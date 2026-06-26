import "server-only";

import type {
  ListingModerationAiResult,
  ListingModerationContentPayload,
  ListingModerationDecision,
} from "./listingModerationReviewTypes";
import {
  getCategoryPolicyNotes,
  LEONIX_MODERATION_POLICY_VERSION,
  LEONIX_MODERATION_PROMPT_VERSION,
  LEONIX_MODERATION_REASON_CATEGORIES,
  normalizeLeonixReasonCategory,
  normalizeRecommendedAction,
  normalizeRiskLevel,
  normalizeStringArray,
  runListingModerationPolicyScan,
  type PolicyScannerResult,
} from "./listingModerationPolicy";

function buildSystemPrompt(scanner: PolicyScannerResult, categoryNotes: string): string {
  return `You are Leonix Safety & Trust moderation for Leonix Media classifieds (Spanish/English local marketplace).
Policy version: ${LEONIX_MODERATION_POLICY_VERSION}
Prompt version: ${LEONIX_MODERATION_PROMPT_VERSION}

Return ONLY valid JSON with keys:
decision, reason_category, reason_text, confidence, risk_level, recommended_action,
policy_flags, keyword_flags, category_rules, admin_summary

decision: approved | needs_review | rejected
reason_category: ${LEONIX_MODERATION_REASON_CATEGORIES.join(", ")}
confidence: low | medium | high
risk_level: low | medium | high | critical
recommended_action: approve | review_manually | contact_seller | request_more_info | edit_listing | archive | remove_listing
policy_flags, keyword_flags, category_rules: string arrays (may include scanner findings plus any additional AI-detected flags)
admin_summary: 1-2 sentence admin-facing summary in plain language

Category policy notes: ${categoryNotes}

Deterministic scanner findings (signal layer — interpret with context, do not ignore critical signals):
${JSON.stringify(scanner)}

Rules:
- approved ONLY when no meaningful policy/trust issues are present.
- needs_review for uncertainty, borderline cases, or when scanner risk is medium/high but content may be legitimate.
- rejected ONLY for clearly prohibited, unsafe, scam, or severe policy violations.
- NEVER recommend auto-delete, auto-hide, auto-archive, or auto-clear flags. Human admin makes final decision.
- recommended_action is advisory only — admin performs actions manually.
- Evaluate title, description, category, price, location, contact fields, image count/URLs.
- Flag suspicious pricing, scam patterns, missing critical info, unsafe off-platform contact, category-specific risks.
- If scanner risk is critical but you would approve, use needs_review and explain the conflict in admin_summary.`;
}

export function getOpenAiModerationApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function getOpenAiModerationModel(): string {
  return process.env.OPENAI_MODERATION_MODEL?.trim() || "gpt-4o-mini";
}

function parseImageUrls(images: unknown): string[] {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images
      .map((x) =>
        typeof x === "string"
          ? x.trim()
          : typeof x === "object" && x && "url" in x
            ? String((x as { url?: string }).url ?? "").trim()
            : "",
      )
      .filter(Boolean);
  }
  if (typeof images === "string") {
    try {
      return parseImageUrls(JSON.parse(images));
    } catch {
      return images.trim() ? [images.trim()] : [];
    }
  }
  return [];
}

export function buildListingModerationContentPayload(
  row: Record<string, unknown>,
  ownerEmail?: string | null,
): ListingModerationContentPayload {
  const imageUrls = parseImageUrls(row.images).slice(0, 12);
  return {
    listing_id: String(row.id ?? "").trim(),
    leonix_ad_id: String(row.leonix_ad_id ?? "").trim() || null,
    source_table: "public.listings",
    category: String(row.category ?? "").trim() || null,
    title: String(row.title ?? "").trim() || null,
    description: String(row.description ?? "").trim() || null,
    city: String(row.city ?? "").trim() || null,
    zip: String(row.zip ?? "").trim() || null,
    price: typeof row.price === "number" ? row.price : row.price != null ? Number(row.price) : null,
    is_free: row.is_free === true ? true : row.is_free === false ? false : null,
    status: String(row.status ?? "").trim() || null,
    contact_email: String(row.contact_email ?? "").trim() || null,
    contact_phone: String(row.contact_phone ?? "").trim() || null,
    business_name: String(row.business_name ?? "").trim() || null,
    seller_type: String(row.seller_type ?? "").trim() || null,
    owner_email: ownerEmail?.trim() || null,
    image_count: imageUrls.length,
    image_urls: imageUrls,
  };
}

function normalizeDecision(raw: unknown): ListingModerationAiResult["decision"] {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "approved" || s === "needs_review" || s === "rejected") return s;
  return "needs_review";
}

function normalizeConfidence(raw: unknown): ListingModerationAiResult["confidence"] {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "low" || s === "medium" || s === "high") return s;
  return "medium";
}

export function resolveAiResultWithScanner(
  result: ListingModerationAiResult,
  scanner: PolicyScannerResult,
): ListingModerationAiResult {
  let decision = result.decision;
  let adminSummary = result.admin_summary;
  let riskLevel = result.risk_level;
  let recommendedAction = result.recommended_action;

  if (scanner.riskLevel === "critical" && decision === "approved") {
    decision = "needs_review";
    adminSummary = `${adminSummary} Scanner critical risk (${scanner.scannerSummary}) conflicts with approved — escalated to needs_review.`.trim();
  }

  if (scanner.riskLevel === "high" && decision === "approved" && scanner.policyFlags.length > 0) {
    decision = "needs_review";
    adminSummary = `${adminSummary} High scanner risk with policy flags — needs manual review.`.trim();
  }

  const scannerRiskRank = { low: 0, medium: 1, high: 2, critical: 3 };
  if (scannerRiskRank[scanner.riskLevel] > scannerRiskRank[riskLevel]) {
    riskLevel = scanner.riskLevel;
  }

  if (scanner.riskLevel === "critical" && recommendedAction === "approve") {
    recommendedAction = scanner.recommendedAction;
  }

  const mergedPolicyFlags = [...new Set([...scanner.policyFlags, ...result.policy_flags])];
  const mergedKeywordFlags = [...new Set([...scanner.keywordFlags, ...result.keyword_flags])];
  const mergedCategoryRules = [...new Set([...scanner.categoryRules, ...result.category_rules])];

  return {
    ...result,
    decision,
    risk_level: riskLevel,
    recommended_action: recommendedAction,
    policy_flags: mergedPolicyFlags,
    keyword_flags: mergedKeywordFlags,
    category_rules: mergedCategoryRules,
    admin_summary: adminSummary,
  };
}

export type RunListingAiModerationResult =
  | {
      ok: true;
      result: ListingModerationAiResult;
      scanner: PolicyScannerResult;
      model: string;
      rawResult: unknown;
      policyVersion: string;
      promptVersion: string;
    }
  | { ok: false; decision: ListingModerationDecision; error: string; model: string | null; scanner: PolicyScannerResult | null };

export async function runListingAiModeration(
  content: ListingModerationContentPayload,
): Promise<RunListingAiModerationResult> {
  const scanner = runListingModerationPolicyScan(content);
  const apiKey = getOpenAiModerationApiKey();
  const model = getOpenAiModerationModel();

  if (!apiKey) {
    return {
      ok: false,
      decision: "unavailable",
      error: "AI review unavailable: missing provider configuration (OPENAI_API_KEY).",
      model: null,
      scanner,
    };
  }

  if (!content.listing_id) {
    return {
      ok: false,
      decision: "unavailable",
      error: "AI review unavailable: listing content not found.",
      model,
      scanner,
    };
  }

  const categoryNotes = getCategoryPolicyNotes(content.category);
  const systemPrompt = buildSystemPrompt(scanner, categoryNotes);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              listing: content,
              scanner_findings: scanner,
              instructions:
                "Moderate this classified listing for Leonix Safety & Trust. Human admin makes final decision. Do not auto-delete or auto-clear flags.",
            }),
          },
        ],
      }),
    });

    const body = (await res.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!res.ok) {
      const msg = body.error?.message?.trim() || `OpenAI HTTP ${res.status}`;
      return { ok: false, decision: "unavailable", error: msg.slice(0, 500), model, scanner };
    }

    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, decision: "unavailable", error: "Empty AI response", model, scanner };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { ok: false, decision: "unavailable", error: "AI response was not valid JSON", model, scanner };
    }

    const reasonText = String(parsed.reason_text ?? "").trim();
    const adminSummary = String(parsed.admin_summary ?? "").trim() || reasonText || "AI review completed.";

    const baseResult: ListingModerationAiResult = {
      decision: normalizeDecision(parsed.decision),
      reason_category: normalizeLeonixReasonCategory(parsed.reason_category),
      reason_text: reasonText || "AI review completed without a detailed reason.",
      confidence: normalizeConfidence(parsed.confidence),
      risk_level: normalizeRiskLevel(parsed.risk_level),
      recommended_action: normalizeRecommendedAction(parsed.recommended_action),
      policy_flags: normalizeStringArray(parsed.policy_flags),
      keyword_flags: normalizeStringArray(parsed.keyword_flags),
      category_rules: normalizeStringArray(parsed.category_rules),
      admin_summary: adminSummary,
    };

    const result = resolveAiResultWithScanner(baseResult, scanner);

    return {
      ok: true,
      result,
      scanner,
      model,
      rawResult: { ai: parsed, scanner, resolved: result },
      policyVersion: LEONIX_MODERATION_POLICY_VERSION,
      promptVersion: LEONIX_MODERATION_PROMPT_VERSION,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network_error";
    return { ok: false, decision: "unavailable", error: msg.slice(0, 500), model, scanner };
  }
}

export function formatAiReviewProofLabel(
  decision: ListingModerationDecision,
  reasonCategory: string | null,
  reasonText: string | null,
  riskLevel?: string | null,
): string {
  if (decision === "unavailable") {
    return reasonText?.trim() || "AI review unavailable";
  }
  const cat = reasonCategory ? ` — ${reasonCategory}` : "";
  const risk = riskLevel ? ` [${riskLevel} risk]` : "";
  const reason = reasonText?.trim() ? `: ${reasonText.trim()}` : "";
  return `AI review completed: ${decision}${cat}${risk}${reason}`;
}

export { runListingModerationPolicyScan };

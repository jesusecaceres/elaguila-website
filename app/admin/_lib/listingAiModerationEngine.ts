import "server-only";

import type {
  ListingModerationAiResult,
  ListingModerationContentPayload,
  ListingModerationDecision,
  ListingModerationReasonCategory,
} from "./listingModerationReviewTypes";

const REASON_CATEGORIES: ListingModerationReasonCategory[] = [
  "safe",
  "spam",
  "scam",
  "prohibited_item",
  "suspicious_price",
  "duplicate",
  "missing_info",
  "unsafe_contact",
  "policy_review",
  "other",
];

const SYSTEM_PROMPT = `You are Leonix Media classifieds moderation assistant.
Review listing content for a local marketplace (Spanish/English).
Return ONLY valid JSON with keys: decision, reason_category, reason_text, confidence.

decision must be one of: approved, needs_review, rejected
reason_category must be one of: ${REASON_CATEGORIES.join(", ")}
confidence must be one of: low, medium, high
reason_text must be a concise human-readable explanation (1-3 sentences).

Rules:
- approved: content appears legitimate and policy-safe for a local classifieds marketplace.
- needs_review: uncertain, borderline, or requires human judgment.
- rejected: clear scam, prohibited item, dangerous content, or severe policy violation.
- Do NOT recommend delete, archive, or auto-hide — human admin decides final action.
- Evaluate title, description, category, price, location, contact fields, image count/URLs.
- Flag suspicious pricing, scam patterns, missing critical info, unsafe off-platform contact.`;

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

function normalizeReasonCategory(raw: unknown): ListingModerationReasonCategory {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase() as ListingModerationReasonCategory;
  return REASON_CATEGORIES.includes(s) ? s : "other";
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

export type RunListingAiModerationResult =
  | { ok: true; result: ListingModerationAiResult; model: string; rawResult: unknown }
  | { ok: false; decision: ListingModerationDecision; error: string; model: string | null };

export async function runListingAiModeration(
  content: ListingModerationContentPayload,
): Promise<RunListingAiModerationResult> {
  const apiKey = getOpenAiModerationApiKey();
  const model = getOpenAiModerationModel();

  if (!apiKey) {
    return {
      ok: false,
      decision: "unavailable",
      error: "AI review unavailable: missing provider configuration (OPENAI_API_KEY).",
      model: null,
    };
  }

  if (!content.listing_id) {
    return {
      ok: false,
      decision: "unavailable",
      error: "AI review unavailable: listing content not found.",
      model,
    };
  }

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
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              listing: content,
              instructions:
                "Moderate this classified listing for Leonix Media. Human admin makes final decision.",
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
      return { ok: false, decision: "unavailable", error: msg.slice(0, 500), model };
    }

    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, decision: "unavailable", error: "Empty AI response", model };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { ok: false, decision: "unavailable", error: "AI response was not valid JSON", model };
    }

    const reasonText = String(parsed.reason_text ?? "").trim();
    const result: ListingModerationAiResult = {
      decision: normalizeDecision(parsed.decision),
      reason_category: normalizeReasonCategory(parsed.reason_category),
      reason_text: reasonText || "AI review completed without a detailed reason.",
      confidence: normalizeConfidence(parsed.confidence),
    };

    return { ok: true, result, model, rawResult: parsed };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network_error";
    return { ok: false, decision: "unavailable", error: msg.slice(0, 500), model };
  }
}

export function formatAiReviewProofLabel(
  decision: ListingModerationDecision,
  reasonCategory: string | null,
  reasonText: string | null,
): string {
  if (decision === "unavailable") {
    return reasonText?.trim() || "AI review unavailable";
  }
  const cat = reasonCategory ? ` — ${reasonCategory}` : "";
  const reason = reasonText?.trim() ? `: ${reasonText.trim()}` : "";
  return `AI review completed: ${decision}${cat}${reason}`;
}

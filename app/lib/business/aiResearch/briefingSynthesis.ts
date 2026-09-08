/**
 * Program 4, Gate 4C — deterministic input-packet builder + strict output-schema validator. No
 * network calls here — pure functions only (the provider itself performs the network call).
 * Malformed provider output is always rejected, never coerced into a partially-fabricated shape.
 */
import type {
  AiBriefingSynthesisResult,
  AiResearchInputPacket,
  BriefingConfidence,
  BriefingContradiction,
  BriefingStrengthOrOpportunity,
  BriefingUnknown,
  WebsiteResearchResult,
} from "./types";

export const AI_BRIEFING_SCHEMA_VERSION = "1";

const CONFIDENCE_VALUES: readonly BriefingConfidence[] = ["low", "medium", "high"];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function validateEvidenceRefs(v: unknown): { sourceType: string; sourceId: string | null; excerpt: string | null }[] | null {
  if (!Array.isArray(v)) return null;
  const refs: { sourceType: string; sourceId: string | null; excerpt: string | null }[] = [];
  for (const item of v) {
    if (typeof item !== "object" || item === null) return null;
    const o = item as Record<string, unknown>;
    if (!isNonEmptyString(o.source_type)) return null;
    refs.push({
      sourceType: o.source_type,
      sourceId: typeof o.source_id === "string" ? o.source_id : null,
      excerpt: typeof o.excerpt === "string" ? o.excerpt : null,
    });
  }
  return refs;
}

function validateStrengthOrOpportunity(v: unknown, index: number): BriefingStrengthOrOpportunity | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.claim_es) || !isNonEmptyString(o.claim_en)) return null;
  const evidenceRefs = validateEvidenceRefs(o.evidence_refs);
  if (!evidenceRefs || evidenceRefs.length === 0) return null; // evidence refs required — never an unevidenced claim.
  if (typeof o.confidence !== "string" || !CONFIDENCE_VALUES.includes(o.confidence as BriefingConfidence)) return null;
  if (typeof o.requires_confirmation !== "boolean") return null;
  if (!isStringArray(o.source_types)) return null;
  if (!isNonEmptyString(o.reasoning_summary)) return null;
  if (!isStringArray(o.prohibited_claim_flags)) return null;
  return {
    itemId: `item_${index}`,
    claimEs: o.claim_es,
    claimEn: o.claim_en,
    evidenceRefs,
    confidence: o.confidence as BriefingConfidence,
    requiresConfirmation: o.requires_confirmation,
    sourceTypes: o.source_types,
    reasoningSummary: o.reasoning_summary,
    prohibitedClaimFlags: o.prohibited_claim_flags,
    promotionStatus: "unresolved",
  };
}

function validateContradiction(v: unknown, index: number): BriefingContradiction | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.description_es) || !isNonEmptyString(o.description_en)) return null;
  const evidenceRefs = validateEvidenceRefs(o.evidence_refs);
  if (!evidenceRefs) return null;
  if (!isNonEmptyString(o.recommended_confirmation_question_es) || !isNonEmptyString(o.recommended_confirmation_question_en)) return null;
  return {
    itemId: `contradiction_${index}`,
    descriptionEs: o.description_es,
    descriptionEn: o.description_en,
    evidenceRefs,
    recommendedConfirmationQuestionEs: o.recommended_confirmation_question_es,
    recommendedConfirmationQuestionEn: o.recommended_confirmation_question_en,
    promotionStatus: "unresolved",
  };
}

function validateUnknown(v: unknown, index: number): BriefingUnknown | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.question_es) || !isNonEmptyString(o.question_en)) return null;
  if (!isNonEmptyString(o.why_needed_es) || !isNonEmptyString(o.why_needed_en)) return null;
  if (o.priority !== "low" && o.priority !== "medium" && o.priority !== "high") return null;
  return {
    itemId: `unknown_${index}`,
    questionEs: o.question_es,
    questionEn: o.question_en,
    whyNeededEs: o.why_needed_es,
    whyNeededEn: o.why_needed_en,
    priority: o.priority,
    relatedDimensionKey: typeof o.related_dimension_key === "string" ? o.related_dimension_key : null,
    promotionStatus: "unresolved",
  };
}

export type SchemaValidationResult = { ok: true; value: AiBriefingSynthesisResult } | { ok: false; error: string };

/** Strict schema validator — any structural deviation is rejected, never silently coerced. */
export function validateBriefingSynthesisJson(raw: unknown): SchemaValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Provider output is not a JSON object." };
  }
  const o = raw as Record<string, unknown>;
  if (!isNonEmptyString(o.summary_es) || !isNonEmptyString(o.summary_en)) {
    return { ok: false, error: "Missing bilingual summary." };
  }
  if (!Array.isArray(o.strengths) || !Array.isArray(o.opportunities) || !Array.isArray(o.contradictions) || !Array.isArray(o.unknowns) || !isStringArray(o.limitations)) {
    return { ok: false, error: "Missing or malformed briefing arrays." };
  }

  const strengths: BriefingStrengthOrOpportunity[] = [];
  for (let i = 0; i < o.strengths.length; i++) {
    const v = validateStrengthOrOpportunity(o.strengths[i], i);
    if (!v) return { ok: false, error: `Malformed strength item at index ${i}.` };
    strengths.push(v);
  }
  const opportunities: BriefingStrengthOrOpportunity[] = [];
  for (let i = 0; i < o.opportunities.length; i++) {
    const v = validateStrengthOrOpportunity(o.opportunities[i], i);
    if (!v) return { ok: false, error: `Malformed opportunity item at index ${i}.` };
    opportunities.push(v);
  }
  const contradictions: BriefingContradiction[] = [];
  for (let i = 0; i < o.contradictions.length; i++) {
    const v = validateContradiction(o.contradictions[i], i);
    if (!v) return { ok: false, error: `Malformed contradiction item at index ${i}.` };
    contradictions.push(v);
  }
  const unknowns: BriefingUnknown[] = [];
  for (let i = 0; i < o.unknowns.length; i++) {
    const v = validateUnknown(o.unknowns[i], i);
    if (!v) return { ok: false, error: `Malformed unknown item at index ${i}.` };
    unknowns.push(v);
  }

  return {
    ok: true,
    value: {
      ok: true,
      summaryEs: o.summary_es,
      summaryEn: o.summary_en,
      strengths,
      opportunities,
      contradictions,
      unknowns,
      limitations: o.limitations,
    },
  };
}

/**
 * Bounded input-packet builder. Deliberately excludes secrets, unrelated private notes, other
 * businesses, raw Auth data, and payment records — only the fields listed in the Bible's "AI
 * INPUT PACKET" contract are ever included.
 */
export function buildAiResearchInputPacket(input: {
  businessIdentity: { displayName: string; broadBusinessType: string; businessStage: string };
  ownerStatedGoals: readonly string[];
  confirmedFacts: readonly { factKey: string; displayValue: string }[];
  sourceLinks: readonly { sourceType: string; url: string }[];
  fileEvidence: readonly { fileKind: string; excerptOrCaption: string | null }[];
  websiteResearch: WebsiteResearchResult | null;
  unknowns: readonly { questionLabel: string }[];
  contradictions: readonly { claimALabel: string; claimBLabel: string }[];
  latestHealthFindings: readonly { dimensionKey: string; findingLabel: string }[];
  capacityReadiness: string | null;
  languageTarget: "es" | "en" | "both";
}): AiResearchInputPacket {
  return {
    businessIdentity: input.businessIdentity,
    ownerStatedGoals: input.ownerStatedGoals,
    confirmedFacts: input.confirmedFacts,
    sourceLinks: input.sourceLinks,
    fileEvidence: input.fileEvidence,
    websiteResearch: input.websiteResearch,
    unknowns: input.unknowns,
    contradictions: input.contradictions,
    latestHealthFindings: input.latestHealthFindings,
    capacityReadiness: input.capacityReadiness,
    lionCodeRules: [
      "Never recommend a paid product/service before a free or low-cost option has been considered truthfully.",
      "Never fabricate a review, rating, ranking, or SEO/PageSpeed score not present in the evidence.",
      "Never claim Google/social integration data that was not actually collected.",
      "Every claim must cite at least one evidence reference from the input packet.",
    ],
    outputSchemaVersion: AI_BRIEFING_SCHEMA_VERSION,
    prohibitedClaims: [
      "search ranking or Google indexing status",
      "PageSpeed or performance score",
      "accessibility certification",
      "review or rating scores not present in the input",
      "any claim about a source_type not present in sourceLinks or fileEvidence",
    ],
    languageTarget: input.languageTarget,
  };
}

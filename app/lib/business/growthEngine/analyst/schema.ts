/**
 * Business Development Analyst — strict structured-output schema + validator. Mirrors the exact
 * philosophy of app/lib/business/aiResearch/briefingSynthesis.ts's validateBriefingSynthesisJson:
 * malformed provider output is always rejected, never coerced into a partially-fabricated shape.
 * No network call lives in this file — pure validation only. Deliberately has no "server-only"
 * marker (matching aiResearch/briefingSynthesis.ts's own precedent) since it touches no secret,
 * no database, and no network call — only the actual provider adapter (openaiAnalystProvider.ts)
 * carries that marker.
 */
import type { GrowthProviderClass, GrowthFindingItem, GrowthMediaMixItem, GrowthSuggestedSolution } from "../types";

export const GROWTH_ASSESSMENT_SCHEMA_VERSION = "1";

const PROVIDER_CLASS_VALUES: readonly GrowthProviderClass[] = ["leonix_provides", "leonix_coordinates_partner", "external_professional_required"];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function validateFindingItem(v: unknown): GrowthFindingItem | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.text_es) || !isNonEmptyString(o.text_en)) return null;
  const evidenceRefs = o.evidence_refs === undefined ? [] : o.evidence_refs;
  if (!isStringArray(evidenceRefs)) return null;
  return { textEs: o.text_es, textEn: o.text_en, evidenceRefs };
}

function validateFindingArray(v: unknown, fieldName: string): { ok: true; value: GrowthFindingItem[] } | { ok: false; error: string } {
  if (!Array.isArray(v)) return { ok: false, error: `${fieldName} must be an array.` };
  const out: GrowthFindingItem[] = [];
  for (let i = 0; i < v.length; i++) {
    const item = validateFindingItem(v[i]);
    if (!item) return { ok: false, error: `${fieldName}[${i}] is malformed.` };
    out.push(item);
  }
  return { ok: true, value: out };
}

function validateSuggestedSolution(v: unknown, index: number): GrowthSuggestedSolution | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.text_es) || !isNonEmptyString(o.text_en)) return null;
  if (typeof o.provider_class !== "string" || !PROVIDER_CLASS_VALUES.includes(o.provider_class as GrowthProviderClass)) return null;
  if (!isNonEmptyString(o.category)) return null;
  const evidenceRefs = o.evidence_refs === undefined ? [] : o.evidence_refs;
  if (!isStringArray(evidenceRefs)) return null;
  return {
    textEs: o.text_es,
    textEn: o.text_en,
    evidenceRefs,
    providerClass: o.provider_class as GrowthProviderClass,
    category: o.category,
  };
  // (index reserved for future item-id tagging, matching aiResearch's item_${index} convention —
  // not needed yet since suggested solutions are not individually addressable until promoted.)
  void index;
}

function validateMediaMixItem(v: unknown): GrowthMediaMixItem | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.text_es) || !isNonEmptyString(o.text_en)) return null;
  if (!isNonEmptyString(o.channel_key)) return null;
  const evidenceRefs = o.evidence_refs === undefined ? [] : o.evidence_refs;
  if (!isStringArray(evidenceRefs)) return null;
  return { textEs: o.text_es, textEn: o.text_en, evidenceRefs, channelKey: o.channel_key };
}

export type GrowthAssessmentGeneratedContent = {
  summaryEs: string;
  summaryEn: string;
  whatFound: GrowthFindingItem[];
  whatKnown: GrowthFindingItem[];
  whatUnknown: GrowthFindingItem[];
  needsVerification: GrowthFindingItem[];
  weakOrMissing: GrowthFindingItem[];
  clientQuestions: GrowthFindingItem[];
  risksConstraints: GrowthFindingItem[];
  growthOpportunities: GrowthFindingItem[];
  suggestedSolutions: GrowthSuggestedSolution[];
  recommendedMediaMix: GrowthMediaMixItem[];
  priorityOrder: GrowthFindingItem[];
  measurementPlan: GrowthFindingItem[];
  nextRightMoveEs: string;
  nextRightMoveEn: string;
};

export type SchemaValidationResult = { ok: true; value: GrowthAssessmentGeneratedContent } | { ok: false; error: string };

/**
 * Strict schema validator — any structural deviation is rejected, never silently coerced. Truth
 * governance rule enforced here: this function only ever produces "AI SUGGESTION" shaped content
 * (GrowthAssessmentGeneratedContent) — nothing in this module writes to business_facts,
 * business_growth_solutions, or business_growth_official_requirements. Promotion into those
 * canonical tables is a separate, explicit staff action elsewhere (Gate A's repository).
 */
export function validateGrowthAssessmentJson(raw: unknown): SchemaValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Provider output is not a JSON object." };
  }
  const o = raw as Record<string, unknown>;

  if (!isNonEmptyString(o.summary_es) || !isNonEmptyString(o.summary_en)) {
    return { ok: false, error: "Missing bilingual summary." };
  }
  if (!isNonEmptyString(o.next_right_move_es) || !isNonEmptyString(o.next_right_move_en)) {
    return { ok: false, error: "Missing bilingual next right move." };
  }

  const arrayFields: Array<[keyof GrowthAssessmentGeneratedContent, string]> = [
    ["whatFound", "found"],
    ["whatKnown", "known"],
    ["whatUnknown", "unknown"],
    ["needsVerification", "needs_verification"],
    ["weakOrMissing", "weak_or_missing"],
    ["clientQuestions", "questions_to_ask"],
    ["risksConstraints", "risks_constraints"],
    ["growthOpportunities", "growth_opportunities"],
    ["priorityOrder", "priorities_dependencies"],
    ["measurementPlan", "measurement_plan"],
  ];

  const findings: Record<string, GrowthFindingItem[]> = {};
  for (const [tsKey, jsonKey] of arrayFields) {
    const result = validateFindingArray(o[jsonKey], jsonKey);
    if (!result.ok) return { ok: false, error: result.error };
    findings[tsKey] = result.value;
  }

  if (!Array.isArray(o.possible_solutions)) return { ok: false, error: "possible_solutions must be an array." };
  const suggestedSolutions: GrowthSuggestedSolution[] = [];
  for (let i = 0; i < o.possible_solutions.length; i++) {
    const item = validateSuggestedSolution(o.possible_solutions[i], i);
    if (!item) return { ok: false, error: `possible_solutions[${i}] is malformed.` };
    suggestedSolutions.push(item);
  }

  if (!Array.isArray(o.media_mix)) return { ok: false, error: "media_mix must be an array." };
  const recommendedMediaMix: GrowthMediaMixItem[] = [];
  for (let i = 0; i < o.media_mix.length; i++) {
    const item = validateMediaMixItem(o.media_mix[i]);
    if (!item) return { ok: false, error: `media_mix[${i}] is malformed.` };
    recommendedMediaMix.push(item);
  }

  return {
    ok: true,
    value: {
      summaryEs: o.summary_es,
      summaryEn: o.summary_en,
      whatFound: findings.whatFound,
      whatKnown: findings.whatKnown,
      whatUnknown: findings.whatUnknown,
      needsVerification: findings.needsVerification,
      weakOrMissing: findings.weakOrMissing,
      clientQuestions: findings.clientQuestions,
      risksConstraints: findings.risksConstraints,
      growthOpportunities: findings.growthOpportunities,
      suggestedSolutions,
      recommendedMediaMix,
      priorityOrder: findings.priorityOrder,
      measurementPlan: findings.measurementPlan,
      nextRightMoveEs: o.next_right_move_es,
      nextRightMoveEn: o.next_right_move_en,
    },
  };
}

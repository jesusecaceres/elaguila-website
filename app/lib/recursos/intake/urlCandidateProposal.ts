/**
 * Recursos Intake OS — Gate 3 URL-candidate proposal contract.
 *
 * `community_resource_candidate_reviews` was designed around PDF candidates, whose actual
 * content lives in a static checked-in JSON file — the DB table only ever held REVIEW/EVIDENCE
 * state. A URL-sourced candidate has no such JSON entry, so this module stores the proposed
 * candidate CONTENT itself inside the same table's existing `discrepancies_from_pdf` jsonb
 * column (one FieldDiscrepancy entry per proposed field, `pdfValue: ""` since there is no PDF
 * baseline to contrast against). This is a deliberate reuse of an existing, already-reviewable
 * jsonb column rather than a schema change — every entry here is still exactly what a human
 * reviewer sees on the candidate review page.
 *
 * Pure module: encode/decode only, no network, no DB, no AI.
 */
import type { FieldDiscrepancy } from "@/app/lib/recursos/verificationEvidence";
import type { CostModel, OrganizationType, PrimaryCategorySlug, UrgencyLevel } from "@/app/lib/recursos/types";
import type { DetectedLanguage } from "./htmlExtraction";

export type UrlCandidateProposal = {
  organizationName: string;
  programName: string | null;
  organizationType: OrganizationType | null;
  suggestedDescriptionEn: string | null;
  suggestedPrimaryCategory: PrimaryCategorySlug;
  suggestedUrgencyLevel: UrgencyLevel;
  phone: string | null;
  crisisPhone: string | null;
  sms: string | null;
  email: string | null;
  websiteUrl: string | null;
  addressLine1: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  addressWithheldForSafety: boolean;
  serviceArea: string | null;
  eligibilityEn: string | null;
  languages: string[];
  costModel: CostModel | null;
  hoursNoteEn: string | null;
  is24Hours: boolean;
  officialSourceUrl: string;
  /** Never true from AI/deterministic sources — present for shape completeness only. */
  confidenceNote: string | null;

  // Spanish Bridge (Gate ES-5C) — populated ONLY when the source itself is in Spanish or
  // bilingual (see aiProposalAdapter.ts). Never populated by translating English at intake time —
  // that only ever happens post-verification via the Phase-B translator. Extracted/preserved
  // directly from the source text, never invented.
  shortDescriptionEs: string | null;
  detailsEs: string | null;
  eligibilityEs: string | null;
  hoursNoteEs: string | null;
  /** Advisory-only signal from htmlExtraction.ts's detectSourceLanguage() — never factual verification. */
  detectedSourceLanguage: DetectedLanguage;
  /** True only when shortDescriptionEs/etc above were extracted directly from an es/bilingual source — never true for AI-translated content. */
  spanishIsOfficialSource: boolean;
};

const FIELD_KEYS: (keyof UrlCandidateProposal)[] = [
  "organizationName",
  "programName",
  "organizationType",
  "suggestedDescriptionEn",
  "suggestedPrimaryCategory",
  "suggestedUrgencyLevel",
  "phone",
  "crisisPhone",
  "sms",
  "email",
  "websiteUrl",
  "addressLine1",
  "addressCity",
  "addressState",
  "addressZip",
  "addressWithheldForSafety",
  "serviceArea",
  "eligibilityEn",
  "languages",
  "costModel",
  "hoursNoteEn",
  "is24Hours",
  "officialSourceUrl",
  "confidenceNote",
  "shortDescriptionEs",
  "detailsEs",
  "eligibilityEs",
  "hoursNoteEs",
  "detectedSourceLanguage",
  "spanishIsOfficialSource",
];

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join("; ");
  return String(v);
}

/** Encodes a proposal into the FieldDiscrepancy[] shape stored in discrepancies_from_pdf. Skips empty/null fields. */
export function encodeProposalAsDiscrepancies(proposal: UrlCandidateProposal): FieldDiscrepancy[] {
  const out: FieldDiscrepancy[] = [];
  for (const key of FIELD_KEYS) {
    const value = proposal[key];
    const asString = valueToString(value);
    if (!asString) continue;
    out.push({ field: key, pdfValue: "", currentValue: asString });
  }
  return out;
}

const CATEGORY_VALUES = new Set<PrimaryCategorySlug>([
  "urgent-safety",
  "food-basic-needs",
  "housing-rent",
  "mental-health-recovery",
  "health-clinics",
  "legal-immigration",
  "babies-kids-parents",
  "youth-education",
  "jobs-training",
  "seniors-disability",
  "transportation-access",
  "community-support",
]);
const URGENCY_VALUES = new Set<UrgencyLevel>(["help-now", "i-need-help", "want-to-connect"]);
const ORG_TYPE_VALUES = new Set<OrganizationType>(["nonprofit", "government", "faith-based", "school-district", "healthcare", "community-clinic", "hotline", "other"]);
const COST_MODEL_VALUES = new Set<CostModel>(["free", "low_cost", "eligibility_based", "unknown"]);
const DETECTED_LANGUAGE_VALUES = new Set<DetectedLanguage>(["en", "es", "bilingual", "unknown"]);

/** Best-effort reconstruction back from stored discrepancies — used to render/reuse a saved proposal. */
export function decodeProposalFromDiscrepancies(discrepancies: FieldDiscrepancy[]): UrlCandidateProposal {
  const byField = new Map(discrepancies.map((d) => [d.field, d.currentValue]));
  const get = (k: string) => byField.get(k) ?? null;

  const category = get("suggestedPrimaryCategory");
  const urgency = get("suggestedUrgencyLevel");
  const orgType = get("organizationType");
  const cost = get("costModel");

  return {
    organizationName: get("organizationName") ?? "",
    programName: get("programName"),
    organizationType: orgType && ORG_TYPE_VALUES.has(orgType as OrganizationType) ? (orgType as OrganizationType) : null,
    suggestedDescriptionEn: get("suggestedDescriptionEn"),
    suggestedPrimaryCategory: category && CATEGORY_VALUES.has(category as PrimaryCategorySlug) ? (category as PrimaryCategorySlug) : "community-support",
    suggestedUrgencyLevel: urgency && URGENCY_VALUES.has(urgency as UrgencyLevel) ? (urgency as UrgencyLevel) : "i-need-help",
    phone: get("phone"),
    crisisPhone: get("crisisPhone"),
    sms: get("sms"),
    email: get("email"),
    websiteUrl: get("websiteUrl"),
    addressLine1: get("addressLine1"),
    addressCity: get("addressCity"),
    addressState: get("addressState"),
    addressZip: get("addressZip"),
    addressWithheldForSafety: get("addressWithheldForSafety") === "true",
    serviceArea: get("serviceArea"),
    eligibilityEn: get("eligibilityEn"),
    languages: (get("languages") ?? "").split(";").map((s) => s.trim()).filter(Boolean),
    costModel: cost && COST_MODEL_VALUES.has(cost as CostModel) ? (cost as CostModel) : "unknown",
    hoursNoteEn: get("hoursNoteEn"),
    is24Hours: get("is24Hours") === "true",
    officialSourceUrl: get("officialSourceUrl") ?? "",
    confidenceNote: get("confidenceNote"),
    shortDescriptionEs: get("shortDescriptionEs"),
    detailsEs: get("detailsEs"),
    eligibilityEs: get("eligibilityEs"),
    hoursNoteEs: get("hoursNoteEs"),
    detectedSourceLanguage: (() => {
      const v = get("detectedSourceLanguage");
      return v && DETECTED_LANGUAGE_VALUES.has(v as DetectedLanguage) ? (v as DetectedLanguage) : "unknown";
    })(),
    spanishIsOfficialSource: get("spanishIsOfficialSource") === "true",
  };
}

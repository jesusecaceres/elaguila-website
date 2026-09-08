/**
 * Recursos Intake OS — Gate 5 candidate match metadata. Same "cargo bay" technique as
 * urlCandidateProposal.ts's encode/decode: stores structured match info as extra
 * FieldDiscrepancy entries (field names prefixed `__` so they never collide with a real
 * WRITABLE_FIELD_COLUMNS key) inside the same discrepancies_from_pdf jsonb array, rather than a
 * new column. Pure encode/decode only.
 */
import type { FieldDiscrepancy } from "@/app/lib/recursos/verificationEvidence";
import type { MatchResult } from "./matchCandidateToExistingResource";

const CLASSIFICATION_KEY = "__matchClassification__";
const RESOURCE_ID_KEY = "__matchedResourceId__";
const REASONS_KEY = "__matchReasons__";

export function encodeMatchMetadata(match: MatchResult): FieldDiscrepancy[] {
  return [
    { field: CLASSIFICATION_KEY, pdfValue: "", currentValue: match.classification },
    { field: RESOURCE_ID_KEY, pdfValue: "", currentValue: match.matchedResourceId ?? "" },
    { field: REASONS_KEY, pdfValue: "", currentValue: match.reasons.join(";") },
  ];
}

export type DecodedMatchMetadata = { classification: MatchResult["classification"]; matchedResourceId: string | null; reasons: string[] };

const VALID_CLASSIFICATIONS = new Set(["NEW", "LIKELY_MATCH", "POSSIBLE_DUPLICATE", "EXISTING_RESOURCE_UPDATE"]);

export function decodeMatchMetadata(discrepancies: FieldDiscrepancy[]): DecodedMatchMetadata {
  const byField = new Map(discrepancies.map((d) => [d.field, d.currentValue]));
  const classificationRaw = byField.get(CLASSIFICATION_KEY) ?? "NEW";
  const classification = VALID_CLASSIFICATIONS.has(classificationRaw) ? (classificationRaw as MatchResult["classification"]) : "NEW";
  const matchedResourceId = byField.get(RESOURCE_ID_KEY) || null;
  const reasons = (byField.get(REASONS_KEY) ?? "").split(";").filter(Boolean);
  return { classification, matchedResourceId, reasons };
}

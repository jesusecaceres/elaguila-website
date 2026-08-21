/**
 * Recursos Spanish Bridge — Gate ES-6A. Pure classification of a verified resource's current
 * Spanish-readiness operating state. No DB, no network. This is deliberately a DERIVED
 * classification (computed live from resource-level truth), never a stored column — the same
 * "no duplicate stored classification" doctrine already used for reverificationQueue.ts.
 *
 * Precedence is fixed and must not be reordered: factual staleness always wins first (translating
 * from facts that are no longer trustworthy is worse than not translating yet), then the resource's
 * own spanish_status decides the rest. Mere presence of *_es text is NEVER treated as approved —
 * only spanish_status (itself only ever set by a human action, see ES-2F/ES-4E/ES-5H) decides.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import { resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";
import type { SpanishStatus } from "./server/resourceSpanishStatusDb";

export type SpanishReadinessClassification =
  | "SPANISH_READY_OFFICIAL"
  | "SPANISH_READY_VERIFIED_TRANSLATION"
  | "NEEDS_SPANISH_TRANSLATION"
  | "NEEDS_TRANSLATION_REVIEW"
  | "SOURCE_REVERIFICATION_REQUIRED";

export function classifySpanishReadiness(
  resource: Pick<ResourceRecord, "verification">,
  spanishStatus: SpanishStatus,
  now: Date = new Date(),
): SpanishReadinessClassification {
  const effective = resolveEffectiveVerificationStatus(resource.verification, now);
  if (effective !== "verified") return "SOURCE_REVERIFICATION_REQUIRED";

  if (spanishStatus === "official_spanish") return "SPANISH_READY_OFFICIAL";
  if (spanishStatus === "verified_translation") return "SPANISH_READY_VERIFIED_TRANSLATION";
  if (spanishStatus === "needs_translation_review") return "NEEDS_TRANSLATION_REVIEW";
  // not_available / official_english_only — nothing approved yet, needs a fresh draft.
  return "NEEDS_SPANISH_TRANSLATION";
}

export const SPANISH_READY_CLASSIFICATIONS: ReadonlySet<SpanishReadinessClassification> = new Set([
  "SPANISH_READY_OFFICIAL",
  "SPANISH_READY_VERIFIED_TRANSLATION",
]);

export function isSpanishReadinessReady(classification: SpanishReadinessClassification): boolean {
  return SPANISH_READY_CLASSIFICATIONS.has(classification);
}

export const SPANISH_READINESS_LABEL: Record<SpanishReadinessClassification, string> = {
  SPANISH_READY_OFFICIAL: "ES oficial listo",
  SPANISH_READY_VERIFIED_TRANSLATION: "Traducción verificada lista",
  NEEDS_SPANISH_TRANSLATION: "Necesita traducción",
  NEEDS_TRANSLATION_REVIEW: "Necesita revisión de español",
  SOURCE_REVERIFICATION_REQUIRED: "Fuente necesita reverificación",
};

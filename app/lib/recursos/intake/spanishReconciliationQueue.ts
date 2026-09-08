import "server-only";

/**
 * Recursos Spanish Bridge — Gate ES-6. Single composition point for the bulk reconciliation
 * queue, the command-center Spanish metrics, and the bulk-draft action's eligibility filter — one
 * definition of "eligible for a Spanish draft" reused everywhere, not three that can drift apart.
 * Joins three already-existing reads (resources, spanish_status rows, pending proposals) into one
 * enriched, per-resource snapshot. No new table, no new stored classification column.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { dbListAllCommunityResourceSpanishStatuses, type SpanishStatus, type SpanishSourceType } from "./server/resourceSpanishStatusDb";
import { dbListAllPendingResourceChangeProposals, type ResourceChangeProposalRow } from "./server/resourceChangeProposalsDb";
import { classifySpanishReadiness, type SpanishReadinessClassification } from "./spanishReadinessClassification";
import { isHighRiskResourceForTranslation } from "./resourceChangeDetection";
import { checkFieldTranslationIntegrity, checkOfficialSpanishFieldIntegrity } from "./translation/translationIntegrityCheck";
import { buildOfficialSpanishStructuredFacts, relatedEnTextForOfficialSpanishField } from "./translation/prepareOfficialSpanishProposals";

const ES_FIELD_TO_EN_SOURCE: Record<string, (r: ResourceRecord) => string | null> = {
  shortDescriptionEs: (r) => r.shortDescriptionEn,
  detailsEs: (r) => r.detailsEn ?? null,
  eligibilityEs: (r) => r.eligibilityEn ?? null,
  hoursNoteEs: (r) => r.contact.hoursNoteEn ?? null,
};

function computeQueueStatus(params: {
  classification: SpanishReadinessClassification;
  officialSpanishAwaitingConfirmation: boolean;
  spanishStatus: SpanishStatus;
  pendingTranslationCount: number;
  pendingTranslationsClean: boolean;
  hasBaseContent: boolean;
}): SpanishQueueStatus {
  if (params.classification === "SOURCE_REVERIFICATION_REQUIRED") return "REVERIFICAR_PRIMERO";
  if (params.officialSpanishAwaitingConfirmation) return "FUENTE_OFICIAL_ES";
  if (params.spanishStatus === "official_spanish" || params.spanishStatus === "verified_translation") return "ESPANOL_PUBLICADO";
  if (params.pendingTranslationCount > 0) return params.pendingTranslationsClean ? "LISTO_PARA_PUBLICAR" : "REVISION_PENDIENTE";
  return params.hasBaseContent ? "LISTO_PARA_GENERAR" : "SIN_CONTENIDO_BASE";
}

/**
 * Owner Spanish Translation Review Workspace — operational queue status. Richer than
 * SpanishReadinessClassification: distinguishes "no English to translate from" (a content-
 * completeness problem, never AI's fault) from "has English, not generated yet" (previously both
 * silently lumped into NEEDS_SPANISH_TRANSLATION, which falsely counted zero-content resources as
 * ready-to-translate), and distinguishes "pending review has an integrity conflict" from
 * "pending review is clean and one click from publish." Derived live, same as
 * SpanishReadinessClassification — no new stored column.
 */
export type SpanishQueueStatus =
  | "SIN_CONTENIDO_BASE"
  | "LISTO_PARA_GENERAR"
  | "REVISION_PENDIENTE"
  | "LISTO_PARA_PUBLICAR"
  | "ESPANOL_PUBLICADO"
  | "FUENTE_OFICIAL_ES"
  | "REVERIFICAR_PRIMERO";

export const SPANISH_QUEUE_STATUS_LABEL: Record<SpanishQueueStatus, string> = {
  SIN_CONTENIDO_BASE: "Sin contenido base",
  LISTO_PARA_GENERAR: "Listo para generar",
  REVISION_PENDIENTE: "Revisión pendiente",
  LISTO_PARA_PUBLICAR: "Listo para publicar",
  ESPANOL_PUBLICADO: "Español publicado",
  FUENTE_OFICIAL_ES: "Fuente oficial ES",
  REVERIFICAR_PRIMERO: "Reverificar primero",
};

/** Content-readiness gate (owner workspace): translatable only if at least one EN presentation field is non-empty. */
export function hasTranslatableBaseContent(resource: Pick<ResourceRecord, "shortDescriptionEn" | "detailsEn" | "eligibilityEn"> & { contact: Pick<ResourceRecord["contact"], "hoursNoteEn"> }): boolean {
  return Boolean(resource.shortDescriptionEn?.trim() || resource.detailsEn?.trim() || resource.eligibilityEn?.trim() || resource.contact.hoursNoteEn?.trim());
}

export type SpanishReconciliationEntry = {
  resource: ResourceRecord;
  spanishStatus: SpanishStatus;
  spanishSourceType: SpanishSourceType | null;
  classification: SpanishReadinessClassification;
  highRisk: boolean;
  hasOfficialSourceUrl: boolean;
  /** Existing *_es text is display-only info here — never itself treated as "approved" (ES-6A doctrine). */
  hasExistingSpanishText: boolean;
  pendingTranslationCount: number;
  /** Existing Resource Official-Spanish Bridge (Gate ES-9G): full pending official_spanish proposal rows for this resource, for the owner workspace's EN↔ES paired preview. */
  pendingOfficialSpanish: ResourceChangeProposalRow[];
  pendingOfficialSpanishCount: number;
  /** True only when every pending official_spanish proposal passes checkOfficialSpanishFieldIntegrity against the resource's CURRENT structured facts — a live re-check, not the value captured at attach time. */
  pendingOfficialSpanishClean: boolean;
  /** Gate ES-9G: pendingFactualCount now excludes BOTH translation and official_spanish — neither is a "factual" structured-field proposal, both are Spanish-presentation content reviewed through their own dedicated flows. */
  pendingFactualCount: number;
  /** ES-6G: official-source Spanish evidence exists but a human hasn't confirmed it yet — routes to "Confirmar español oficial", never AI translation. */
  officialSpanishAwaitingConfirmation: boolean;
  /** Owner workspace: at least one EN presentation field is non-empty. */
  hasBaseContent: boolean;
  /** Owner workspace: true only when every currently-pending translation proposal for this resource passes the integrity check against its own EN source. */
  pendingTranslationsClean: boolean;
  /** Owner workspace: the 7-value operational status driving queue CTAs — see SpanishQueueStatus. */
  queueStatus: SpanishQueueStatus;
};

export type SpanishReconciliationSnapshot = {
  entries: SpanishReconciliationEntry[];
  unavailable: boolean;
};

/** Gate ES-6D/F hard cap — lives here (not in the "use server" actions file) since it's a plain constant, not an async server action. */
export const MAX_BULK_SPANISH_DRAFT_BATCH = 20;

export type BulkSpanishDraftSummary = {
  requested: number;
  processed: number;
  proposalsCreated: number;
  skippedPending: number;
  skippedNotVerified: number;
  failed: number;
};

/**
 * Pure join/classify step — no DB access. Exported separately from the DB-fetching wrapper below
 * so the Certification inventory script (ES-6L) and tests can feed it already-fetched rows
 * without a second live query, and so it can never accidentally diverge from what the live
 * snapshot function actually computes.
 */
export function buildSpanishReconciliationEntries(
  resources: ResourceRecord[],
  spanishRows: { id: string; spanishStatus: SpanishStatus; spanishSourceType: SpanishSourceType | null }[],
  pendingRows: ResourceChangeProposalRow[],
  now: Date = new Date(),
): SpanishReconciliationEntry[] {
  const spanishById = new Map(spanishRows.map((r) => [r.id, r]));
  const pendingByResource = new Map<string, ResourceChangeProposalRow[]>();
  for (const p of pendingRows) {
    const list = pendingByResource.get(p.resourceId) ?? [];
    list.push(p);
    pendingByResource.set(p.resourceId, list);
  }

  return resources.map((resource) => {
    const spanishRow = spanishById.get(resource.id);
    const spanishStatus: SpanishStatus = spanishRow?.spanishStatus ?? "not_available";
    const spanishSourceType = spanishRow?.spanishSourceType ?? null;
    const pending = pendingByResource.get(resource.id) ?? [];
    const pendingTranslations = pending.filter((p) => p.proposalSource === "translation");
    const pendingTranslationCount = pendingTranslations.length;
    const pendingOfficialSpanish = pending.filter((p) => p.proposalSource === "official_spanish");
    const pendingOfficialSpanishCount = pendingOfficialSpanish.length;
    const pendingFactualCount = pending.filter((p) => p.proposalSource !== "translation" && p.proposalSource !== "official_spanish").length;
    const classification = classifySpanishReadiness(resource, spanishStatus, now);
    const officialSpanishAwaitingConfirmation =
      (spanishSourceType === "official_spanish_source" || spanishSourceType === "official_bilingual_source") && spanishStatus !== "official_spanish";
    const hasBaseContent = hasTranslatableBaseContent(resource);
    const pendingTranslationsClean = pendingTranslations.every((p) => {
      const enSourceFn = ES_FIELD_TO_EN_SOURCE[p.fieldName];
      const enSource = enSourceFn ? enSourceFn(resource) : null;
      const integrity = checkFieldTranslationIntegrity(enSource, p.proposedValue == null ? null : String(p.proposedValue));
      return integrity.ok;
    });
    const officialSpanishFacts = buildOfficialSpanishStructuredFacts(resource);
    const pendingOfficialSpanishClean = pendingOfficialSpanish.every((p) => {
      const relatedEnText = relatedEnTextForOfficialSpanishField(p.fieldName, resource);
      const integrity = checkOfficialSpanishFieldIntegrity(
        { ...officialSpanishFacts, relatedVerifiedEnText: relatedEnText },
        p.proposedValue == null ? null : String(p.proposedValue),
      );
      return integrity.ok;
    });
    const highRisk = isHighRiskResourceForTranslation({
      primaryCategory: resource.primaryCategory,
      crisisPhone: resource.contact.crisisPhone,
      is24Hours: resource.contact.is24Hours,
    });

    return {
      resource,
      spanishStatus,
      spanishSourceType,
      classification,
      highRisk,
      hasOfficialSourceUrl: Boolean(resource.verification.officialSourceUrl),
      hasExistingSpanishText: Boolean(
        resource.shortDescriptionEs?.trim() || resource.detailsEs?.trim() || resource.eligibilityEs?.trim() || resource.contact.hoursNoteEs?.trim(),
      ),
      pendingTranslationCount,
      pendingOfficialSpanish,
      pendingOfficialSpanishCount,
      pendingOfficialSpanishClean,
      pendingFactualCount,
      officialSpanishAwaitingConfirmation,
      hasBaseContent,
      pendingTranslationsClean,
      queueStatus: computeQueueStatus({ classification, officialSpanishAwaitingConfirmation, spanishStatus, pendingTranslationCount, pendingTranslationsClean, hasBaseContent }),
    };
  });
}

/**
 * Existing Resource Official-Spanish Bridge (Gate ES-9G) — eligibility for the owner batch
 * approval gesture in the espanol command center. Mirrors isEligibleForBulkTranslationDraft's
 * shape but for the confirm-side of the official-source flow: the resource must already be in
 * FUENTE_OFICIAL_ES (spanish_source_type official_*, not yet spanish_status=official_spanish),
 * have at least one pending official_spanish proposal, every one of those must currently pass
 * integrity (re-checked live against current structured facts, not the value at attach time),
 * and the resource must never be high-risk — defense-in-depth alongside prepareOfficialSpanishProposals'
 * own hard refusal.
 */
export function isEligibleForOfficialSpanishBatchApproval(entry: SpanishReconciliationEntry): boolean {
  if (entry.highRisk) return false;
  if (!entry.officialSpanishAwaitingConfirmation) return false;
  if (entry.pendingOfficialSpanishCount === 0) return false;
  if (!entry.pendingOfficialSpanishClean) return false;
  if (entry.pendingTranslationCount > 0) return false; // no conflicting translation proposal on any field
  return true;
}

export async function loadSpanishReconciliationSnapshot(now: Date = new Date()): Promise<SpanishReconciliationSnapshot> {
  const [resourcesResult, spanishResult, pendingResult] = await Promise.all([
    dbListCommunityResources(),
    dbListAllCommunityResourceSpanishStatuses(),
    dbListAllPendingResourceChangeProposals(),
  ]);

  if (resourcesResult.unavailable || spanishResult.unavailable || pendingResult.unavailable) {
    return { entries: [], unavailable: true };
  }

  return { entries: buildSpanishReconciliationEntries(resourcesResult.rows, spanishResult.rows, pendingResult.rows, now), unavailable: false };
}

/**
 * ES-6D/ES-6G/ES-6H/ES-6I eligibility, all in one place: must classify as NEEDS_SPANISH_TRANSLATION
 * (excludes stale/reverification-required via ES-6A precedence, and excludes anything already
 * official/verified/under-review), must have no pending translation proposal already (cost guard),
 * must not be official-Spanish-awaiting-confirmation (official source always wins over AI), and
 * must have no pending FACTUAL proposal either (translate from settled truth only).
 */
export function isEligibleForBulkTranslationDraft(entry: SpanishReconciliationEntry): boolean {
  if (entry.classification !== "NEEDS_SPANISH_TRANSLATION") return false;
  if (!entry.hasBaseContent) return false; // owner workspace: zero EN content is a content gap, never AI's job to fix
  if (entry.pendingTranslationCount > 0) return false;
  if (entry.officialSpanishAwaitingConfirmation) return false;
  if (entry.pendingFactualCount > 0) return false;
  return true;
}

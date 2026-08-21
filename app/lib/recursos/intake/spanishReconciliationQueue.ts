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
  pendingFactualCount: number;
  /** ES-6G: official-source Spanish evidence exists but a human hasn't confirmed it yet — routes to "Confirmar español oficial", never AI translation. */
  officialSpanishAwaitingConfirmation: boolean;
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
    const pendingTranslationCount = pending.filter((p) => p.proposalSource === "translation").length;
    const pendingFactualCount = pending.filter((p) => p.proposalSource !== "translation").length;

    return {
      resource,
      spanishStatus,
      spanishSourceType,
      classification: classifySpanishReadiness(resource, spanishStatus, now),
      highRisk: isHighRiskResourceForTranslation({
        primaryCategory: resource.primaryCategory,
        crisisPhone: resource.contact.crisisPhone,
        is24Hours: resource.contact.is24Hours,
      }),
      hasOfficialSourceUrl: Boolean(resource.verification.officialSourceUrl),
      hasExistingSpanishText: Boolean(
        resource.shortDescriptionEs?.trim() || resource.detailsEs?.trim() || resource.eligibilityEs?.trim() || resource.contact.hoursNoteEs?.trim(),
      ),
      pendingTranslationCount,
      pendingFactualCount,
      officialSpanishAwaitingConfirmation:
        (spanishSourceType === "official_spanish_source" || spanishSourceType === "official_bilingual_source") && spanishStatus !== "official_spanish",
    };
  });
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
  if (entry.pendingTranslationCount > 0) return false;
  if (entry.officialSpanishAwaitingConfirmation) return false;
  if (entry.pendingFactualCount > 0) return false;
  return true;
}

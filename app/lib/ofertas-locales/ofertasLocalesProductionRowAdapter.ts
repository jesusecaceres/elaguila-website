/**
 * Maps draft payloads to production `ofertas_locales` columns (Gate OFERTAS-SCHEMA-2).
 */
import {
  filterToOfertasLocalesProductionColumns,
  mergeOfertaLocalDraftSnapshot,
  OFERTAS_LOCALES_WRITE_RETURN_COLUMNS,
  parseOfertaLocalDraftSnapshot,
  type OfertaLocalDraftSnapshot,
} from "./ofertasLocalesDbSchema";
import { inferPrimaryAdFormatFromDraft } from "./ofertasLocalesTwoLaneProductModel";
import { normalizeOfertaLocalUrlInput } from "./ofertasLocalesFormatting";
import { mapOfertaLocalDraftToInsertPayload } from "./ofertasLocalesPublishMapper";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

function optionalUrl(raw: string): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  return normalizeOfertaLocalUrlInput(t) || null;
}

function buildDraftSnapshotFromDraft(
  draft: OfertaLocalDraft,
  existingSnapshot?: unknown
): Record<string, unknown> {
  const patch: OfertaLocalDraftSnapshot = {
    membershipCtaLabel: draft.membershipCtaLabel.trim() || null,
    requiresMembershipForDeals: Boolean(draft.requiresMembershipForDeals),
    magazine: {
      magazineDistributionStatus: String(draft.magazineDistributionStatus || "not_offered"),
      magazineMonthlyDropEstimate: draft.magazineMonthlyDropEstimate.trim() || null,
      magazinePickupNotes: draft.magazinePickupNotes.trim() || null,
    },
    primaryAdFormat: inferPrimaryAdFormatFromDraft(draft),
    languageTags: draft.languageTags,
  };
  return mergeOfertaLocalDraftSnapshot(existingSnapshot, patch);
}

export function buildOfertasLocalesProductionInsertRow(
  draft: OfertaLocalDraft,
  ownerId: string,
  existingSnapshot?: unknown
): Record<string, unknown> {
  const now = new Date().toISOString();
  const canonical = mapOfertaLocalDraftToInsertPayload(draft, ownerId);
  const primaryAdFormat = inferPrimaryAdFormatFromDraft(draft);

  const row: Record<string, unknown> = {
    ...canonical,
    offer_title: canonical.title,
    product_type: primaryAdFormat || canonical.offer_type,
    custom_market_type: draft.customMarketType.trim() || null,
    wants_ai_searchable_specials: Boolean(draft.wantsAiSearchableSpecials),
    wants_featured_placement: Boolean(draft.wantsFeaturedPlacement || draft.isFeaturedRequested),
    featured_placement_scope:
      draft.featuredPlacementScope && draft.featuredPlacementScope !== "none"
        ? draft.featuredPlacementScope
        : null,
    facebook_url: optionalUrl(draft.facebookUrl),
    instagram_url: optionalUrl(draft.instagramUrl),
    tiktok_url: optionalUrl(draft.tiktokUrl),
    youtube_url: optionalUrl(draft.youtubeUrl),
    google_business_url: optionalUrl(draft.googleBusinessUrl),
    google_review_url: optionalUrl(draft.googleReviewUrl),
    yelp_url: optionalUrl(draft.yelpUrl),
    draft_snapshot: buildDraftSnapshotFromDraft(draft, existingSnapshot),
    updated_at: now,
  };

  return filterToOfertasLocalesProductionColumns(row);
}

export function buildOfertasLocalesScanPrepInsertRow(
  draft: OfertaLocalDraft,
  ownerId: string
): Record<string, unknown> {
  return buildOfertasLocalesProductionInsertRow(draft, ownerId);
}

export function buildOfertasLocalesScanPrepUpdateRow(
  draft: OfertaLocalDraft,
  ownerId: string,
  existingSnapshot?: unknown
): Record<string, unknown> {
  const row = buildOfertasLocalesProductionInsertRow(draft, ownerId, existingSnapshot);
  delete row.owner_id;
  delete row.submitted_at;
  delete row.created_at;
  return row;
}

export const OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS = OFERTAS_LOCALES_WRITE_RETURN_COLUMNS;

export function pickScanPrepSubmittedAt(row: Record<string, unknown>, fallback: string): string {
  const submitted = row.submitted_at;
  if (typeof submitted === "string" && submitted.trim()) return submitted;
  const created = row.created_at;
  if (typeof created === "string" && created.trim()) return created;
  const published = row.published_at;
  if (typeof published === "string" && published.trim()) return published;
  const updated = row.updated_at;
  if (typeof updated === "string" && updated.trim()) return updated;
  return fallback;
}

export function sanitizeSupabaseWriteError(error: {
  message?: string;
  code?: string;
  hint?: string;
  details?: string;
}): { message: string; code: string | null; hint: string | null } {
  return {
    message: String(error.message ?? "unknown").slice(0, 500),
    code: error.code ?? null,
    hint: error.hint ? String(error.hint).slice(0, 200) : null,
  };
}

export function readExistingDraftSnapshotFromRow(row: { draft_snapshot?: unknown } | null | undefined): unknown {
  return parseOfertaLocalDraftSnapshot(row?.draft_snapshot);
}

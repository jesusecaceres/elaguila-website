/**
 * Maps canonical Ofertas Locales publish payloads to production `ofertas_locales` columns.
 * Overflow / legacy fields are preserved in draft_snapshot (OL-7E).
 */
import { inferPrimaryAdFormatFromDraft } from "./ofertasLocalesTwoLaneProductModel";
import { normalizeOfertaLocalUrlInput } from "./ofertasLocalesFormatting";
import { mapOfertaLocalDraftToInsertPayload } from "./ofertasLocalesPublishMapper";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

/** Columns known to exist on production and/or OL-7B bootstrap schemas. */
export const OFERTAS_LOCALES_KNOWN_DB_COLUMNS = new Set([
  "owner_id",
  "status",
  "offer_type",
  "product_type",
  "business_name",
  "title",
  "offer_title",
  "description",
  "coupon_text",
  "business_category",
  "business_subcategory",
  "market_type",
  "custom_market_type",
  "valid_from",
  "valid_until",
  "address",
  "city",
  "state",
  "zip_code",
  "phone",
  "whatsapp",
  "website_url",
  "directions_url",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
  "youtube_url",
  "google_business_url",
  "google_review_url",
  "yelp_url",
  "membership_url",
  "membership_cta_label",
  "membership_note",
  "requires_membership_for_deals",
  "digital_coupon_url",
  "digital_coupon_note",
  "wants_ai_searchable_specials",
  "wants_featured_placement",
  "featured_placement_scope",
  "flyer_assets",
  "coupon_assets",
  "external_urls",
  "draft_snapshot",
  "internal_notes",
  "reviewed_at",
  "reviewed_by",
  "published_at",
  "archived_at",
  "created_at",
  "updated_at",
  "submitted_at",
  "flyer_title",
  "service_zip_codes",
  "is_featured_requested",
  "language_tags",
  "is_magazine_pickup_partner",
  "magazine_distribution_status",
  "magazine_monthly_drop_estimate",
  "magazine_pickup_notes",
]);

function optionalUrl(raw: string): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  return normalizeOfertaLocalUrlInput(t) || null;
}

function buildDraftSnapshotExtras(
  draft: OfertaLocalDraft,
  canonical: Record<string, unknown>
): Record<string, unknown> {
  const extras: Record<string, unknown> = {
    scanPrepVersion: 1,
    primaryAdFormat: inferPrimaryAdFormatFromDraft(draft),
    wantsAiSearchableSpecials: draft.wantsAiSearchableSpecials,
    languageTags: draft.languageTags,
    serviceZipCodes: draft.serviceZipCodes,
    flyerTitle: draft.flyerTitle,
    magazine: {
      isMagazinePickupPartner: draft.isMagazinePickupPartner,
      magazineDistributionStatus: draft.magazineDistributionStatus,
      magazineMonthlyDropEstimate: draft.magazineMonthlyDropEstimate,
      magazinePickupNotes: draft.magazinePickupNotes,
    },
    socialLinks: {
      facebookUrl: draft.facebookUrl,
      instagramUrl: draft.instagramUrl,
      tiktokUrl: draft.tiktokUrl,
      youtubeUrl: draft.youtubeUrl,
      googleBusinessUrl: draft.googleBusinessUrl,
      googleReviewUrl: draft.googleReviewUrl,
      yelpUrl: draft.yelpUrl,
    },
  };

  for (const [key, value] of Object.entries(canonical)) {
    if (!OFERTAS_LOCALES_KNOWN_DB_COLUMNS.has(key)) {
      extras[key] = value;
    }
  }

  return extras;
}

export function buildOfertasLocalesScanPrepInsertRow(
  draft: OfertaLocalDraft,
  ownerId: string
): Record<string, unknown> {
  const now = new Date().toISOString();
  const canonical = mapOfertaLocalDraftToInsertPayload(draft, ownerId) as Record<string, unknown>;
  const primaryAdFormat = inferPrimaryAdFormatFromDraft(draft);

  const expanded: Record<string, unknown> = {
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
    updated_at: now,
    draft_snapshot: buildDraftSnapshotExtras(draft, canonical),
  };

  const row: Record<string, unknown> = {};
  const overflow: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(expanded)) {
    if (key === "draft_snapshot") {
      row.draft_snapshot = value;
      continue;
    }
    if (OFERTAS_LOCALES_KNOWN_DB_COLUMNS.has(key)) {
      row[key] = value;
    } else {
      overflow[key] = value;
    }
  }

  if (Object.keys(overflow).length > 0) {
    const snapshot =
      row.draft_snapshot && typeof row.draft_snapshot === "object"
        ? (row.draft_snapshot as Record<string, unknown>)
        : {};
    row.draft_snapshot = { ...snapshot, overflow };
  }

  return row;
}

export function buildOfertasLocalesScanPrepUpdateRow(
  draft: OfertaLocalDraft,
  ownerId: string
): Record<string, unknown> {
  const row = buildOfertasLocalesScanPrepInsertRow(draft, ownerId);
  delete row.owner_id;
  delete row.submitted_at;
  delete row.created_at;
  return row;
}

/** Safe select columns after insert/update — avoids submitted_at when production lacks it. */
export const OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS = "id, status, created_at, updated_at, published_at";

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

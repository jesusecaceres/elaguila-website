/**
 * Production `public.ofertas_locales` column contract (Gate OFERTAS-SCHEMA-2).
 * Single source of truth — all inserts/updates/selects must align with this list.
 */

export const OFERTAS_LOCALES_PRODUCTION_COLUMNS = [
  "id",
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
  "membership_note",
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
  "flyer_title",
  "flyer_description",
  "offer_description",
  "service_zips",
  "primary_asset_id",
  "primary_asset_url",
  "primary_storage_path",
  "primary_mime_type",
  "primary_file_name",
  "ai_scan_status",
  "ai_last_scan_job_id",
  "submitted_at",
  "last_scan_error",
  "is_featured_requested",
  "is_magazine_pickup_partner",
  "language_tags",
] as const;

export type OfertasLocalesProductionColumn = (typeof OFERTAS_LOCALES_PRODUCTION_COLUMNS)[number];

export const OFERTAS_LOCALES_PRODUCTION_COLUMN_SET = new Set<string>(OFERTAS_LOCALES_PRODUCTION_COLUMNS);

/** Legacy repo columns that do NOT exist on production — never write/select these. */
export const OFERTAS_LOCALES_LEGACY_REMOVED_COLUMNS = [
  "service_zip_codes",
  "membership_cta_label",
  "requires_membership_for_deals",
  "magazine_distribution_status",
  "magazine_monthly_drop_estimate",
  "magazine_pickup_notes",
] as const;

export type OfertaLocalDraftSnapshot = {
  membershipCtaLabel?: string | null;
  requiresMembershipForDeals?: boolean;
  magazine?: {
    magazineDistributionStatus?: string;
    magazineMonthlyDropEstimate?: string | null;
    magazinePickupNotes?: string | null;
  };
  [key: string]: unknown;
};

export function parseOfertaLocalDraftSnapshot(raw: unknown): OfertaLocalDraftSnapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as OfertaLocalDraftSnapshot;
}

/** Public-safe location fields stored in `draft_snapshot.location` (country not on parent columns). */
export function readDraftSnapshotLocationFields(snapshot: OfertaLocalDraftSnapshot): {
  country: string | null;
} {
  const loc = snapshot.location;
  if (!loc || typeof loc !== "object" || Array.isArray(loc)) return { country: null };
  const o = loc as Record<string, unknown>;
  const country =
    typeof o.country === "string" && o.country.trim() ? o.country.trim().slice(0, 80) : null;
  return { country };
}

export function readDraftSnapshotMembershipFields(snapshot: OfertaLocalDraftSnapshot): {
  membershipCtaLabel: string | null;
  requiresMembershipForDeals: boolean;
  magazineDistributionStatus: string;
  magazineMonthlyDropEstimate: string | null;
  magazinePickupNotes: string | null;
} {
  const magazine = snapshot.magazine && typeof snapshot.magazine === "object" ? snapshot.magazine : {};
  return {
    membershipCtaLabel:
      typeof snapshot.membershipCtaLabel === "string" && snapshot.membershipCtaLabel.trim()
        ? snapshot.membershipCtaLabel.trim()
        : null,
    requiresMembershipForDeals: Boolean(snapshot.requiresMembershipForDeals),
    magazineDistributionStatus:
      typeof magazine.magazineDistributionStatus === "string" && magazine.magazineDistributionStatus.trim()
        ? magazine.magazineDistributionStatus.trim()
        : "not_offered",
    magazineMonthlyDropEstimate:
      typeof magazine.magazineMonthlyDropEstimate === "string" && magazine.magazineMonthlyDropEstimate.trim()
        ? magazine.magazineMonthlyDropEstimate.trim()
        : null,
    magazinePickupNotes:
      typeof magazine.magazinePickupNotes === "string" && magazine.magazinePickupNotes.trim()
        ? magazine.magazinePickupNotes.trim()
        : null,
  };
}

export function mergeOfertaLocalDraftSnapshot(
  existing: unknown,
  patch: OfertaLocalDraftSnapshot
): Record<string, unknown> {
  const base = parseOfertaLocalDraftSnapshot(existing);
  const mergedMagazine = {
    ...(base.magazine && typeof base.magazine === "object" ? base.magazine : {}),
    ...(patch.magazine && typeof patch.magazine === "object" ? patch.magazine : {}),
  };
  return {
    ...base,
    ...patch,
    ...(Object.keys(mergedMagazine).length ? { magazine: mergedMagazine } : {}),
  };
}

/** Strip unknown keys before Supabase insert/update. */
export function filterToOfertasLocalesProductionColumns(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (OFERTAS_LOCALES_PRODUCTION_COLUMN_SET.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

export const OFERTAS_LOCALES_ADMIN_SELECT = `
  id,
  owner_id,
  status,
  offer_type,
  product_type,
  business_category,
  business_subcategory,
  market_type,
  custom_market_type,
  business_name,
  title,
  offer_title,
  description,
  coupon_text,
  flyer_title,
  valid_from,
  valid_until,
  address,
  city,
  state,
  zip_code,
  service_zips,
  phone,
  whatsapp,
  website_url,
  directions_url,
  facebook_url,
  instagram_url,
  tiktok_url,
  youtube_url,
  google_business_url,
  google_review_url,
  yelp_url,
  membership_url,
  membership_note,
  digital_coupon_url,
  digital_coupon_note,
  wants_ai_searchable_specials,
  wants_featured_placement,
  featured_placement_scope,
  is_magazine_pickup_partner,
  flyer_assets,
  coupon_assets,
  external_urls,
  draft_snapshot,
  is_featured_requested,
  language_tags,
  internal_notes,
  submitted_at,
  created_at,
  updated_at
`;

export const OFERTAS_LOCALES_PUBLIC_DETAIL_SELECT = `
  id,
  status,
  offer_type,
  business_category,
  market_type,
  business_name,
  title,
  description,
  coupon_text,
  flyer_title,
  valid_from,
  valid_until,
  address,
  city,
  state,
  zip_code,
  phone,
  whatsapp,
  website_url,
  directions_url,
  membership_url,
  membership_note,
  digital_coupon_url,
  digital_coupon_note,
  flyer_assets,
  coupon_assets,
  draft_snapshot,
  internal_notes,
  submitted_at,
  updated_at
`;

export const OFERTAS_LOCALES_PUBLIC_SEARCH_PARENT_SELECT = `
  id,
  status,
  offer_type,
  business_category,
  market_type,
  business_name,
  address,
  city,
  state,
  zip_code,
  phone,
  whatsapp,
  website_url,
  directions_url,
  valid_from,
  valid_until,
  membership_url,
  membership_note,
  digital_coupon_url,
  digital_coupon_note,
  flyer_assets,
  coupon_assets,
  draft_snapshot,
  internal_notes
`;

export const OFERTAS_LOCALES_PUBLIC_SEARCH_JOIN_SELECT = `
  *,
  ofertas_locales!inner (
    id,
    status,
    offer_type,
    business_category,
    market_type,
    business_name,
    address,
    city,
    state,
    zip_code,
    phone,
    whatsapp,
    website_url,
    directions_url,
    valid_from,
    valid_until,
    membership_url,
    membership_note,
    digital_coupon_url,
    digital_coupon_note,
    flyer_assets,
    coupon_assets,
    draft_snapshot,
    internal_notes
  )
`;

export const OFERTAS_LOCALES_WRITE_RETURN_COLUMNS =
  "id, status, submitted_at, created_at, updated_at, published_at";

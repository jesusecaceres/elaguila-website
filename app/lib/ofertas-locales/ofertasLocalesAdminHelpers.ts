/**
 * Ofertas Locales admin review — server-only queries and view models (FINAL-2).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSafeOfertaLocalSourceAssetHref } from "./ofertasLocalesClickableItemPreviewHelpers";
import { parseOfertaLocalPublishedSocialLinksFromInternalNotes } from "./ofertasLocalesPublicSearchHelpers";
import type {
  OfertaLocalFeaturedPlacementScope,
  OfertaLocalPublishedAssetMetadata,
  OfertaLocalPublishStatus,
} from "./ofertasLocalesTypes";

const INTERNAL_METADATA_PREFIX = "[ofertas_locales_metadata]";
const ADMIN_REVIEW_PREFIX = "[admin_review]";

export const OFERTAS_LOCALES_ADMIN_SELECT = `
  id,
  owner_id,
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
  service_zip_codes,
  phone,
  whatsapp,
  website_url,
  directions_url,
  membership_url,
  membership_cta_label,
  membership_note,
  requires_membership_for_deals,
  digital_coupon_url,
  digital_coupon_note,
  is_magazine_pickup_partner,
  magazine_distribution_status,
  magazine_monthly_drop_estimate,
  magazine_pickup_notes,
  flyer_assets,
  coupon_assets,
  is_featured_requested,
  language_tags,
  internal_notes,
  submitted_at,
  created_at,
  updated_at
`;

export type OfertaLocalAdminRow = {
  id: string;
  owner_id: string;
  status: OfertaLocalPublishStatus;
  offer_type: string;
  business_category: string;
  market_type: string | null;
  business_name: string;
  title: string;
  description: string | null;
  coupon_text: string | null;
  flyer_title: string | null;
  valid_from: string;
  valid_until: string;
  address: string | null;
  city: string;
  state: string | null;
  zip_code: string;
  service_zip_codes: string[];
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  directions_url: string | null;
  membership_url: string | null;
  membership_cta_label: string | null;
  membership_note: string | null;
  requires_membership_for_deals: boolean;
  digital_coupon_url: string | null;
  digital_coupon_note: string | null;
  is_magazine_pickup_partner: boolean;
  magazine_distribution_status: string;
  magazine_monthly_drop_estimate: string | null;
  magazine_pickup_notes: string | null;
  flyer_assets: unknown;
  coupon_assets: unknown;
  is_featured_requested: boolean;
  language_tags: string[];
  internal_notes: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type OfertaLocalAdminMetadata = {
  socialLinks: ReturnType<typeof parseOfertaLocalPublishedSocialLinksFromInternalNotes>;
  wantsAiSearchableSpecials: boolean;
  featuredPlacementScope: OfertaLocalFeaturedPlacementScope | null;
  userNote: string | null;
  adminReviewNotes: string[];
};

export type OfertaLocalAdminListVm = {
  id: string;
  businessName: string;
  title: string;
  offerType: string;
  businessCategory: string;
  city: string;
  zipCode: string;
  status: OfertaLocalPublishStatus;
  validFrom: string;
  validUntil: string;
  submittedAt: string;
  assetCount: number;
  wantsAiSearchableSpecials: boolean;
  featuredRequested: boolean;
  featuredPlacementScope: string | null;
  ownerIdShort: string;
};

export type OfertaLocalAdminDetailVm = OfertaLocalAdminListVm & {
  description: string | null;
  couponText: string | null;
  flyerTitle: string | null;
  marketType: string | null;
  address: string | null;
  state: string | null;
  serviceZipCodes: string[];
  phone: string | null;
  whatsapp: string | null;
  websiteHref: string | null;
  directionsHref: string | null;
  membershipUrl: string | null;
  membershipCtaLabel: string | null;
  membershipNote: string | null;
  requiresMembershipForDeals: boolean;
  digitalCouponUrl: string | null;
  digitalCouponNote: string | null;
  isMagazinePickupPartner: boolean;
  magazineDistributionStatus: string;
  magazineMonthlyDropEstimate: string | null;
  magazinePickupNotes: string | null;
  languageTags: string[];
  internalNotes: string | null;
  metadata: OfertaLocalAdminMetadata;
  flyerAssets: OfertaLocalPublishedAssetMetadata[];
  couponAssets: OfertaLocalPublishedAssetMetadata[];
  createdAt: string;
  updatedAt: string;
  ownerId: string;
};

export const OFERTAS_LOCALES_QUEUE_STATUSES: readonly OfertaLocalPublishStatus[] = [
  "pending_review",
  "submitted",
  "draft",
] as const;

export const OFERTAS_LOCALES_LIVE_STATUS: OfertaLocalPublishStatus = "approved";

export type OfertasLocalesAdminListFilters = {
  limit?: number;
  scope?: "queue" | "live";
  q?: string;
  id?: string;
  owner_id?: string;
};

function parseAssetArray(raw: unknown): OfertaLocalPublishedAssetMetadata[] {
  if (!Array.isArray(raw)) return [];
  const out: OfertaLocalPublishedAssetMetadata[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    if (!id) continue;
    out.push({
      id,
      assetType: String(o.assetType ?? "flyer_image") as OfertaLocalPublishedAssetMetadata["assetType"],
      title: String(o.title ?? "").trim(),
      note: String(o.note ?? "").trim(),
      url: String(o.url ?? "").trim(),
      fileName: String(o.fileName ?? "").trim(),
      mimeType: String(o.mimeType ?? "").trim(),
      storagePath: String(o.storagePath ?? "").trim(),
      sizeBytes: typeof o.sizeBytes === "number" ? o.sizeBytes : null,
      pageNumber: typeof o.pageNumber === "number" ? o.pageNumber : null,
      sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : 0,
    });
  }
  return out;
}

export function parseOfertaLocalAdminMetadataFromInternalNotes(
  internalNotes: string | null | undefined
): OfertaLocalAdminMetadata {
  const text = String(internalNotes ?? "");
  const socialLinks = parseOfertaLocalPublishedSocialLinksFromInternalNotes(text);

  let wantsAiSearchableSpecials = false;
  let featuredPlacementScope: OfertaLocalFeaturedPlacementScope | null = null;
  const adminReviewNotes: string[] = [];

  const metaIdx = text.indexOf(INTERNAL_METADATA_PREFIX);
  let userNote: string | null =
    metaIdx > 0 ? text.slice(0, metaIdx).trim() : metaIdx < 0 ? text.trim() : "";

  if (metaIdx >= 0) {
    const jsonPart = text.slice(metaIdx + INTERNAL_METADATA_PREFIX.length).trim();
    const endIdx = jsonPart.indexOf(ADMIN_REVIEW_PREFIX);
    const metaJson = endIdx >= 0 ? jsonPart.slice(0, endIdx).trim() : jsonPart;
    try {
      const parsed = JSON.parse(metaJson) as {
        wantsAiSearchableSpecials?: boolean;
        featuredPlacementScope?: string;
      };
      wantsAiSearchableSpecials = Boolean(parsed.wantsAiSearchableSpecials);
      const scope = String(parsed.featuredPlacementScope ?? "").trim();
      if (scope && scope !== "none") featuredPlacementScope = scope as OfertaLocalFeaturedPlacementScope;
    } catch {
      /* ignore malformed metadata */
    }
  }

  let searchFrom = 0;
  while (true) {
    const idx = text.indexOf(ADMIN_REVIEW_PREFIX, searchFrom);
    if (idx < 0) break;
    const chunk = text.slice(idx + ADMIN_REVIEW_PREFIX.length).trim();
    const nextMeta = chunk.indexOf(INTERNAL_METADATA_PREFIX);
    const nextAdmin = chunk.indexOf(ADMIN_REVIEW_PREFIX, 1);
    const end =
      nextMeta >= 0 && nextAdmin >= 0
        ? Math.min(nextMeta, nextAdmin)
        : nextMeta >= 0
          ? nextMeta
          : nextAdmin >= 0
            ? nextAdmin
            : chunk.length;
    adminReviewNotes.push(chunk.slice(0, end).trim());
    searchFrom = idx + ADMIN_REVIEW_PREFIX.length + end;
  }

  if (!userNote && metaIdx < 0 && adminReviewNotes.length === 0) {
    userNote = text.trim() || null;
  } else if (!userNote) {
    userNote = null;
  }

  return {
    socialLinks,
    wantsAiSearchableSpecials,
    featuredPlacementScope,
    userNote,
    adminReviewNotes,
  };
}

export function appendOfertaLocalAdminReviewNote(
  existingNotes: string | null | undefined,
  action: "approve" | "reject" | "archive",
  note: string | null | undefined
): string | null {
  const trimmed = String(note ?? "").trim().slice(0, 2000);
  if (!trimmed) return existingNotes?.trim() || null;

  const adminChunk = `${ADMIN_REVIEW_PREFIX}${JSON.stringify({
    action,
    note: trimmed,
    at: new Date().toISOString(),
  })}`;

  const base = String(existingNotes ?? "").trim();
  if (!base) return adminChunk;
  return `${base}\n\n${adminChunk}`.slice(0, 8000);
}

function shortOwnerId(ownerId: string): string {
  const t = ownerId.trim();
  if (t.length <= 12) return t;
  return `${t.slice(0, 8)}…${t.slice(-4)}`;
}

function mapRowToListVm(row: OfertaLocalAdminRow): OfertaLocalAdminListVm {
  const flyerAssets = parseAssetArray(row.flyer_assets);
  const couponAssets = parseAssetArray(row.coupon_assets);
  const metadata = parseOfertaLocalAdminMetadataFromInternalNotes(row.internal_notes);

  return {
    id: row.id,
    businessName: row.business_name,
    title: row.title,
    offerType: row.offer_type,
    businessCategory: row.business_category,
    city: row.city,
    zipCode: row.zip_code,
    status: row.status,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    submittedAt: row.submitted_at,
    assetCount: flyerAssets.length + couponAssets.length,
    wantsAiSearchableSpecials: metadata.wantsAiSearchableSpecials,
    featuredRequested: row.is_featured_requested,
    featuredPlacementScope: metadata.featuredPlacementScope,
    ownerIdShort: shortOwnerId(row.owner_id),
  };
}

export function mapOfertaLocalAdminRowToDetailVm(row: OfertaLocalAdminRow): OfertaLocalAdminDetailVm {
  const flyerAssets = parseAssetArray(row.flyer_assets);
  const couponAssets = parseAssetArray(row.coupon_assets);
  const metadata = parseOfertaLocalAdminMetadataFromInternalNotes(row.internal_notes);
  const list = mapRowToListVm(row);

  return {
    ...list,
    description: row.description,
    couponText: row.coupon_text,
    flyerTitle: row.flyer_title,
    marketType: row.market_type,
    address: row.address,
    state: row.state,
    serviceZipCodes: row.service_zip_codes ?? [],
    phone: row.phone,
    whatsapp: row.whatsapp,
    websiteHref: getSafeOfertaLocalSourceAssetHref(row.website_url),
    directionsHref: getSafeOfertaLocalSourceAssetHref(row.directions_url),
    membershipUrl: getSafeOfertaLocalSourceAssetHref(row.membership_url),
    membershipCtaLabel: row.membership_cta_label,
    membershipNote: row.membership_note,
    requiresMembershipForDeals: row.requires_membership_for_deals,
    digitalCouponUrl: getSafeOfertaLocalSourceAssetHref(row.digital_coupon_url),
    digitalCouponNote: row.digital_coupon_note,
    isMagazinePickupPartner: row.is_magazine_pickup_partner,
    magazineDistributionStatus: row.magazine_distribution_status,
    magazineMonthlyDropEstimate: row.magazine_monthly_drop_estimate,
    magazinePickupNotes: row.magazine_pickup_notes,
    languageTags: row.language_tags ?? [],
    internalNotes: row.internal_notes,
    metadata,
    flyerAssets,
    couponAssets,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerId: row.owner_id,
  };
}

export async function listOfertasLocalesAdminRows(
  sb: SupabaseClient,
  filters: OfertasLocalesAdminListFilters = {}
): Promise<OfertaLocalAdminRow[]> {
  const limit = Math.min(Math.max(filters.limit ?? 80, 1), 200);

  let query = sb
    .from("ofertas_locales")
    .select(OFERTAS_LOCALES_ADMIN_SELECT)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (filters.scope === "live") {
    query = query.eq("status", OFERTAS_LOCALES_LIVE_STATUS);
  } else {
    query = query.in("status", [...OFERTAS_LOCALES_QUEUE_STATUSES]);
  }

  const id = filters.id?.trim();
  if (id) query = query.eq("id", id);

  const owner = filters.owner_id?.trim();
  if (owner) query = query.eq("owner_id", owner);

  const search = filters.q?.trim();
  if (search) {
    const like = `%${search}%`;
    query = query.or(
      [
        `business_name.ilike.${like}`,
        `title.ilike.${like}`,
        `city.ilike.${like}`,
        `zip_code.ilike.${like}`,
        `id.eq.${search}`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as OfertaLocalAdminRow[];
}

export function mapOfertasLocalesAdminRowsToListVms(rows: OfertaLocalAdminRow[]): OfertaLocalAdminListVm[] {
  return rows.map(mapRowToListVm);
}

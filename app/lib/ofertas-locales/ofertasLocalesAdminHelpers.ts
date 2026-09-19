/**
 * Ofertas Locales admin review — server-only queries and view models (FINAL-2).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { applyOfertasLiveSqlSuperset, isOfertaPubliclyLive } from "@/app/admin/_lib/adminOfertasLivePredicate";
import { scanPagedRows } from "@/app/admin/_lib/adminPagedScan";
import { getSafeOfertaLocalSourceAssetHref } from "./ofertasLocalesClickableItemPreviewHelpers";
import {
  getOfertaLocalPublicTermDaysRemaining,
  isOfertaLocalPublicTermActive,
  isOfertaLocalPublicTermExpired,
} from "./ofertasLocalesFormatting";
import {
  OFERTAS_LOCALES_ADMIN_SELECT,
  parseOfertaLocalDraftSnapshot,
  readDraftSnapshotMembershipFields,
} from "./ofertasLocalesDbSchema";
import {
  formatOfertaLocalCommercialAmount,
  getOfertaLocalCommercialProductByPackageKey,
} from "./ofertasLocalesCommercial";
import {
  deriveOfertaLocalOperationalStatus,
  type OfertaLocalOperationalStatus,
} from "./ofertasLocalesOperationalStatus";
import { parseOfertaLocalPublishedSocialLinksFromInternalNotes } from "./ofertasLocalesPublicSearchHelpers";
import type {
  OfertaLocalFeaturedPlacementScope,
  OfertaLocalPublishedAssetMetadata,
  OfertaLocalPublishStatus,
} from "./ofertasLocalesTypes";

const INTERNAL_METADATA_PREFIX = "[ofertas_locales_metadata]";
const ADMIN_REVIEW_PREFIX = "[admin_review]";

export { OFERTAS_LOCALES_ADMIN_SELECT } from "./ofertasLocalesDbSchema";

export type OfertaLocalAdminRow = {
  id: string;
  leonix_ad_id?: string | null;
  owner_id: string;
  status: OfertaLocalPublishStatus;
  offer_type: string;
  product_type?: string | null;
  business_category: string;
  business_subcategory?: string | null;
  market_type: string | null;
  custom_market_type?: string | null;
  business_name: string;
  title: string;
  offer_title?: string | null;
  description: string | null;
  coupon_text: string | null;
  flyer_title: string | null;
  valid_from: string;
  valid_until: string;
  address: string | null;
  city: string;
  state: string | null;
  zip_code: string;
  service_zips: string[];
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  directions_url: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  google_business_url?: string | null;
  google_review_url?: string | null;
  yelp_url?: string | null;
  membership_url: string | null;
  membership_note: string | null;
  digital_coupon_url: string | null;
  digital_coupon_note: string | null;
  wants_ai_searchable_specials?: boolean;
  wants_featured_placement?: boolean;
  featured_placement_scope?: string | null;
  is_magazine_pickup_partner: boolean;
  flyer_assets: unknown;
  coupon_assets: unknown;
  external_urls?: unknown;
  draft_snapshot: unknown;
  is_featured_requested: boolean;
  language_tags: string[];
  internal_notes: string | null;
  published_at: string | null;
  expires_at: string | null;
  commercial_product_key?: string | null;
  commercial_amount_cents?: number | null;
  commercial_currency?: string | null;
  commercial_duration_days?: number | null;
  commercial_ai_included?: boolean | null;
  payment_status?: string | null;
  paid_at?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  payment_record_id?: string | null;
  package_entitlement_id?: string | null;
  entitlement_status?: string | null;
  entitlement_granted_at?: string | null;
  entitlement_ends_at?: string | null;
  partner_assignment_id?: string | null;
  commercial_eligibility_source?: string | null;
  active_source_asset_id?: string | null;
  public_source_asset_id?: string | null;
  asset_lifecycle_status?: string | null;
  asset_replacement_required_review?: boolean | null;
  ai_scan_status?: string | null;
  ai_last_scan_job_id?: string | null;
  last_scan_error?: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type OfertaLocalPublicTermStatus = "not_started" | "active" | "expired" | "incomplete";

export type OfertaLocalAdminMetadata = {
  socialLinks: ReturnType<typeof parseOfertaLocalPublishedSocialLinksFromInternalNotes>;
  wantsAiSearchableSpecials: boolean;
  featuredPlacementScope: OfertaLocalFeaturedPlacementScope | null;
  userNote: string | null;
  adminReviewNotes: string[];
};

export type OfertaLocalAdminListVm = {
  id: string;
  leonixAdId: string | null;
  businessName: string;
  title: string;
  offerType: string;
  businessCategory: string;
  city: string;
  zipCode: string;
  status: OfertaLocalPublishStatus;
  validFrom: string;
  validUntil: string;
  publishedAt: string | null;
  expiresAt: string | null;
  publicTermStatus: OfertaLocalPublicTermStatus;
  publicTermDaysRemaining: number | null;
  commercialProductKey: string | null;
  commercialProductLabel: string | null;
  commercialAmount: string | null;
  commercialAmountCents: number | null;
  commercialCurrency: string | null;
  commercialDurationDays: number | null;
  commercialAiIncluded: boolean;
  paymentStatus: string;
  paidAt: string | null;
  entitlementStatus: string;
  entitlementGrantedAt: string | null;
  entitlementEndsAt: string | null;
  stripeReferencePresent: boolean;
  paymentRecordId: string | null;
  packageEntitlementId: string | null;
  partnerAssignmentId: string | null;
  commercialEligibilitySource: string;
  activeSourceAssetId: string | null;
  publicSourceAssetId: string | null;
  assetLifecycleStatus: string;
  assetReplacementRequiredReview: boolean;
  aiScanStatus: string | null;
  aiLastScanJobId: string | null;
  lastScanError: string | null;
  operationalStatus: OfertaLocalOperationalStatus;
  commercialDiscrepancyWarning: string | null;
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

/** Statuses that are never public and never in the review queue — reachable through `scope: "history"`. */
export const OFERTAS_LOCALES_HISTORY_STATUSES: readonly OfertaLocalPublishStatus[] = [
  "rejected",
  "archived",
  "expired",
] as const;

/**
 * `queue`   draft / submitted / pending_review (operational review queue; default).
 * `live`    ONLY offers the public reader shows: approved + published_at + expires_at in the future + a current
 *           public source asset (+ coupon date window, non-empty name/title) — `isOfertaPubliclyLive`.
 * `history` rejected / archived / expired offers PLUS approved offers that are NOT publicly live
 *           (term ended, asset missing, ...), so nothing that left the queue becomes unreachable.
 */
export type OfertasLocalesAdminScope = "queue" | "live" | "history";

export type OfertasLocalesAdminListFilters = {
  limit?: number;
  scope?: OfertasLocalesAdminScope;
  q?: string;
  id?: string;
  owner_id?: string;
  /** Page param `status_group`: an `OfertaLocalOperationalStatus.adminKey` value (e.g. "scan_unresolved", "expiring"). */
  status_group?: string;
  /** Page param `lane`: "flyer" (weekly_flyer) | "coupon" (every other offer type). */
  lane?: string;
  /** Page param `commercial`: "ready" | "blocked" (commercially_ineligible). */
  commercial?: string;
  /** Page param `scan_review`: "blocked" | "ready" (scan_unresolved / review_unresolved / operational_recovery). */
  scan_review?: string;
  /** Page param `term`: "active" | "expired" | "expiring" | "renewal". */
  term?: string;
};

/** The five derived-status filters the Admin page used to apply AFTER the row limit. */
export type OfertasLocalesAdminDerivedFilters = Pick<
  OfertasLocalesAdminListFilters,
  "status_group" | "lane" | "commercial" | "scan_review" | "term"
>;

export type OfertasLocalesAdminListResult = {
  rows: OfertaLocalAdminRow[];
  /** Query error message (the plain `listOfertasLocalesAdminRows` swallows it and returns []). */
  error: string | null;
  /** Raw rows read before the derived filters. */
  scanned: number;
  /** True when the safety cap stopped the scan before `limit` matches / exhaustion — older matches may be missing. */
  capped: boolean;
};

const ADMIN_SEARCH_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export function parseLastOfertaLocalAdminReviewNote(
  internalNotes: string | null | undefined,
  action: "approve" | "reject" | "archive"
): string | null {
  const text = String(internalNotes ?? "");
  const notes: string[] = [];
  let searchFrom = 0;
  while (true) {
    const idx = text.indexOf(ADMIN_REVIEW_PREFIX, searchFrom);
    if (idx < 0) break;
    const chunk = text.slice(idx + ADMIN_REVIEW_PREFIX.length).trim();
    const end = chunk.search(/\n\n|\[ofertas_locales_metadata\]|\[admin_review\]/);
    const jsonPart = end >= 0 ? chunk.slice(0, end).trim() : chunk;
    try {
      const parsed = JSON.parse(jsonPart) as { action?: string; note?: string };
      if (parsed.action === action && typeof parsed.note === "string" && parsed.note.trim()) {
        notes.push(parsed.note.trim().slice(0, 2000));
      }
    } catch {
      /* ignore malformed admin review notes */
    }
    searchFrom = idx + ADMIN_REVIEW_PREFIX.length + jsonPart.length;
  }
  return notes[notes.length - 1] ?? null;
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
  const commercialProduct = getOfertaLocalCommercialProductByPackageKey(row.commercial_product_key);
  const expectedProduct =
    row.offer_type === "weekly_flyer"
      ? getOfertaLocalCommercialProductByPackageKey("ofertas_locales_flyer_30d")
      : getOfertaLocalCommercialProductByPackageKey("ofertas_locales_coupons_30d");
  const commercialDiscrepancyWarning =
    commercialProduct && expectedProduct && commercialProduct.packageKey !== expectedProduct.packageKey
      ? "Product key does not match listing lane."
      : commercialProduct && row.commercial_amount_cents != null && row.commercial_amount_cents !== commercialProduct.amountCents
        ? "Paid amount does not match expected product price."
        : null;
  const termActive = isOfertaLocalPublicTermActive(row.published_at, row.expires_at);
  const termExpired = isOfertaLocalPublicTermExpired(row.expires_at);
  const publicTermStatus: OfertaLocalPublicTermStatus =
    row.status !== "approved"
      ? "not_started"
      : termActive
        ? "active"
        : termExpired
          ? "expired"
          : "incomplete";
  const assetCount = flyerAssets.length + couponAssets.length;
  const rejectionNote = parseLastOfertaLocalAdminReviewNote(row.internal_notes, "reject");
  const operationalStatus = deriveOfertaLocalOperationalStatus({
    status: row.status,
    offerType: row.offer_type,
    leonixAdId: row.leonix_ad_id ?? null,
    commercialProductKey: row.commercial_product_key ?? null,
    commercialAmountCents: row.commercial_amount_cents ?? null,
    commercialAiIncluded: row.commercial_ai_included ?? null,
    paymentStatus: row.payment_status ?? null,
    entitlementStatus: row.entitlement_status ?? null,
    paymentRecordId: row.payment_record_id ?? null,
    packageEntitlementId: row.package_entitlement_id ?? null,
    commercialEligibilitySource: row.commercial_eligibility_source ?? null,
    commercialDiscrepancyWarning,
    activeSourceAssetId: row.active_source_asset_id ?? null,
    publicSourceAssetId: row.public_source_asset_id ?? null,
    assetLifecycleStatus: row.asset_lifecycle_status ?? null,
    assetReplacementRequiredReview: row.asset_replacement_required_review ?? null,
    assetCount,
    aiScanStatus: row.ai_scan_status ?? null,
    aiLastScanJobId: row.ai_last_scan_job_id ?? null,
    lastScanError: row.last_scan_error ?? null,
    wantsAiSearchableSpecials: Boolean(row.wants_ai_searchable_specials ?? metadata.wantsAiSearchableSpecials),
    rejectionNote,
    publicTermStatus,
    publicTermDaysRemaining:
      row.status === "approved" && row.expires_at
        ? getOfertaLocalPublicTermDaysRemaining(row.expires_at)
        : null,
  });

  return {
    id: row.id,
    leonixAdId: row.leonix_ad_id ?? null,
    businessName: row.business_name,
    title: row.title,
    offerType: row.offer_type,
    businessCategory: row.business_category,
    city: row.city,
    zipCode: row.zip_code,
    status: row.status,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    publicTermStatus,
    publicTermDaysRemaining:
      row.status === "approved" && row.expires_at
        ? getOfertaLocalPublicTermDaysRemaining(row.expires_at)
        : null,
    commercialProductKey: row.commercial_product_key ?? null,
    commercialProductLabel: commercialProduct?.labelEs ?? null,
    commercialAmount:
      row.commercial_amount_cents == null
        ? null
        : formatOfertaLocalCommercialAmount(row.commercial_amount_cents, row.commercial_currency),
    commercialAmountCents: row.commercial_amount_cents ?? null,
    commercialCurrency: row.commercial_currency ?? null,
    commercialDurationDays: row.commercial_duration_days ?? null,
    commercialAiIncluded: row.commercial_ai_included === true,
    paymentStatus: row.payment_status ?? "unpaid",
    paidAt: row.paid_at ?? null,
    entitlementStatus: row.entitlement_status ?? "none",
    entitlementGrantedAt: row.entitlement_granted_at ?? null,
    entitlementEndsAt: row.entitlement_ends_at ?? null,
    stripeReferencePresent: Boolean(row.stripe_checkout_session_id || row.stripe_payment_intent_id),
    paymentRecordId: row.payment_record_id ?? null,
    packageEntitlementId: row.package_entitlement_id ?? null,
    partnerAssignmentId: row.partner_assignment_id ?? null,
    commercialEligibilitySource: row.commercial_eligibility_source ?? "paid",
    activeSourceAssetId: row.active_source_asset_id ?? null,
    publicSourceAssetId: row.public_source_asset_id ?? null,
    assetLifecycleStatus: row.asset_lifecycle_status ?? "legacy",
    assetReplacementRequiredReview: row.asset_replacement_required_review === true,
    aiScanStatus: row.ai_scan_status ?? null,
    aiLastScanJobId: row.ai_last_scan_job_id ?? null,
    lastScanError: row.last_scan_error ?? null,
    operationalStatus,
    commercialDiscrepancyWarning,
    submittedAt: row.submitted_at,
    assetCount,
    wantsAiSearchableSpecials: Boolean(row.wants_ai_searchable_specials ?? metadata.wantsAiSearchableSpecials),
    featuredRequested: row.is_featured_requested,
    featuredPlacementScope:
      (row.featured_placement_scope as OfertaLocalFeaturedPlacementScope | null) ??
      metadata.featuredPlacementScope,
    ownerIdShort: shortOwnerId(row.owner_id),
  };
}

export function mapOfertaLocalAdminRowToDetailVm(row: OfertaLocalAdminRow): OfertaLocalAdminDetailVm {
  const flyerAssets = parseAssetArray(row.flyer_assets);
  const couponAssets = parseAssetArray(row.coupon_assets);
  const metadata = parseOfertaLocalAdminMetadataFromInternalNotes(row.internal_notes);
  const snapshotFields = readDraftSnapshotMembershipFields(parseOfertaLocalDraftSnapshot(row.draft_snapshot));
  const list = mapRowToListVm(row);

  return {
    ...list,
    description: row.description,
    couponText: row.coupon_text,
    flyerTitle: row.flyer_title,
    marketType: row.market_type,
    address: row.address,
    state: row.state,
    serviceZipCodes: row.service_zips ?? [],
    phone: row.phone,
    whatsapp: row.whatsapp,
    websiteHref: getSafeOfertaLocalSourceAssetHref(row.website_url),
    directionsHref: getSafeOfertaLocalSourceAssetHref(row.directions_url),
    membershipUrl: getSafeOfertaLocalSourceAssetHref(row.membership_url),
    membershipCtaLabel: snapshotFields.membershipCtaLabel,
    membershipNote: row.membership_note,
    requiresMembershipForDeals: snapshotFields.requiresMembershipForDeals,
    digitalCouponUrl: getSafeOfertaLocalSourceAssetHref(row.digital_coupon_url),
    digitalCouponNote: row.digital_coupon_note,
    isMagazinePickupPartner: row.is_magazine_pickup_partner,
    magazineDistributionStatus: snapshotFields.magazineDistributionStatus,
    magazineMonthlyDropEstimate: snapshotFields.magazineMonthlyDropEstimate,
    magazinePickupNotes: snapshotFields.magazinePickupNotes,
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

/**
 * The derived-status filters (`status_group`, `lane`, `commercial`, `scan_review`, `term`) — same rules the
 * Admin page applied in memory after the limit, now shared so they run BEFORE the limit.
 */
export function ofertaListVmMatchesAdminDerivedFilters(
  item: OfertaLocalAdminListVm,
  f: OfertasLocalesAdminDerivedFilters,
): boolean {
  const statusGroup = f.status_group ?? "";
  const lane = f.lane ?? "";
  const commercial = f.commercial ?? "";
  const scanReview = f.scan_review ?? "";
  const term = f.term ?? "";
  if (statusGroup && item.operationalStatus.adminKey !== statusGroup) return false;
  if (lane === "flyer" && item.offerType !== "weekly_flyer") return false;
  if (lane === "coupon" && item.offerType === "weekly_flyer") return false;
  if (commercial === "ready" && !item.operationalStatus.adminApprovalAllowed && item.operationalStatus.adminKey === "commercially_ineligible") return false;
  if (commercial === "blocked" && item.operationalStatus.adminKey !== "commercially_ineligible") return false;
  const scanBlockedKeys = ["scan_unresolved", "review_unresolved", "operational_recovery"];
  if (scanReview === "blocked" && !scanBlockedKeys.includes(item.operationalStatus.adminKey)) return false;
  if (scanReview === "ready" && scanBlockedKeys.includes(item.operationalStatus.adminKey)) return false;
  if (term === "active" && item.publicTermStatus !== "active") return false;
  if (term === "expired" && item.publicTermStatus !== "expired") return false;
  if (term === "expiring" && item.operationalStatus.adminKey !== "expiring") return false;
  if (term === "renewal" && !["renewal_review", "renewal_scheduled"].includes(item.operationalStatus.adminKey)) return false;
  return true;
}

/**
 * Admin list with the scope predicate AND the derived filters applied BEFORE the row limit (windowed
 * scan; see `scanPagedRows`). `scope`: "queue" | "live" | "history" (see `OfertasLocalesAdminScope`).
 * Returns the query error and cap flag instead of swallowing them.
 */
export async function listOfertasLocalesAdminRowsDetailed(
  sb: SupabaseClient,
  filters: OfertasLocalesAdminListFilters = {}
): Promise<OfertasLocalesAdminListResult> {
  const limit = Math.min(Math.max(filters.limit ?? 80, 1), 200);
  const scope: OfertasLocalesAdminScope = filters.scope === "live" || filters.scope === "history" ? filters.scope : "queue";
  const now = new Date();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  const id = filters.id?.trim();
  const owner = filters.owner_id?.trim();
  const search = filters.q?.trim();
  const derived: OfertasLocalesAdminDerivedFilters = {
    status_group: filters.status_group?.trim() || undefined,
    lane: filters.lane?.trim() || undefined,
    commercial: filters.commercial?.trim() || undefined,
    scan_review: filters.scan_review?.trim() || undefined,
    term: filters.term?.trim() || undefined,
  };
  const hasDerived = Boolean(derived.status_group || derived.lane || derived.commercial || derived.scan_review || derived.term);

  const fetchPage = async (from: number, to: number) => {
    let query = sb
      .from("ofertas_locales")
      .select(OFERTAS_LOCALES_ADMIN_SELECT)
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (scope === "live") {
      // SQL superset of the public reader; `isOfertaPubliclyLive` is the exact rule (below).
      query = applyOfertasLiveSqlSuperset(query, nowIso);
    } else if (scope === "history") {
      query = query.in("status", [...OFERTAS_LOCALES_HISTORY_STATUSES, OFERTAS_LOCALES_LIVE_STATUS]);
    } else {
      query = query.in("status", [...OFERTAS_LOCALES_QUEUE_STATUSES]);
    }

    if (id) query = query.eq("id", id);
    if (owner) query = query.eq("owner_id", owner);
    if (search) {
      const like = `%${search}%`;
      query = query.or(
        [
          `business_name.ilike.${like}`,
          `title.ilike.${like}`,
          `city.ilike.${like}`,
          `zip_code.ilike.${like}`,
          `leonix_ad_id.ilike.${like}`,
          ...(ADMIN_SEARCH_UUID_RE.test(search) ? [`id.eq.${search}`] : []),
        ].join(",")
      );
    }
    const { data, error } = await query;
    return {
      data: (data as unknown as OfertaLocalAdminRow[] | null) ?? null,
      error: error ? { message: error.message } : null,
    };
  };

  const needsAccept = scope !== "queue" || hasDerived;
  const res = await scanPagedRows<OfertaLocalAdminRow>({
    limit,
    fetchPage,
    accept: needsAccept
      ? (rows) =>
          rows.filter((row) => {
            const asRecord = row as unknown as Record<string, unknown>;
            if (scope === "live" && !isOfertaPubliclyLive(asRecord, nowMs)) return false;
            if (scope === "history" && row.status === "approved" && isOfertaPubliclyLive(asRecord, nowMs)) return false;
            return hasDerived ? ofertaListVmMatchesAdminDerivedFilters(mapRowToListVm(row), derived) : true;
          })
      : undefined,
    getId: (r) => r.id,
  });
  return { rows: res.rows, error: res.error, scanned: res.scanned, capped: res.capped };
}

/** Back-compat array form of `listOfertasLocalesAdminRowsDetailed` (errors swallowed → []). */
export async function listOfertasLocalesAdminRows(
  sb: SupabaseClient,
  filters: OfertasLocalesAdminListFilters = {}
): Promise<OfertaLocalAdminRow[]> {
  const res = await listOfertasLocalesAdminRowsDetailed(sb, filters);
  return res.error ? [] : res.rows;
}

export function mapOfertasLocalesAdminRowsToListVms(rows: OfertaLocalAdminRow[]): OfertaLocalAdminListVm[] {
  return rows.map(mapRowToListVm);
}

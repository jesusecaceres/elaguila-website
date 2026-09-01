/**
 * Ofertas Locales owner dashboard — safe projections (FINAL-3).
 * Never expose raw internal_notes to owner clients.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapOfertaLocalAdminRowToDetailVm,
  OFERTAS_LOCALES_ADMIN_SELECT,
  parseOfertaLocalAdminMetadataFromInternalNotes,
  type OfertaLocalAdminRow,
  type OfertaLocalPublicTermStatus,
} from "./ofertasLocalesAdminHelpers";
import {
  isOfertaLocalExpired,
  isOfertaLocalPublicTermActive,
  isOfertaLocalPublicTermExpired,
} from "./ofertasLocalesFormatting";
import type { OfertaLocalPublishStatus } from "./ofertasLocalesTypes";
import type { OfertaLocalOperationalStatus } from "./ofertasLocalesOperationalStatus";

const ADMIN_REVIEW_PREFIX = "[admin_review]";

export const OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES: readonly OfertaLocalPublishStatus[] = [
  "draft",
  "submitted",
  "pending_review",
  "rejected",
] as const;

export type OfertaLocalOwnerListItem = {
  id: string;
  leonixAdId: string | null;
  businessName: string;
  title: string;
  offerType: string;
  businessCategory: string;
  city: string;
  zipCode: string;
  status: OfertaLocalPublishStatus;
  displayStatus: string;
  validFrom: string;
  validUntil: string;
  publishedAt: string | null;
  expiresAt: string | null;
  publicTermStatus: OfertaLocalPublicTermStatus;
  publicTermDaysRemaining: number | null;
  commercialProductKey: string | null;
  commercialProductLabel: string | null;
  commercialAmount: string | null;
  commercialCurrency: string | null;
  commercialDurationDays: number | null;
  commercialAiIncluded: boolean;
  paymentStatus: string;
  paidAt: string | null;
  entitlementStatus: string;
  entitlementGrantedAt: string | null;
  entitlementEndsAt: string | null;
  partnerAssignmentId: string | null;
  commercialEligibilitySource: string;
  activeSourceAssetId: string | null;
  publicSourceAssetId: string | null;
  assetLifecycleStatus: string;
  assetReplacementRequiredReview: boolean;
  checkoutEligible: boolean;
  submittedAt: string;
  assetCount: number;
  wantsAiSearchableSpecials: boolean;
  featuredRequested: boolean;
  featuredPlacementScope: string | null;
  rejectionNote: string | null;
  operationalStatus: OfertaLocalOperationalStatus;
  canEdit: boolean;
  publicResultsHref: string | null;
};

export type OfertaLocalOwnerDetail = Omit<
  ReturnType<typeof mapOfertaLocalAdminRowToDetailVm>,
  "internalNotes" | "ownerId"
> & {
  displayStatus: string;
  statusMessage: string;
  rejectionNote: string | null;
  canEdit: boolean;
  isExpired: boolean;
  publicResultsHref: string | null;
  checkoutEligible: boolean;
  analytics?: {
    views: number;
    listingOpens: number;
    productOpens: number;
    productSearchClicks: number;
    shares: number;
    shoppingListAdds: number;
    contactActions: number;
    websiteClicks: number;
    directionsClicks: number;
    lastActivity: string | null;
    unavailable: boolean;
  };
};

export function ofertaLocalOwnerStatusLabel(
  status: OfertaLocalPublishStatus,
  lang: "es" | "en",
  isExpired = false
): string {
  if (isExpired && status === "approved") {
    return lang === "es" ? "Expirada" : "Expired";
  }
  const es: Record<OfertaLocalPublishStatus, string> = {
    draft: "Borrador",
    submitted: "Enviada",
    pending_review: "Pendiente de revisión",
    approved: "Aprobada",
    rejected: "Rechazada",
    archived: "Archivada",
    expired: "Expirada",
  };
  const en: Record<OfertaLocalPublishStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    pending_review: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    archived: "Archived",
    expired: "Expired",
  };
  return (lang === "es" ? es : en)[status] ?? status;
}

export function ofertaLocalOwnerStatusMessage(
  status: OfertaLocalPublishStatus,
  lang: "es" | "en",
  rejectionNote: string | null,
  isExpired = false
): string {
  if (status === "pending_review" || status === "submitted" || status === "draft") {
    return lang === "es" ? "Tu oferta está en revisión." : "Your offer is under review.";
  }
  if (status === "approved") {
    if (isExpired) {
      return lang === "es"
        ? "Tu oferta ya no está visible públicamente porque terminó el término público."
        : "Your deal is no longer publicly visible because the public term ended.";
    }
    return lang === "es" ? "Tu oferta fue aprobada." : "Your offer was approved.";
  }
  if (status === "rejected") {
    if (rejectionNote?.trim()) return rejectionNote.trim();
    return lang === "es"
      ? "Tu oferta fue rechazada. Contacta a Leonix para más detalles."
      : "Your offer was rejected. Contact Leonix for more details.";
  }
  if (status === "archived") {
    return lang === "es"
      ? "Esta oferta está archivada. Contacta a Leonix si necesitas reactivarla."
      : "This offer is archived. Contact Leonix if you need it restored.";
  }
  return "";
}

/** Owner-safe: only reject-action admin notes intended for the submitter. */
export function parseOfertaLocalOwnerSafeRejectionNote(
  internalNotes: string | null | undefined
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
      if (parsed.action === "reject" && typeof parsed.note === "string" && parsed.note.trim()) {
        notes.push(parsed.note.trim().slice(0, 2000));
      }
    } catch {
      /* ignore */
    }
    searchFrom = idx + ADMIN_REVIEW_PREFIX.length + jsonPart.length;
  }
  if (!notes.length) return null;
  return notes[notes.length - 1] ?? null;
}

function resolveDisplayStatus(
  row: OfertaLocalAdminRow,
  lang: "es" | "en"
): { displayStatus: string; isExpired: boolean } {
  const expired = row.status === "approved"
    ? isOfertaLocalPublicTermExpired(row.expires_at)
    : isOfertaLocalExpired(row.valid_until);
  if (expired && row.status === "approved") {
    return { displayStatus: ofertaLocalOwnerStatusLabel("expired", lang, true), isExpired: true };
  }
  return {
    displayStatus: ofertaLocalOwnerStatusLabel(row.status, lang, expired),
    isExpired: expired,
  };
}

function publicResultsHrefForStatus(status: OfertaLocalPublishStatus, isExpired: boolean): string | null {
  if (status === "approved" && !isExpired) return "/clasificados/ofertas-locales";
  return null;
}

export function mapOfertaLocalRowToOwnerListItem(
  row: OfertaLocalAdminRow,
  lang: "es" | "en"
): OfertaLocalOwnerListItem {
  const detail = mapOfertaLocalAdminRowToDetailVm(row);
  const metadata = parseOfertaLocalAdminMetadataFromInternalNotes(row.internal_notes);
  const rejectionNote = parseOfertaLocalOwnerSafeRejectionNote(row.internal_notes);
  const { isExpired } = resolveDisplayStatus(row, lang);
  const termActive = isOfertaLocalPublicTermActive(row.published_at, row.expires_at);

  return {
    id: row.id,
    leonixAdId: detail.leonixAdId,
    businessName: detail.businessName,
    title: detail.title,
    offerType: detail.offerType,
    businessCategory: detail.businessCategory,
    city: detail.city,
    zipCode: detail.zipCode,
    status: row.status,
    displayStatus: lang === "es" ? detail.operationalStatus.labelEs : detail.operationalStatus.labelEn,
    validFrom: detail.validFrom,
    validUntil: detail.validUntil,
    publishedAt: detail.publishedAt,
    expiresAt: detail.expiresAt,
    publicTermStatus: detail.publicTermStatus,
    publicTermDaysRemaining: detail.publicTermDaysRemaining,
    commercialProductKey: detail.commercialProductKey,
    commercialProductLabel: detail.commercialProductLabel,
    commercialAmount: detail.commercialAmount,
    commercialCurrency: detail.commercialCurrency,
    commercialDurationDays: detail.commercialDurationDays,
    commercialAiIncluded: detail.commercialAiIncluded,
    paymentStatus: detail.paymentStatus,
    paidAt: detail.paidAt,
    entitlementStatus: detail.entitlementStatus,
    entitlementGrantedAt: detail.entitlementGrantedAt,
    entitlementEndsAt: detail.entitlementEndsAt,
    partnerAssignmentId: detail.partnerAssignmentId,
    commercialEligibilitySource: detail.commercialEligibilitySource,
    activeSourceAssetId: detail.activeSourceAssetId,
    publicSourceAssetId: detail.publicSourceAssetId,
    assetLifecycleStatus: detail.assetLifecycleStatus,
    assetReplacementRequiredReview: detail.assetReplacementRequiredReview,
    checkoutEligible:
      ["draft", "submitted", "pending_review", "rejected"].includes(row.status) &&
      detail.commercialEligibilitySource !== "partner_courtesy" &&
      detail.entitlementStatus !== "active" &&
      detail.paymentStatus !== "paid",
    submittedAt: detail.submittedAt,
    assetCount: detail.flyerAssets.length + detail.couponAssets.length,
    wantsAiSearchableSpecials: metadata.wantsAiSearchableSpecials,
    featuredRequested: detail.featuredRequested,
    featuredPlacementScope: detail.featuredPlacementScope,
    rejectionNote,
    operationalStatus: detail.operationalStatus,
    canEdit: detail.operationalStatus.editAllowed,
    publicResultsHref: detail.operationalStatus.publicLinkAllowed
      ? publicResultsHrefForStatus(row.status, isExpired || !termActive)
      : null,
  };
}

export function mapOfertaLocalRowToOwnerDetail(
  row: OfertaLocalAdminRow,
  lang: "es" | "en"
): OfertaLocalOwnerDetail {
  const vm = mapOfertaLocalAdminRowToDetailVm(row);
  const rejectionNote = parseOfertaLocalOwnerSafeRejectionNote(row.internal_notes);
  const { isExpired } = resolveDisplayStatus(row, lang);
  const termActive = isOfertaLocalPublicTermActive(row.published_at, row.expires_at);
  const { internalNotes: _i, ownerId: _o, ...safe } = vm;

  return {
    ...safe,
    displayStatus: lang === "es" ? safe.operationalStatus.labelEs : safe.operationalStatus.labelEn,
    statusMessage:
      lang === "es"
        ? safe.operationalStatus.explanationEs
        : safe.operationalStatus.explanationEn,
    rejectionNote,
    canEdit: safe.operationalStatus.editAllowed,
    isExpired,
    publicResultsHref: safe.operationalStatus.publicLinkAllowed
      ? publicResultsHrefForStatus(row.status, isExpired || !termActive)
      : null,
    checkoutEligible:
      ["draft", "submitted", "pending_review", "rejected"].includes(row.status) &&
      safe.commercialEligibilitySource !== "partner_courtesy" &&
      safe.entitlementStatus !== "active" &&
      safe.paymentStatus !== "paid",
  };
}

/**
 * Reconstructs publish-wizard draft fields from a canonical owner row, for
 * recovering an in-progress application when browser-local draft state is
 * unavailable (different origin/device, or storage was cleared). Only
 * returns fields that map 1:1 onto OfertaLocalDraft — the client is
 * responsible for sanitizing flyerAssets/couponAssets the same way it
 * sanitizes a locally-stored draft.
 */
export function mapOfertaLocalAdminRowToDraftRecoveryPatch(row: OfertaLocalAdminRow): Record<string, unknown> {
  return {
    offerType: row.offer_type || "",
    businessCategory: row.business_category || "",
    marketType: row.market_type || "",
    customMarketType: row.custom_market_type || "",
    businessName: row.business_name || "",
    title: row.title || "",
    description: row.description || "",
    couponText: row.coupon_text || "",
    flyerTitle: row.flyer_title || "",
    validFrom: row.valid_from || "",
    validUntil: row.valid_until || "",
    address: row.address || "",
    city: row.city || "",
    state: row.state || "",
    zipCode: row.zip_code || "",
    // Absent/undefined on any listing published before this column existed — default true so
    // re-opening an existing listing for edit never silently flips an always-public address to
    // hidden.
    showExactAddress: typeof row.show_exact_address === "boolean" ? row.show_exact_address : true,
    serviceZipCodes: Array.isArray(row.service_zips) ? row.service_zips : [],
    phone: row.phone || "",
    whatsapp: row.whatsapp || "",
    websiteUrl: row.website_url || "",
    directionsUrl: row.directions_url || "",
    facebookUrl: row.facebook_url || "",
    instagramUrl: row.instagram_url || "",
    tiktokUrl: row.tiktok_url || "",
    youtubeUrl: row.youtube_url || "",
    googleBusinessUrl: row.google_business_url || "",
    googleReviewUrl: row.google_review_url || "",
    yelpUrl: row.yelp_url || "",
    membershipUrl: row.membership_url || "",
    membershipNote: row.membership_note || "",
    wantsAiSearchableSpecials: Boolean(row.wants_ai_searchable_specials),
    wantsFeaturedPlacement: Boolean(row.wants_featured_placement),
    featuredPlacementScope: row.featured_placement_scope || "none",
    isFeaturedRequested: Boolean(row.is_featured_requested),
    languageTags: Array.isArray(row.language_tags) ? row.language_tags : [],
    flyerAssets: Array.isArray(row.flyer_assets) ? row.flyer_assets : [],
    couponAssets: Array.isArray(row.coupon_assets) ? row.coupon_assets : [],
  };
}

export async function listOfertasLocalesForOwner(
  sb: SupabaseClient,
  ownerId: string,
  limit = 80
): Promise<OfertaLocalAdminRow[]> {
  const { data, error } = await sb
    .from("ofertas_locales")
    .select(OFERTAS_LOCALES_ADMIN_SELECT)
    .eq("owner_id", ownerId)
    .order("submitted_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error || !data) return [];
  return data as OfertaLocalAdminRow[];
}

export async function getOfertaLocalForOwner(
  sb: SupabaseClient,
  ownerId: string,
  offerId: string
): Promise<OfertaLocalAdminRow | null> {
  const { data, error } = await sb
    .from("ofertas_locales")
    .select(OFERTAS_LOCALES_ADMIN_SELECT)
    .eq("id", offerId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) return null;
  return data as OfertaLocalAdminRow;
}

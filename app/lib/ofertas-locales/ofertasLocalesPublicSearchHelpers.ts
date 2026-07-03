/**
 * Ofertas Locales public item search — pure helpers (Stack D).
 */

import { canOfertaLocalItemBePubliclyEligible } from "./ofertasLocalesAiDbMapper";
import {
  formatOfertaLocalItemPriceDisplay,
  getOfertaLocalClickablePreviewBoundingBoxNote,
  getSafeOfertaLocalSourceAssetHref,
} from "./ofertasLocalesClickableItemPreviewHelpers";
import {
  isOfertaLocalExpired,
  normalizeOfertaLocalSearchText,
  normalizeOfertaLocalUrlInput,
} from "./ofertasLocalesFormatting";
import {
  effectiveOfertaLocalCountryForMatching,
  locationTokensMatch,
  normalizeOfertaLocalLocationToken,
  normalizeOfertaLocalPostalCode,
  readOfertaLocalPostalFromSearchParams,
  resolveOfertaLocalUsStateInput,
} from "./ofertasLocalesLocationHelpers";
import {
  buildOfertaLocalTelHref,
  buildOfertaLocalWhatsAppHref,
} from "./ofertasLocalesPreviewHelpers";
import type {
  OfertaLocalItemDbRow,
  OfertaLocalItemReviewViewModel,
  OfertaLocalPublicSearchItem,
  OfertaLocalPublicSearchSort,
  OfertaLocalPublishedAssetMetadata,
  OfertaLocalPublishStatus,
} from "./ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "./useOfertasLocalesAppLang";
import {
  OFERTAS_LOCALES_PUBLIC_SEARCH_PARENT_SELECT,
  parseOfertaLocalDraftSnapshot,
  readDraftSnapshotLocationFields,
  readDraftSnapshotMembershipFields,
} from "./ofertasLocalesDbSchema";

const INTERNAL_METADATA_PREFIX = "[ofertas_locales_metadata]";
const PUBLIC_PARENT_STATUSES: ReadonlySet<OfertaLocalPublishStatus> = new Set(["approved"]);

export type OfertaLocalPublicSearchQuery = {
  q?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  category?: string;
  marketType?: string;
  offerType?: string;
  sort?: OfertaLocalPublicSearchSort;
};

export type OfertaLocalPublicSearchParentRow = {
  id: string;
  status: OfertaLocalPublishStatus;
  offer_type: string;
  business_category: string;
  market_type: string | null;
  business_name: string;
  address: string | null;
  city: string;
  state: string | null;
  zip_code: string;
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  directions_url: string | null;
  valid_from: string;
  valid_until: string;
  membership_url: string | null;
  membership_note: string | null;
  digital_coupon_url: string | null;
  digital_coupon_note: string | null;
  flyer_assets: unknown;
  coupon_assets: unknown;
  draft_snapshot: unknown;
  internal_notes: string | null;
};

export type OfertaLocalPublicSearchJoinedRow = OfertaLocalItemDbRow & {
  ofertas_locales: OfertaLocalPublicSearchParentRow;
};

function sanitizePublicText(raw: string | null | undefined, max = 500): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

function safePublicHref(raw: string | null | undefined): string | null {
  const normalized = normalizeOfertaLocalUrlInput(String(raw ?? "").trim());
  if (!normalized) return null;
  return normalized;
}

function parseAssetArray(raw: unknown): OfertaLocalPublishedAssetMetadata[] {
  if (!Array.isArray(raw)) return [];
  const out: OfertaLocalPublishedAssetMetadata[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const id = sanitizePublicText(String(o.id ?? ""), 80);
    if (!id) continue;
    out.push({
      id,
      assetType: (String(o.assetType ?? "flyer_image") as OfertaLocalPublishedAssetMetadata["assetType"]),
      title: sanitizePublicText(String(o.title ?? ""), 120),
      note: sanitizePublicText(String(o.note ?? ""), 500),
      url: sanitizePublicText(String(o.url ?? ""), 500),
      fileName: sanitizePublicText(String(o.fileName ?? ""), 160),
      mimeType: sanitizePublicText(String(o.mimeType ?? ""), 80),
      storagePath: sanitizePublicText(String(o.storagePath ?? ""), 500),
      sizeBytes: null,
      pageNumber: typeof o.pageNumber === "number" ? o.pageNumber : null,
      sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : 0,
    });
  }
  return out;
}

export function parseOfertaLocalPublishedSocialLinksFromInternalNotes(
  internalNotes: string | null | undefined
): OfertaLocalPublicSearchItem["socialLinks"] {
  const text = String(internalNotes ?? "");
  const idx = text.indexOf(INTERNAL_METADATA_PREFIX);
  if (idx < 0) return {};
  const jsonPart = text.slice(idx + INTERNAL_METADATA_PREFIX.length).trim();
  try {
    const parsed = JSON.parse(jsonPart) as { socialLinks?: Record<string, string> };
    const links = parsed.socialLinks ?? {};
    const out: OfertaLocalPublicSearchItem["socialLinks"] = {};
    for (const [key, value] of Object.entries(links)) {
      const href = safePublicHref(value);
      if (!href) continue;
      if (key === "facebookUrl") out.facebookUrl = href;
      if (key === "instagramUrl") out.instagramUrl = href;
      if (key === "tiktokUrl") out.tiktokUrl = href;
      if (key === "youtubeUrl") out.youtubeUrl = href;
      if (key === "xTwitterUrl") out.xTwitterUrl = href;
      if (key === "linkedinUrl") out.linkedinUrl = href;
      if (key === "snapchatUrl") out.snapchatUrl = href;
      if (key === "pinterestUrl") out.pinterestUrl = href;
      if (key === "googleBusinessUrl") out.googleBusinessUrl = href;
      if (key === "googleReviewUrl") out.googleReviewUrl = href;
      if (key === "yelpUrl") out.yelpUrl = href;
    }
    return out;
  } catch {
    return {};
  }
}

function findPublishedAssetById(
  assets: OfertaLocalPublishedAssetMetadata[],
  sourceAssetId: string
): OfertaLocalPublishedAssetMetadata | null {
  if (!sourceAssetId.trim()) return null;
  return assets.find((a) => a.id === sourceAssetId) ?? null;
}

export function resolveOfertaLocalPublicSourceAsset(
  item: Pick<OfertaLocalItemDbRow, "source_asset_id" | "source_asset_url">,
  parent: Pick<OfertaLocalPublicSearchParentRow, "flyer_assets" | "coupon_assets">
): { label: string; href: string | null } {
  const assets = [
    ...parseAssetArray(parent.flyer_assets),
    ...parseAssetArray(parent.coupon_assets),
  ];
  const match = findPublishedAssetById(assets, item.source_asset_id ?? "");
  const itemHref = getSafeOfertaLocalSourceAssetHref(item.source_asset_url);
  const assetHref = getSafeOfertaLocalSourceAssetHref(match?.url);
  const href = itemHref ?? assetHref;
  const label =
    match?.fileName?.trim() ||
    match?.title?.trim() ||
    (item.source_asset_id?.trim() ? item.source_asset_id.trim() : "");
  return { label, href };
}

export function isOfertaLocalPublicSearchRowEligible(
  row: OfertaLocalPublicSearchJoinedRow,
  now: Date = new Date()
): boolean {
  const parent = row.ofertas_locales;
  if (!PUBLIC_PARENT_STATUSES.has(parent.status)) return false;
  if (isOfertaLocalExpired(parent.valid_until, now)) return false;
  if (row.review_status !== "approved") return false;
  if (!row.is_active) return false;
  if (!sanitizePublicText(row.item_name, 200)) return false;

  const itemFrom = row.valid_from?.trim() ?? "";
  const itemUntil = row.valid_until?.trim() ?? "";
  const validFrom = itemFrom || parent.valid_from;
  const validUntil = itemUntil || parent.valid_until;

  return canOfertaLocalItemBePubliclyEligible(
    {
      review_status: row.review_status,
      is_active: row.is_active,
      valid_from: itemFrom || null,
      valid_until: itemUntil || null,
      parentOfferStatus: parent.status,
    },
    parent.status
  ) && !isOfertaLocalExpired(validUntil, now);
}

export function mapOfertaLocalPublicSearchRowToItem(
  row: OfertaLocalPublicSearchJoinedRow,
  lang: OfertasLocalesAppLang = "es"
): OfertaLocalPublicSearchItem {
  const parent = row.ofertas_locales;
  const snapshot = parseOfertaLocalDraftSnapshot(parent.draft_snapshot);
  const snapshotFields = readDraftSnapshotMembershipFields(snapshot);
  const locationFields = readDraftSnapshotLocationFields(snapshot);
  const source = resolveOfertaLocalPublicSourceAsset(row, parent);
  const itemFrom = row.valid_from?.trim() || parent.valid_from;
  const itemUntil = row.valid_until?.trim() || parent.valid_until;
  const businessName = sanitizePublicText(row.business_name || parent.business_name, 200);
  const city = sanitizePublicText(row.business_city || parent.city, 80);
  const state = sanitizePublicText(row.business_state || parent.state, 40);
  const zipCode = sanitizePublicText(row.business_zip_code || parent.zip_code, 20);
  const address = sanitizePublicText(row.business_address || parent.address, 200);
  const phoneRaw = sanitizePublicText(parent.phone || parent.whatsapp, 40);
  const phoneHref = buildOfertaLocalTelHref(phoneRaw);
  const whatsappHref = buildOfertaLocalWhatsAppHref(parent.whatsapp ?? parent.phone ?? "", businessName);
  const websiteHref = safePublicHref(parent.website_url);
  const directionsDirect = safePublicHref(parent.directions_url);
  const directionsHref =
    directionsDirect ||
    (address || city || zipCode
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [address, city, state, locationFields.country, zipCode].filter(Boolean).join(", ")
        )}`
      : null);

  const priceVm: Pick<OfertaLocalItemReviewViewModel, "priceText" | "priceAmount" | "unit"> = {
    priceText: row.price_text ?? "",
    priceAmount: row.price_amount,
    unit: row.unit ?? "",
  };

  return {
    id: row.id,
    itemName: sanitizePublicText(row.item_name, 200),
    normalizedItemName: sanitizePublicText(row.normalized_item_name, 200),
    priceText: sanitizePublicText(row.price_text, 64),
    priceAmount: row.price_amount,
    unit: sanitizePublicText(row.unit, 32),
    category: sanitizePublicText(row.category, 80),
    subcategory: sanitizePublicText(row.subcategory, 80),
    searchTags: (row.search_tags ?? []).map((t) => sanitizePublicText(t, 64)).filter(Boolean),
    sourcePage: row.source_page,
    sourceAssetLabel: source.label,
    sourceAssetHref: source.href,
    validFrom: itemFrom || null,
    validUntil: itemUntil || null,
    businessName,
    address,
    city,
    state,
    zipCode,
    country: locationFields.country ?? "",
    phoneDisplay: phoneRaw,
    phoneHref: phoneHref || null,
    whatsappHref: whatsappHref || null,
    websiteHref,
    directionsHref,
    membershipUrl: safePublicHref(parent.membership_url),
    membershipNote: sanitizePublicText(parent.membership_note, 300),
    requiresMembership: snapshotFields.requiresMembershipForDeals,
    digitalCouponUrl: safePublicHref(parent.digital_coupon_url),
    digitalCouponNote: sanitizePublicText(parent.digital_coupon_note, 300),
    offerType: sanitizePublicText(parent.offer_type, 64),
    marketType: sanitizePublicText(parent.market_type, 64),
    businessCategory: sanitizePublicText(parent.business_category, 64),
    socialLinks: parseOfertaLocalPublishedSocialLinksFromInternalNotes(parent.internal_notes),
    boundingBoxNote: getOfertaLocalClickablePreviewBoundingBoxNote(lang),
    updatedAt: row.updated_at,
  };
}

function matchesKeyword(item: OfertaLocalPublicSearchItem, q: string): boolean {
  const needle = normalizeOfertaLocalSearchText(q);
  if (!needle) return true;
  const haystacks = [
    item.itemName,
    item.normalizedItemName,
    item.category,
    item.subcategory,
    item.city,
    item.state,
    item.country,
    item.zipCode,
    ...item.searchTags,
  ].map(normalizeOfertaLocalSearchText);
  return haystacks.some((h) => h.includes(needle));
}

function matchesCity(item: OfertaLocalPublicSearchItem, city: string): boolean {
  return locationTokensMatch(city, item.city);
}

function matchesZip(item: OfertaLocalPublicSearchItem, zip: string): boolean {
  const needle = normalizeOfertaLocalPostalCode(zip);
  if (!needle) return true;
  const hay = normalizeOfertaLocalPostalCode(item.zipCode);
  return hay.startsWith(needle) || hay.includes(needle);
}

function matchesState(
  item: Pick<OfertaLocalPublicSearchItem, "state" | "country">,
  state: string
): boolean {
  const needle = normalizeOfertaLocalLocationToken(state);
  if (!needle) return true;
  if (effectiveOfertaLocalCountryForMatching(item.country) === "united states") {
    const resolvedNeedle = resolveOfertaLocalUsStateInput(state);
    const resolvedHay = resolveOfertaLocalUsStateInput(item.state);
    if (
      normalizeOfertaLocalLocationToken(resolvedNeedle) ===
      normalizeOfertaLocalLocationToken(resolvedHay)
    ) {
      return true;
    }
  }
  return locationTokensMatch(state, item.state);
}

function matchesCountry(item: Pick<OfertaLocalPublicSearchItem, "country">, country: string): boolean {
  const needle = normalizeOfertaLocalLocationToken(country);
  if (!needle) return true;
  const hay = effectiveOfertaLocalCountryForMatching(item.country);
  return hay.includes(needle) || needle.includes(hay);
}

export function filterAndSortOfertaLocalPublicSearchItems(
  items: OfertaLocalPublicSearchItem[],
  query: OfertaLocalPublicSearchQuery
): OfertaLocalPublicSearchItem[] {
  let out = items.filter((item) => {
    if (query.category?.trim() && normalizeOfertaLocalSearchText(item.category) !== normalizeOfertaLocalSearchText(query.category)) {
      return false;
    }
    if (query.marketType?.trim() && normalizeOfertaLocalSearchText(item.marketType) !== normalizeOfertaLocalSearchText(query.marketType)) {
      return false;
    }
    if (query.offerType?.trim() && normalizeOfertaLocalSearchText(item.offerType) !== normalizeOfertaLocalSearchText(query.offerType)) {
      return false;
    }
    if (!matchesKeyword(item, query.q ?? "")) return false;
    if (!matchesCity(item, query.city ?? "")) return false;
    if (!matchesState(item, query.state ?? "")) return false;
    if (!matchesZip(item, query.zip ?? "")) return false;
    if (!matchesCountry(item, query.country ?? "")) return false;
    return true;
  });

  const sort = query.sort ?? "newest";
  out = [...out].sort((a, b) => {
    if (sort === "price_low") {
      const ap = a.priceAmount ?? Number.POSITIVE_INFINITY;
      const bp = b.priceAmount ?? Number.POSITIVE_INFINITY;
      return ap - bp;
    }
    if (sort === "expiring_soon") {
      const ae = a.validUntil ?? "9999-12-31";
      const be = b.validUntil ?? "9999-12-31";
      return ae.localeCompare(be);
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return out;
}

export function formatOfertaLocalPublicItemPriceDisplay(
  item: Pick<OfertaLocalPublicSearchItem, "priceText" | "priceAmount" | "unit">
): string {
  return formatOfertaLocalItemPriceDisplay({
    priceText: item.priceText,
    priceAmount: item.priceAmount,
    unit: item.unit,
  });
}

export function formatOfertaLocalPublicItemLocation(
  item: Pick<OfertaLocalPublicSearchItem, "city" | "state" | "zipCode" | "country">
): string {
  return [item.city, item.state, item.zipCode, item.country].filter(Boolean).join(", ");
}

export function formatOfertaLocalPublicItemValidDates(
  item: Pick<OfertaLocalPublicSearchItem, "validFrom" | "validUntil">,
  lang: OfertasLocalesAppLang
): string {
  const from = item.validFrom?.trim() ?? "";
  const until = item.validUntil?.trim() ?? "";
  if (!from && !until) return lang === "en" ? "Dates not listed" : "Fechas no indicadas";
  if (from && until) return `${from} – ${until}`;
  return from || until;
}

export function parseOfertaLocalPublicSearchQuery(
  params: URLSearchParams
): OfertaLocalPublicSearchQuery {
  const sortRaw = params.get("sort")?.trim() ?? "newest";
  const sort: OfertaLocalPublicSearchSort =
    sortRaw === "price_low" || sortRaw === "expiring_soon" ? sortRaw : "newest";
  return {
    q: params.get("q")?.trim() ?? "",
    city: params.get("city")?.trim() ?? "",
    state: params.get("state")?.trim() ?? "",
    zip: readOfertaLocalPostalFromSearchParams(params),
    country: params.get("country")?.trim() ?? "",
    category: params.get("category")?.trim() ?? "",
    marketType: params.get("marketType")?.trim() ?? "",
    offerType: params.get("offerType")?.trim() ?? "",
    sort,
  };
}

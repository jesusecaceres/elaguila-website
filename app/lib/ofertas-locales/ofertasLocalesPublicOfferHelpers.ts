/**
 * Ofertas Locales public approved offers — pure helpers (FINAL-1).
 */

import { isOfertaLocalExpired, normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";
import {
  effectiveOfertaLocalCountryForMatching,
  locationTokensMatch,
  normalizeOfertaLocalLocationToken,
  normalizeOfertaLocalPostalCode,
  readOfertaLocalPostalFromSearchParams,
  resolveOfertaLocalUsStateInput,
} from "./ofertasLocalesLocationHelpers";
import { getSafeOfertaLocalSourceAssetHref } from "./ofertasLocalesClickableItemPreviewHelpers";
import { buildOfertaLocalTelHref } from "./ofertasLocalesPreviewHelpers";
import { parseOfertaLocalDraftSnapshot, readDraftSnapshotLocationFields } from "./ofertasLocalesDbSchema";
import type { OfertaLocalPublicOfferCard, OfertaLocalPublishStatus } from "./ofertasLocalesTypes";

export type OfertaLocalPublicOfferRow = {
  id: string;
  status: OfertaLocalPublishStatus;
  offer_type: string;
  business_category: string;
  market_type: string | null;
  business_name: string;
  title: string;
  description: string | null;
  valid_from: string;
  valid_until: string;
  address: string | null;
  city: string;
  state: string | null;
  zip_code: string;
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  directions_url: string | null;
  draft_snapshot: unknown;
  flyer_assets: unknown;
  coupon_assets: unknown;
  submitted_at: string;
  updated_at: string;
};

export type OfertaLocalPublicOfferSearchQuery = {
  q?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  category?: string;
  marketType?: string;
  offerType?: string;
  sort?: "newest" | "expiring_soon";
};

const PUBLIC_OFFER_STATUSES: ReadonlySet<OfertaLocalPublishStatus> = new Set(["approved"]);

function sanitizeText(raw: string | null | undefined, max: number): string {
  return String(raw ?? "")
    .replace(/\0/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

function firstAssetHref(assets: unknown): { href: string | null; label: string } {
  if (!Array.isArray(assets) || assets.length === 0) return { href: null, label: "" };
  for (const entry of assets) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const href = getSafeOfertaLocalSourceAssetHref(String(o.url ?? ""));
    const label = sanitizeText(String(o.fileName ?? o.title ?? ""), 120);
    if (href) return { href, label };
  }
  return { href: null, label: "" };
}

export function isOfertaLocalPublicOfferRowEligible(
  row: OfertaLocalPublicOfferRow,
  now: Date = new Date()
): boolean {
  if (!PUBLIC_OFFER_STATUSES.has(row.status)) return false;
  if (isOfertaLocalExpired(row.valid_until, now)) return false;
  if (!sanitizeText(row.business_name, 200) || !sanitizeText(row.title, 200)) return false;
  return true;
}

export function mapOfertaLocalPublicOfferRowToCard(row: OfertaLocalPublicOfferRow): OfertaLocalPublicOfferCard {
  const flyer = firstAssetHref(row.flyer_assets);
  const coupon = firstAssetHref(row.coupon_assets);
  const primary = flyer.href ? flyer : coupon;
  const phone = sanitizeText(row.phone || row.whatsapp, 40);
  const address = sanitizeText(row.address, 200);
  const city = sanitizeText(row.city, 80);
  const state = sanitizeText(row.state, 40);
  const zipCode = sanitizeText(row.zip_code, 20);
  const country =
    readDraftSnapshotLocationFields(parseOfertaLocalDraftSnapshot(row.draft_snapshot)).country ?? "";
  const directionsRaw = sanitizeText(row.directions_url, 500);
  const directionsHref =
    directionsRaw && directionsRaw.startsWith("http")
      ? directionsRaw
      : address || city
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            [address, city, state, country, zipCode].filter(Boolean).join(", ")
          )}`
        : null;

  return {
    id: row.id,
    businessName: sanitizeText(row.business_name, 200),
    title: sanitizeText(row.title, 200),
    offerType: sanitizeText(row.offer_type, 64),
    businessCategory: sanitizeText(row.business_category, 80),
    marketType: sanitizeText(row.market_type, 64),
    city,
    state,
    zipCode,
    country,
    address,
    validFrom: sanitizeText(row.valid_from, 32),
    validUntil: sanitizeText(row.valid_until, 32),
    phoneHref: buildOfertaLocalTelHref(phone) || null,
    websiteHref: getSafeOfertaLocalSourceAssetHref(row.website_url),
    directionsHref,
    primaryAssetHref: primary.href,
    primaryAssetLabel: primary.label,
    updatedAt: row.updated_at,
  };
}

export function filterAndSortOfertaLocalPublicOffers(
  offers: OfertaLocalPublicOfferCard[],
  query: OfertaLocalPublicOfferSearchQuery
): OfertaLocalPublicOfferCard[] {
  let out = offers.filter((offer) => {
    const q = normalizeOfertaLocalSearchText(query.q ?? "");
    if (q) {
      const hay = [
        offer.title,
        offer.businessName,
        offer.businessCategory,
        offer.marketType,
        offer.offerType,
        offer.city,
        offer.state,
        offer.country,
        offer.zipCode,
      ]
        .map(normalizeOfertaLocalSearchText)
        .some((h) => h.includes(q));
      if (!hay) return false;
    }
    if (!locationTokensMatch(query.city ?? "", offer.city)) return false;
    if (!matchesOfferState(offer, query.state ?? "")) return false;
    if (!matchesOfferZip(offer, query.zip ?? "")) return false;
    if (!matchesOfferCountry(offer, query.country ?? "")) return false;
    if (
      query.category?.trim() &&
      normalizeOfertaLocalSearchText(offer.businessCategory) !==
        normalizeOfertaLocalSearchText(query.category)
    ) {
      return false;
    }
    if (
      query.marketType?.trim() &&
      normalizeOfertaLocalSearchText(offer.marketType) !==
        normalizeOfertaLocalSearchText(query.marketType)
    ) {
      return false;
    }
    if (
      query.offerType?.trim() &&
      normalizeOfertaLocalSearchText(offer.offerType) !== normalizeOfertaLocalSearchText(query.offerType)
    ) {
      return false;
    }
    return true;
  });

  const sort = query.sort ?? "newest";
  out = [...out].sort((a, b) => {
    if (sort === "expiring_soon") return a.validUntil.localeCompare(b.validUntil);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  return out;
}

function matchesOfferState(offer: OfertaLocalPublicOfferCard, state: string): boolean {
  const needle = normalizeOfertaLocalLocationToken(state);
  if (!needle) return true;
  if (effectiveOfertaLocalCountryForMatching(offer.country) === "united states") {
    const resolvedNeedle = resolveOfertaLocalUsStateInput(state);
    const resolvedHay = resolveOfertaLocalUsStateInput(offer.state);
    if (
      normalizeOfertaLocalLocationToken(resolvedNeedle) ===
      normalizeOfertaLocalLocationToken(resolvedHay)
    ) {
      return true;
    }
  }
  return locationTokensMatch(state, offer.state);
}

function matchesOfferZip(offer: OfertaLocalPublicOfferCard, zip: string): boolean {
  const needle = normalizeOfertaLocalPostalCode(zip);
  if (!needle) return true;
  const hay = normalizeOfertaLocalPostalCode(offer.zipCode);
  return hay.startsWith(needle) || hay.includes(needle);
}

function matchesOfferCountry(offer: OfertaLocalPublicOfferCard, country: string): boolean {
  const needle = normalizeOfertaLocalLocationToken(country);
  if (!needle) return true;
  const hay = effectiveOfertaLocalCountryForMatching(offer.country);
  return hay.includes(needle) || needle.includes(hay);
}

export function parseOfertaLocalPublicOfferSearchQuery(
  params: URLSearchParams
): OfertaLocalPublicOfferSearchQuery {
  const sortRaw = params.get("sort")?.trim() ?? "newest";
  const sort: "newest" | "expiring_soon" = sortRaw === "expiring_soon" ? "expiring_soon" : "newest";
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

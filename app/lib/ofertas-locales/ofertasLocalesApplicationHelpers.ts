import {
  OFERTAS_LOCALES_COUPON_PROMOTION_SUBTYPE_OPTIONS,
  OFERTAS_LOCALES_MARKET_TYPE_OPTIONS,
  OFERTAS_LOCALES_PRICING,
  OFERTAS_LOCALES_STEP1_BASE_PRODUCTS,
} from "./ofertasLocalesConstants";
import { normalizeOfertaLocalUrlInput, normalizeOfertaLocalZipInput } from "./ofertasLocalesFormatting";
import type { OfertaLocalDraft, OfertaLocalOfferType } from "./ofertasLocalesTypes";

export function getOfertaLocalMarketDisplayLabel(
  draft: Pick<OfertaLocalDraft, "marketType" | "customMarketType">,
  lang: "es" | "en" = "es"
): string {
  if (draft.marketType === "other" && draft.customMarketType.trim()) {
    return draft.customMarketType.trim();
  }
  if (!draft.marketType) return "";
  const opt = OFERTAS_LOCALES_MARKET_TYPE_OPTIONS.find((o) => o.value === draft.marketType);
  if (!opt) return draft.marketType;
  return lang === "en" ? opt.labelEn : opt.labelEs;
}

const COUPON_PROMOTION_OFFER_TYPES: ReadonlySet<OfertaLocalOfferType> = new Set([
  "coupon",
  "promotion",
  "seasonal_special",
  "bundle",
  "featured_deal",
]);

export function isOfertaLocalWeeklyFlyerFlow(offerType: OfertaLocalDraft["offerType"]): boolean {
  return offerType === "weekly_flyer";
}

/** Coupon / Promotion base product — includes legacy internal offer types (Stack 9B). */
export function isOfertaLocalCouponPromotionFlow(offerType: OfertaLocalDraft["offerType"]): boolean {
  if (!offerType) return false;
  return COUPON_PROMOTION_OFFER_TYPES.has(offerType);
}

/** @deprecated Use isOfertaLocalCouponPromotionFlow — kept for backward compatibility. */
export function isOfertaLocalCouponFlow(offerType: OfertaLocalDraft["offerType"]): boolean {
  return isOfertaLocalCouponPromotionFlow(offerType);
}

/** @deprecated Merged into isOfertaLocalCouponPromotionFlow for UI. */
export function isOfertaLocalGeneralPromotionFlow(offerType: OfertaLocalDraft["offerType"]): boolean {
  return isOfertaLocalCouponPromotionFlow(offerType);
}

export function normalizeOfertaLocalOfferTypeToProduct(
  offerType: OfertaLocalDraft["offerType"]
): "weekly_flyer" | "coupon_promotion" | "" {
  if (!offerType) return "";
  if (offerType === "weekly_flyer") return "weekly_flyer";
  if (COUPON_PROMOTION_OFFER_TYPES.has(offerType)) return "coupon_promotion";
  return "";
}

export function getOfertaLocalProductDisplayLabel(
  draft: Pick<OfertaLocalDraft, "offerType">,
  lang: "es" | "en" = "es"
): string {
  const product = normalizeOfertaLocalOfferTypeToProduct(draft.offerType);
  if (product === "weekly_flyer") {
    const p = OFERTAS_LOCALES_STEP1_BASE_PRODUCTS[0];
    return lang === "en" ? p.labelEn : p.labelEs;
  }
  if (product === "coupon_promotion") {
    const p = OFERTAS_LOCALES_STEP1_BASE_PRODUCTS[1];
    return lang === "en" ? p.labelEn : p.labelEs;
  }
  return "";
}

export function getOfertaLocalProductPriceKey(
  draft: Pick<OfertaLocalDraft, "offerType">
): "digitalWeeklySpecials" | "digitalCouponListing" | null {
  const product = normalizeOfertaLocalOfferTypeToProduct(draft.offerType);
  if (product === "weekly_flyer") return "digitalWeeklySpecials";
  if (product === "coupon_promotion") return "digitalCouponListing";
  return null;
}

export function getOfertaLocalApplicationBasePriceMonthly(draft: Pick<OfertaLocalDraft, "offerType">): number | null {
  const key = getOfertaLocalProductPriceKey(draft);
  if (!key) return null;
  return OFERTAS_LOCALES_PRICING[key].regularPriceMonthly;
}

export function labelForCouponPromotionSubtype(
  offerType: OfertaLocalDraft["offerType"],
  lang: "es" | "en" = "es"
): string {
  if (!offerType || offerType === "weekly_flyer") return "";
  const opt = OFERTAS_LOCALES_COUPON_PROMOTION_SUBTYPE_OPTIONS.find((o) => o.value === offerType);
  if (!opt) return offerType;
  return lang === "en" ? opt.labelEn : opt.labelEs;
}

export function hasOfertaLocalAddressAccepted(draft: Pick<OfertaLocalDraft, "address" | "city" | "zipCode">): boolean {
  return Boolean(
    draft.address.trim() &&
      draft.city.trim() &&
      normalizeOfertaLocalZipInput(draft.zipCode).length === 5
  );
}

export function hasOfertaLocalDirectionsAccepted(draft: Pick<OfertaLocalDraft, "directionsUrl">): boolean {
  return Boolean(normalizeOfertaLocalUrlInput(draft.directionsUrl));
}

export function hasOfertaLocalUrlAccepted(url: string): boolean {
  return Boolean(normalizeOfertaLocalUrlInput(url));
}

export type OfertaLocalSocialLinkKey =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "googleBusiness"
  | "googleReview"
  | "yelp";

export type OfertaLocalSocialLink = {
  key: OfertaLocalSocialLinkKey;
  url: string;
  label: string;
};

export function getOfertaLocalSocialLinks(
  draft: Pick<
    OfertaLocalDraft,
    | "facebookUrl"
    | "instagramUrl"
    | "tiktokUrl"
    | "youtubeUrl"
    | "googleBusinessUrl"
    | "googleReviewUrl"
    | "yelpUrl"
  >
): OfertaLocalSocialLink[] {
  const out: OfertaLocalSocialLink[] = [];
  const push = (key: OfertaLocalSocialLinkKey, raw: string, label: string) => {
    const url = normalizeOfertaLocalUrlInput(raw);
    if (url) out.push({ key, url, label });
  };
  push("facebook", draft.facebookUrl, "Facebook");
  push("instagram", draft.instagramUrl, "Instagram");
  push("tiktok", draft.tiktokUrl, "TikTok");
  push("youtube", draft.youtubeUrl, "YouTube");
  push("googleBusiness", draft.googleBusinessUrl, "Google Business");
  push("googleReview", draft.googleReviewUrl, "Google Reviews");
  push("yelp", draft.yelpUrl, "Yelp");
  return out;
}

export function hasOfertaLocalSocialLinks(
  draft: Pick<
    OfertaLocalDraft,
    | "facebookUrl"
    | "instagramUrl"
    | "tiktokUrl"
    | "youtubeUrl"
    | "googleBusinessUrl"
    | "googleReviewUrl"
    | "yelpUrl"
  >
): boolean {
  return getOfertaLocalSocialLinks(draft).length > 0;
}

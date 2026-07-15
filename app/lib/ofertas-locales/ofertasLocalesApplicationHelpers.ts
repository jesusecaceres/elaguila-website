import {
  OFERTAS_LOCALES_COUPON_PROMOTION_SUBTYPE_OPTIONS,
  OFERTAS_LOCALES_MARKET_TYPE_OPTIONS,
  OFERTAS_LOCALES_PRICING,
  OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG,
  OFERTAS_LOCALES_STEP1_BASE_PRODUCTS,
  type OfertaLocalPublishProductKey,
} from "./ofertasLocalesConstants";
import { inferPrimaryAdFormatFromDraft } from "./ofertasLocalesTwoLaneProductModel";
import {
  businessCategoryUsesCustomTypeText,
  labelForBusinessSubtype,
} from "./ofertasLocalesBusinessCategoryUx";
import { buildOfertaLocalGoogleMapsSearchUrl, normalizeOfertaLocalUrlInput } from "./ofertasLocalesFormatting";
import type { OfertaLocalDraft, OfertaLocalOfferType } from "./ofertasLocalesTypes";

export function getOfertaLocalMarketDisplayLabel(
  draft: Pick<OfertaLocalDraft, "businessCategory" | "marketType" | "customMarketType">,
  lang: "es" | "en" = "es"
): string {
  if (businessCategoryUsesCustomTypeText(draft.businessCategory) && draft.customMarketType.trim()) {
    return draft.customMarketType.trim();
  }
  if (draft.marketType === "other" && draft.customMarketType.trim()) {
    return draft.customMarketType.trim();
  }
  if (!draft.marketType) return "";
  const subtypeLabel = labelForBusinessSubtype(draft.businessCategory, draft.marketType, lang);
  if (subtypeLabel) return subtypeLabel;
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

type OfertaLocalProductDraftPick = Pick<OfertaLocalDraft, "offerType"> &
  Partial<Pick<OfertaLocalDraft, "primaryAdFormat">>;

export function getOfertaLocalPublishProductKey(
  draft: OfertaLocalProductDraftPick
): OfertaLocalPublishProductKey | "" {
  const format = inferPrimaryAdFormatFromDraft({
    primaryAdFormat: draft.primaryAdFormat ?? "",
    offerType: draft.offerType,
  });
  if (format === "shopping_specials") return "interactive_flyer";
  if (format === "local_coupons") return "coupons";
  return "";
}

export function getOfertaLocalPublishProductCatalogEntry(draft: OfertaLocalProductDraftPick) {
  const key = getOfertaLocalPublishProductKey(draft);
  if (!key) return null;
  return OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG[key];
}

/** AI scan/review is included with both publish products when a lane is selected. */
export function isOfertaLocalAiIncludedInPackage(draft: OfertaLocalProductDraftPick): boolean {
  return Boolean(getOfertaLocalPublishProductCatalogEntry(draft)?.aiIncluded);
}

/**
 * Backward-compatible draft normalization — legacy wantsAiSearchableSpecials=false no longer disables AI.
 * @deprecated Field wantsAiSearchableSpecials on draft is legacy; use isOfertaLocalAiIncludedInPackage().
 */
export function normalizeOfertaLocalDraftProductEntitlements(draft: OfertaLocalDraft): OfertaLocalDraft {
  const aiIncluded = isOfertaLocalAiIncludedInPackage(draft);
  if (!aiIncluded) {
    return draft.wantsAiSearchableSpecials ? { ...draft, wantsAiSearchableSpecials: false } : draft;
  }
  return draft.wantsAiSearchableSpecials ? draft : { ...draft, wantsAiSearchableSpecials: true };
}

export function getOfertaLocalProductDisplayLabel(
  draft: OfertaLocalProductDraftPick,
  lang: "es" | "en" = "es"
): string {
  const catalog = getOfertaLocalPublishProductCatalogEntry(draft);
  if (catalog) return lang === "en" ? catalog.labelEn : catalog.labelEs;
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

/** Single complete-package display price (no AI add-on arithmetic). */
export function getOfertaLocalApplicationDisplayPrice(draft: OfertaLocalProductDraftPick): number | null {
  const catalog = getOfertaLocalPublishProductCatalogEntry(draft);
  if (catalog) return catalog.displayPriceUsd;
  return getOfertaLocalApplicationBasePriceMonthly(draft);
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

export function hasOfertaLocalAddressAccepted(
  draft: Pick<OfertaLocalDraft, "address" | "city" | "country" | "zipCode">
): boolean {
  return Boolean(draft.address.trim() && draft.city.trim() && draft.country.trim());
}

export function hasOfertaLocalDirectionsAccepted(
  draft: Pick<OfertaLocalDraft, "directionsUrl" | "address" | "city" | "state" | "country" | "zipCode">
): boolean {
  return Boolean(
    buildOfertaLocalGoogleMapsSearchUrl(draft) || normalizeOfertaLocalUrlInput(draft.directionsUrl)
  );
}

export function hasOfertaLocalUrlAccepted(url: string): boolean {
  return Boolean(normalizeOfertaLocalUrlInput(url));
}

export type OfertaLocalSocialLinkKey =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "xTwitter"
  | "linkedin"
  | "snapchat"
  | "pinterest"
  | "googleBusiness"
  | "googleReview"
  | "yelp";

export type OfertaLocalSocialLinkCategory = "follow" | "review" | "business";

export type OfertaLocalSocialLink = {
  key: OfertaLocalSocialLinkKey;
  url: string;
  label: string;
  category: OfertaLocalSocialLinkCategory;
};

export function normalizeOfertaLocalEmailInput(raw: string): string {
  return String(raw ?? "").trim().slice(0, 120);
}

export function isOfertaLocalEmailFormatValid(email: string): boolean {
  const t = normalizeOfertaLocalEmailInput(email);
  if (!t) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function resolveOfertaLocalContactEmail(draft: Pick<OfertaLocalDraft, "email">): string {
  const t = normalizeOfertaLocalEmailInput(draft.email);
  if (!t || !isOfertaLocalEmailFormatValid(t)) return "";
  return t;
}

export function buildOfertaLocalMailtoHref(email: string, businessName?: string): string {
  const t = resolveOfertaLocalContactEmail({ email });
  if (!t) return "";
  const subject = businessName?.trim()
    ? encodeURIComponent(`${businessName.trim()} · Leonix`)
    : encodeURIComponent("Leonix inquiry");
  return `mailto:${encodeURIComponent(t)}?subject=${subject}`;
}

export function getOfertaLocalSocialLinkPillClass(key: OfertaLocalSocialLinkKey): string {
  const map: Record<OfertaLocalSocialLinkKey, string> = {
    facebook: "border-blue-200 bg-blue-50 text-blue-900",
    instagram: "border-pink-200 bg-pink-50 text-pink-950",
    tiktok: "border-[#1E1814]/20 bg-[#FDF8F0] text-[#1E1814]",
    youtube: "border-red-200 bg-red-50 text-red-900",
    xTwitter: "border-[#1E1814]/20 bg-[#FDF8F0] text-[#1E1814]",
    linkedin: "border-sky-200 bg-sky-50 text-sky-950",
    snapchat: "border-yellow-200 bg-yellow-50 text-yellow-950",
    pinterest: "border-rose-200 bg-rose-50 text-rose-950",
    googleBusiness: "border-emerald-200 bg-emerald-50 text-emerald-950",
    googleReview: "border-amber-200 bg-amber-50 text-amber-950",
    yelp: "border-red-200 bg-red-50 text-red-900",
  };
  return map[key] ?? "border-[#D4C4A8] bg-white text-[#1E1814]";
}

export function getOfertaLocalSocialLinks(
  draft: Pick<
    OfertaLocalDraft,
    | "facebookUrl"
    | "instagramUrl"
    | "tiktokUrl"
    | "youtubeUrl"
    | "xTwitterUrl"
    | "linkedinUrl"
    | "snapchatUrl"
    | "pinterestUrl"
    | "googleBusinessUrl"
    | "googleReviewUrl"
    | "yelpUrl"
  >
): OfertaLocalSocialLink[] {
  const out: OfertaLocalSocialLink[] = [];
  const push = (
    key: OfertaLocalSocialLinkKey,
    raw: string,
    label: string,
    category: OfertaLocalSocialLinkCategory
  ) => {
    const url = normalizeOfertaLocalUrlInput(raw);
    if (url) out.push({ key, url, label, category });
  };
  push("facebook", draft.facebookUrl, "Facebook", "follow");
  push("instagram", draft.instagramUrl, "Instagram", "follow");
  push("tiktok", draft.tiktokUrl, "TikTok", "follow");
  push("youtube", draft.youtubeUrl, "YouTube", "follow");
  push("xTwitter", draft.xTwitterUrl, "X / Twitter", "follow");
  push("linkedin", draft.linkedinUrl, "LinkedIn", "follow");
  push("snapchat", draft.snapchatUrl, "Snapchat", "follow");
  push("pinterest", draft.pinterestUrl, "Pinterest", "follow");
  push("googleBusiness", draft.googleBusinessUrl, "Google Business", "business");
  push("googleReview", draft.googleReviewUrl, "Google Reviews", "review");
  push("yelp", draft.yelpUrl, "Yelp", "review");
  return out;
}

export function getOfertaLocalSocialLinksByCategory(
  draft: Parameters<typeof getOfertaLocalSocialLinks>[0],
  category: OfertaLocalSocialLinkCategory
): OfertaLocalSocialLink[] {
  return getOfertaLocalSocialLinks(draft).filter((link) => link.category === category);
}

export function hasOfertaLocalSocialLinks(
  draft: Pick<
    OfertaLocalDraft,
    | "facebookUrl"
    | "instagramUrl"
    | "tiktokUrl"
    | "youtubeUrl"
    | "xTwitterUrl"
    | "linkedinUrl"
    | "snapchatUrl"
    | "pinterestUrl"
    | "googleBusinessUrl"
    | "googleReviewUrl"
    | "yelpUrl"
  >
): boolean {
  return getOfertaLocalSocialLinks(draft).length > 0;
}

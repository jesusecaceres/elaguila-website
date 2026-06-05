import { OFERTAS_LOCALES_MARKET_TYPE_OPTIONS } from "./ofertasLocalesConstants";
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

export function isOfertaLocalWeeklyFlyerFlow(offerType: OfertaLocalDraft["offerType"]): boolean {
  return offerType === "weekly_flyer";
}

export function isOfertaLocalCouponFlow(offerType: OfertaLocalDraft["offerType"]): boolean {
  return offerType === "coupon";
}

export function isOfertaLocalGeneralPromotionFlow(offerType: OfertaLocalDraft["offerType"]): boolean {
  return (
    offerType === "promotion" ||
    offerType === "seasonal_special" ||
    offerType === "bundle" ||
    offerType === "featured_deal"
  );
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
  | "googleBusiness";

export type OfertaLocalSocialLink = {
  key: OfertaLocalSocialLinkKey;
  url: string;
  label: string;
};

/** Social links with normalized URLs — only non-empty entries (Stack 8). */
export function getOfertaLocalSocialLinks(
  draft: Pick<
    OfertaLocalDraft,
    "facebookUrl" | "instagramUrl" | "tiktokUrl" | "youtubeUrl" | "googleBusinessUrl"
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
  return out;
}

export function hasOfertaLocalSocialLinks(
  draft: Pick<
    OfertaLocalDraft,
    "facebookUrl" | "instagramUrl" | "tiktokUrl" | "youtubeUrl" | "googleBusinessUrl"
  >
): boolean {
  return getOfertaLocalSocialLinks(draft).length > 0;
}

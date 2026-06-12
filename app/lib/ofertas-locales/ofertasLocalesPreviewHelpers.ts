import {
  OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STATUS_OPTIONS,
  OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS,
  OFERTAS_LOCALES_OFFER_TYPE_OPTIONS,
} from "./ofertasLocalesConstants";
import { labelForPrimaryBusinessCategory } from "./ofertasLocalesBusinessCategoryUx";
import { labelForPrimaryAdFormat } from "./ofertasLocalesTwoLaneProductModel";
import { getOfertaLocalMarketDisplayLabel, getOfertaLocalProductDisplayLabel, labelForCouponPromotionSubtype } from "./ofertasLocalesApplicationHelpers";
import { activeOfertaLocalDraftAssets } from "./ofertasLocalesDraftAssetHelpers";
import { buildOfertaLocalGoogleMapsSearchUrl, normalizeOfertaLocalPhoneInput, normalizeOfertaLocalUrlInput } from "./ofertasLocalesFormatting";
import type { OfertaLocalDraft } from "./ofertasLocalesTypes";

/** True when the draft has enough content to show a meaningful preview. */
export function hasOfertaLocalDraftContent(draft: OfertaLocalDraft): boolean {
  return Boolean(draft.businessName.trim() || draft.title.trim() || draft.offerType);
}

export function labelForOfferType(value: OfertaLocalDraft["offerType"], lang: "es" | "en" = "es"): string {
  if (!value) return "";
  const productLabel = getOfertaLocalProductDisplayLabel({ offerType: value }, lang);
  if (productLabel) {
    const subtype = labelForCouponPromotionSubtype(value, lang);
    if (subtype && value !== "coupon") return `${productLabel} · ${subtype}`;
    return productLabel;
  }
  const opt = OFERTAS_LOCALES_OFFER_TYPE_OPTIONS.find((o) => o.value === value);
  if (!opt) return value;
  return lang === "en" ? opt.labelEn : opt.labelEs;
}

export function labelForPrimaryAdFormatLane(
  draft: Pick<OfertaLocalDraft, "primaryAdFormat" | "offerType">,
  lang: "es" | "en" = "es"
): string {
  return labelForPrimaryAdFormat(draft, lang);
}

export function labelForBusinessCategory(
  value: OfertaLocalDraft["businessCategory"],
  lang: "es" | "en" = "es"
): string {
  return labelForPrimaryBusinessCategory(value, lang);
}

export function labelForMarketType(
  draft: Pick<OfertaLocalDraft, "businessCategory" | "marketType" | "customMarketType">,
  lang: "es" | "en" = "es"
): string {
  return getOfertaLocalMarketDisplayLabel(draft, lang);
}

export { getOfertaLocalMarketDisplayLabel };

export function labelForMagazineStatus(
  value: OfertaLocalDraft["magazineDistributionStatus"],
  lang: "es" | "en" = "es"
): string {
  const opt = OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STATUS_OPTIONS.find((o) => o.value === value);
  if (!opt) return value;
  return lang === "en" ? opt.labelEn : opt.labelEs;
}

export function formatOfertaLocalDateRange(validFrom: string, validUntil: string): string {
  const from = validFrom.trim();
  const until = validUntil.trim();
  if (!from && !until) return "";
  if (from && until) return `${from} — ${until}`;
  return from || until;
}

export function buildOfertaLocalTelHref(phone: string): string {
  const digits = normalizeOfertaLocalPhoneInput(phone);
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  const t = phone.trim();
  return t ? `tel:${t}` : "";
}

export function buildOfertaLocalWhatsAppHref(phone: string, businessName?: string): string {
  const digits = normalizeOfertaLocalPhoneInput(phone).replace(/\D/g, "");
  if (digits.length < 8) return "";
  const name = (businessName ?? "").trim();
  const text = encodeURIComponent(
    name
      ? `Hola, vi la oferta de ${name} en Leonix. Me gustaría más información.`
      : "Hola, vi una oferta en Leonix. Me gustaría más información."
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export function resolveOfertaLocalWebsiteHref(url: string): string {
  return normalizeOfertaLocalUrlInput(url);
}

export function resolveOfertaLocalDirectionsHref(draft: OfertaLocalDraft): string {
  const generated = buildOfertaLocalGoogleMapsSearchUrl(draft);
  if (generated) return generated;
  return normalizeOfertaLocalUrlInput(draft.directionsUrl);
}

export function hasOfertaLocalFlyerAsset(draft: OfertaLocalDraft): boolean {
  return activeOfertaLocalDraftAssets(draft.flyerAssets).length > 0;
}

export function hasOfertaLocalCouponAsset(draft: OfertaLocalDraft): boolean {
  return activeOfertaLocalDraftAssets(draft.couponAssets).length > 0;
}

export function shouldShowMembershipBlock(draft: OfertaLocalDraft): boolean {
  return Boolean(
    draft.requiresMembershipForDeals ||
      draft.membershipUrl.trim() ||
      draft.membershipCtaLabel.trim() ||
      draft.membershipNote.trim()
  );
}

export function shouldShowDigitalCouponBlock(draft: OfertaLocalDraft): boolean {
  return Boolean(draft.digitalCouponUrl.trim() || draft.digitalCouponNote.trim());
}

export function shouldShowMagazinePartnerBlock(_draft: OfertaLocalDraft): boolean {
  return false;
}

export function membershipCtaLabel(lang: "es" | "en" = "es"): string {
  return lang === "en"
    ? OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.signUpBeforeYouGoEn
    : OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.signUpBeforeYouGoEs;
}

export function digitalCouponCtaLabel(lang: "es" | "en" = "en"): string {
  return lang === "en"
    ? OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.activateDigitalCouponsEn
    : OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.activateDigitalCouponsEs;
}

import {
  OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STATUS_OPTIONS,
  OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS,
  OFERTAS_LOCALES_OFFER_TYPE_OPTIONS,
} from "./ofertasLocalesConstants";
import { labelForPrimaryBusinessCategory } from "./ofertasLocalesBusinessCategoryUx";
import { labelForPrimaryAdFormat, isOfertaLocalLocalCouponsLane } from "./ofertasLocalesTwoLaneProductModel";
import {
  getOfertaLocalMarketDisplayLabel,
  getOfertaLocalProductDisplayLabel,
  labelForCouponPromotionSubtype,
} from "./ofertasLocalesApplicationHelpers";
import { activeOfertaLocalDraftAssets, assetHasExternalUrlReady, assetHasUploadedWithUrl } from "./ofertasLocalesDraftAssetHelpers";
import { buildOfertaLocalGoogleMapsSearchUrl, normalizeOfertaLocalPhoneInput, normalizeOfertaLocalUrlInput } from "./ofertasLocalesFormatting";
import { splitOfertaLocalPrimaryFlyerAssets } from "./ofertasLocalesStep5AssetLayout";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "./ofertasLocalesTypes";

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
  if (!isOfertaLocalLocalCouponsLane(draft)) return false;
  return Boolean(draft.digitalCouponUrl.trim() || draft.digitalCouponNote.trim());
}

export {
  buildOfertaLocalMailtoHref,
  getOfertaLocalSocialLinkPillClass,
  getOfertaLocalSocialLinksByCategory,
  resolveOfertaLocalContactEmail,
} from "./ofertasLocalesApplicationHelpers";

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

/**
 * Resolve a safe HTTPS business logo URL from the draft, or null. Logo is
 * optional draft/session metadata — never faked. Requires https to avoid mixed
 * content / unsafe schemes.
 */
function resolveHttpsLogoUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = normalizeOfertaLocalUrlInput(trimmed);
  if (!normalized) return null;
  return normalized.toLowerCase().startsWith("https://") ? normalized : null;
}

/** Uploaded blob logo takes priority over pasted URL. */
export function getOfertaLocalBusinessLogoUrl(draft: OfertaLocalDraft): string | null {
  const uploaded = resolveHttpsLogoUrl(String(draft.businessLogoUploadedUrl ?? ""));
  if (uploaded) return uploaded;
  return resolveHttpsLogoUrl(String(draft.businessLogoUrl ?? ""));
}

export type OfertaLocalPreviewHeroAsset = {
  href: string | null;
  fileName: string;
  mimeType: string;
  isImage: boolean;
  isPdf: boolean;
  kind: "flyer" | "coupon";
};

function resolvePreviewAssetHref(asset: OfertaLocalDraftAsset): string | null {
  if (assetHasUploadedWithUrl(asset)) {
    return normalizeOfertaLocalUrlInput(asset.url);
  }
  if (assetHasExternalUrlReady(asset)) {
    return normalizeOfertaLocalUrlInput(asset.url);
  }
  return null;
}

function toPreviewHeroAsset(
  asset: OfertaLocalDraftAsset,
  kind: "flyer" | "coupon"
): OfertaLocalPreviewHeroAsset {
  const mime = (asset.mimeType || "").toLowerCase();
  const href = resolvePreviewAssetHref(asset);
  return {
    href,
    fileName: asset.fileName.trim() || asset.title.trim() || (kind === "flyer" ? "flyer" : "coupon"),
    mimeType: mime,
    isImage: mime.startsWith("image/"),
    isPdf: mime === "application/pdf" || asset.fileName.toLowerCase().endsWith(".pdf"),
    kind,
  };
}

/** Primary hero asset for preview — coupon lane prefers coupon, flyer lane prefers main flyer. */
export function getOfertaLocalPreviewHeroAsset(draft: OfertaLocalDraft): OfertaLocalPreviewHeroAsset | null {
  if (isOfertaLocalLocalCouponsLane(draft)) {
    const coupon = activeOfertaLocalDraftAssets(draft.couponAssets)[0];
    if (coupon) return toPreviewHeroAsset(coupon, "coupon");
    const flyer = activeOfertaLocalDraftAssets(draft.flyerAssets)[0];
    if (flyer) return toPreviewHeroAsset(flyer, "flyer");
    return null;
  }
  const { primary } = splitOfertaLocalPrimaryFlyerAssets(draft.flyerAssets);
  if (primary) return toPreviewHeroAsset(primary, "flyer");
  const coupon = activeOfertaLocalDraftAssets(draft.couponAssets)[0];
  if (coupon) return toPreviewHeroAsset(coupon, "coupon");
  return null;
}

export function buildOfertaLocalPreviewLocationLine(draft: OfertaLocalDraft): string {
  return [draft.address, draft.city, draft.state, draft.country, draft.zipCode]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");
}

/** Preview-only Google Maps embed URL from a real address line (no fake coordinates). */
export function buildOfertaLocalPreviewMapEmbedUrl(locationLine: string): string {
  const q = locationLine.trim();
  if (!q) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

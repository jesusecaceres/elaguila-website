/**
 * Ofertas Locales — two-lane primary ad format (shopping specials vs local coupons).
 * Persisted in draft.primaryAdFormat + internal_notes metadata on publish (no DB migration).
 */

import {
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
} from "./ofertasLocalesApplicationHelpers";
import type {
  OfertaLocalDraft,
  OfertaLocalOfferType,
  OfertaLocalPrimaryAdFormat,
} from "./ofertasLocalesTypes";

export const OFERTAS_LOCALES_PRIMARY_AD_FORMAT_OPTIONS: ReadonlyArray<{
  value: OfertaLocalPrimaryAdFormat;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  priceDisplayMonthly: number;
}> = [
  {
    value: "shopping_specials",
    titleEs: "Especiales de compra / Volante semanal",
    titleEn: "Shopping Specials / Weekly Ad",
    descriptionEs:
      "Para negocios con productos, precios semanales, ofertas por libra, combos o volantes completos.",
    descriptionEn:
      "For businesses with products, weekly prices, price-per-pound deals, bundles, or full flyers.",
    priceDisplayMonthly: 399,
  },
  {
    value: "local_coupons",
    titleEs: "Cupones y promociones locales",
    titleEn: "Local Coupons / Promotions",
    descriptionEs:
      "Para negocios con descuentos, servicios, paquetes, ofertas limitadas o cupones individuales.",
    descriptionEn:
      "For businesses with discounts, services, packages, limited-time offers, or individual coupons.",
    priceDisplayMonthly: 199,
  },
];

export function inferPrimaryAdFormatFromDraft(
  draft: Pick<OfertaLocalDraft, "primaryAdFormat" | "offerType">
): OfertaLocalPrimaryAdFormat | "" {
  if (draft.primaryAdFormat === "shopping_specials" || draft.primaryAdFormat === "local_coupons") {
    return draft.primaryAdFormat;
  }
  if (isOfertaLocalWeeklyFlyerFlow(draft.offerType)) return "shopping_specials";
  if (isOfertaLocalCouponPromotionFlow(draft.offerType)) return "local_coupons";
  return "";
}

export function isOfertaLocalShoppingSpecialsLane(
  draft: Pick<OfertaLocalDraft, "primaryAdFormat" | "offerType">
): boolean {
  return inferPrimaryAdFormatFromDraft(draft) === "shopping_specials";
}

export function isOfertaLocalLocalCouponsLane(
  draft: Pick<OfertaLocalDraft, "primaryAdFormat" | "offerType">
): boolean {
  return inferPrimaryAdFormatFromDraft(draft) === "local_coupons";
}

export function labelForPrimaryAdFormat(
  draft: Pick<OfertaLocalDraft, "primaryAdFormat" | "offerType">,
  lang: "es" | "en" = "es"
): string {
  const format = inferPrimaryAdFormatFromDraft(draft);
  if (!format) return "";
  const opt = OFERTAS_LOCALES_PRIMARY_AD_FORMAT_OPTIONS.find((o) => o.value === format);
  if (!opt) return format;
  return lang === "en" ? opt.titleEn : opt.titleEs;
}

export function buildPrimaryAdFormatChangePatch(
  draft: Pick<OfertaLocalDraft, "offerType">,
  nextFormat: OfertaLocalPrimaryAdFormat
): Pick<OfertaLocalDraft, "primaryAdFormat" | "offerType"> {
  if (nextFormat === "shopping_specials") {
    return { primaryAdFormat: nextFormat, offerType: "weekly_flyer" };
  }
  const offerType: OfertaLocalOfferType = isOfertaLocalCouponPromotionFlow(draft.offerType)
    ? (draft.offerType as OfertaLocalOfferType)
    : "coupon";
  return { primaryAdFormat: nextFormat, offerType };
}

export function parsePrimaryAdFormatFromInternalNotes(
  internalNotes: string | null | undefined
): OfertaLocalPrimaryAdFormat | "" {
  const raw = String(internalNotes ?? "");
  const prefix = "[ofertas_locales_metadata]";
  const idx = raw.indexOf(prefix);
  if (idx === -1) return "";
  try {
    const json = raw.slice(idx + prefix.length).trim();
    const meta = JSON.parse(json) as { primaryAdFormat?: string };
    if (meta.primaryAdFormat === "shopping_specials" || meta.primaryAdFormat === "local_coupons") {
      return meta.primaryAdFormat;
    }
  } catch {
    // ignore malformed metadata
  }
  return "";
}

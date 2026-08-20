import {
  OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
  OFERTAS_LOCALES_COUPONS_PRICE_CENTS,
  OFERTAS_LOCALES_CURRENCY,
  OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY,
  OFERTAS_LOCALES_FLYER_PRICE_CENTS,
  OFERTAS_LOCALES_PUBLIC_TERM_DAYS,
} from "./ofertasLocalesConstants";
import { inferPrimaryAdFormatFromDraft } from "./ofertasLocalesTwoLaneProductModel";
import type { OfertaLocalDraft, OfertaLocalOfferType, OfertaLocalPrimaryAdFormat } from "./ofertasLocalesTypes";

export type OfertaLocalCommercialProductKey =
  | typeof OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY
  | typeof OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY;

export type OfertaLocalCommercialLane = "interactive_flyer" | "coupons";

export type OfertaLocalCommercialProduct = {
  category: "ofertas-locales";
  packageKey: OfertaLocalCommercialProductKey;
  lane: OfertaLocalCommercialLane;
  labelEs: string;
  labelEn: string;
  amountCents: number;
  currency: typeof OFERTAS_LOCALES_CURRENCY;
  durationDays: typeof OFERTAS_LOCALES_PUBLIC_TERM_DAYS;
  aiIncluded: true;
};

export const OFERTAS_LOCALES_COMMERCIAL_PRODUCTS = {
  interactive_flyer: {
    category: "ofertas-locales",
    packageKey: OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY,
    lane: "interactive_flyer",
    labelEs: "Volante interactivo Leonix",
    labelEn: "Leonix Interactive Flyer",
    amountCents: OFERTAS_LOCALES_FLYER_PRICE_CENTS,
    currency: OFERTAS_LOCALES_CURRENCY,
    durationDays: OFERTAS_LOCALES_PUBLIC_TERM_DAYS,
    aiIncluded: true,
  },
  coupons: {
    category: "ofertas-locales",
    packageKey: OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
    lane: "coupons",
    labelEs: "Cupones Leonix",
    labelEn: "Leonix Coupons",
    amountCents: OFERTAS_LOCALES_COUPONS_PRICE_CENTS,
    currency: OFERTAS_LOCALES_CURRENCY,
    durationDays: OFERTAS_LOCALES_PUBLIC_TERM_DAYS,
    aiIncluded: true,
  },
} as const satisfies Record<OfertaLocalCommercialLane, OfertaLocalCommercialProduct>;

export const OFERTAS_LOCALES_COMMERCIAL_PACKAGE_KEYS: readonly OfertaLocalCommercialProductKey[] = [
  OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY,
  OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
];

export function isOfertaLocalCommercialPackageKey(
  value: string | null | undefined,
): value is OfertaLocalCommercialProductKey {
  return OFERTAS_LOCALES_COMMERCIAL_PACKAGE_KEYS.includes(
    String(value ?? "").trim().toLowerCase() as OfertaLocalCommercialProductKey,
  );
}

export function getOfertaLocalCommercialProductByPackageKey(
  packageKey: string | null | undefined,
): OfertaLocalCommercialProduct | null {
  const key = String(packageKey ?? "").trim().toLowerCase();
  if (key === OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY) return OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.interactive_flyer;
  if (key === OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY) return OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.coupons;
  return null;
}

export function getOfertaLocalCommercialProductForDraft(
  draft: Pick<OfertaLocalDraft, "primaryAdFormat" | "offerType">,
): OfertaLocalCommercialProduct | null {
  const format = inferPrimaryAdFormatFromDraft(draft);
  if (format === "shopping_specials") return OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.interactive_flyer;
  if (format === "local_coupons") return OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.coupons;
  return null;
}

export function getOfertaLocalCommercialProductForOfferType(
  offerType: OfertaLocalOfferType | string | null | undefined,
): OfertaLocalCommercialProduct | null {
  if (offerType === "weekly_flyer") return OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.interactive_flyer;
  if (
    offerType === "coupon" ||
    offerType === "promotion" ||
    offerType === "seasonal_special" ||
    offerType === "bundle" ||
    offerType === "featured_deal"
  ) {
    return OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.coupons;
  }
  return null;
}

export function ofertaLocalCommercialProductMatchesOfferType(input: {
  packageKey: string | null | undefined;
  offerType: OfertaLocalOfferType | string | null | undefined;
}): boolean {
  const expected = getOfertaLocalCommercialProductForOfferType(input.offerType);
  return Boolean(expected && expected.packageKey === String(input.packageKey ?? "").trim().toLowerCase());
}

export function primaryAdFormatForOfertaLocalPackageKey(
  packageKey: string | null | undefined,
): OfertaLocalPrimaryAdFormat | "" {
  const product = getOfertaLocalCommercialProductByPackageKey(packageKey);
  if (!product) return "";
  return product.lane === "interactive_flyer" ? "shopping_specials" : "local_coupons";
}

export function formatOfertaLocalCommercialAmount(
  amountCents: number | null | undefined,
  currency: string | null | undefined = "usd",
): string {
  const amount = typeof amountCents === "number" && Number.isFinite(amountCents) ? amountCents : 0;
  return `${(amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: String(currency ?? "usd").toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

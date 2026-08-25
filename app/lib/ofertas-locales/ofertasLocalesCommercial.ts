import {
  OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
  OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY,
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
  | typeof OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY
  /** Historical/retired — see OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY (owner lock 2026-08-25). */
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
  /** Owner lock 2026-08-25 (Package 4) — true only on the retired historical coupons entry. */
  newSalesRetired?: true;
};

/**
 * Owner lock 2026-08-25 (Package 4) — current, NEW-SALE commercial truth. Community coupon
 * publishing is free (no Stripe, no promo, no premium placement, no automatic Business Tools);
 * the interactive flyer stays paid at $399/30 days. Keyed by lane so every NEW-SALE resolver
 * below (ForDraft / ForOfferType / ByPackageKey for the two live keys) reads from here only.
 */
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
    packageKey: OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY,
    lane: "coupons",
    labelEs: "Cupones Leonix — Gratis",
    labelEn: "Leonix Coupons — Free",
    amountCents: 0,
    currency: OFERTAS_LOCALES_CURRENCY,
    // Content/moderation-validity lifecycle, not a billing duration (there is no billing) —
    // free publishing does not mean a coupon may claim an untruthful/indefinite expiration.
    durationDays: OFERTAS_LOCALES_PUBLIC_TERM_DAYS,
    aiIncluded: true,
  },
} as const satisfies Record<OfertaLocalCommercialLane, OfertaLocalCommercialProduct>;

/**
 * Historical/retired only — never returned by the NEW-SALE resolvers (ForDraft / ForOfferType).
 * Kept so old payment records, old entitlements, and admin history still resolve a truthful
 * $199 label and price for rows written before the owner lock.
 */
export const OFERTAS_LOCALES_HISTORICAL_COMMERCIAL_PRODUCTS: Readonly<
  Partial<Record<OfertaLocalCommercialProductKey, OfertaLocalCommercialProduct>>
> = {
  [OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY]: {
    category: "ofertas-locales",
    packageKey: OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
    lane: "coupons",
    labelEs: "Cupones Leonix 30 días (retirado — publicación actual gratis)",
    labelEn: "Leonix Coupons 30-day (retired — current publishing is free)",
    amountCents: OFERTAS_LOCALES_COUPONS_PRICE_CENTS,
    currency: OFERTAS_LOCALES_CURRENCY,
    durationDays: OFERTAS_LOCALES_PUBLIC_TERM_DAYS,
    aiIncluded: true,
    newSalesRetired: true,
  },
};

export const OFERTAS_LOCALES_COMMERCIAL_PACKAGE_KEYS: readonly OfertaLocalCommercialProductKey[] = [
  OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY,
  OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY,
  OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
];

export function isOfertaLocalCommercialPackageKey(
  value: string | null | undefined,
): value is OfertaLocalCommercialProductKey {
  return OFERTAS_LOCALES_COMMERCIAL_PACKAGE_KEYS.includes(
    String(value ?? "").trim().toLowerCase() as OfertaLocalCommercialProductKey,
  );
}

/** Resolves current AND historical package keys — the only lookup safe for admin/history reads. */
export function getOfertaLocalCommercialProductByPackageKey(
  packageKey: string | null | undefined,
): OfertaLocalCommercialProduct | null {
  const key = String(packageKey ?? "").trim().toLowerCase();
  if (key === OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY) return OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.interactive_flyer;
  if (key === OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY) return OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.coupons;
  if (key === OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY) {
    return OFERTAS_LOCALES_HISTORICAL_COMMERCIAL_PRODUCTS[OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY] ?? null;
  }
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

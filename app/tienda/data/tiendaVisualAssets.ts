/**
 * Curated photography for Tienda (Unsplash CDN). Representative / editorial only — not SKU-specific.
 * All `photo-*` IDs are verified to return HTTP 200 on images.unsplash.com (IDs can be retired over time).
 * Delivery: Next/Image + remotePatterns.
 */

import type { TiendaCategorySlug } from "./tiendaCategories";

/** Standard Leonix crop URL */
const crop = (photoPath: string, w: number) =>
  `https://images.unsplash.com/${photoPath}?auto=format&fit=crop&w=${w}&q=82`;

/** Last-resort neutral business / print context — always keep a verified ID here. */
export const TIENDA_GLOBAL_FALLBACK_IMAGE = crop("photo-1454165804606-c3d57bc86b40", 1400);

/**
 * Category grid / category hero / catalog fallback by category.
 * Intent: each image reads as the product type (cards, flyers, brochures, banners, etc.).
 */
export const tiendaCategoryCoverImage = (slug: TiendaCategorySlug): string => {
  const map: Record<TiendaCategorySlug, string> = {
    // Stack of business cards — reads clearly as cards, not loose paper
    "business-cards": crop("photo-1589829085413-56de8ae18c73", 1400),
    // Print / press context — crisp marketing print
    flyers: crop("photo-1586953208448-b95a79798f07", 1400),
    // Folded / editorial marketing piece
    brochures: crop("photo-1563986768609-322da13575f3", 1400),
    // Large event / display presence (reads as display & venue, not a random portrait)
    banners: crop("photo-1505373877841-8d25f7d46678", 1400),
    // Outdoor yard / signage
    signs: crop("photo-1566073771259-6a8506099945", 1400),
    "stickers-labels": crop("photo-1611532736597-de2d4265fba3", 1400),
    "promo-products": crop("photo-1607082348824-0a96f2a4b9da", 1400),
    // Menus / hospitality table — strong “marketing print materials” read
    "marketing-materials": crop("photo-1517248135467-4c7edcad34c4", 1400),
  };
  return map[slug] ?? TIENDA_GLOBAL_FALLBACK_IMAGE;
};

/** Product family cards + product hero (matches category when not overridden) */
const FAMILY_OVERRIDES: Record<string, string> = {
  "standard-business-cards": crop("photo-1589829085413-56de8ae18c73", 1200),
  "two-sided-business-cards": crop("photo-1611348586804-61bf6c080437", 1200),
  "flyers-standard": crop("photo-1586953208448-b95a79798f07", 1200),
  "brochures-standard": crop("photo-1563986768609-322da13575f3", 1200),
  "retractable-banners": crop("photo-1540575467063-178a50c2df87", 1200),
  "yard-signs": crop("photo-1566073771259-6a8506099945", 1200),
  "stickers-standard": crop("photo-1611532736597-de2d4265fba3", 1200),
  "postcards-standard": crop("photo-1554224155-6726b3ff858f", 1200),
  "promo-giveaways": crop("photo-1607082348824-0a96f2a4b9da", 1200),
  "promo-pens": crop("photo-1497366216548-37526070297c", 1200),
  "promo-drinkware": crop("photo-1509042239860-f550ce710b93", 1200),
  "promo-bags": crop("photo-1597484661643-2f5fef640dd1", 1200),
  "promo-desk-office": crop("photo-1497366216548-37526070297c", 1200),
  "promo-apparel-program": crop("photo-1523381210434-271e8be1f52b", 1200),
};

export function tiendaProductFamilyCoverImage(slug: string, categorySlug: string): string {
  if (FAMILY_OVERRIDES[slug]) return FAMILY_OVERRIDES[slug]!;
  if (isCategorySlug(categorySlug)) return tiendaCategoryCoverImage(categorySlug);
  return TIENDA_GLOBAL_FALLBACK_IMAGE;
}

function isCategorySlug(s: string): s is TiendaCategorySlug {
  return (
    s === "business-cards" ||
    s === "flyers" ||
    s === "brochures" ||
    s === "banners" ||
    s === "signs" ||
    s === "stickers-labels" ||
    s === "promo-products" ||
    s === "marketing-materials"
  );
}

/** Homepage hero: primary tiles — must load (verified) and read as product */
export const tiendaHeroAssets = {
  /** Premium business cards — clear card stack */
  businessCards: crop("photo-1589829085413-56de8ae18c73", 900),
  /** Event / large-format display (not an unrelated portrait) */
  bannersSigns: crop("photo-1505373877841-8d25f7d46678", 900),
  /** Planning / files / order flow — reads as “work & production”, not a broken placeholder */
  printWorkflow: crop("photo-1454165804606-c3d57bc86b40", 900),
  thumbFlyers: crop("photo-1586953208448-b95a79798f07", 500),
  thumbStickers: crop("photo-1611532736597-de2d4265fba3", 500),
  thumbBrochures: crop("photo-1563986768609-322da13575f3", 500),
} as const;

/** When admin catalog item has no primary image */
export function tiendaCatalogFallbackImage(categorySlug: string | null | undefined): string {
  const key = (categorySlug ?? "").trim();
  if (isCategorySlug(key)) return tiendaCategoryCoverImage(key);
  return TIENDA_GLOBAL_FALLBACK_IMAGE;
}

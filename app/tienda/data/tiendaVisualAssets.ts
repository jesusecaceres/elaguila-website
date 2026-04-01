/**
 * Leonix Tienda visuals — local SVG assets under `/public/tienda/visuals/`.
 * Each illustration is intentionally product-literal (cards read as cards, flyers as sheets, etc.)
 * so storefront imagery cannot drift into unrelated stock photography.
 */

import type { TiendaCategorySlug } from "./tiendaCategories";

const V = "/tienda/visuals";

/** Last-resort neutral print context — still reads as “professional print,” not a dead shell */
export const TIENDA_GLOBAL_FALLBACK_IMAGE = `${V}/fallback-premium-print.svg`;

/**
 * Category grid / category hero / catalog fallback by category.
 */
export const tiendaCategoryCoverImage = (slug: TiendaCategorySlug): string => {
  const map: Record<TiendaCategorySlug, string> = {
    "business-cards": `${V}/category-business-cards.svg`,
    flyers: `${V}/category-flyers.svg`,
    brochures: `${V}/category-brochures.svg`,
    banners: `${V}/category-banners.svg`,
    signs: `${V}/category-signs.svg`,
    "stickers-labels": `${V}/category-stickers-labels.svg`,
    "promo-products": `${V}/category-promo-products.svg`,
    "marketing-materials": `${V}/category-marketing-materials.svg`,
  };
  return map[slug] ?? TIENDA_GLOBAL_FALLBACK_IMAGE;
};

/** Product family cards + product hero (matches category when not overridden) */
const FAMILY_OVERRIDES: Record<string, string> = {
  "standard-business-cards": `${V}/product-standard-business-cards.svg`,
  "two-sided-business-cards": `${V}/product-two-sided-business-cards.svg`,
  "flyers-standard": `${V}/category-flyers.svg`,
  "brochures-standard": `${V}/category-brochures.svg`,
  "retractable-banners": `${V}/hero-banners.svg`,
  "yard-signs": `${V}/category-signs.svg`,
  "stickers-standard": `${V}/category-stickers-labels.svg`,
  "postcards-standard": `${V}/category-marketing-materials.svg`,
  "promo-giveaways": `${V}/category-promo-products.svg`,
  "promo-pens": `${V}/category-promo-products.svg`,
  "promo-drinkware": `${V}/category-promo-products.svg`,
  "promo-bags": `${V}/category-promo-products.svg`,
  "promo-desk-office": `${V}/category-promo-products.svg`,
  "promo-apparel-program": `${V}/category-promo-products.svg`,
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

/** Homepage hero: primary tiles — product-literal compositions */
export const tiendaHeroAssets = {
  businessCards: `${V}/hero-business-cards.svg`,
  bannersSigns: `${V}/hero-banners.svg`,
  printWorkflow: `${V}/hero-print-workflow.svg`,
  thumbFlyers: `${V}/thumb-flyers.svg`,
  thumbStickers: `${V}/thumb-stickers.svg`,
  thumbBrochures: `${V}/thumb-brochures.svg`,
} as const;

/** When admin catalog item has no primary image */
export function tiendaCatalogFallbackImage(categorySlug: string | null | undefined): string {
  const key = (categorySlug ?? "").trim();
  if (isCategorySlug(key)) return tiendaCategoryCoverImage(key);
  return TIENDA_GLOBAL_FALLBACK_IMAGE;
}

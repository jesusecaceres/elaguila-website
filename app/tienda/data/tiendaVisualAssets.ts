/**
 * Curated photography for Tienda (Unsplash). Representative / editorial only — not SKU-specific.
 * URLs use stable photo IDs; optimize delivery via Next/Image + remotePatterns.
 */

import type { TiendaCategorySlug } from "./tiendaCategories";

/** Full-width storefront imagery */
const crop = (photoPath: string, w: number) =>
  `https://images.unsplash.com/${photoPath}?auto=format&fit=crop&w=${w}&q=82`;

/** Category grid / hero (wide) */
export const tiendaCategoryCoverImage = (slug: TiendaCategorySlug): string => {
  const map: Record<TiendaCategorySlug, string> = {
    "business-cards": crop("photo-1589829085413-56de8ae18c73", 1400),
    flyers: crop("photo-1557804506-669a67965ba0", 1400),
    brochures: crop("photo-1544716278-ca5e3f16abd8", 1400),
    banners: crop("photo-1558618666-fcd25c85cd64", 1400),
    signs: crop("photo-1581579438740-1f8b949b675e", 1400),
    "stickers-labels": crop("photo-1611532736597-de2d4265fba3", 1400),
    "promo-products": crop("photo-1607082348824-0a96f2a4b9da", 1400),
    "marketing-materials": crop("photo-1504711434969-e33886168f5c", 1400),
  };
  return map[slug] ?? crop("photo-1562654508-a0cc0a45cd7a", 1400);
};

/** Product family cards + product hero (matches category when not overridden) */
const FAMILY_OVERRIDES: Record<string, string> = {
  "standard-business-cards": crop("photo-1589829085413-56de8ae18c73", 1200),
  "two-sided-business-cards": crop("photo-1616628188469-86a9e5e5394a", 1200),
  "flyers-standard": crop("photo-1542744173-8a7f547dfcbe", 1200),
  "brochures-standard": crop("photo-1544716278-ca5e3f16abd8", 1200),
  "retractable-banners": crop("photo-1531243265621-459450e3d5d3", 1200),
  "yard-signs": crop("photo-1566073771259-6a8506099945", 1200),
  "stickers-standard": crop("photo-1611532736597-de2d4265fba3", 1200),
  "postcards-standard": crop("photo-1544716278-ca5e3f16abd8", 1200),
  "promo-giveaways": crop("photo-1513885535751-51b651c2edfa", 1200),
  "promo-pens": crop("photo-1513475382583-d06e58bcb0e0", 1200),
  "promo-drinkware": crop("photo-1523362628745-0fef402472d3", 1200),
  "promo-bags": crop("photo-1597484661643-2f5fef640dd1", 1200),
  "promo-desk-office": crop("photo-1497366216548-37526070297c", 1200),
  "promo-apparel-program": crop("photo-1523381210434-271e8be1f52b", 1200),
};

export function tiendaProductFamilyCoverImage(slug: string, categorySlug: string): string {
  if (FAMILY_OVERRIDES[slug]) return FAMILY_OVERRIDES[slug]!;
  if (isCategorySlug(categorySlug)) return tiendaCategoryCoverImage(categorySlug);
  return crop("photo-1562654508-a0cc0a45cd7a", 1200);
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

/** Homepage hero: primary tiles */
export const tiendaHeroAssets = {
  businessCards: crop("photo-1589829085413-56de8ae18c73", 900),
  bannersSigns: crop("photo-1558618666-fcd25c85cd64", 900),
  printWorkflow: crop("photo-1562654508-a0cc0a45cd7a", 900),
  thumbFlyers: crop("photo-1542744173-8a7f547dfcbe", 500),
  thumbStickers: crop("photo-1611532736597-de2d4265fba3", 500),
  thumbBrochures: crop("photo-1544716278-ca5e3f16abd8", 500),
} as const;

/** When admin catalog item has no primary image */
export function tiendaCatalogFallbackImage(categorySlug: string | null | undefined): string {
  const key = (categorySlug ?? "").trim();
  if (isCategorySlug(key)) return tiendaCategoryCoverImage(key);
  return crop("photo-1562654508-a0cc0a45cd7a", 1200);
}

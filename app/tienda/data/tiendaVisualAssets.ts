/**
 * Leonix Tienda visuals — hybrid system:
 * - Primary: curated Unsplash photography (print/product‑truthful scenes; `images.unsplash.com` in next.config).
 *   Unsplash License applies to those photos (https://unsplash.com/license).
 * - Fallback: local product‑literal SVGs under `/public/tienda/visuals/` so imagery stays on‑category if a remote fails.
 */

import type { TiendaCategorySlug } from "./tiendaCategories";

const V = "/tienda/visuals";

/** Unsplash — `auto=format&fit=crop` keeps loads predictable; IDs are fixed for stability. */
function us(id: string, w: number) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
}

/** Desk stack — reads instantly as premium business cards (category, hero, catalog). */
const PHOTO_BUSINESS_CARDS_STACK = us("photo-1589829545856-d10d557cf95f", 1600);
/** Multiple one-face card layouts — “un lado” / standard family merchandising. */
const PHOTO_BUSINESS_CARDS_ONE_SIDED = us("photo-1611532736597-de2d4265fba3", 1600);

/** Last-resort neutral print context */
export const TIENDA_GLOBAL_FALLBACK_IMAGE = `${V}/fallback-premium-print.svg`;

/* -------------------------------------------------------------------------- */
/* Category: literal SVGs (backup) + photography (primary)                    */
/* -------------------------------------------------------------------------- */

const CATEGORY_LITERAL: Record<TiendaCategorySlug, string> = {
  "business-cards": `${V}/category-business-cards.svg`,
  flyers: `${V}/category-flyers.svg`,
  brochures: `${V}/category-brochures.svg`,
  banners: `${V}/category-banners.svg`,
  signs: `${V}/category-signs.svg`,
  "stickers-labels": `${V}/category-stickers-labels.svg`,
  "promo-products": `${V}/category-promo-products.svg`,
  "marketing-materials": `${V}/category-marketing-materials.svg`,
};

/** Product‑truthful photography per category (premium print / retail context). */
const CATEGORY_PHOTO: Record<TiendaCategorySlug, string> = {
  "business-cards": PHOTO_BUSINESS_CARDS_STACK,
  /** Leaflets / promo sheets — reads as campaign print, distinct from brochures. */
  flyers: us("photo-1557804506-669a67965ba0", 1600),
  /** Folded editorial — brochure truth. */
  brochures: us("photo-1543002588-bfa74002ed7e", 1600),
  banners: us("photo-1505373877841-8d25f7d46678", 1600),
  signs: us("photo-1558618666-fcd25c85cd64", 1600),
  /** Color-forward sticker/label wall — more “retail merch” energy than flat stock. */
  "stickers-labels": us("photo-1556228720-195a672e8a03", 1600),
  /** Promo table / retail counter — breadth of merch possibilities. */
  "promo-products": us("photo-1556742049-0cfed4f6a45d", 1600),
  /** Editorial / mailer context — distinct from flyers + brochures covers. */
  "marketing-materials": us("photo-1544716278-ca390e02658a", 1600),
};

/** Literal SVG for category (backup + admin/catalog truth). */
export function tiendaCategoryCoverLiteral(slug: TiendaCategorySlug): string {
  return CATEGORY_LITERAL[slug] ?? TIENDA_GLOBAL_FALLBACK_IMAGE;
}

/** Primary hero/cover photo URL for category. */
export function tiendaCategoryCoverPrimary(slug: TiendaCategorySlug): string {
  return CATEGORY_PHOTO[slug] ?? TIENDA_GLOBAL_FALLBACK_IMAGE;
}

/** @deprecated Use tiendaCategoryCoverPrimary + tiendaCategoryCoverLiteral for remote fill */
export const tiendaCategoryCoverImage = (slug: TiendaCategorySlug): string => tiendaCategoryCoverLiteral(slug);

/* -------------------------------------------------------------------------- */
/* Product family: literal overrides + optional photo overrides               */
/* -------------------------------------------------------------------------- */

const FAMILY_LITERAL: Record<string, string> = {
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

const FAMILY_PHOTO: Record<string, string> = {
  /** Multiple one-face layouts (photo) — “un lado” / estándar. */
  "standard-business-cards": PHOTO_BUSINESS_CARDS_ONE_SIDED,
  /** Front + back mockup (SVG) — clearer than unrelated stock for “dos lados”. */
  "two-sided-business-cards": `${V}/product-two-sided-business-cards.svg`,
  "flyers-standard": us("photo-1557804506-669a67965ba0", 1600),
  "brochures-standard": us("photo-1543002588-bfa74002ed7e", 1600),
  "retractable-banners": us("photo-1511578311128-61b9dd992832", 1600),
  "yard-signs": us("photo-1558618666-fcd25c85cd64", 1600),
  "stickers-standard": us("photo-1556228720-195a672e8a03", 1600),
  "postcards-standard": us("photo-1544716278-ca390e02658a", 1600),
  /** Colorful swag / gift bags — not the same table shot as category hero. */
  "promo-giveaways": us("photo-1526178819929-0c4bd8e7ab7e", 1600),
  "promo-pens": us("photo-1585386959984-ba415c6d906d", 1600),
  "promo-drinkware": us("photo-1495474472287-4d71bddd7c6d", 1600),
  "promo-bags": us("photo-1597484661643-2f5fef640dd1", 1600),
  "promo-desk-office": us("photo-1518455021857-6ce2b496e5f0", 1600),
  "promo-apparel-program": us("photo-1521572163474-6864f9cf17ab", 1600),
};

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

export function tiendaProductFamilyCoverLiteral(slug: string, categorySlug: string): string {
  if (FAMILY_LITERAL[slug]) return FAMILY_LITERAL[slug]!;
  if (isCategorySlug(categorySlug)) return tiendaCategoryCoverLiteral(categorySlug);
  return TIENDA_GLOBAL_FALLBACK_IMAGE;
}

export function tiendaProductFamilyCoverPrimary(slug: string, categorySlug: string): string {
  if (FAMILY_PHOTO[slug]) return FAMILY_PHOTO[slug]!;
  if (isCategorySlug(categorySlug)) return tiendaCategoryCoverPrimary(categorySlug);
  return TIENDA_GLOBAL_FALLBACK_IMAGE;
}

/** Primary URL for cards/heroes (photography when available). */
export function tiendaProductFamilyCoverImage(slug: string, categorySlug: string): string {
  return tiendaProductFamilyCoverPrimary(slug, categorySlug);
}

/**
 * `object-*` for product family covers — two-sided uses SVG mockup (contain + dark matte);
 * one-sided standard uses full-bleed photo (cover).
 */
export function tiendaProductFamilyImageClass(slug: string): string {
  return slug === "two-sided-business-cards"
    ? "object-contain object-center bg-[#0b0b0d]"
    : "object-cover object-center";
}

/* -------------------------------------------------------------------------- */
/* Homepage hero                                                              */
/* -------------------------------------------------------------------------- */

export const tiendaHeroAssets = {
  businessCards: us("photo-1589829545856-d10d557cf95f", 1800),
  bannersSigns: us("photo-1531243269054-5ebf6f0526bb", 1800),
  printWorkflow: us("photo-1454165804606-c3d57bc86b40", 1800),
  thumbFlyers: us("photo-1557804506-669a67965ba0", 800),
  thumbBrochures: us("photo-1543002588-bfa74002ed7e", 800),
  thumbStickers: us("photo-1556228720-195a672e8a03", 800),
  thumbPromo: us("photo-1607082348824-0a96f2a4b9da", 800),
} as const;

/** SVG fallbacks for hero tiles (match previous literals). */
export const tiendaHeroLiterals = {
  businessCards: `${V}/hero-business-cards.svg`,
  bannersSigns: `${V}/hero-banners.svg`,
  printWorkflow: `${V}/hero-print-workflow.svg`,
  thumbFlyers: `${V}/thumb-flyers.svg`,
  thumbBrochures: `${V}/thumb-brochures.svg`,
  thumbStickers: `${V}/thumb-stickers.svg`,
  thumbPromo: `${V}/category-promo-products.svg`,
} as const;

/* -------------------------------------------------------------------------- */
/* Catalog (CMS missing image)                                                */
/* -------------------------------------------------------------------------- */

export function tiendaCatalogCoverPrimary(categorySlug: string | null | undefined): string {
  const key = (categorySlug ?? "").trim();
  if (isCategorySlug(key)) return tiendaCategoryCoverPrimary(key);
  return TIENDA_GLOBAL_FALLBACK_IMAGE;
}

export function tiendaCatalogCoverLiteral(categorySlug: string | null | undefined): string {
  const key = (categorySlug ?? "").trim();
  if (isCategorySlug(key)) return tiendaCategoryCoverLiteral(key);
  return TIENDA_GLOBAL_FALLBACK_IMAGE;
}

/** @deprecated Prefer tiendaCatalogCoverPrimary + tiendaCatalogCoverLiteral */
export function tiendaCatalogFallbackImage(categorySlug: string | null | undefined): string {
  return tiendaCatalogCoverLiteral(categorySlug);
}

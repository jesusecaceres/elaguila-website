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

/** Blank stacked cards — reads as real business cards (not legal/scales stock). */
const PHOTO_BUSINESS_CARDS_STACK = us("photo-1623305466040-b753da413c9b", 1600);
/** Printed sheets / handouts on a table — campaign flyers, not laptop/office scenes. */
const PHOTO_FLYERS_HANDOUTS = us("photo-1598819672741-3989ede3cb45", 1600);
/** Magazine/catalog stack — mixed marketing print. */
const PHOTO_MARKETING_PRINT_MIX = us("photo-1530669731069-48706bc794ab", 1600);
/** Gift-wrapped boxes — promo / giveaway bundle energy. */
const PHOTO_PROMO_GIFT_BUNDLE = us("photo-1513885535751-8b9238bd345a", 1600);
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
  flyers: PHOTO_FLYERS_HANDOUTS,
  brochures: us("photo-1543002588-bfa74002ed7e", 1600),
  banners: us("photo-1505373877841-8d25f7d46678", 1600),
  signs: us("photo-1558618666-fcd25c85cd64", 1600),
  "stickers-labels": us("photo-1556228720-195a672e8a03", 1600),
  "promo-products": PHOTO_PROMO_GIFT_BUNDLE,
  "marketing-materials": PHOTO_MARKETING_PRINT_MIX,
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
  "standard-business-cards": PHOTO_BUSINESS_CARDS_STACK,
  "two-sided-business-cards": `${V}/product-two-sided-business-cards.svg`,
  "flyers-standard": PHOTO_FLYERS_HANDOUTS,
  "brochures-standard": us("photo-1543002588-bfa74002ed7e", 1600),
  "retractable-banners": us("photo-1511578311128-61b9dd992832", 1600),
  "yard-signs": us("photo-1558618666-fcd25c85cd64", 1600),
  "stickers-standard": us("photo-1556228720-195a672e8a03", 1600),
  "postcards-standard": us("photo-1513519245088-0e12902e5a38", 1600),
  "promo-giveaways": PHOTO_PROMO_GIFT_BUNDLE,
  "promo-pens": us("photo-1513542789411-b6a5d4f31634", 1600),
  "promo-drinkware": us("photo-1514228742587-6b1558fcca3d", 1600),
  "promo-bags": us("photo-1590874103328-eac38a683ce7", 1600),
  "promo-desk-office": us("photo-1503602642458-232111445657", 1600),
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

/** Tarjetas gateway — photography & SVGs that read as real business cards (no generic stock scenes). */
export const businessCardGatewayVisuals = {
  leo: { primary: PHOTO_BUSINESS_CARDS_STACK, fallback: `${V}/category-business-cards.svg` },
  upload: { primary: PHOTO_BUSINESS_CARDS_STACK, fallback: `${V}/product-standard-business-cards.svg` },
  /** Front/back mockup — communicates two-sided editing in Studio. */
  studio: { primary: `${V}/product-two-sided-business-cards.svg`, fallback: `${V}/product-two-sided-business-cards.svg` },
} as const;

/* -------------------------------------------------------------------------- */
/* Homepage hero                                                              */
/* -------------------------------------------------------------------------- */

export const tiendaHeroAssets = {
  businessCards: us("photo-1623305466040-b753da413c9b", 1800),
  bannersSigns: us("photo-1531243269054-5ebf6f0526bb", 1800),
  printWorkflow: us("photo-1454165804606-c3d57bc86b40", 1800),
  thumbFlyers: us("photo-1598819672741-3989ede3cb45", 800),
  thumbBrochures: us("photo-1543002588-bfa74002ed7e", 800),
  thumbStickers: us("photo-1556228720-195a672e8a03", 800),
  thumbPromo: us("photo-1513885535751-8b9238bd345a", 800),
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

/* -------------------------------------------------------------------------- */
/* Marketing materials — showcase grid (category page merchandising only)    */
/* -------------------------------------------------------------------------- */

export type MarketingShowcaseItem = {
  photo: string;
  label: { en: string; es: string };
};

/** Strict product‑literal tiles — order matches the merchandising brief. */
export const marketingMaterialsShowcaseItems: MarketingShowcaseItem[] = [
  { photo: us("photo-1631972757546-a9c28c924c2b", 1400), label: { en: "Calendars", es: "Calendarios" } },
  { photo: us("photo-1695634365294-7e50d731722b", 1400), label: { en: "Catalogs", es: "Catálogos" } },
  { photo: us("photo-1636314326111-b7fa652a3abf", 1400), label: { en: "Counter cards", es: "Tarjetas de mostrador" } },
  { photo: us("photo-1557499305-bd68d0ad468d", 1400), label: { en: "Menus", es: "Menús" } },
  { photo: us("photo-1513519245088-0e12902e5a38", 1400), label: { en: "Greeting cards", es: "Tarjetas de felicitación" } },
  { photo: us("photo-1536236397240-9b229a37a286", 1400), label: { en: "Table tents", es: "Letreros de mesa" } },
  { photo: us("photo-1572700433449-72c797656fe5", 1400), label: { en: "Posters", es: "Posters" } },
  { photo: us("photo-1581431886211-6b932f8367f2", 1400), label: { en: "Notepads", es: "Libretas y blocs" } },
];

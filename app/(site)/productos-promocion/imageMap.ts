export type CategoryId = "business-cards" | "marketing" | "signs" | "promo" | "essentials";

export type ImageMatchStatus = "exact-match" | "close-match" | "missing-source-image";

export type CatalogProductBase = {
  slug: string;
  es: { title: string; subtitle: string };
  en: { title: string; subtitle: string };
  visualType: string;
  subcategory?: string;
};

export type CatalogProductWithImage = CatalogProductBase & {
  imageSrc?: string;
  imageAltEn?: string;
  imageAltEs?: string;
  imageMatchStatus?: ImageMatchStatus;
};

export type CatalogCategoryBase = {
  id: CategoryId;
  es: { label: string; description: string };
  en: { label: string; description: string };
  products: CatalogProductBase[];
};

export type CatalogCategoryWithImage = Omit<CatalogCategoryBase, "products"> & {
  products: CatalogProductWithImage[];
};

export type ImageAssignment = {
  imageSrc?: string;
  imageAltEn?: string;
  imageAltEs?: string;
  imageMatchStatus: ImageMatchStatus;
};

export const SOURCE_IMAGE_BASE = "/productos-promocion/source-images";

/** Relative paths from source-images/ (folder/file.ext) — Gate 1C-G */
export const SOURCE_IMAGE_FILES: readonly string[] = [
  "business-cards/business-cards-foil.jpg",
  "business-cards/business-cards-foil.png",
  "business-cards/business-cards-gloss.png",
  "business-cards/business-cards-loyalty.png",
  "business-cards/business-cards-matte.jpg.png",
  "business-cards/business-cards-painted-edge.jpg.png",
  "business-cards/business-cards-painted-edge.png",
  "business-cards/business-cards-plastic.jpg",
  "business-cards/business-cards-plastic.png",
  "business-cards/business-cards-premium.jpg.png",
  "business-cards/business-cards-spot-uv.png",
  "business-cards/business-cards-standard.jpg.png",
  "marketing-print/brochures.png",
  "marketing-print/flyers.png",
  "marketing-print/menus.png",
  "marketing-print/postcards.png",
  "marketing-print/presentation-folders.png",
  "marketing-print/stickers-labels.png",
  "promo-products/buttons.jpg",
  "promo-products/coasters.jpg",
  "promo-products/event-giveaways.png",
  "promo-products/hats.png",
  "promo-products/keychains.png",
  "promo-products/lanyards.jpg",
  "promo-products/mugs.webp",
  "promo-products/notebooks.png",
  "promo-products/pens.png",
  "promo-products/tote-bags.webp",
  "promo-products/tshirts.webp",
  "promo-products/tumblers.png",
  "promo-products/umbrellas.jpg",
  "promo-products/water-bottles.png",
  "signs-banners/retractable-banners.png",
  "signs-banners/sidewalk-signs.png",
  "signs-banners/vinyl-banners.png",
  "signs-banners/yard-signs.png",
];

const SOURCE_FILE_SET = new Set<string>(SOURCE_IMAGE_FILES);

type ProductImageRule = {
  relPath: string;
  status: "exact-match" | "close-match";
  notes?: string;
};

const PRODUCT_IMAGE_BY_SLUG: Record<string, ProductImageRule> = {
  "standard-business-cards": { relPath: "business-cards/business-cards-standard.jpg.png", status: "exact-match" },
  "premium-business-cards": { relPath: "business-cards/business-cards-premium.jpg.png", status: "exact-match" },
  "matte-business-cards": { relPath: "business-cards/business-cards-matte.jpg.png", status: "exact-match" },
  "gloss-business-cards": { relPath: "business-cards/business-cards-gloss.png", status: "exact-match" },
  "foil-business-cards": { relPath: "business-cards/business-cards-foil.png", status: "exact-match" },
  "spot-uv-business-cards": { relPath: "business-cards/business-cards-spot-uv.png", status: "exact-match" },
  "painted-edge-business-cards": { relPath: "business-cards/business-cards-painted-edge.png", status: "exact-match" },
  "plastic-business-cards": { relPath: "business-cards/business-cards-plastic.png", status: "exact-match" },
  "loyalty-cards": { relPath: "business-cards/business-cards-loyalty.png", status: "exact-match" },
  "suede-business-cards": { relPath: "business-cards/business-cards-premium.jpg.png", status: "close-match", notes: "Shares premium business card image" },
  "silk-business-cards": { relPath: "business-cards/business-cards-premium.jpg.png", status: "close-match", notes: "Shares premium business card image" },
  "fold-over-business-cards": { relPath: "business-cards/business-cards-standard.jpg.png", status: "close-match", notes: "Shares standard business card image" },
  "square-business-cards": { relPath: "business-cards/business-cards-standard.jpg.png", status: "close-match", notes: "Shares standard business card image" },
  "rounded-corner-business-cards": { relPath: "business-cards/business-cards-standard.jpg.png", status: "close-match", notes: "Shares standard business card image" },
  "appointment-cards": { relPath: "business-cards/business-cards-loyalty.png", status: "close-match", notes: "Shares loyalty card image" },
  flyers: { relPath: "marketing-print/flyers.png", status: "exact-match" },
  brochures: { relPath: "marketing-print/brochures.png", status: "exact-match" },
  "tri-fold-brochures": { relPath: "marketing-print/brochures.png", status: "close-match", notes: "Shares brochures image" },
  postcards: { relPath: "marketing-print/postcards.png", status: "exact-match" },
  "rack-cards": { relPath: "marketing-print/postcards.png", status: "close-match", notes: "Shares postcards image" },
  menus: { relPath: "marketing-print/menus.png", status: "exact-match" },
  "takeout-menus": { relPath: "marketing-print/menus.png", status: "close-match", notes: "Shares menus image" },
  "presentation-folders": { relPath: "marketing-print/presentation-folders.png", status: "exact-match" },
  stickers: { relPath: "marketing-print/stickers-labels.png", status: "close-match", notes: "Stickers and labels pack image" },
  labels: { relPath: "marketing-print/stickers-labels.png", status: "close-match", notes: "Stickers and labels pack image" },
  booklets: { relPath: "marketing-print/brochures.png", status: "close-match", notes: "Shares brochures image" },
  catalogs: { relPath: "marketing-print/brochures.png", status: "close-match", notes: "Shares brochures image" },
  invitations: { relPath: "marketing-print/postcards.png", status: "close-match", notes: "Shares postcards image" },
  "sell-sheets": { relPath: "marketing-print/postcards.png", status: "close-match", notes: "Shares postcards image" },
  "table-tents": { relPath: "marketing-print/menus.png", status: "close-match", notes: "Table display; shares menus image" },
  coupons: { relPath: "marketing-print/postcards.png", status: "close-match", notes: "Shares postcards image" },
  envelopes: { relPath: "marketing-print/presentation-folders.png", status: "close-match", notes: "Shares presentation folders image" },
  letterhead: { relPath: "marketing-print/presentation-folders.png", status: "close-match", notes: "Shares presentation folders image" },
  notepads: { relPath: "promo-products/notebooks.png", status: "close-match", notes: "Shares promo notebooks image" },
  "vinyl-banners": { relPath: "signs-banners/vinyl-banners.png", status: "exact-match" },
  "mesh-banners": { relPath: "signs-banners/vinyl-banners.png", status: "close-match", notes: "Shares vinyl banners image" },
  "fabric-banners": { relPath: "signs-banners/vinyl-banners.png", status: "close-match", notes: "Shares vinyl banners image" },
  "step-and-repeat-banners": { relPath: "signs-banners/vinyl-banners.png", status: "close-match", notes: "Shares vinyl banners image" },
  "retractable-banners": { relPath: "signs-banners/retractable-banners.png", status: "exact-match" },
  "x-stand-banners": { relPath: "signs-banners/retractable-banners.png", status: "close-match", notes: "Shares retractable banners image" },
  "yard-signs": { relPath: "signs-banners/yard-signs.png", status: "exact-match" },
  "real-estate-signs": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "sidewalk-signs": { relPath: "signs-banners/sidewalk-signs.png", status: "exact-match" },
  "a-frame-signs": { relPath: "signs-banners/sidewalk-signs.png", status: "close-match", notes: "Shares sidewalk signs image" },
  "tabletop-displays": { relPath: "signs-banners/retractable-banners.png", status: "close-match", notes: "Shares retractable banners image" },
  "event-tents": { relPath: "signs-banners/vinyl-banners.png", status: "close-match", notes: "Shares vinyl banners image" },
  flags: { relPath: "signs-banners/vinyl-banners.png", status: "close-match", notes: "Shares vinyl banners image" },
  "feather-flags": { relPath: "signs-banners/vinyl-banners.png", status: "close-match", notes: "Shares vinyl banners image" },
  posters: { relPath: "signs-banners/vinyl-banners.png", status: "close-match", notes: "Shares vinyl banners image" },
  "foam-board-signs": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "coroplast-signs": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "acrylic-signs": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "aluminum-signs": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "parking-signs": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "hanging-signs": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "t-shirts": { relPath: "promo-products/tshirts.webp", status: "exact-match" },
  "polo-shirts": { relPath: "promo-products/tshirts.webp", status: "close-match", notes: "Shares apparel / t-shirts image" },
  hoodies: { relPath: "promo-products/tshirts.webp", status: "close-match", notes: "Shares apparel / t-shirts image" },
  hats: { relPath: "promo-products/hats.png", status: "exact-match" },
  "tote-bags": { relPath: "promo-products/tote-bags.webp", status: "exact-match" },
  "drawstring-bags": { relPath: "promo-products/tote-bags.webp", status: "close-match", notes: "Shares tote bags image" },
  mugs: { relPath: "promo-products/mugs.webp", status: "exact-match" },
  tumblers: { relPath: "promo-products/tumblers.png", status: "exact-match" },
  "water-bottles": { relPath: "promo-products/water-bottles.png", status: "exact-match" },
  pens: { relPath: "promo-products/pens.png", status: "exact-match" },
  pencils: { relPath: "promo-products/pens.png", status: "close-match", notes: "Shares pens image" },
  buttons: { relPath: "promo-products/buttons.jpg", status: "exact-match" },
  keychains: { relPath: "promo-products/keychains.png", status: "exact-match" },
  lanyards: { relPath: "promo-products/lanyards.jpg", status: "exact-match" },
  "promo-stickers": { relPath: "marketing-print/stickers-labels.png", status: "close-match", notes: "Shares stickers-labels image" },
  notebooks: { relPath: "promo-products/notebooks.png", status: "exact-match" },
  umbrellas: { relPath: "promo-products/umbrellas.jpg", status: "exact-match" },
  aprons: { relPath: "promo-products/tshirts.webp", status: "close-match", notes: "Shares apparel image" },
  "reusable-cups": { relPath: "promo-products/tumblers.png", status: "close-match", notes: "Shares tumblers image" },
  coasters: { relPath: "promo-products/coasters.jpg", status: "exact-match" },
  "phone-accessories": { relPath: "promo-products/keychains.png", status: "close-match", notes: "Shares keychains image" },
  "event-giveaways": { relPath: "promo-products/event-giveaways.png", status: "exact-match" },
  "name-badges": { relPath: "promo-products/lanyards.jpg", status: "close-match", notes: "Shares lanyards image" },
  wristbands: { relPath: "promo-products/lanyards.jpg", status: "close-match", notes: "Shares lanyards image" },
  "tote-kits": { relPath: "promo-products/tote-bags.webp", status: "close-match", notes: "Shares tote bags image" },
  "mouse-pads": { relPath: "promo-products/notebooks.png", status: "close-match", notes: "Shares notebooks image" },
  "promo-magnets": { relPath: "marketing-print/stickers-labels.png", status: "close-match", notes: "No magnet asset; shares stickers-labels" },
  "branded-starter-kit": { relPath: "promo-products/event-giveaways.png", status: "close-match", notes: "Starter kit; shares event giveaways image" },
  "grand-opening-kit": { relPath: "promo-products/event-giveaways.png", status: "close-match", notes: "Shares event giveaways image" },
  "new-business-launch-bundle": { relPath: "promo-products/event-giveaways.png", status: "close-match", notes: "Shares event giveaways image" },
  "restaurant-starter-kit": { relPath: "marketing-print/menus.png", status: "close-match", notes: "Restaurant kit; shares menus image" },
  "food-truck-kit": { relPath: "marketing-print/menus.png", status: "close-match", notes: "Shares menus image" },
  "event-booth-kit": { relPath: "signs-banners/vinyl-banners.png", status: "close-match", notes: "Booth kit; shares vinyl banners image" },
  "real-estate-marketing-kit": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "contractor-marketing-kit": { relPath: "signs-banners/yard-signs.png", status: "close-match", notes: "Shares yard signs image" },
  "church-outreach-kit": { relPath: "marketing-print/flyers.png", status: "close-match", notes: "Shares flyers image" },
  "hiring-recruiting-kit": { relPath: "marketing-print/flyers.png", status: "close-match", notes: "Shares flyers image" },
  "salon-beauty-kit": { relPath: "business-cards/business-cards-premium.jpg.png", status: "close-match", notes: "Shares premium business cards image" },
  "loyalty-program-materials": { relPath: "business-cards/business-cards-loyalty.png", status: "close-match", notes: "Shares loyalty cards image" },
  "review-request-cards": { relPath: "business-cards/business-cards-loyalty.png", status: "close-match", notes: "Shares loyalty cards image" },
  "coupon-cards": { relPath: "marketing-print/postcards.png", status: "close-match", notes: "Shares postcards image" },
  "gift-certificates": { relPath: "marketing-print/postcards.png", status: "close-match", notes: "Shares postcards image" },
  "thank-you-cards": { relPath: "marketing-print/postcards.png", status: "close-match", notes: "Shares postcards image" },
  "qr-code-table-cards": { relPath: "marketing-print/menus.png", status: "close-match", notes: "Table cards; shares menus image" },
};

const MISSING_IMAGE_SLUGS = new Set([
  "door-hangers",
  "greeting-cards",
  "event-tickets",
  "bookmarks",
  "calendars",
  "ncr-forms",
  "carbonless-forms",
  "printed-magnets",
  "window-clings",
  "window-perforated-vinyl",
  "wall-decals",
  "floor-graphics",
  "car-magnets",
  "vehicle-magnets",
]);

export function getImageAssignment(product: CatalogProductBase): ImageAssignment {
  const altEn = product.en.title;
  const altEs = product.es.title;

  if (MISSING_IMAGE_SLUGS.has(product.slug)) {
    return { imageAltEn: altEn, imageAltEs: altEs, imageMatchStatus: "missing-source-image" };
  }

  const rule = PRODUCT_IMAGE_BY_SLUG[product.slug];
  if (!rule || !SOURCE_FILE_SET.has(rule.relPath)) {
    return { imageAltEn: altEn, imageAltEs: altEs, imageMatchStatus: "missing-source-image" };
  }

  return {
    imageSrc: `${SOURCE_IMAGE_BASE}/${rule.relPath}`,
    imageAltEn: altEn,
    imageAltEs: altEs,
    imageMatchStatus: rule.status,
  };
}

export function applyImageToProduct<T extends CatalogProductBase>(product: T): T & ImageAssignment {
  const assignment = getImageAssignment(product);
  return { ...product, ...assignment };
}

export function applyImageMappings<T extends CatalogCategoryBase>(
  categories: T[],
): (Omit<T, "products"> & { products: (T["products"][number] & ImageAssignment)[] })[] {
  return categories.map((cat) => ({
    ...cat,
    products: cat.products.map(applyImageToProduct),
  }));
}

export function getCategoryIdForSlug(slug: string, categories: CatalogCategoryBase[]): CategoryId | undefined {
  for (const cat of categories) {
    if (cat.products.some((p) => p.slug === slug)) return cat.id;
  }
  return undefined;
}

export type ImageManifestRow = {
  slug: string;
  titleEn: string;
  titleEs: string;
  category: CategoryId;
  imagePath: string;
  imageMatchStatus: ImageMatchStatus;
  notes: string;
};

export function buildImageManifest(categories: CatalogCategoryBase[]): ImageManifestRow[] {
  return categories.flatMap((cat) =>
    cat.products.map((product) => {
      const assignment = getImageAssignment(product);
      const rule = PRODUCT_IMAGE_BY_SLUG[product.slug];
      const notes =
        assignment.imageMatchStatus === "missing-source-image"
          ? MISSING_IMAGE_SLUGS.has(product.slug)
            ? "No source asset in image packs"
            : rule
              ? `Expected: ${rule.relPath}`
              : "No mapping rule"
          : rule?.notes ?? "";

      return {
        slug: product.slug,
        titleEn: product.en.title,
        titleEs: product.es.title,
        category: cat.id,
        imagePath: assignment.imageSrc ?? "MISSING",
        imageMatchStatus: assignment.imageMatchStatus,
        notes,
      };
    }),
  );
}

export function countImageAssignments(categories: CatalogCategoryBase[]): {
  exact: number;
  close: number;
  missing: number;
} {
  let exact = 0;
  let close = 0;
  let missing = 0;
  for (const cat of categories) {
    for (const p of cat.products) {
      const s = getImageAssignment(p).imageMatchStatus;
      if (s === "exact-match") exact++;
      else if (s === "close-match") close++;
      else missing++;
    }
  }
  return { exact, close, missing };
}

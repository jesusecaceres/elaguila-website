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

export const BUSINESS_CARDS_IMAGE_BASE = `${SOURCE_IMAGE_BASE}/business-cards`;

/** Filenames on disk under source-images/business-cards/ (Gate 1C-B1). */
export const BUSINESS_CARD_SOURCE_FILES: readonly string[] = [
  "business-cards-foil.jpg",
  "business-cards-foil.png",
  "business-cards-gloss.png",
  "business-cards-loyalty.png",
  "business-cards-matte.jpg.png",
  "business-cards-painted-edge.jpg.png",
  "business-cards-painted-edge.png",
  "business-cards-plastic.jpg",
  "business-cards-plastic.png",
  "business-cards-premium.jpg.png",
  "business-cards-spot-uv.png",
  "business-cards-standard.jpg.png",
] as const;

const BUSINESS_CARD_FILE_SET = new Set<string>(BUSINESS_CARD_SOURCE_FILES);

type BusinessCardImageRule = {
  file: string;
  status: "exact-match" | "close-match";
  notes?: string;
};

/** Gate 1C-B1 — explicit slug → filename under business-cards/ */
const BUSINESS_CARD_IMAGE_BY_SLUG: Record<string, BusinessCardImageRule> = {
  "standard-business-cards": { file: "business-cards-standard.jpg.png", status: "exact-match" },
  "premium-business-cards": { file: "business-cards-premium.jpg.png", status: "exact-match" },
  "matte-business-cards": { file: "business-cards-matte.jpg.png", status: "exact-match" },
  "gloss-business-cards": { file: "business-cards-gloss.png", status: "exact-match" },
  "foil-business-cards": { file: "business-cards-foil.png", status: "exact-match" },
  "spot-uv-business-cards": { file: "business-cards-spot-uv.png", status: "exact-match" },
  "painted-edge-business-cards": { file: "business-cards-painted-edge.png", status: "exact-match" },
  "plastic-business-cards": { file: "business-cards-plastic.png", status: "exact-match" },
  "loyalty-cards": { file: "business-cards-loyalty.png", status: "exact-match" },
  "suede-business-cards": {
    file: "business-cards-premium.jpg.png",
    status: "close-match",
    notes: "Shares premium business card image",
  },
  "silk-business-cards": {
    file: "business-cards-premium.jpg.png",
    status: "close-match",
    notes: "Shares premium business card image",
  },
  "fold-over-business-cards": {
    file: "business-cards-standard.jpg.png",
    status: "close-match",
    notes: "Shares standard business card image",
  },
  "square-business-cards": {
    file: "business-cards-standard.jpg.png",
    status: "close-match",
    notes: "Shares standard business card image",
  },
  "rounded-corner-business-cards": {
    file: "business-cards-standard.jpg.png",
    status: "close-match",
    notes: "Shares standard business card image",
  },
  "appointment-cards": {
    file: "business-cards-loyalty.png",
    status: "close-match",
    notes: "Shares loyalty card image",
  },
};

const BUSINESS_CARD_SLUGS = new Set(Object.keys(BUSINESS_CARD_IMAGE_BY_SLUG));

/** Filenames in public/productos-promocion/source-images/ root (other categories — future gates). */
export const SOURCE_IMAGE_FILES: readonly string[] = [];

const IMAGE_EXTENSIONS = [".webp", ".jpg", ".jpeg", ".png", ".svg"] as const;

type SlugRule = {
  slug: string;
  basename: string;
  status: "exact-match" | "close-match";
};

/** Per-slug mapping: exact product family first, then close family shares. */
const SLUG_RULES: SlugRule[] = [
  // Business cards (15) — shared business-cards asset
  { slug: "standard-business-cards", basename: "business-cards", status: "exact-match" },
  { slug: "premium-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "matte-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "gloss-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "suede-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "silk-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "spot-uv-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "foil-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "painted-edge-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "fold-over-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "plastic-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "square-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "rounded-corner-business-cards", basename: "business-cards", status: "close-match" },
  { slug: "loyalty-cards", basename: "business-cards", status: "close-match" },
  { slug: "appointment-cards", basename: "business-cards", status: "close-match" },

  // Marketing print (27)
  { slug: "flyers", basename: "flyers", status: "exact-match" },
  { slug: "brochures", basename: "brochures", status: "exact-match" },
  { slug: "tri-fold-brochures", basename: "brochures", status: "close-match" },
  { slug: "postcards", basename: "postcards", status: "exact-match" },
  { slug: "rack-cards", basename: "postcards", status: "close-match" },
  { slug: "door-hangers", basename: "door-hangers", status: "exact-match" },
  { slug: "menus", basename: "menus", status: "exact-match" },
  { slug: "takeout-menus", basename: "menus", status: "close-match" },
  { slug: "presentation-folders", basename: "presentation-folders", status: "exact-match" },
  { slug: "greeting-cards", basename: "greeting-cards", status: "exact-match" },
  { slug: "invitations", basename: "greeting-cards", status: "close-match" },
  { slug: "event-tickets", basename: "event-tickets", status: "exact-match" },
  { slug: "bookmarks", basename: "bookmarks", status: "exact-match" },
  { slug: "catalogs", basename: "catalogs", status: "exact-match" },
  { slug: "booklets", basename: "brochures", status: "close-match" },
  { slug: "calendars", basename: "calendars", status: "exact-match" },
  { slug: "stickers", basename: "stickers", status: "exact-match" },
  { slug: "labels", basename: "labels", status: "exact-match" },
  { slug: "ncr-forms", basename: "forms", status: "exact-match" },
  { slug: "envelopes", basename: "stationery", status: "exact-match" },
  { slug: "letterhead", basename: "stationery", status: "close-match" },
  { slug: "notepads", basename: "notepads", status: "exact-match" },
  { slug: "carbonless-forms", basename: "forms", status: "close-match" },
  { slug: "sell-sheets", basename: "postcards", status: "close-match" },
  { slug: "table-tents", basename: "table-tents", status: "exact-match" },
  { slug: "printed-magnets", basename: "magnets", status: "exact-match" },
  { slug: "coupons", basename: "coupons", status: "exact-match" },

  // Signs & banners (27)
  { slug: "vinyl-banners", basename: "banners", status: "exact-match" },
  { slug: "mesh-banners", basename: "banners", status: "close-match" },
  { slug: "fabric-banners", basename: "banners", status: "close-match" },
  { slug: "step-and-repeat-banners", basename: "banners", status: "close-match" },
  { slug: "retractable-banners", basename: "banners", status: "close-match" },
  { slug: "x-stand-banners", basename: "banners", status: "close-match" },
  { slug: "yard-signs", basename: "yard-signs", status: "exact-match" },
  { slug: "real-estate-signs", basename: "yard-signs", status: "close-match" },
  { slug: "sidewalk-signs", basename: "sidewalk-signs", status: "exact-match" },
  { slug: "a-frame-signs", basename: "sidewalk-signs", status: "close-match" },
  { slug: "window-clings", basename: "vinyl-graphics", status: "exact-match" },
  { slug: "window-perforated-vinyl", basename: "vinyl-graphics", status: "close-match" },
  { slug: "wall-decals", basename: "vinyl-graphics", status: "close-match" },
  { slug: "floor-graphics", basename: "vinyl-graphics", status: "close-match" },
  { slug: "car-magnets", basename: "car-magnets", status: "exact-match" },
  { slug: "vehicle-magnets", basename: "car-magnets", status: "close-match" },
  { slug: "tabletop-displays", basename: "displays", status: "exact-match" },
  { slug: "event-tents", basename: "event-tents", status: "exact-match" },
  { slug: "flags", basename: "flags", status: "exact-match" },
  { slug: "feather-flags", basename: "flags", status: "close-match" },
  { slug: "posters", basename: "posters", status: "exact-match" },
  { slug: "foam-board-signs", basename: "signs", status: "exact-match" },
  { slug: "coroplast-signs", basename: "signs", status: "close-match" },
  { slug: "acrylic-signs", basename: "signs", status: "close-match" },
  { slug: "aluminum-signs", basename: "signs", status: "close-match" },
  { slug: "parking-signs", basename: "signs", status: "close-match" },
  { slug: "hanging-signs", basename: "signs", status: "close-match" },

  // Promo products (27)
  { slug: "t-shirts", basename: "apparel", status: "exact-match" },
  { slug: "polo-shirts", basename: "apparel", status: "close-match" },
  { slug: "hoodies", basename: "apparel", status: "close-match" },
  { slug: "hats", basename: "apparel", status: "close-match" },
  { slug: "tote-bags", basename: "tote-bags", status: "exact-match" },
  { slug: "drawstring-bags", basename: "tote-bags", status: "close-match" },
  { slug: "mugs", basename: "mugs", status: "exact-match" },
  { slug: "tumblers", basename: "drinkware", status: "exact-match" },
  { slug: "water-bottles", basename: "drinkware", status: "close-match" },
  { slug: "pens", basename: "pens", status: "exact-match" },
  { slug: "pencils", basename: "pens", status: "close-match" },
  { slug: "buttons", basename: "buttons", status: "exact-match" },
  { slug: "promo-magnets", basename: "magnets", status: "close-match" },
  { slug: "keychains", basename: "keychains", status: "exact-match" },
  { slug: "lanyards", basename: "lanyards", status: "exact-match" },
  { slug: "promo-stickers", basename: "stickers", status: "close-match" },
  { slug: "mouse-pads", basename: "mouse-pads", status: "exact-match" },
  { slug: "notebooks", basename: "notebooks", status: "exact-match" },
  { slug: "umbrellas", basename: "umbrellas", status: "exact-match" },
  { slug: "aprons", basename: "aprons", status: "exact-match" },
  { slug: "reusable-cups", basename: "drinkware", status: "close-match" },
  { slug: "coasters", basename: "coasters", status: "exact-match" },
  { slug: "phone-accessories", basename: "phone-accessories", status: "exact-match" },
  { slug: "event-giveaways", basename: "promo-kit", status: "exact-match" },
  { slug: "name-badges", basename: "name-badges", status: "exact-match" },
  { slug: "wristbands", basename: "wristbands", status: "exact-match" },
  { slug: "tote-kits", basename: "tote-bags", status: "close-match" },

  // Business essentials (17)
  { slug: "branded-starter-kit", basename: "starter-kit", status: "exact-match" },
  { slug: "grand-opening-kit", basename: "starter-kit", status: "close-match" },
  { slug: "restaurant-starter-kit", basename: "menus", status: "close-match" },
  { slug: "event-booth-kit", basename: "banners", status: "close-match" },
  { slug: "real-estate-marketing-kit", basename: "yard-signs", status: "close-match" },
  { slug: "church-outreach-kit", basename: "flyers", status: "close-match" },
  { slug: "contractor-marketing-kit", basename: "yard-signs", status: "close-match" },
  { slug: "salon-beauty-kit", basename: "business-cards", status: "close-match" },
  { slug: "food-truck-kit", basename: "menus", status: "close-match" },
  { slug: "loyalty-program-materials", basename: "business-cards", status: "close-match" },
  { slug: "coupon-cards", basename: "coupons", status: "close-match" },
  { slug: "gift-certificates", basename: "greeting-cards", status: "close-match" },
  { slug: "thank-you-cards", basename: "greeting-cards", status: "close-match" },
  { slug: "review-request-cards", basename: "business-cards", status: "close-match" },
  { slug: "qr-code-table-cards", basename: "table-tents", status: "close-match" },
  { slug: "new-business-launch-bundle", basename: "starter-kit", status: "close-match" },
  { slug: "hiring-recruiting-kit", basename: "flyers", status: "close-match" },
];

const SLUG_RULE_MAP = new Map(SLUG_RULES.map((r) => [r.slug, r]));

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveSourceFilename(basename: string, slug: string): string | undefined {
  const files = SOURCE_IMAGE_FILES;
  if (files.length === 0) return undefined;

  const baseKey = normalizeKey(basename);
  const slugKey = normalizeKey(slug);

  for (const file of files) {
    const stem = normalizeKey(file.replace(/\.[^.]+$/, ""));
    if (stem === slugKey || stem === baseKey) return file;
  }

  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = `${basename}${ext}`;
    if (files.includes(candidate)) return candidate;
    const candidateLower = `${basename.toLowerCase()}${ext}`;
    if (files.includes(candidateLower)) return candidateLower;
  }

  for (const file of files) {
    const stem = normalizeKey(file.replace(/\.[^.]+$/, ""));
    if (stem.includes(baseKey) || baseKey.includes(stem)) return file;
  }

  return undefined;
}

function getBusinessCardImageAssignment(product: CatalogProductBase): ImageAssignment | null {
  if (!BUSINESS_CARD_SLUGS.has(product.slug)) return null;

  const altEn = product.en.title;
  const altEs = product.es.title;
  const rule = BUSINESS_CARD_IMAGE_BY_SLUG[product.slug];
  if (!rule || !BUSINESS_CARD_FILE_SET.has(rule.file)) {
    return { imageAltEn: altEn, imageAltEs: altEs, imageMatchStatus: "missing-source-image" };
  }

  return {
    imageSrc: `${BUSINESS_CARDS_IMAGE_BASE}/${rule.file}`,
    imageAltEn: altEn,
    imageAltEs: altEs,
    imageMatchStatus: rule.status,
  };
}

export function getImageAssignment(product: CatalogProductBase): ImageAssignment {
  const altEn = product.en.title;
  const altEs = product.es.title;

  const businessCard = getBusinessCardImageAssignment(product);
  if (businessCard) return businessCard;

  const rule = SLUG_RULE_MAP.get(product.slug);
  if (!rule) {
    return { imageAltEn: altEn, imageAltEs: altEs, imageMatchStatus: "missing-source-image" };
  }

  const filename = resolveSourceFilename(rule.basename, product.slug);
  if (!filename) {
    return { imageAltEn: altEn, imageAltEs: altEs, imageMatchStatus: "missing-source-image" };
  }

  return {
    imageSrc: `${SOURCE_IMAGE_BASE}/${filename}`,
    imageAltEn: altEn,
    imageAltEs: altEs,
    imageMatchStatus: rule.status,
  };
}

export function applyImageToProduct<T extends CatalogProductBase>(product: T): T & ImageAssignment {
  const assignment = getImageAssignment(product);
  return { ...product, ...assignment };
}

export function applyImageMappings<T extends CatalogCategoryBase>(categories: T[]): (Omit<T, "products"> & { products: (T["products"][number] & ImageAssignment)[] })[] {
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
      const bcRule = BUSINESS_CARD_IMAGE_BY_SLUG[product.slug];
      const rule = SLUG_RULE_MAP.get(product.slug);
      const notes =
        assignment.imageMatchStatus === "missing-source-image"
          ? bcRule
            ? `Expected business-cards file: ${bcRule.file}`
            : rule
              ? `Expected source basename: ${rule.basename}`
              : "No mapping rule"
          : bcRule?.notes
            ? bcRule.notes
            : rule && assignment.imageMatchStatus === "close-match"
              ? `Shares ${rule.basename} family image`
              : "";

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

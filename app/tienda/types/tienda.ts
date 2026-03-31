export type Lang = "es" | "en";

/** Bilingual field pair (maps to titleEs/titleEn conceptually via .es / .en) */
export type TiendaBilingual = { es: string; en: string };

export type TiendaAccent =
  | "gold"
  | "stone"
  | "cream"
  | "ink"
  | "sage"
  | "plum"
  | "sky";

/** How the category or family is primarily ordered */
export type TiendaProductMode = "design-online" | "upload-ready" | "mixed";

export type TiendaFutureConfiguratorType =
  | "business-card-builder"
  | "print-upload"
  | "none";

export type TiendaCategory = {
  id: string;
  slug: string;
  eyebrow?: TiendaBilingual;
  title: TiendaBilingual;
  description: TiendaBilingual;
  href: string;
  featured?: boolean;
  accent: TiendaAccent;
  /** Slugs of product families in this category (resolved from registry) */
  familySlugs: string[];
  productMode: TiendaProductMode;
  heroSummary: TiendaBilingual;
  supportMessage: TiendaBilingual;
  howOrderingWorks: TiendaBilingual;
  /** @deprecated optional count for future catalog scale */
  familyCount?: number | null;
};

/** Summary row for category grids (denormalized or resolved from full family) */
export type TiendaProductFamilySummary = {
  id: string;
  slug: string;
  title: TiendaBilingual;
  description: TiendaBilingual;
  categorySlug: string;
  productMode: TiendaProductMode;
  href: string;
  featured?: boolean;
  startingPrice: { amount: number; currency: "USD" };
  badges: TiendaBilingual[];
  comingSoon: boolean;
  supportsUpload: boolean;
  supportsDesigner: boolean;
  supportsTwoSided?: boolean;
};

export type TiendaProductFamily = {
  id: string;
  slug: string;
  categorySlug: string;
  title: TiendaBilingual;
  description: TiendaBilingual;
  longDescription: TiendaBilingual;
  productMode: TiendaProductMode;
  startingPrice: { amount: number; currency: "USD" };
  badges: TiendaBilingual[];
  specs: TiendaBilingual[];
  optionsSummary: TiendaBilingual[];
  supportsUpload: boolean;
  supportsOnlineDesign: boolean;
  supportsTwoSided: boolean;
  requiresApproval: boolean;
  needsPrintReadyFiles: boolean;
  futureConfiguratorType: TiendaFutureConfiguratorType;
  href: string;
  comingSoon?: boolean;
  /** How ordering works for this product (short, for product page) */
  howOrdered: TiendaBilingual;
  /** File / design responsibility disclaimer bullets */
  responsibilityBullets: TiendaBilingual[];
};

export type TiendaFeaturedProduct = {
  id: string;
  slug: string;
  title: TiendaBilingual;
  description: TiendaBilingual;
  startingPrice: { amount: number; currency: "USD" };
  badge: TiendaBilingual;
  categorySlug: string;
  href: string;
  uploadReady: boolean;
  customHelpAvailable: boolean;
};

/**
 * The four paid Quick categories a staff member can sell, and the ONE place that says, for each
 * one, which table its canonical row lives in and which existing intake prepares it.
 *
 * This is a map, not a fifth intake. The sales workspace deliberately does not re-implement any
 * category's form: it establishes custody and then hands the staff member to the intake that
 * already exists, so there is exactly one place per category where a Quick ad is built.
 */
export const QUICK_SALES_CATEGORIES = ["servicios", "restaurantes", "autos", "bienes-raices"] as const;

export type QuickSalesCategory = (typeof QUICK_SALES_CATEGORIES)[number];

export function isQuickSalesCategory(value: unknown): value is QuickSalesCategory {
  return typeof value === "string" && (QUICK_SALES_CATEGORIES as readonly string[]).includes(value);
}

export type QuickSalesCategoryDescriptor = {
  category: QuickSalesCategory;
  /** The table the canonical listing/draft row lives in. */
  listingSource: "servicios_public_listings" | "restaurantes_public_listings" | "autos_classifieds_listings" | "listings";
  /** The EXISTING intake a staff member builds the ad in. Never a new form. */
  intakePath: string;
  /** The EXISTING assisted save endpoint for this category. */
  saveEndpoint: string;
  /** Whether this category's assisted save attributes the row to a customer account. */
  requiresClientUserId: boolean;
  labelEs: string;
  labelEn: string;
};

export const QUICK_SALES_CATEGORY_MAP: Record<QuickSalesCategory, QuickSalesCategoryDescriptor> = {
  servicios: {
    category: "servicios",
    listingSource: "servicios_public_listings",
    intakePath: "/clasificados/publicar/servicios",
    saveEndpoint: "/api/clasificados/servicios/publish",
    // Servicios rows are deliberately born with owner_user_id = NULL so the client can claim them
    // through the normal signup flow.
    requiresClientUserId: false,
    labelEs: "Servicios",
    labelEn: "Services",
  },
  restaurantes: {
    category: "restaurantes",
    listingSource: "restaurantes_public_listings",
    intakePath: "/clasificados/publicar/restaurantes",
    saveEndpoint: "/api/clasificados/restaurantes/publish",
    requiresClientUserId: false,
    labelEs: "Restaurantes",
    labelEn: "Restaurants",
  },
  autos: {
    category: "autos",
    listingSource: "autos_classifieds_listings",
    intakePath: "/clasificados/publicar/autos",
    saveEndpoint: "/api/clasificados/autos/assisted-publish",
    requiresClientUserId: true,
    labelEs: "Autos Dealer",
    labelEn: "Auto Dealer",
  },
  "bienes-raices": {
    category: "bienes-raices",
    listingSource: "listings",
    intakePath: "/clasificados/publicar/bienes-raices",
    saveEndpoint: "/api/clasificados/bienes-raices/negocio/assisted-publish",
    requiresClientUserId: true,
    labelEs: "Bienes Raíces Negocio",
    labelEn: "Real Estate Business",
  },
};

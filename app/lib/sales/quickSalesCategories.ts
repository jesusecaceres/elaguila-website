/**
 * The eight families a staff member can sell from the Quick Sales cockpit, and the ONE place that
 * says, for each one, which table its canonical row lives in and which EXISTING fillable
 * application prepares it.
 *
 * This is a map, not a ninth intake. The sales workspace does not re-implement any category's
 * form: it establishes server custody and then hands the staff member to the proven application.
 *
 * The staff doorway MUST open a fillable application. Hubs, branch choosers, paid-product
 * checkpoints, and customer Quick adapters are refused as destinations.
 *
 * Exact families: Rentas, Empleos, Autos privados, Servicios, Restaurantes, Comida Local,
 * Autos Dealer, Bienes Raíces Negocio. Exclude Viajes, Iglesias, Recursos.
 */
export const QUICK_SALES_CATEGORIES = [
  "rentas",
  "empleos",
  "autos-privado",
  "servicios",
  "restaurantes",
  "comida-local",
  "autos",
  "bienes-raices",
] as const;

export type QuickSalesCategory = (typeof QUICK_SALES_CATEGORIES)[number];

export function isQuickSalesCategory(value: unknown): value is QuickSalesCategory {
  return typeof value === "string" && (QUICK_SALES_CATEGORIES as readonly string[]).includes(value);
}

export type QuickSalesListingSource =
  | "servicios_public_listings"
  | "restaurantes_public_listings"
  | "autos_classifieds_listings"
  | "listings"
  | "empleos_public_listings"
  | "comida_local_public_listings";

export type QuickSalesCategoryDescriptor = {
  category: QuickSalesCategory;
  /** The table the canonical listing/draft row lives in. */
  listingSource: QuickSalesListingSource;
  /** The EXISTING fillable intake a staff member builds the ad in. Never a hub, checkpoint, or adapter. */
  intakePath: string;
  /** The EXISTING save endpoint for this category. */
  saveEndpoint: string;
  /**
   * Organizational custody: Leonix-managed rows are born owner-null. A customer id is optional
   * attribution, never required to start or save the ad.
   */
  requiresClientUserId: false;
  labelEs: string;
  labelEn: string;
};

export const QUICK_SALES_CATEGORY_MAP: Record<QuickSalesCategory, QuickSalesCategoryDescriptor> = {
  rentas: {
    category: "rentas",
    listingSource: "listings",
    intakePath: "/clasificados/publicar/rentas/privado",
    saveEndpoint: "/api/clasificados/rentas/listing-edit",
    requiresClientUserId: false,
    labelEs: "Rentas",
    labelEn: "Rentals",
  },
  empleos: {
    category: "empleos",
    listingSource: "empleos_public_listings",
    intakePath: "/publicar/empleos/quick",
    saveEndpoint: "/api/clasificados/empleos/listings",
    requiresClientUserId: false,
    labelEs: "Empleos",
    labelEn: "Jobs",
  },
  "autos-privado": {
    category: "autos-privado",
    listingSource: "autos_classifieds_listings",
    intakePath: "/publicar/autos/privado",
    saveEndpoint: "/api/clasificados/autos/listings",
    requiresClientUserId: false,
    labelEs: "Autos privados",
    labelEn: "Private autos",
  },
  servicios: {
    category: "servicios",
    listingSource: "servicios_public_listings",
    intakePath: "/publicar/servicios",
    saveEndpoint: "/api/clasificados/servicios/publish",
    requiresClientUserId: false,
    labelEs: "Servicios",
    labelEn: "Services",
  },
  restaurantes: {
    category: "restaurantes",
    listingSource: "restaurantes_public_listings",
    intakePath: "/publicar/restaurantes",
    saveEndpoint: "/api/clasificados/restaurantes/publish",
    requiresClientUserId: false,
    labelEs: "Restaurantes",
    labelEn: "Restaurants",
  },
  "comida-local": {
    category: "comida-local",
    listingSource: "comida_local_public_listings",
    intakePath: "/publicar/comida-local",
    saveEndpoint: "/api/clasificados/comida-local/publish",
    requiresClientUserId: false,
    labelEs: "Comida Local",
    labelEn: "Local Food",
  },
  autos: {
    category: "autos",
    listingSource: "autos_classifieds_listings",
    intakePath: "/publicar/autos/negocios",
    saveEndpoint: "/api/clasificados/autos/assisted-publish",
    requiresClientUserId: false,
    labelEs: "Autos Dealer",
    labelEn: "Auto Dealer",
  },
  "bienes-raices": {
    category: "bienes-raices",
    listingSource: "listings",
    intakePath: "/clasificados/publicar/bienes-raices/negocio",
    saveEndpoint: "/api/clasificados/bienes-raices/negocio/assisted-publish",
    requiresClientUserId: false,
    labelEs: "Bienes Raíces Negocio",
    labelEn: "Real Estate Business",
  },
};

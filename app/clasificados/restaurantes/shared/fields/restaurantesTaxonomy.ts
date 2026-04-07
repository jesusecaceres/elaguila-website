/**
 * Restaurantes landing: browse pills and cuisine quick-filters for lista links.
 */

export type RestaurantesLandingCategoryPill = { key: string; es: string; en: string };

/** Browse-by-category pills (same `cat` keys as lista). */
export const RESTAURANTES_LANDING_CATEGORY_PILLS: RestaurantesLandingCategoryPill[] = [
  { key: "rentas", es: "Rentas", en: "Rentals" },
  { key: "en-venta", es: "En venta", en: "For sale" },
  { key: "empleos", es: "Empleos", en: "Jobs" },
  { key: "servicios", es: "Servicios", en: "Services" },
  { key: "restaurantes", es: "Restaurantes", en: "Restaurants" },
  { key: "travel", es: "Viajes", en: "Travel" },
  { key: "autos", es: "Autos", en: "Autos" },
  { key: "clases", es: "Clases", en: "Classes" },
  { key: "comunidad", es: "Comunidad", en: "Community" },
];

/**
 * Landing quick chips → canonical `cuisine` keys for `/clasificados/restaurantes/resultados`.
 */
export const RESTAURANTES_LANDING_CUISINE_QUICK: { key: string; es: string; en: string }[] = [
  { key: "mexican", es: "Mexicana", en: "Mexican" },
  { key: "italian", es: "Italiana", en: "Italian" },
  { key: "american", es: "Americana", en: "American" },
  { key: "asian", es: "Asiática", en: "Asian" },
  { key: "seafood", es: "Mariscos", en: "Seafood" },
  { key: "other", es: "Otro", en: "Other" },
];

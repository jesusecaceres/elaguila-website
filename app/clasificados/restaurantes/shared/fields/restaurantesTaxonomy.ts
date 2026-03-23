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

/** Cuisine quick-filter labels for lista `cuisine` param (language-specific display). */
export const RESTAURANTES_CUISINE_CHIPS: Record<"es" | "en", string[]> = {
  es: ["Mexicana", "Italiana", "Americana", "Asiática", "Mariscos", "Otro"],
  en: ["Mexican", "Italian", "American", "Asian", "Seafood", "Other"],
};

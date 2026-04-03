/**
 * Autos public hub: cross-category browse pills (used by `AutosPublicLanding` hub section).
 */

export type AutosLandingCategoryPill = { key: string; labelEs: string; labelEn: string };

/** Browse-by-category pills (clasificados hub `cat` keys). */
export const AUTOS_LANDING_CATEGORY_PILLS: AutosLandingCategoryPill[] = [
  { key: "rentas", labelEs: "Rentas", labelEn: "Rentals" },
  { key: "en-venta", labelEs: "En venta", labelEn: "For sale" },
  { key: "empleos", labelEs: "Empleos", labelEn: "Jobs" },
  { key: "servicios", labelEs: "Servicios", labelEn: "Services" },
  { key: "restaurantes", labelEs: "Restaurantes", labelEn: "Restaurants" },
  { key: "travel", labelEs: "Viajes", labelEn: "Travel" },
  { key: "autos", labelEs: "Autos", labelEn: "Autos" },
  { key: "clases", labelEs: "Clases", labelEn: "Classes" },
  { key: "comunidad", labelEs: "Comunidad", labelEn: "Community" },
];

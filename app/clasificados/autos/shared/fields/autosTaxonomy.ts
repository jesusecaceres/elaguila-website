/**
 * Autos landing: cross-category browse pills and quick-filter chips for lista (`q`).
 */

export type AutosLandingCategoryPill = { key: string; labelEs: string; labelEn: string };

/** Browse-by-category pills (same `cat` keys as lista). */
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

/** Quick search chips (passed as `q` for lista). */
export const AUTOS_QUICK_CHIPS: Record<"es" | "en", readonly string[]> = {
  es: ["Carros", "Camionetas", "SUV", "Motos", "Refacciones", "Otro"],
  en: ["Cars", "Trucks", "SUV", "Motorcycles", "Parts", "Other"],
};

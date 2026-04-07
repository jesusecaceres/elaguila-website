/**
 * Comunidad landing: cross-category browse pills and quick-filter chips for lista (`q`).
 */

export type ComunidadLandingCategoryPill = { key: string; labelEs: string; labelEn: string };

/** Browse-by-category pills (same `cat` keys as lista). */
export const COMUNIDAD_LANDING_CATEGORY_PILLS: ComunidadLandingCategoryPill[] = [
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
export const COMUNIDAD_QUICK_CHIPS: Record<"es" | "en", readonly string[]> = {
  es: ["Eventos", "Ayuda", "Avisos", "Voluntariado", "Otros"],
  en: ["Events", "Help", "Notices", "Volunteer", "Other"],
};

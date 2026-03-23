/**
 * Travel landing: browse pills and quick-filter chips for lista links.
 */

export type TravelLandingCategoryPill = { key: string; es: string; en: string };

/** Browse-by-category pills (same `cat` keys as lista). */
export const TRAVEL_LANDING_CATEGORY_PILLS: TravelLandingCategoryPill[] = [
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

export type TravelQuickChip = { label: string; t: string };

/** Quick chips for `t=` param (informational; lista engine may ignore). */
export const TRAVEL_QUICK_CHIPS: Record<"es" | "en", TravelQuickChip[]> = {
  en: [
    { label: "Packages & Deals", t: "deals" },
    { label: "Travel Agents", t: "agents" },
    { label: "Resorts & Hotels", t: "resorts" },
    { label: "Cruises", t: "cruises" },
    { label: "Tours & Excursions", t: "tours" },
    { label: "Other", t: "" },
  ],
  es: [
    { label: "Paquetes y Ofertas", t: "deals" },
    { label: "Agentes de Viajes", t: "agents" },
    { label: "Resorts y Hoteles", t: "resorts" },
    { label: "Cruceros", t: "cruises" },
    { label: "Tours y Excursiones", t: "tours" },
    { label: "Otro", t: "" },
  ],
};

/**
 * Servicios landing: filter groups for lista (`sv_grp`). Paid business lane — keys are stable for URLs.
 */

export type ServiciosGroupPill = { key: string; labelEs: string; labelEn: string };

export const SERVICIOS_GROUPS: ServiciosGroupPill[] = [
  { key: "home-garden", labelEs: "Hogar y Jardín", labelEn: "Home & Garden" },
  { key: "autos", labelEs: "Servicios Automotrices", labelEn: "Auto Services" },
  { key: "health-beauty", labelEs: "Salud y Bienestar", labelEn: "Health & Wellness" },
  { key: "more", labelEs: "Más servicios", labelEn: "More services" },
];

/**
 * Cuenta: business category keys, monthly business prices, and select labels.
 */

export type BizCategory = "rentas" | "autos" | "en-venta" | "empleos" | "servicios" | "clases" | "comunidad";

export const BUSINESS_PRICES: Record<Exclude<BizCategory, "clases" | "comunidad">, number> = {
  rentas: 189,
  autos: 149,
  "en-venta": 149,
  empleos: 135,
  servicios: 129,
};

/** `<select>` options (value + per-language label) — mirrors lista category keys. */
export const CUENTA_BIZ_CATEGORY_OPTIONS: readonly { value: BizCategory; labelEs: string; labelEn: string }[] = [
  { value: "rentas", labelEs: "Rentas", labelEn: "Rentals" },
  { value: "autos", labelEs: "Autos", labelEn: "Autos" },
  { value: "en-venta", labelEs: "En Venta", labelEn: "For Sale" },
  { value: "empleos", labelEs: "Empleos", labelEn: "Jobs" },
  { value: "servicios", labelEs: "Servicios", labelEn: "Services" },
  { value: "clases", labelEs: "Clases (gratis)", labelEn: "Classes (free)" },
  { value: "comunidad", labelEs: "Comunidad (gratis)", labelEn: "Community (free)" },
];

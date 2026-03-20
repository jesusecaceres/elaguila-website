/**
 * Bienes Raíces taxonomy: subcategories for real-estate sales.
 * Single source of truth for the Bienes Raíces publish form.
 * Clean Spanish labels; no rentas-only concepts (no renta mensual, depósito, etc.).
 * Structured for future: business profile, company rails, same-company inventory, premium plans.
 */

export type BienesRaicesSubcategoryOption = {
  key: string;
  label: { es: string; en: string };
};

/** Subcategories for Bienes Raíces (sales). Order drives the Tipo de propiedad / Subcategoría dropdown. */
export const BIENES_RAICES_SUBCATEGORIES: BienesRaicesSubcategoryOption[] = [
  { key: "residencial", label: { es: "Residencial", en: "Residential" } },
  { key: "condos-townhomes", label: { es: "Condos y townhomes", en: "Condos & townhomes" } },
  { key: "multifamiliar", label: { es: "Multifamiliar", en: "Multifamily" } },
  { key: "terrenos", label: { es: "Terrenos", en: "Land" } },
  { key: "comercial", label: { es: "Comercial", en: "Commercial" } },
  { key: "industrial", label: { es: "Industrial", en: "Industrial" } },
];

/** Resolve subcategory display label for a given key. */
export function getBienesRaicesSubcategoryLabel(
  key: string,
  lang: "es" | "en"
): string {
  const opt = BIENES_RAICES_SUBCATEGORIES.find((s) => s.key === key);
  return opt ? opt.label[lang] : key;
}

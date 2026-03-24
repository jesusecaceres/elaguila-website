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

/** Property type options for BR publish detail pairs and selects (same labels as legacy En Venta–style block). */
export const BR_PROPERTY_TYPE_OPTIONS: Array<{ value: string; label: { es: string; en: string } }> = [
  { value: "casa", label: { es: "Casa", en: "House" } },
  { value: "apartamento", label: { es: "Apartamento", en: "Apartment" } },
  { value: "condo", label: { es: "Condo", en: "Condo" } },
  { value: "townhouse", label: { es: "Townhouse", en: "Townhouse" } },
  { value: "lote", label: { es: "Lote", en: "Lot" } },
  { value: "finca", label: { es: "Finca", en: "Farm / ranch" } },
  { value: "oficina", label: { es: "Oficina", en: "Office" } },
  { value: "local-comercial", label: { es: "Local comercial", en: "Commercial space" } },
  { value: "edificio", label: { es: "Edificio", en: "Building" } },
  { value: "proyecto-nuevo", label: { es: "Proyecto nuevo", en: "New development" } },
];

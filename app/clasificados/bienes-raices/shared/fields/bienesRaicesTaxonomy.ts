export const BR_PROPERTY_TYPE_OPTIONS = [
  { value: "casa", label: { es: "Casa", en: "House" } },
  { value: "departamento", label: { es: "Departamento", en: "Apartment" } },
  { value: "terreno", label: { es: "Terreno", en: "Land" } },
];

export const BIENES_RAICES_SUBCATEGORIES = [
  { key: "venta", label: { es: "Venta", en: "Sale" } },
  { key: "renta", label: { es: "Renta", en: "Rent" } },
];

export function getBienesRaicesSubcategoryLabel(key: string, lang: "es" | "en"): string {
  const row = BIENES_RAICES_SUBCATEGORIES.find((x) => x.key === key);
  return row?.label[lang] ?? key;
}

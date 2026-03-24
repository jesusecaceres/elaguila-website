export type EnVentaDept = {
  key: string;
  label: { es: string; en: string };
  browseHint: { es: string; en: string };
};

export const EN_VENTA_DEPARTMENTS: EnVentaDept[] = [
  {
    key: "electronics",
    label: { es: "Electrónica", en: "Electronics" },
    browseHint: { es: "Teléfonos, computadoras, audio…", en: "Phones, computers, audio…" },
  },
  {
    key: "home",
    label: { es: "Hogar", en: "Home" },
    browseHint: { es: "Muebles, decoración, cocina…", en: "Furniture, décor, kitchen…" },
  },
  {
    key: "fashion",
    label: { es: "Moda", en: "Fashion" },
    browseHint: { es: "Ropa, calzado, accesorios…", en: "Clothing, shoes, accessories…" },
  },
];

export const EN_VENTA_PUBLISH_CONDITION_OPTIONS = [
  { value: "new", labelEs: "Nuevo", labelEn: "New" },
  { value: "like_new", labelEs: "Como nuevo", labelEn: "Like new" },
  { value: "excellent", labelEs: "Excelente estado", labelEn: "Excellent" },
  { value: "good", labelEs: "Buen estado", labelEn: "Good" },
  { value: "fair", labelEs: "Estado aceptable", labelEn: "Fair" },
  { value: "poor", labelEs: "Para repuesto / reparar", labelEn: "For parts / repair" },
];

export const EN_VENTA_SUBCATEGORIES: Array<{ key: string; label: { es: string; en: string } }> = [
  { key: "general", label: { es: "General", en: "General" } },
];

export function getSubcategoriesForDept(rama: string) {
  if (!rama || !EN_VENTA_DEPARTMENTS.some((d) => d.key === rama)) return [];
  return [{ dept: rama, key: "general", label: { es: "General", en: "General" } }];
}

export function getItemTypesForSelection(
  rama: string,
  _evSub: string
): Array<{ value: string; label: { es: string; en: string } }> {
  if (!rama) return [];
  return [
    { value: "item", label: { es: "Artículo", en: "Item" } },
    { value: "other", label: { es: "Otro", en: "Other" } },
  ];
}

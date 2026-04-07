import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import { EN_VENTA_PUBLISH_CONDITION_OPTIONS } from "../shared/fields/enVentaTaxonomy";

export type EnVentaSortId = "newest" | "price-asc" | "price-desc";

export const EN_VENTA_SORT_OPTIONS: Array<{ id: EnVentaSortId; label: { es: string; en: string } }> = [
  { id: "newest", label: { es: "Más recientes", en: "Newest" } },
  { id: "price-asc", label: { es: "Precio: menor a mayor", en: "Price: low to high" } },
  { id: "price-desc", label: { es: "Precio: mayor a menor", en: "Price: high to low" } },
];

export function enVentaDepartmentFilterOptions(lang: "es" | "en") {
  return EN_VENTA_DEPARTMENTS.map((d) => ({ value: d.key, label: d.label[lang] }));
}

export function enVentaConditionFilterOptions(lang: "es" | "en") {
  return EN_VENTA_PUBLISH_CONDITION_OPTIONS.map((c) => ({
    value: c.value,
    label: lang === "es" ? c.labelEs : c.labelEn,
  }));
}

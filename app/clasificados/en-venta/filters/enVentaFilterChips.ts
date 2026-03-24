import { departmentLabel, findSubcategory } from "../shared/fields/enVentaTaxonomy";
import { enVentaConditionFilterOptions } from "./enVentaFilterGroups";

export function enVentaDeptChipText(deptKey: string, lang: "es" | "en") {
  return departmentLabel(deptKey, lang);
}

export function enVentaSubChipText(deptKey: string, subKey: string, lang: "es" | "en") {
  const row = findSubcategory(deptKey, subKey);
  return row ? row.label[lang] : subKey;
}

export function enVentaConditionChipText(condKey: string, lang: "es" | "en") {
  const hit = enVentaConditionFilterOptions(lang).find((o) => o.value === condKey);
  return hit?.label ?? condKey;
}

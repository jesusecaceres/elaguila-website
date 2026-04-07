import type { EnVentaDepartmentKey } from "../taxonomy/categories";
import { EN_VENTA_SUBCATEGORY_ROWS } from "../taxonomy/subcategories";

/** When `detail_pairs` omits department but includes `Leonix:evSub`, infer department from taxonomy. */
export function inferEnVentaDeptFromSubKey(subKey: string | null | undefined): EnVentaDepartmentKey | null {
  const k = (subKey ?? "").trim();
  if (!k) return null;
  const row = EN_VENTA_SUBCATEGORY_ROWS.find((r) => r.key === k);
  return row?.dept ?? null;
}

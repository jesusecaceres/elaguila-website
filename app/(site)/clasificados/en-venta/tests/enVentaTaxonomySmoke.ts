import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import { EN_VENTA_SUBCATEGORY_ROWS } from "../taxonomy/subcategories";
import { getArticulosForDepartment, getItemTypesForSelection } from "../shared/fields/enVentaTaxonomy";

/** Gate 2G subcategory keys that must exist for publish + results filters. */
export const EN_VENTA_GATE2G_SUB_KEYS = [
  "electrodomesticos",
  "mascotas-accesorios",
  "libros-medios",
  "materiales-construccion",
  "venta-garage-mudanza",
  "joyeria-relojes",
  "oficina-escuela",
  "accesorios-auto",
] as const;

export function assertEnVentaTaxonomySmoke(): boolean {
  const dept = getArticulosForDepartment("electronicos");
  const noSub = getItemTypesForSelection("electronicos", "");
  const narrowed = getItemTypesForSelection("electronicos", "phones");
  const subKeys = new Set(EN_VENTA_SUBCATEGORY_ROWS.map((r) => r.key));
  const gate2gOk = EN_VENTA_GATE2G_SUB_KEYS.every((k) => subKeys.has(k));
  const partsDept = EN_VENTA_DEPARTMENTS.some((d) => d.key === "vehiculos-partes");
  return (
    EN_VENTA_DEPARTMENTS.length > 0 &&
    dept.length > 0 &&
    noSub.length === dept.length &&
    narrowed.length > 0 &&
    narrowed.length < dept.length &&
    gate2gOk &&
    partsDept
  );
}

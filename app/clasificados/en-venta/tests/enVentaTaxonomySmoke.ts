import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import { getArticulosForDepartment } from "../shared/fields/enVentaTaxonomy";

export function assertEnVentaTaxonomySmoke(): boolean {
  return EN_VENTA_DEPARTMENTS.length > 0 && getArticulosForDepartment("electronicos").length > 0;
}

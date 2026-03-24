import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import { getArticulosForDepartment, getItemTypesForSelection } from "../shared/fields/enVentaTaxonomy";

export function assertEnVentaTaxonomySmoke(): boolean {
  const dept = getArticulosForDepartment("electronicos");
  const noSub = getItemTypesForSelection("electronicos", "");
  const narrowed = getItemTypesForSelection("electronicos", "phones");
  return (
    EN_VENTA_DEPARTMENTS.length > 0 &&
    dept.length > 0 &&
    noSub.length === dept.length &&
    narrowed.length > 0 &&
    narrowed.length < dept.length
  );
}

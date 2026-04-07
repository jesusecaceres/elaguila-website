/**
 * Resolves which detail form fields apply for the unified publish flow, by category and branch.
 * Rentas: dynamic rows from subcategoría + tipo.
 */

import { DETAIL_FIELDS, type DetailField } from "@/app/clasificados/config/publishDetailFields";
import { getRentasDetailFields } from "@/app/clasificados/rentas/shared/fields/rentasTaxonomy";

export function getPublishCategoryFields(
  cat: string,
  details?: Record<string, string>
): DetailField[] {
  if (cat === "rentas" && details) {
    const sub = (details.rentasSubcategoria ?? "").trim();
    const tipo = (details.tipoPropiedad ?? "").trim();
    if (!sub || !tipo) return [];
    return getRentasDetailFields(sub, tipo) as DetailField[];
  }
  return DETAIL_FIELDS[cat] ?? [];
}

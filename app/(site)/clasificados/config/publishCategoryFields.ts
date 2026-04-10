/**
 * Resolves which detail form fields apply for the unified publish flow, by category and branch.
 * Rentas: dynamic rows from subcategoría + tipo.
 */

import type { ClasificadosDetailFieldCopyPatch } from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import { DETAIL_FIELDS, type DetailField } from "@/app/clasificados/config/publishDetailFields";
import { getRentasDetailFields } from "@/app/clasificados/rentas/shared/fields/rentasTaxonomy";

function applyDetailFieldOverrides(
  fields: DetailField[],
  overrides?: Record<string, ClasificadosDetailFieldCopyPatch>
): DetailField[] {
  if (!overrides) return fields;
  return fields.map((f) => {
    const o = overrides[f.key];
    if (!o) return f;
    return {
      ...f,
      label: {
        es: o.label?.es ?? f.label.es,
        en: o.label?.en ?? f.label.en,
      },
      placeholder: f.placeholder
        ? {
            es: o.placeholder?.es ?? f.placeholder.es,
            en: o.placeholder?.en ?? f.placeholder.en,
          }
        : f.placeholder,
    };
  });
}

/**
 * Optional `fieldOverrides` merges admin copy over `DETAIL_FIELDS` (code defaults).
 * Used when wiring category content from `clasificados_category_content` (e.g. En Venta).
 */
export function getPublishCategoryFields(
  cat: string,
  details?: Record<string, string>,
  fieldOverrides?: Record<string, ClasificadosDetailFieldCopyPatch>
): DetailField[] {
  if (cat === "rentas" && details) {
    const sub = (details.rentasSubcategoria ?? "").trim();
    const tipo = (details.tipoPropiedad ?? "").trim();
    if (!sub || !tipo) return [];
    return applyDetailFieldOverrides(getRentasDetailFields(sub, tipo) as DetailField[], fieldOverrides);
  }
  const base = DETAIL_FIELDS[cat] ?? [];
  return applyDetailFieldOverrides(base, fieldOverrides);
}

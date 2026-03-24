/**
 * Resolves which detail form fields apply for the unified publish flow, by category and branch.
 * Rentas: dynamic rows from subcategoría + tipo. Bienes Raíces: branch + property-type gates.
 */

import { DETAIL_FIELDS, type DetailField } from "@/app/clasificados/config/publishDetailFields";
import {
  isBrPrivadoComercial,
  isBrPrivadoEdificio,
  isBrPrivadoLote,
  isBrPrivadoProyectoNuevo,
  isBrPrivadoResidential,
} from "@/app/clasificados/bienes-raices/privado/publish/brPrivadoPublishConstants";
import { getRentasDetailFields } from "@/app/clasificados/rentas/shared/fields/rentasTaxonomy";
import {
  coalesceWizardDetailValue,
  LEGACY_WIZARD_BR_DETAIL,
} from "@/app/clasificados/bienes-raices/shared/wizard/brLegacyWizardRead";

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
  if (cat === "bienes-raices" && details) {
    const brBranch = (details.bienesRaicesBranch ?? "").trim().toLowerCase();
    const pt = coalesceWizardDetailValue(details, "brPropertyType", LEGACY_WIZARD_BR_DETAIL.propertyType);
    // BR application branches by sub property type (bienesRaicesSubcategoria / brPropertyType); taxonomy is source of truth.
    if (brBranch === "negocio") return DETAIL_FIELDS["bienes-raices"] ?? [];
    if (brBranch === "privado") {
      if (isBrPrivadoResidential(pt)) return DETAIL_FIELDS["bienes-raices"] ?? [];
      if (isBrPrivadoLote(pt) || isBrPrivadoComercial(pt) || isBrPrivadoEdificio(pt) || isBrPrivadoProyectoNuevo(pt))
        return [];
    }
  }
  return DETAIL_FIELDS[cat] ?? [];
}

import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";
import {
  getBrSubcategoriaFromPropertyType,
  isBrPrivadoComercial,
  isBrPrivadoEdificio,
  isBrPrivadoLote,
  isBrPrivadoProyectoNuevo,
} from "@/app/clasificados/publicar/bienes-raices/privado/publish/brPrivadoPublishConstants";
import {
  coalesceNegocioNombreFromWizard,
  coalesceWizardDetailValue,
  LEGACY_WIZARD_BR_DETAIL,
} from "@/app/clasificados/bienes-raices/shared/wizard/brLegacyWizardRead";

export function computeBienesRaicesPublishMetaOk(s: PublishDraftSnapshot): boolean {
  const d = s.details;
  const bienesRaicesBranch = (d.bienesRaicesBranch ?? "").trim().toLowerCase();
  const brDescription = coalesceWizardDetailValue(d, "brFullDescription", LEGACY_WIZARD_BR_DETAIL.fullDescription);
  const brPt = coalesceWizardDetailValue(d, "brPropertyType", LEGACY_WIZARD_BR_DETAIL.propertyType);
  const brSubcat = (d.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType(brPt);
  const brPrivadoTypeOk =
    brSubcat === "terrenos"
      ? !!coalesceWizardDetailValue(d, "brLotSize", LEGACY_WIZARD_BR_DETAIL.lotSize)
      : brSubcat === "comercial" || brSubcat === "industrial"
        ? !!coalesceWizardDetailValue(d, "brSquareFeet", LEGACY_WIZARD_BR_DETAIL.squareFeet)
        : brSubcat === "residencial" || brSubcat === "condos-townhomes" || brSubcat === "multifamiliar"
          ? !!coalesceWizardDetailValue(d, "brBedrooms", LEGACY_WIZARD_BR_DETAIL.bedrooms) &&
            !!coalesceWizardDetailValue(d, "brBathrooms", LEGACY_WIZARD_BR_DETAIL.bathrooms) &&
            !!coalesceWizardDetailValue(d, "brSquareFeet", LEGACY_WIZARD_BR_DETAIL.squareFeet)
          : isBrPrivadoLote(brPt)
            ? !!coalesceWizardDetailValue(d, "brLotSize", LEGACY_WIZARD_BR_DETAIL.lotSize)
            : isBrPrivadoComercial(brPt) || isBrPrivadoEdificio(brPt)
              ? !!coalesceWizardDetailValue(d, "brSquareFeet", LEGACY_WIZARD_BR_DETAIL.squareFeet)
              : isBrPrivadoProyectoNuevo(brPt)
                ? true
                : true;

  return (
    s.category !== "bienes-raices" ||
    (["privado", "negocio"].includes(bienesRaicesBranch) &&
      !!brPt &&
      brDescription.length >= 5 &&
      (bienesRaicesBranch === "negocio"
        ? !!coalesceWizardDetailValue(d, "brBedrooms", LEGACY_WIZARD_BR_DETAIL.bedrooms) &&
          !!coalesceWizardDetailValue(d, "brBathrooms", LEGACY_WIZARD_BR_DETAIL.bathrooms) &&
          !!coalesceWizardDetailValue(d, "brSquareFeet", LEGACY_WIZARD_BR_DETAIL.squareFeet) &&
          !!coalesceNegocioNombreFromWizard(d)
        : brPrivadoTypeOk))
  );
}

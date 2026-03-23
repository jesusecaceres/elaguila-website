import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";
import {
  getBrSubcategoriaFromPropertyType,
  isBrPrivadoComercial,
  isBrPrivadoEdificio,
  isBrPrivadoLote,
  isBrPrivadoProyectoNuevo,
} from "@/app/clasificados/bienes-raices/privado/publish/brPrivadoPublishConstants";
import {
  BR_PUBLISH_BATHROOMS_KEY,
  BR_PUBLISH_BEDROOMS_KEY,
  BR_PUBLISH_BUSINESS_NAME_KEY,
  BR_PUBLISH_FULL_DESCRIPTION_KEY,
  BR_PUBLISH_LOT_SIZE_KEY,
  BR_PUBLISH_PROPERTY_TYPE_KEY,
  BR_PUBLISH_SQUARE_FEET_KEY,
} from "./brPublishDraftLegacyKeys";

export function computeBienesRaicesPublishMetaOk(s: PublishDraftSnapshot): boolean {
  const d = s.details;
  const bienesRaicesBranch = (d.bienesRaicesBranch ?? "").trim().toLowerCase();
  const brDescription = (d[BR_PUBLISH_FULL_DESCRIPTION_KEY] ?? "").trim();
  const brPt = (d[BR_PUBLISH_PROPERTY_TYPE_KEY] ?? "").trim();
  const brSubcat = (d.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType(brPt);
  const brPrivadoTypeOk =
    brSubcat === "terrenos"
      ? !!(d[BR_PUBLISH_LOT_SIZE_KEY] ?? "").trim()
      : brSubcat === "comercial" || brSubcat === "industrial"
        ? !!(d[BR_PUBLISH_SQUARE_FEET_KEY] ?? "").trim()
        : brSubcat === "residencial" || brSubcat === "condos-townhomes" || brSubcat === "multifamiliar"
          ? !!(d[BR_PUBLISH_BEDROOMS_KEY] ?? "").trim() &&
            !!(d[BR_PUBLISH_BATHROOMS_KEY] ?? "").trim() &&
            !!(d[BR_PUBLISH_SQUARE_FEET_KEY] ?? "").trim()
          : isBrPrivadoLote(brPt)
            ? !!(d[BR_PUBLISH_LOT_SIZE_KEY] ?? "").trim()
            : isBrPrivadoComercial(brPt) || isBrPrivadoEdificio(brPt)
              ? !!(d[BR_PUBLISH_SQUARE_FEET_KEY] ?? "").trim()
              : isBrPrivadoProyectoNuevo(brPt)
                ? true
                : true;

  return (
    s.category !== "bienes-raices" ||
    (["privado", "negocio"].includes(bienesRaicesBranch) &&
      !!brPt &&
      brDescription.length >= 5 &&
      (bienesRaicesBranch === "negocio"
        ? !!(d[BR_PUBLISH_BEDROOMS_KEY] ?? "").trim() &&
          !!(d[BR_PUBLISH_BATHROOMS_KEY] ?? "").trim() &&
          !!(d[BR_PUBLISH_SQUARE_FEET_KEY] ?? "").trim() &&
          !!(d.negocioNombre ?? d[BR_PUBLISH_BUSINESS_NAME_KEY] ?? "").trim()
        : brPrivadoTypeOk))
  );
}

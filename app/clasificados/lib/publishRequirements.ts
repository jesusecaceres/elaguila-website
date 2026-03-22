/**
 * Publish wizard: readiness flags derived from `EnVentaDraftSnapshot` (same source as preview/insert).
 */

import { categoryConfig, type CategoryKey } from "@/app/clasificados/config/categoryConfig";
import type { EnVentaDraftSnapshot } from "@/app/clasificados/en-venta/publish/buildEnVentaDraftSnapshot";
import {
  getBrSubcategoriaFromPropertyType,
  isBrPrivadoComercial,
  isBrPrivadoEdificio,
  isBrPrivadoLote,
  isBrPrivadoProyectoNuevo,
} from "@/app/clasificados/bienes-raices/privado/publish/brPrivadoPublishConstants";

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}

function getPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

export type PublishRequirements = {
  categoryOk: boolean;
  titleOk: boolean;
  descOk: boolean;
  cityOk: boolean;
  priceOk: boolean;
  imagesOk: boolean;
  phoneOk: boolean;
  emailOk: boolean;
  contactOk: boolean;
  enVentaMetaOk: boolean;
  rentasMetaOk: boolean;
  bienesRaicesMetaOk: boolean;
  allOk: boolean;
};

/** Validation from snapshot so we validate what preview/insert use. */
export function computePublishRequirements(s: EnVentaDraftSnapshot): PublishRequirements {
  const categoryOk = !!normalizeCategory(s.category);
  const titleOk = s.title.length >= 5;
  const descOk = s.description.length >= 5;
  const cityOk = Boolean(s.cityCanonical);
  const priceNum = (s.priceRaw ?? "").replace(/[^0-9.]/g, "");
  const priceOk =
    s.category === "rentas" || s.category === "bienes-raices"
      ? priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0
      : s.isFree || (priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0);
  const imagesOk = s.images.length >= 1;
  const bienesRaicesBranchEarly = (s.details.bienesRaicesBranch ?? "").trim().toLowerCase();
  const isBienesRaicesNegocioContact = s.category === "bienes-raices" && bienesRaicesBranchEarly === "negocio";
  const brNegocioOfficeDigits = (s.details.negocioTelOficina ?? "").replace(/\D/g, "").slice(0, 10);
  const brNegocioBizEmailOk = /.+@.+\..+/.test((s.details.negocioEmail ?? "").trim());
  const phoneDigits = getPhoneDigits(s.contactPhone);
  const phoneOk =
    s.contactMethod === "email"
      ? true
      : phoneDigits.length === 10 || (isBienesRaicesNegocioContact && brNegocioOfficeDigits.length === 10);
  const emailOk =
    s.contactMethod === "phone"
      ? true
      : /.+@.+\..+/.test(s.contactEmail.trim()) || (isBienesRaicesNegocioContact && brNegocioBizEmailOk);
  const contactOk =
    phoneDigits.length === 10 ||
    /.+@.+\..+/.test(s.contactEmail.trim()) ||
    (isBienesRaicesNegocioContact && (brNegocioOfficeDigits.length === 10 || brNegocioBizEmailOk));
  // En Venta: item-selling metadata (subcategoría, artículo, condición).
  const enVentaMetaOk =
    s.category !== "en-venta" ||
    (!!(s.details.rama ?? "").trim() &&
      !!(s.details.itemType ?? "").trim() &&
      !!(s.details.condition ?? "").trim());
  const rentasBranch = (s.details.rentasBranch ?? "").trim();
  const rentasNegocio = s.category === "rentas" && rentasBranch === "negocio";
  const rentasNegocioNameOk = !rentasNegocio || !!(s.details.negocioNombre ?? "").trim();
  const rentasNegocioTierOk = !rentasNegocio || !!(s.details.rentasTier ?? "").trim();
  const negocioOfficePhone = (s.details.negocioTelOficina ?? "").replace(/\D/g, "").slice(0, 10);
  const rentasNegocioContactOk =
    !rentasNegocio || contactOk || negocioOfficePhone.length === 10;
  const rentasMetaOk =
    s.category !== "rentas" ||
    (!!(s.details.rentasSubcategoria ?? "").trim() &&
      !!(s.details.tipoPropiedad ?? "").trim() &&
      !!rentasBranch &&
      !!(s.details.fechaDisponible ?? "").trim() &&
      rentasNegocioNameOk &&
      rentasNegocioTierOk &&
      rentasNegocioContactOk);
  const bienesRaicesBranch = (s.details.bienesRaicesBranch ?? "").trim().toLowerCase();
  const isBienesRaicesNegocio = s.category === "bienes-raices" && bienesRaicesBranch === "negocio";
  const brDescription = (s.details.enVentaFullDescription ?? "").trim();
  const brPt = (s.details.enVentaPropertyType ?? "").trim();
  const brSubcat = (s.details.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType(brPt);
  const brPrivadoCoreOk = !!(s.details.enVentaPropertyType ?? "").trim() && brDescription.length >= 5;
  const brPrivadoTypeOk =
    brSubcat === "terrenos"
      ? !!(s.details.enVentaLotSize ?? "").trim()
      : brSubcat === "comercial" || brSubcat === "industrial"
        ? !!(s.details.enVentaSquareFeet ?? "").trim()
        : (brSubcat === "residencial" || brSubcat === "condos-townhomes" || brSubcat === "multifamiliar")
          ? !!(s.details.enVentaBedrooms ?? "").trim() &&
            !!(s.details.enVentaBathrooms ?? "").trim() &&
            !!(s.details.enVentaSquareFeet ?? "").trim()
          : isBrPrivadoLote(brPt)
            ? !!(s.details.enVentaLotSize ?? "").trim()
            : isBrPrivadoComercial(brPt) || isBrPrivadoEdificio(brPt)
              ? !!(s.details.enVentaSquareFeet ?? "").trim()
              : isBrPrivadoProyectoNuevo(brPt)
                ? true
                : true;
  const bienesRaicesMetaOk =
    s.category !== "bienes-raices" ||
    (["privado", "negocio"].includes(bienesRaicesBranch) &&
      !!brPt &&
      brDescription.length >= 5 &&
      (bienesRaicesBranch === "negocio"
        ? !!(s.details.enVentaBedrooms ?? "").trim() &&
          !!(s.details.enVentaBathrooms ?? "").trim() &&
          !!(s.details.enVentaSquareFeet ?? "").trim() &&
          !!(s.details.negocioNombre ?? s.details.enVentaBusinessName ?? "").trim()
        : brPrivadoTypeOk));

  return {
    categoryOk,
    titleOk,
    descOk,
    cityOk,
    priceOk,
    imagesOk,
    phoneOk,
    emailOk,
    contactOk,
    enVentaMetaOk,
    rentasMetaOk,
    bienesRaicesMetaOk,
    allOk:
      categoryOk &&
      titleOk &&
      descOk &&
      cityOk &&
      priceOk &&
      imagesOk &&
      contactOk &&
      phoneOk &&
      emailOk &&
      enVentaMetaOk &&
      rentasMetaOk &&
      bienesRaicesMetaOk,
  };
}

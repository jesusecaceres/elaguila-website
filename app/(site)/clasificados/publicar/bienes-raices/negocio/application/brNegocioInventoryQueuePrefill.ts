/**
 * BR-INV-E-FAST — merge queued child property fields into add-mode form (property-only).
 */

import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BienesRaicesNegocioFormState } from "./schema/bienesRaicesNegocioFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "./brNegocioAdditionalInventoryDraft";
import {
  brInventoryPropertySubtypeLabel,
  brInventoryPropertyTypeLabel,
} from "./brNegocioAdditionalInventoryDraft";

function safePhotoUrl(raw: string): string {
  const u = raw.trim();
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/")) return u;
  return "";
}

/** Property-only overlay for Agente add-mode (keeps agent/contact from inherited snapshot). */
export function applyInventoryDraftToAgenteFormState(
  base: AgenteIndividualResidencialFormState,
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  lang: "es" | "en" = "es",
): AgenteIndividualResidencialFormState {
  const photo = safePhotoUrl(draft.mainPhotoUrl);
  const typeCode = draft.propertyType.trim();
  const isResidencial = ["casa", "condominio", "townhome", "apartamento", "multifamiliar"].includes(typeCode);

  return {
    ...base,
    additionalInventoryProperties: [],
    titulo: draft.title.trim(),
    precio: draft.price.trim(),
    ciudad: draft.city.trim(),
    direccionEstado: draft.state.trim(),
    direccionCodigoPostal: draft.zip.trim(),
    direccionLinea1: draft.streetLine1.trim(),
    direccionLinea2: draft.streetLine2.trim(),
    direccion: draft.streetLine1.trim() || base.direccion,
    mostrarDireccionExacta: draft.showExactAddress,
    descripcionPrincipal: draft.description.trim(),
    recamaras: draft.bedrooms.trim(),
    banos: draft.bathrooms.trim(),
    tamanoInteriorSqft: draft.interiorSqft.trim(),
    tamanoLoteSqft: draft.lotSqft.trim(),
    tipoPropiedadCodigo: isResidencial
      ? (typeCode as AgenteIndividualResidencialFormState["tipoPropiedadCodigo"])
      : base.tipoPropiedadCodigo,
    subtipoPropiedad: isResidencial
      ? draft.propertySubtype.trim()
      : brInventoryPropertySubtypeLabel(typeCode, draft.propertySubtype, lang) || draft.propertySubtype.trim(),
    categoriaPropiedad:
      typeCode === "comercial"
        ? "comercial"
        : typeCode === "terreno"
          ? "terreno_lote"
          : base.categoriaPropiedad,
    fotosDataUrls: photo ? [photo] : [],
    fotoPortadaIndex: 0,
  };
}

/** Property-only overlay for Negocio 15-step add-mode. */
export function applyInventoryDraftToNegocioFormState(
  base: BienesRaicesNegocioFormState,
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  lang: "es" | "en" = "es",
): BienesRaicesNegocioFormState {
  const photo = safePhotoUrl(draft.mainPhotoUrl);
  const typeLabel = brInventoryPropertyTypeLabel(draft.propertyType, lang);
  const subLabel = brInventoryPropertySubtypeLabel(draft.propertyType, draft.propertySubtype, lang);

  return {
    ...base,
    additionalInventoryProperties: [],
    titulo: draft.title.trim(),
    precio: draft.price.trim(),
    ciudad: draft.city.trim(),
    estado: draft.state.trim(),
    codigoPostal: draft.zip.trim(),
    direccion: draft.streetLine1.trim(),
    direccionLinea2: draft.streetLine2.trim(),
    mostrarDireccionExacta: draft.showExactAddress,
    descripcionLarga: draft.description.trim(),
    tipoPropiedad: typeLabel,
    propertySubtype: subLabel || draft.propertySubtype.trim(),
    recamaras: draft.bedrooms.trim(),
    banosCompletos: draft.bathrooms.trim(),
    piesCuadrados: draft.interiorSqft.trim(),
    tamanoLote: draft.lotSqft.trim(),
    media: {
      ...base.media,
      photoUrls: photo ? [photo] : [],
      primaryImageIndex: 0,
    },
  };
}

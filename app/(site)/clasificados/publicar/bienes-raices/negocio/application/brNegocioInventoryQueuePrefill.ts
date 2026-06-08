/**
 * BR-INV-E-FAST + BR-INV-FIX-01B — merge queued child property fields into add-mode form (property-only).
 */

import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BienesRaicesNegocioFormState } from "./schema/bienesRaicesNegocioFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "./brNegocioAdditionalInventoryDraft";
import {
  brInventoryPropertySubtypeLabel,
  brInventoryPropertyTypeLabel,
  childInventoryCoverPhotoUrl,
  normalizeChildInventoryDraft,
} from "./brNegocioAdditionalInventoryDraft";

function durablePhotoUrls(raw: BrNegocioAdditionalInventoryPropertyDraft): string[] {
  const draft = normalizeChildInventoryDraft(raw);
  return draft.photoUrls.filter((u) => {
    const t = u.trim();
    return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("data:image/");
  });
}

function durableUrl(raw: string): string {
  const u = raw.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "";
}

/** Property-only overlay for Agente add-mode (keeps agent/contact from inherited snapshot). */
export function applyInventoryDraftToAgenteFormState(
  base: AgenteIndividualResidencialFormState,
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  lang: "es" | "en" = "es",
): AgenteIndividualResidencialFormState {
  const normalized = normalizeChildInventoryDraft(draft);
  const photos = durablePhotoUrls(normalized);
  const cover = childInventoryCoverPhotoUrl(normalized);
  const coverIndex = photos.findIndex((u) => u === cover);
  const typeCode = normalized.propertyType.trim();
  const isResidencial = ["casa", "condominio", "townhome", "apartamento", "multifamiliar"].includes(typeCode);

  return {
    ...base,
    additionalInventoryProperties: [],
    titulo: normalized.title.trim(),
    precio: normalized.price.trim(),
    ciudad: normalized.city.trim(),
    direccionEstado: normalized.state.trim(),
    direccionCodigoPostal: normalized.zip.trim(),
    direccionLinea1: normalized.streetLine1.trim(),
    direccionLinea2: normalized.streetLine2.trim(),
    direccion: normalized.streetLine1.trim() || base.direccion,
    mostrarDireccionExacta: normalized.showExactAddress,
    descripcionPrincipal: normalized.description.trim(),
    recamaras: normalized.bedrooms.trim(),
    banos: normalized.bathrooms.trim(),
    tamanoInteriorSqft: normalized.interiorSqft.trim(),
    tamanoLoteSqft: normalized.lotSqft.trim(),
    tipoPropiedadCodigo: isResidencial
      ? (typeCode as AgenteIndividualResidencialFormState["tipoPropiedadCodigo"])
      : base.tipoPropiedadCodigo,
    subtipoPropiedad: isResidencial
      ? normalized.propertySubtype.trim()
      : brInventoryPropertySubtypeLabel(typeCode, normalized.propertySubtype, lang) || normalized.propertySubtype.trim(),
    categoriaPropiedad:
      typeCode === "comercial"
        ? "comercial"
        : typeCode === "terreno"
          ? "terreno_lote"
          : base.categoriaPropiedad,
    fotosDataUrls: photos.length ? photos : cover ? [cover] : [],
    fotoPortadaIndex: coverIndex >= 0 ? coverIndex : 0,
    listadoUrl: durableUrl(normalized.listadoUrl),
    videoUrl: durableUrl(normalized.videoUrl),
    tourUrl: durableUrl(normalized.tourUrl),
    brochureUrl: durableUrl(normalized.brochureUrl),
    ctaUrlMls: durableUrl(normalized.mlsUrl),
  };
}

/** Property-only overlay for Negocio 15-step add-mode. */
export function applyInventoryDraftToNegocioFormState(
  base: BienesRaicesNegocioFormState,
  draft: BrNegocioAdditionalInventoryPropertyDraft,
  lang: "es" | "en" = "es",
): BienesRaicesNegocioFormState {
  const normalized = normalizeChildInventoryDraft(draft);
  const photos = durablePhotoUrls(normalized);
  const cover = childInventoryCoverPhotoUrl(normalized);
  const coverIndex = photos.findIndex((u) => u === cover);
  const typeLabel = brInventoryPropertyTypeLabel(normalized.propertyType, lang);
  const subLabel = brInventoryPropertySubtypeLabel(normalized.propertyType, normalized.propertySubtype, lang);
  const videoUrl = durableUrl(normalized.videoUrl);

  return {
    ...base,
    additionalInventoryProperties: [],
    titulo: normalized.title.trim(),
    precio: normalized.price.trim(),
    ciudad: normalized.city.trim(),
    estado: normalized.state.trim(),
    codigoPostal: normalized.zip.trim(),
    direccion: normalized.streetLine1.trim(),
    direccionLinea2: normalized.streetLine2.trim(),
    mostrarDireccionExacta: normalized.showExactAddress,
    descripcionLarga: normalized.description.trim(),
    tipoPropiedad: typeLabel,
    propertySubtype: subLabel || normalized.propertySubtype.trim(),
    recamaras: normalized.bedrooms.trim(),
    banosCompletos: normalized.bathrooms.trim(),
    piesCuadrados: normalized.interiorSqft.trim(),
    tamanoLote: normalized.lotSqft.trim(),
    media: {
      ...base.media,
      photoUrls: photos.length ? photos : cover ? [cover] : [],
      primaryImageIndex: coverIndex >= 0 ? coverIndex : 0,
      virtualTourUrl: durableUrl(normalized.tourUrl),
      floorPlanUrls: durableUrl(normalized.brochureUrl) ? [durableUrl(normalized.brochureUrl)] : base.media.floorPlanUrls,
      listingVideoSlots: videoUrl
        ? [
            { ...base.media.listingVideoSlots[0], fallbackUrl: videoUrl, status: "idle" as const },
            base.media.listingVideoSlots[1],
          ]
        : base.media.listingVideoSlots,
    },
  };
}

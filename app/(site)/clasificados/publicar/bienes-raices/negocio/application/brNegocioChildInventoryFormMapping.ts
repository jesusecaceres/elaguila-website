/**
 * BR-INV-FIX-01D — child inventory ↔ full Agente property form mapping.
 */

import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import {
  createEmptyAgenteIndividualResidencialState,
  mergePartialAgenteIndividualResidencial,
} from "../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "./brNegocioAdditionalInventoryDraft";
import {
  createEmptyBrNegocioAdditionalInventoryPropertyDraft,
  newBrLocalPropertyDraftId,
  normalizeChildInventoryDraft,
} from "./brNegocioAdditionalInventoryDraft";
import type { BienesRaicesNegocioFormState } from "./schema/bienesRaicesNegocioFormState";
import { applyInventoryDraftToAgenteFormState } from "./brNegocioInventoryQueuePrefill";

/** Property-specific fields — child inventory owns these; parent hub is inherited. */
export const AGENTE_CHILD_PROPERTY_FIELD_KEYS = [
  "categoriaPropiedad",
  "titulo",
  "precio",
  "ciudad",
  "areaCiudad",
  "direccionLinea1",
  "direccionLinea2",
  "direccionEstado",
  "direccionCodigoPostal",
  "direccion",
  "mostrarDireccionExacta",
  "estadoAnuncio",
  "tipoPropiedadCodigo",
  "subtipoPropiedad",
  "comercialTipoCodigo",
  "comercialSubtipoPropiedad",
  "comercialUso",
  "comercialOficinas",
  "comercialNiveles",
  "comercialZonificacion",
  "comercialAccesoCarga",
  "terrenoTipoCodigo",
  "terrenoSubtipoPropiedad",
  "terrenoUsoZonificacion",
  "terrenoAcceso",
  "terrenoServicios",
  "terrenoTopografia",
  "terrenoListoConstruir",
  "terrenoCercado",
  "listadoUrl",
  "listadoArchivoDataUrl",
  "listadoArchivoNombre",
  "fotosDataUrls",
  "fotoPortadaIndex",
  "videoUrl",
  "videoDataUrl",
  "videoArchivoNombre",
  "tourUrl",
  "tourDataUrl",
  "tourArchivoNombre",
  "brochureUrl",
  "brochureDataUrl",
  "brochureArchivoNombre",
  "recamaras",
  "banos",
  "mediosBanos",
  "tamanoInteriorSqft",
  "tamanoLoteSqft",
  "estacionamientos",
  "anoConstruccion",
  "condicionPropiedad",
  "destacados",
  "destacadosComercial",
  "destacadosTerreno",
  "descripcionPrincipal",
  "notasAdicionales",
  "extraOpenHouse",
  "openHouseFecha",
  "openHouseInicio",
  "openHouseFin",
  "openHouseNotas",
  "openHouseSlots",
] as const satisfies readonly (keyof AgenteIndividualResidencialFormState)[];

export type AgenteChildPropertyFormSlice = Pick<
  AgenteIndividualResidencialFormState,
  (typeof AGENTE_CHILD_PROPERTY_FIELD_KEYS)[number]
>;

export function pickChildPropertySlice(
  state: AgenteIndividualResidencialFormState,
): AgenteChildPropertyFormSlice {
  const out = {} as AgenteChildPropertyFormSlice;
  for (const key of AGENTE_CHILD_PROPERTY_FIELD_KEYS) {
    (out as Record<string, unknown>)[key] = state[key];
  }
  return out;
}

export function pickParentHubSlice(
  state: AgenteIndividualResidencialFormState,
): AgenteIndividualResidencialFormState {
  const empty = createEmptyAgenteIndividualResidencialState();
  const childEmpty = pickChildPropertySlice(empty);
  return mergePartialAgenteIndividualResidencial({
    ...state,
    ...childEmpty,
    additionalInventoryProperties: [],
  });
}

export function mergeParentHubWithChildProperty(
  parentHub: AgenteIndividualResidencialFormState,
  childProperty: Partial<AgenteChildPropertyFormSlice>,
): AgenteIndividualResidencialFormState {
  return mergePartialAgenteIndividualResidencial({
    ...pickParentHubSlice(parentHub),
    ...childProperty,
    additionalInventoryProperties: [],
  });
}

function propertyTypeCodeFromSlice(slice: AgenteChildPropertyFormSlice): string {
  if (slice.categoriaPropiedad === "comercial") return "comercial";
  if (slice.categoriaPropiedad === "terreno_lote") return "terreno";
  return slice.tipoPropiedadCodigo.trim() || "";
}

function flatFieldsFromChildSlice(
  slice: AgenteChildPropertyFormSlice,
): Omit<
  BrNegocioAdditionalInventoryPropertyDraft,
  "id" | "createdAt" | "updatedAt" | "propertyForm"
> {
  const photos = (Array.isArray(slice.fotosDataUrls) ? slice.fotosDataUrls : [])
    .map((u) => String(u ?? "").trim())
    .filter(Boolean);
  const coverIdx = Math.min(Math.max(0, slice.fotoPortadaIndex), Math.max(0, photos.length - 1));
  const cover = photos[coverIdx] ?? photos[0] ?? "";
  const durableUrl = (raw: string) => {
    const u = raw.trim();
    return u.startsWith("http://") || u.startsWith("https://") ? u : "";
  };

  return {
    title: slice.titulo.trim(),
    propertyType: propertyTypeCodeFromSlice(slice),
    propertySubtype: slice.subtipoPropiedad.trim() || slice.comercialSubtipoPropiedad.trim() || slice.terrenoSubtipoPropiedad.trim(),
    price: slice.precio.trim(),
    bedrooms: slice.recamaras.trim(),
    bathrooms: slice.banos.trim(),
    interiorSqft: slice.tamanoInteriorSqft.trim(),
    lotSqft: slice.tamanoLoteSqft.trim(),
    streetLine1: slice.direccionLinea1.trim() || slice.direccion.trim(),
    streetLine2: slice.direccionLinea2.trim(),
    city: slice.ciudad.trim(),
    state: slice.direccionEstado.trim(),
    zip: slice.direccionCodigoPostal.trim(),
    showExactAddress: slice.mostrarDireccionExacta,
    description: slice.descripcionPrincipal.trim(),
    mainPhotoUrl: cover,
    photoUrls: photos,
    primaryPhotoIndex: coverIdx,
    videoUrl: durableUrl(slice.videoUrl),
    tourUrl: durableUrl(slice.tourUrl),
    brochureUrl: durableUrl(slice.brochureUrl),
    mlsUrl: durableUrl(""),
    listadoUrl: durableUrl(slice.listadoUrl),
  };
}

export function childInventoryDraftFromEditorState(
  parentHub: AgenteIndividualResidencialFormState,
  editorState: AgenteIndividualResidencialFormState,
  existing: BrNegocioAdditionalInventoryPropertyDraft | null,
  lang: "es" | "en" = "es",
): BrNegocioAdditionalInventoryPropertyDraft {
  const hub = pickParentHubSlice(parentHub);
  const merged = mergeParentHubWithChildProperty(hub, pickChildPropertySlice(editorState));
  const slice = pickChildPropertySlice(merged);
  const now = new Date().toISOString();
  const id = existing?.id ?? newBrLocalPropertyDraftId();
  return normalizeChildInventoryDraft({
    ...createEmptyBrNegocioAdditionalInventoryPropertyDraft(id),
    ...flatFieldsFromChildSlice(slice),
    propertyForm: slice,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export function buildChildInventoryEditorState(
  parentHub: AgenteIndividualResidencialFormState,
  draft: BrNegocioAdditionalInventoryPropertyDraft | null,
  lang: "es" | "en" = "es",
): AgenteIndividualResidencialFormState {
  const hub = pickParentHubSlice(parentHub);
  if (!draft) {
    return mergePartialAgenteIndividualResidencial({
      ...hub,
      ...pickChildPropertySlice(createEmptyAgenteIndividualResidencialState()),
      additionalInventoryProperties: [],
    });
  }
  const normalized = normalizeChildInventoryDraft(draft);
  if (normalized.propertyForm && typeof normalized.propertyForm === "object") {
    return mergeParentHubWithChildProperty(
      hub,
      normalized.propertyForm as Partial<AgenteChildPropertyFormSlice>,
    );
  }
  return applyInventoryDraftToAgenteFormState(hub, normalized, lang);
}

export function validateAgenteChildInventoryForSave(
  state: AgenteIndividualResidencialFormState,
  lang: "es" | "en",
): Partial<Record<"titulo" | "precio" | "ciudad" | "direccionEstado" | "fotos", string>> {
  const errors: Partial<Record<"titulo" | "precio" | "ciudad" | "direccionEstado" | "fotos", string>> = {};
  if (!state.titulo.trim()) {
    errors.titulo = lang === "es" ? "El título es obligatorio." : "Title is required.";
  }
  if (!state.precio.trim()) {
    errors.precio = lang === "es" ? "El precio es obligatorio." : "Price is required.";
  }
  if (!state.ciudad.trim()) {
    errors.ciudad = lang === "es" ? "La ciudad es obligatoria." : "City is required.";
  }
  if (!state.direccionEstado.trim()) {
    errors.direccionEstado = lang === "es" ? "El estado es obligatorio." : "State is required.";
  }
  const photos = (state.fotosDataUrls ?? []).filter((u) => String(u ?? "").trim());
  if (!photos.length) {
    errors.fotos = lang === "es" ? "Agrega al menos una foto." : "Add at least one photo.";
  }
  return errors;
}

export function childInventorySaveHasErrors(
  errors: ReturnType<typeof validateAgenteChildInventoryForSave>,
): boolean {
  return Object.keys(errors).length > 0;
}

/** Negocio 15-step lane — hub fields for child inventory inheritance. */
export function agenteHubSnapshotFromNegocioState(
  state: BienesRaicesNegocioFormState,
): AgenteIndividualResidencialFormState {
  const empty = createEmptyAgenteIndividualResidencialState();
  const ia = state.identityAgente;
  const cc = state.contactChannels;
  return mergePartialAgenteIndividualResidencial({
    ...empty,
    agenteNombre: ia.nombre,
    agenteTitulo: ia.rol,
    agenteLicencia: ia.licencia,
    agenteTelefonoPersonal: ia.telDirecto,
    agenteTelefonoOficina: ia.telOficina,
    correoPrincipal: ia.email,
    agenteSitioWeb: ia.sitioWeb,
    marcaNombre: ia.brokerage,
    marcaLogoDataUrl: ia.logoBrokerageUrl,
    marcaLicencia: ia.licencia,
    marcaSitioWeb: ia.sitioWeb,
    socialInstagram: cc.instagram,
    socialFacebook: cc.facebook,
    socialYoutube: cc.youtube,
    socialTiktok: cc.tiktok,
    permitirSolicitarInformacion: state.cta.permitirSolicitarInfo,
    permitirProgramarVisita: state.cta.permitirProgramarVisita,
    permitirLlamar: state.cta.permitirLlamar,
    permitirWhatsApp: state.cta.permitirWhatsapp,
    ctaUrlListadoCompleto: cc.masInformacionUrl,
    additionalInventoryProperties: [],
  });
}

/**
 * BR-INV-FIX-01D — child inventory ↔ full Agente property form mapping.
 */

import {
  normalizeBrListingCountry,
  resolveBrListingCity,
  isBrUsCountry,
} from "@/app/lib/clasificados/bienes-raices/brLocationHelpers";
import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
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
  syncChildInventoryDraftMedia,
} from "./brNegocioAdditionalInventoryDraft";
import { mergeChildInventoryWithMediaBridge } from "./brNegocioInventoryDraftPersistence";
import {
  hydrateBrChildMediaCanonical,
  projectBrChildMediaToBienesFields,
} from "./brNegocioChildMediaCanonical";
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
  "direccionPais",
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
  "videoUrls",
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

/** Canonical city when NorCal match exists; otherwise preserve manual text. */
export function resolveChildInventoryCity(raw: string): string {
  return resolveBrListingCity(raw);
}

export function mergeParentHubWithChildProperty(
  parentHub: AgenteIndividualResidencialFormState,
  childProperty: Partial<AgenteChildPropertyFormSlice>,
): AgenteIndividualResidencialFormState {
  const merged = mergePartialAgenteIndividualResidencial({
    ...pickParentHubSlice(parentHub),
    ...childProperty,
    additionalInventoryProperties: [],
  });
  return {
    ...merged,
    ciudad: resolveChildInventoryCity(String(childProperty.ciudad ?? merged.ciudad)),
    direccionPais: normalizeBrListingCountry(String(childProperty.direccionPais ?? merged.direccionPais)),
  };
}

/** Live editor merge — no mergePartial; preserves raw typing (videoUrls, city, state, etc.). */
export function mergeParentHubWithChildPropertyForEditor(
  parentHub: AgenteIndividualResidencialFormState,
  childProperty: Partial<AgenteChildPropertyFormSlice>,
): AgenteIndividualResidencialFormState {
  const hub = pickParentHubSlice(parentHub);
  return {
    ...hub,
    ...childProperty,
    additionalInventoryProperties: [],
  };
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
  const durableUrl = (raw: string) => preserveUrlText(raw);
  const primaryVideoUrl =
    (Array.isArray(slice.videoUrls) ? slice.videoUrls : [])
      .map((u) => durableUrl(String(u ?? "")))
      .find(Boolean) ?? durableUrl(slice.videoUrl);

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
    city: resolveChildInventoryCity(slice.ciudad),
    state: slice.direccionEstado.trim(),
    zip: slice.direccionCodigoPostal.trim(),
    country: normalizeBrListingCountry(slice.direccionPais),
    showExactAddress: slice.mostrarDireccionExacta,
    description: slice.descripcionPrincipal.trim(),
    mainPhotoUrl: cover,
    photoUrls: photos,
    primaryPhotoIndex: coverIdx,
    videoUrl: primaryVideoUrl,
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
  // Prefer editor merge so IDB refs / data: gallery slots are not normalized away.
  const merged = mergeParentHubWithChildPropertyForEditor(hub, pickChildPropertySlice(editorState));
  const slice = {
    ...pickChildPropertySlice(merged),
    ciudad: resolveChildInventoryCity(merged.ciudad),
    direccionPais: normalizeBrListingCountry(merged.direccionPais),
  };
  const now = new Date().toISOString();
  const id = existing?.id ?? newBrLocalPropertyDraftId();
  return syncChildInventoryDraftMedia(
    normalizeChildInventoryDraft({
      ...createEmptyBrNegocioAdditionalInventoryPropertyDraft(id),
      ...flatFieldsFromChildSlice(slice),
      propertyForm: slice,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }),
  );
}

/**
 * Build the parent-owned saved child draft from the committed editor media handoff.
 * Prefers durable committed refs; falls back to live editor slots so save never drops
 * a gallery that is still visible (data:) while one representation is unresolved.
 */
export function childInventoryDraftFromCommittedEditorMedia(
  parentHub: AgenteIndividualResidencialFormState,
  committedPropertyForm: Partial<AgenteChildPropertyFormSlice> | null | undefined,
  liveEditorState: AgenteIndividualResidencialFormState,
  existing: BrNegocioAdditionalInventoryPropertyDraft | null,
  lang: "es" | "en" = "es",
  stableChildId?: string | null,
): BrNegocioAdditionalInventoryPropertyDraft {
  const liveSlice = pickChildPropertySlice(liveEditorState);
  const committedFotos = (Array.isArray(committedPropertyForm?.fotosDataUrls)
    ? committedPropertyForm!.fotosDataUrls!
    : []
  )
    .map((u) => String(u ?? "").trim())
    .filter(Boolean);
  const liveFotos = (Array.isArray(liveSlice.fotosDataUrls) ? liveSlice.fotosDataUrls : [])
    .map((u) => String(u ?? "").trim())
    .filter(Boolean);
  const committedDurable = committedFotos.filter(isDurablePhotoUrl);
  const liveDurable = liveFotos.filter(isDurablePhotoUrl);
  const fotos =
    committedDurable.length > 0
      ? committedDurable
      : committedFotos.length > 0
        ? committedFotos
        : liveDurable.length > 0
          ? liveDurable
          : liveFotos;
  const portadaRaw =
    committedPropertyForm && committedFotos.length > 0
      ? Number(committedPropertyForm.fotoPortadaIndex) || 0
      : Number(liveSlice.fotoPortadaIndex) || 0;
  const fotoPortadaIndex = clampEditorPhotoIndex(fotos, portadaRaw);
  const stateForSave = mergeParentHubWithChildPropertyForEditor(parentHub, {
    ...liveSlice,
    ...(committedPropertyForm ?? {}),
    fotosDataUrls: fotos,
    fotoPortadaIndex,
  });
  const draft = childInventoryDraftFromEditorState(parentHub, stateForSave, existing, lang);
  const id =
    String(stableChildId ?? "").trim() ||
    String(existing?.id ?? "").trim() ||
    draft.id;
  return syncChildInventoryDraftMedia({
    ...draft,
    id,
    photoUrls: fotos,
    primaryPhotoIndex: fotoPortadaIndex,
    mainPhotoUrl: fotos[fotoPortadaIndex] ?? fotos[0] ?? "",
    propertyForm: {
      ...(draft.propertyForm ?? {}),
      fotosDataUrls: fotos,
      fotoPortadaIndex,
    },
  });
}

function isDurablePhotoUrl(url: string): boolean {
  const u = url.trim();
  return (
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("data:image/") ||
    u.startsWith("__LX_BR_AGENTE_IDB__")
  );
}

function clampEditorPhotoIndex(photos: string[], index: number): number {
  if (!photos.length) return 0;
  return Math.min(Math.max(0, index), photos.length - 1);
}

function durableHttpUrl(raw: string): string {
  const u = raw.trim();
  return u.startsWith("http://") || u.startsWith("https://") ? u : "";
}

/** Preserve plain text URLs (http/https/www); never strip non-blob URL text for session/preview. */
function preserveUrlText(raw: string): string {
  const u = raw.trim();
  if (!u || u.startsWith("data:")) return "";
  return u;
}

function durableVideoUrlList(urls: unknown, fallbackSingle: string): string[] {
  const list = Array.isArray(urls)
    ? urls.map((u) => preserveUrlText(String(u ?? ""))).filter(Boolean)
    : [];
  if (list.length) return list.slice(0, 4);
  const one = preserveUrlText(fallbackSingle);
  return one ? [one] : [];
}

function livePhotoUrlsFromSlice(slice: Partial<AgenteChildPropertyFormSlice>): string[] {
  const raw = (Array.isArray(slice.fotosDataUrls) ? slice.fotosDataUrls : [])
    .map((u) => String(u ?? "").trim())
    .filter(Boolean);
  const durable = raw.filter(isDurablePhotoUrl);
  return durable.length > 0 ? durable : raw;
}

function liveVideoUrlsFromSlice(slice: Partial<AgenteChildPropertyFormSlice>): string[] {
  const fromArray = Array.isArray(slice.videoUrls)
    ? slice.videoUrls.map((u) => preserveUrlText(String(u ?? ""))).filter(Boolean)
    : [];
  if (fromArray.length) return fromArray.slice(0, 4);
  const one = preserveUrlText(String(slice.videoUrl ?? ""));
  return one ? [one] : [];
}

function liveUrlFromSlice(slice: Partial<AgenteChildPropertyFormSlice>, key: "tourUrl" | "brochureUrl" | "listadoUrl"): string {
  return preserveUrlText(String(slice[key] ?? ""));
}

/** Merge autosaved session slice with saved draft without wiping media. */
export function mergeChildEditorSessionWithDraft(
  sessionForm: AgenteChildPropertyFormSlice,
  draft: BrNegocioAdditionalInventoryPropertyDraft,
): BrNegocioAdditionalInventoryPropertyDraft {
  const synced = syncChildInventoryDraftMedia(draft);
  const draftSlice = (synced.propertyForm ?? {}) as Partial<AgenteChildPropertyFormSlice>;

  const sessionPhotosAll = (Array.isArray(sessionForm.fotosDataUrls) ? sessionForm.fotosDataUrls : [])
    .map((u) => String(u ?? "").trim())
    .filter(Boolean);
  const sessionPhotos = sessionPhotosAll.filter(isDurablePhotoUrl);
  const draftPhotos = synced.photoUrls;

  const sessionVideos = liveVideoUrlsFromSlice(sessionForm);
  const draftVideos = liveVideoUrlsFromSlice(draftSlice);

  const preferSessionPhotos = sessionPhotosAll.length > 0;
  const fotosDataUrls = preferSessionPhotos
    ? sessionPhotos.length > 0
      ? sessionPhotos
      : sessionPhotosAll
    : draftPhotos;
  const fotoPortadaIndex = preferSessionPhotos
    ? clampEditorPhotoIndex(fotosDataUrls, sessionForm.fotoPortadaIndex)
    : synced.primaryPhotoIndex;

  const preferSessionVideos = sessionVideos.length > 0;
  const videoUrls = preferSessionVideos ? sessionVideos : draftVideos;
  const videoUrl =
    videoUrls[0] ?? (preserveUrlText(sessionForm.videoUrl ?? "") || synced.videoUrl || "");

  const mergedSlice: Partial<AgenteChildPropertyFormSlice> = {
    ...draftSlice,
    ...sessionForm,
    fotosDataUrls,
    fotoPortadaIndex,
    videoUrls,
    videoUrl,
    tourUrl:
      liveUrlFromSlice(sessionForm, "tourUrl") ||
      liveUrlFromSlice(draftSlice, "tourUrl") ||
      preserveUrlText(synced.tourUrl ?? ""),
    brochureUrl:
      liveUrlFromSlice(sessionForm, "brochureUrl") ||
      liveUrlFromSlice(draftSlice, "brochureUrl") ||
      preserveUrlText(synced.brochureUrl ?? ""),
    listadoUrl:
      liveUrlFromSlice(sessionForm, "listadoUrl") ||
      liveUrlFromSlice(draftSlice, "listadoUrl") ||
      preserveUrlText(synced.listadoUrl ?? ""),
  };

  return syncChildInventoryDraftMedia({
    ...synced,
    propertyForm: mergedSlice,
  });
}

function applyLiveChildEditorFieldsToPreviewDraft(
  mediaDraft: BrNegocioAdditionalInventoryPropertyDraft,
  editorDraft: BrNegocioAdditionalInventoryPropertyDraft,
): BrNegocioAdditionalInventoryPropertyDraft {
  const editorSlice = (editorDraft.propertyForm ?? {}) as Partial<AgenteChildPropertyFormSlice>;
  const staleSlice = (syncChildInventoryDraftMedia(mediaDraft).propertyForm ?? {}) as Partial<AgenteChildPropertyFormSlice>;

  const livePhotosRaw = livePhotoUrlsFromSlice(editorSlice);
  const fallbackPhotos = livePhotoUrlsFromSlice(staleSlice);
  const photos = livePhotosRaw.length > 0 ? livePhotosRaw : fallbackPhotos;
  const primaryPhotoIndex =
    livePhotosRaw.length > 0
      ? clampEditorPhotoIndex(photos, editorSlice.fotoPortadaIndex ?? editorDraft.primaryPhotoIndex)
      : clampEditorPhotoIndex(photos, mediaDraft.primaryPhotoIndex);
  const cover = photos[primaryPhotoIndex] ?? photos[0] ?? "";

  const liveVideos = liveVideoUrlsFromSlice(editorSlice);
  const fallbackVideos = liveVideoUrlsFromSlice(staleSlice);
  const videoUrls = liveVideos.length > 0 ? liveVideos : fallbackVideos;
  const videoUrl =
    videoUrls[0] ?? (preserveUrlText(String(editorSlice.videoUrl ?? "")) || mediaDraft.videoUrl || "");

  const tourUrl =
    liveUrlFromSlice(editorSlice, "tourUrl") ||
    liveUrlFromSlice(staleSlice, "tourUrl") ||
    preserveUrlText(mediaDraft.tourUrl ?? "");
  const brochureUrl =
    liveUrlFromSlice(editorSlice, "brochureUrl") ||
    liveUrlFromSlice(staleSlice, "brochureUrl") ||
    preserveUrlText(mediaDraft.brochureUrl ?? "");
  const listadoUrl =
    liveUrlFromSlice(editorSlice, "listadoUrl") ||
    liveUrlFromSlice(staleSlice, "listadoUrl") ||
    preserveUrlText(mediaDraft.listadoUrl ?? "");

  const propertyForm: Partial<AgenteChildPropertyFormSlice> = {
    ...staleSlice,
    ...editorSlice,
    fotosDataUrls: photos,
    fotoPortadaIndex: primaryPhotoIndex,
    videoUrls,
    videoUrl,
    tourUrl,
    brochureUrl,
    listadoUrl,
  };

  return syncChildInventoryDraftMedia({
    ...editorDraft,
    ...mediaDraft,
    photoUrls: photos,
    primaryPhotoIndex,
    mainPhotoUrl: cover,
    videoUrl,
    tourUrl,
    brochureUrl,
    listadoUrl,
    propertyForm,
    id: editorDraft.id,
    createdAt: editorDraft.createdAt,
    updatedAt: editorDraft.updatedAt,
  });
}

/**
 * Canonical live child preview draft — Step 10 card, full overlay, and save-adjacent truth.
 * Prefers current editor media; falls back to initial draft + in-memory media bridge.
 */
export function buildLiveChildInventoryPreviewDraft(input: {
  parentHub: AgenteIndividualResidencialFormState;
  state: AgenteIndividualResidencialFormState;
  initialDraft: BrNegocioAdditionalInventoryPropertyDraft | null;
  lang: "es" | "en";
}): BrNegocioAdditionalInventoryPropertyDraft {
  const { parentHub, state, initialDraft, lang } = input;
  const slice = pickChildPropertySlice(state);
  const editorDraft = childInventoryDraftFromEditorState(parentHub, state, initialDraft, lang);

  const hydratedInitial = initialDraft
    ? mergeChildInventoryWithMediaBridge([normalizeChildInventoryDraft(initialDraft)])[0] ?? initialDraft
    : null;

  const merged = hydratedInitial
    ? mergeChildEditorSessionWithDraft(slice, hydratedInitial)
    : mergeChildEditorSessionWithDraft(slice, editorDraft);

  const withLiveFields = applyLiveChildEditorFieldsToPreviewDraft(merged, editorDraft);
  const [bridged] = mergeChildInventoryWithMediaBridge([withLiveFields]);
  return applyLiveChildEditorFieldsToPreviewDraft(bridged ?? withLiveFields, editorDraft);
}

export function buildChildInventoryEditorState(
  parentHub: AgenteIndividualResidencialFormState,
  draft: BrNegocioAdditionalInventoryPropertyDraft | null,
  lang: "es" | "en" = "es",
  opts?: { preferredCategoria?: BrNegocioCategoriaPropiedad | null },
): AgenteIndividualResidencialFormState {
  const hub = pickParentHubSlice(parentHub);
  if (!draft) {
    const emptyChild = pickChildPropertySlice(createEmptyAgenteIndividualResidencialState());
    const preferred = opts?.preferredCategoria;
    return mergePartialAgenteIndividualResidencial({
      ...hub,
      ...emptyChild,
      ...(preferred ? { categoriaPropiedad: preferred } : {}),
      additionalInventoryProperties: [],
    });
  }
  const normalized = syncChildInventoryDraftMedia(normalizeChildInventoryDraft(draft));
  if (normalized.propertyForm && typeof normalized.propertyForm === "object") {
    const merged = mergeParentHubWithChildProperty(
      hub,
      normalized.propertyForm as Partial<AgenteChildPropertyFormSlice>,
    );
    const savedCity = resolveChildInventoryCity(normalized.city || String(normalized.propertyForm.ciudad ?? ""));
    const savedCountry = normalizeBrListingCountry(
      String(normalized.country ?? normalized.propertyForm.direccionPais ?? ""),
    );
    return {
      ...merged,
      fotosDataUrls: normalized.photoUrls,
      fotoPortadaIndex: normalized.primaryPhotoIndex,
      videoUrls: durableVideoUrlList(normalized.propertyForm.videoUrls, normalized.videoUrl),
      videoUrl: normalized.videoUrl,
      tourUrl: normalized.tourUrl || merged.tourUrl,
      brochureUrl: normalized.brochureUrl || merged.brochureUrl,
      listadoUrl: normalized.listadoUrl || merged.listadoUrl,
      ciudad: savedCity || merged.ciudad,
      direccionPais: savedCountry,
    };
  }
  const fromFlat = applyInventoryDraftToAgenteFormState(hub, normalized, lang);
  const preferred = opts?.preferredCategoria;
  if (preferred && !normalized.propertyForm) {
    return { ...fromFlat, categoriaPropiedad: preferred };
  }
  return fromFlat;
}

export function validateAgenteChildInventoryForSave(
  state: AgenteIndividualResidencialFormState,
  lang: "es" | "en",
): Partial<Record<"titulo" | "precio" | "ciudad" | "direccionPais" | "direccionEstado" | "fotos", string>> {
  const errors: Partial<
    Record<"titulo" | "precio" | "ciudad" | "direccionPais" | "direccionEstado" | "fotos", string>
  > = {};
  if (!state.titulo.trim()) {
    errors.titulo = lang === "es" ? "El título es obligatorio." : "Title is required.";
  }
  if (!state.precio.trim()) {
    errors.precio = lang === "es" ? "El precio es obligatorio." : "Price is required.";
  }
  if (!resolveChildInventoryCity(state.ciudad)) {
    errors.ciudad = lang === "es" ? "La ciudad es obligatoria." : "City is required.";
  }
  if (!normalizeBrListingCountry(state.direccionPais)) {
    errors.direccionPais = lang === "es" ? "El país es obligatorio." : "Country is required.";
  }
  if (isBrUsCountry(state.direccionPais) && !state.direccionEstado.trim()) {
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

/**
 * Autos hydrateChildInventoryEditorDraft parity — resolve child media into one display collection,
 * then project onto Bienes `fotosDataUrls` / `photoUrls` / cover fields.
 */
export async function hydrateBrChildInventoryDraftMediaForDisplay(
  draft: BrNegocioAdditionalInventoryPropertyDraft,
): Promise<BrNegocioAdditionalInventoryPropertyDraft> {
  const normalized = syncChildInventoryDraftMedia(normalizeChildInventoryDraft(draft));
  const images = await hydrateBrChildMediaCanonical({
    childId: normalized.id,
    fotosDataUrls: normalized.propertyForm?.fotosDataUrls ?? null,
    fotoPortadaIndex: normalized.propertyForm?.fotoPortadaIndex ?? normalized.primaryPhotoIndex,
    photoUrls: normalized.photoUrls,
    mainPhotoUrl: normalized.mainPhotoUrl,
    primaryPhotoIndex: normalized.primaryPhotoIndex,
  });
  const display = projectBrChildMediaToBienesFields(images, "display");
  const persist = projectBrChildMediaToBienesFields(images, "persist");
  return syncChildInventoryDraftMedia({
    ...normalized,
    photoUrls: display.photoUrls.length ? display.photoUrls : persist.photoUrls,
    primaryPhotoIndex: display.primaryPhotoIndex,
    mainPhotoUrl: display.mainPhotoUrl,
    propertyForm: {
      ...(normalized.propertyForm ?? {}),
      fotosDataUrls: display.fotosDataUrls.length ? display.fotosDataUrls : persist.fotosDataUrls,
      fotoPortadaIndex: display.fotoPortadaIndex,
    },
  });
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

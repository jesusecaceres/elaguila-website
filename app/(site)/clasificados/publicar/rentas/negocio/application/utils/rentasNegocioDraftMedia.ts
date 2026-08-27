/**
 * BR-INV-WAVE1-GATE3 — IndexedDB offload for Rentas Negocio draft photos (+ business logo).
 * Keeps sessionStorage/localStorage JSON small; mirrors the pattern already proven by
 * Restaurantes, Servicios, and BR Negocio agente-individual (see `app/lib/media/draftHeavyMediaIdb.ts`).
 */
import { createDraftHeavyMediaIdbStore } from "@/app/lib/media/draftHeavyMediaIdb";
import type { RentasNegocioFormState } from "../../schema/rentasNegocioFormState";

const NAMESPACE = "rentas-negocio-v1";
const store = createDraftHeavyMediaIdbStore("lx-rentas-negocio-draft", "__LX_RENTAS_NEGOCIO_IDB__");

export async function offloadRentasNegocioHeavyMediaToIdb(
  state: RentasNegocioFormState,
): Promise<RentasNegocioFormState> {
  const photoDataUrls = await store.offloadPhotoArray(NAMESPACE, "MAIN_PHOTO", state.media.photoDataUrls ?? []);
  const negocioLogoDataUrl = await store.offloadScalar(NAMESPACE, "LOGO", undefined, state.negocioLogoDataUrl ?? "");
  return {
    ...state,
    media: { ...state.media, photoDataUrls },
    negocioLogoDataUrl,
  };
}

export async function inlineRentasNegocioHeavyMediaFromIdb(
  state: RentasNegocioFormState,
): Promise<RentasNegocioFormState> {
  const photoDataUrls = await store.inlinePhotoArray(NAMESPACE, "MAIN_PHOTO", state.media.photoDataUrls ?? []);
  const negocioLogoDataUrl = await store.inlineScalar(NAMESPACE, "LOGO", undefined, state.negocioLogoDataUrl ?? "");
  return {
    ...state,
    media: { ...state.media, photoDataUrls },
    negocioLogoDataUrl,
  };
}

export async function clearRentasNegocioDraftMediaIdb(): Promise<void> {
  await store.clearNamespace(NAMESPACE);
}

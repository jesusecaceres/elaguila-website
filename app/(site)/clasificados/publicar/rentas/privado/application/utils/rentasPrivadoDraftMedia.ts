/**
 * BR-INV-WAVE1-GATE3 — IndexedDB offload for Rentas Privado draft photos (+ seller photo).
 * Keeps sessionStorage/localStorage JSON small; mirrors the pattern already proven by
 * Restaurantes, Servicios, and BR Negocio agente-individual (see `app/lib/media/draftHeavyMediaIdb.ts`).
 */
import { createDraftHeavyMediaIdbStore } from "@/app/lib/media/draftHeavyMediaIdb";
import type { RentasPrivadoFormState } from "../../schema/rentasPrivadoFormState";

const NAMESPACE = "rentas-privado-v1";
const store = createDraftHeavyMediaIdbStore("lx-rentas-privado-draft", "__LX_RENTAS_PRIVADO_IDB__");

export async function offloadRentasPrivadoHeavyMediaToIdb(
  state: RentasPrivadoFormState,
): Promise<RentasPrivadoFormState> {
  const photoDataUrls = await store.offloadPhotoArray(NAMESPACE, "MAIN_PHOTO", state.media.photoDataUrls ?? []);
  const sellerPhoto = await store.offloadScalar(NAMESPACE, "SELLER_PHOTO", undefined, state.seller.fotoDataUrl ?? "");
  return {
    ...state,
    media: { ...state.media, photoDataUrls },
    seller: { ...state.seller, fotoDataUrl: sellerPhoto },
  };
}

export async function inlineRentasPrivadoHeavyMediaFromIdb(
  state: RentasPrivadoFormState,
): Promise<RentasPrivadoFormState> {
  const photoDataUrls = await store.inlinePhotoArray(NAMESPACE, "MAIN_PHOTO", state.media.photoDataUrls ?? []);
  const sellerPhoto = await store.inlineScalar(NAMESPACE, "SELLER_PHOTO", undefined, state.seller.fotoDataUrl ?? "");
  return {
    ...state,
    media: { ...state.media, photoDataUrls },
    seller: { ...state.seller, fotoDataUrl: sellerPhoto },
  };
}

export async function clearRentasPrivadoDraftMediaIdb(): Promise<void> {
  await store.clearNamespace(NAMESPACE);
}

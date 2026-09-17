/**
 * BR-INV-WAVE1-GATE3 — IndexedDB offload for BR Privado draft photos (+ seller photo).
 * Keeps sessionStorage/localStorage JSON small; mirrors the pattern already proven by
 * Restaurantes, Servicios, and BR Negocio agente-individual (see `app/lib/media/draftHeavyMediaIdb.ts`).
 */
import { createDraftHeavyMediaIdbStore } from "@/app/lib/media/draftHeavyMediaIdb";
import type { BienesRaicesPrivadoFormState } from "../../schema/bienesRaicesPrivadoFormState";

const NAMESPACE = "br-privado-v1";
const store = createDraftHeavyMediaIdbStore("lx-br-privado-draft", "__LX_BR_PRIVADO_IDB__");

export async function offloadBienesRaicesPrivadoHeavyMediaToIdb(
  state: BienesRaicesPrivadoFormState,
): Promise<BienesRaicesPrivadoFormState> {
  const photoDataUrls = await store.offloadPhotoArray(NAMESPACE, "MAIN_PHOTO", state.media.photoDataUrls ?? []);
  const sellerPhoto = await store.offloadScalar(NAMESPACE, "SELLER_PHOTO", undefined, state.seller.fotoDataUrl ?? "");
  return {
    ...state,
    media: { ...state.media, photoDataUrls },
    seller: { ...state.seller, fotoDataUrl: sellerPhoto },
  };
}

export async function inlineBienesRaicesPrivadoHeavyMediaFromIdb(
  state: BienesRaicesPrivadoFormState,
): Promise<BienesRaicesPrivadoFormState> {
  const photoDataUrls = await store.inlinePhotoArray(NAMESPACE, "MAIN_PHOTO", state.media.photoDataUrls ?? []);
  const sellerPhoto = await store.inlineScalar(NAMESPACE, "SELLER_PHOTO", undefined, state.seller.fotoDataUrl ?? "");
  return {
    ...state,
    media: { ...state.media, photoDataUrls },
    seller: { ...state.seller, fotoDataUrl: sellerPhoto },
  };
}

export async function clearBienesRaicesPrivadoDraftMediaIdb(): Promise<void> {
  await store.clearNamespace(NAMESPACE);
}

/**
 * BR-INV-D2-FIX — true if IndexedDB still holds offloaded photo/seller-photo blobs for this draft,
 * independent of whatever sessionStorage currently reads. Used as positive evidence that a draft
 * really did exist when the sessionStorage/localStorage JSON read comes back empty, so hydration
 * knows to keep waiting rather than conclude "no draft" and let the empty state get autosaved.
 */
export async function bienesRaicesPrivadoHasPersistedMedia(): Promise<boolean> {
  return store.hasNamespaceEntries(NAMESPACE);
}

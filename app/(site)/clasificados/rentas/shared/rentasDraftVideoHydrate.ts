"use client";

import { readRentasDraftVideo } from "@/app/clasificados/rentas/shared/rentasDraftVideoStore";
import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";

type RentasDraftVideoMedia = Pick<
  RentasPrivadoFormState["media"],
  | "videoLocalDraftId"
  | "videoLocalDataUrl"
  | "videoLocalFileName"
  | "videoLocalMimeType"
  | "videoLocalSizeBytes"
  | "videoLocalUpdatedAt"
>;

function trim(s: string): string {
  return String(s ?? "").trim();
}

export type RentasDraftVideoHydrateResult<T> = {
  state: T;
  /** Revoke with `URL.revokeObjectURL` when discarding this hydrated state (preview unmount / navigation). */
  revokeObjectUrl: string | null;
};

/**
 * Restores `media.videoLocalDataUrl` as a `blob:` object URL from IndexedDB when JSON draft
 * stripped the inline data URL (see `saveRentas*Draft`).
 */
export async function hydrateRentasPrivadoDraftVideoFromIdb(
  state: RentasPrivadoFormState,
): Promise<RentasDraftVideoHydrateResult<RentasPrivadoFormState>> {
  return hydrateRentasDraftVideoMediaSlice(state, state.media) as Promise<RentasDraftVideoHydrateResult<RentasPrivadoFormState>>;
}

export async function hydrateRentasNegocioDraftVideoFromIdb(
  state: RentasNegocioFormState,
): Promise<RentasDraftVideoHydrateResult<RentasNegocioFormState>> {
  return hydrateRentasDraftVideoMediaSlice(state, state.media) as Promise<RentasDraftVideoHydrateResult<RentasNegocioFormState>>;
}

async function hydrateRentasDraftVideoMediaSlice<T extends { media: RentasDraftVideoMedia }>(
  state: T,
  media: RentasDraftVideoMedia,
): Promise<RentasDraftVideoHydrateResult<T>> {
  const existing = trim(media.videoLocalDataUrl ?? "");
  if (existing.startsWith("blob:") || /^data:video\//i.test(existing) || /^data:application\/octet-stream/i.test(existing)) {
    return { state, revokeObjectUrl: null };
  }
  const id = trim(media.videoLocalDraftId ?? "");
  if (!id) {
    return { state, revokeObjectUrl: null };
  }
  const rec = await readRentasDraftVideo(id);
  if (!rec?.blob || rec.blob.size < 1) {
    return { state, revokeObjectUrl: null };
  }
  const url = URL.createObjectURL(rec.blob);
  return {
    state: {
      ...state,
      media: {
        ...state.media,
        videoLocalDataUrl: url,
        videoLocalFileName: trim(media.videoLocalFileName) || rec.fileName,
        videoLocalMimeType: trim(media.videoLocalMimeType) || rec.mimeType,
        videoLocalSizeBytes: media.videoLocalSizeBytes || rec.sizeBytes,
        videoLocalUpdatedAt: media.videoLocalUpdatedAt || rec.updatedAt,
      },
    },
    revokeObjectUrl: url,
  };
}

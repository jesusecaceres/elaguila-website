import type { EnVentaAnuncioDTO } from "../types/enVentaListing.types";
import { normalizeEnVentaPublishedMedia, type EnVentaPublishedMedia } from "./enVentaPublishedMedia";

export type EnVentaCardMediaVm = EnVentaPublishedMedia & {
  muxPlaybackId: string | null;
};

/**
 * Canonical Varios card media from a published `listings` row.
 * Always re-resolve from the row so landing/results cards match public detail.
 */
export function normalizeEnVentaCardMedia(
  row: Record<string, unknown>,
  dto?: Pick<EnVentaAnuncioDTO, "hasListingVideo" | "listingVideoUrl" | "muxPlaybackId">
): EnVentaCardMediaVm {
  const media = normalizeEnVentaPublishedMedia(row, dto);
  const muxPlaybackId =
    dto?.muxPlaybackId ??
    (row.mux_playback_id != null ? String(row.mux_playback_id).trim() || null : null);

  return {
    ...media,
    muxPlaybackId,
  };
}

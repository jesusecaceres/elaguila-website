import {
  normalizeVariosDisplayMediaFromRow,
  type VariosDisplayMedia,
} from "@/app/lib/clasificados/en-venta/varios-display-normalizer";
import type { EnVentaAnuncioDTO } from "../types/enVentaListing.types";

export type EnVentaCardMediaVm = Omit<VariosDisplayMedia, "videoUrl"> & {
  videoUrl: string | null;
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
  const media = normalizeVariosDisplayMediaFromRow(row, dto);
  const muxPlaybackId =
    dto?.muxPlaybackId ??
    (row.mux_playback_id != null ? String(row.mux_playback_id).trim() || null : null);

  return {
    primaryImageUrl: media.primaryImageUrl,
    photoUrls: media.photoUrls,
    hasVideo: media.hasVideo,
    videoThumbnailUrl: media.videoThumbnailUrl,
    videoUrl: media.videoUrl ?? null,
    muxPlaybackId,
  };
}

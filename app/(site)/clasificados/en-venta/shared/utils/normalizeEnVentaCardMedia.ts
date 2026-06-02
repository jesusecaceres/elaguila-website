import type { EnVentaAnuncioDTO } from "../types/enVentaListing.types";
import { resolveEnVentaVideoUrl } from "./enVentaVideoEmbed";
import {
  resolveEnVentaHeroImageUrl,
  resolveEnVentaListingImageUrls,
} from "./resolveEnVentaListingImageUrls";

export type EnVentaCardMediaVm = {
  /** All uploaded photo URLs in display order (primary first). */
  photoUrls: string[];
  /** Card hero: primary photo, else first photo, else video thumbnail when no photos. */
  primaryImageUrl: string | null;
  hasVideo: boolean;
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
  const photoUrls = resolveEnVentaListingImageUrls(row);
  const muxPlaybackId =
    dto?.muxPlaybackId ??
    (row.mux_playback_id != null ? String(row.mux_playback_id).trim() || null : null);
  const rawDesc = String(row.description ?? "");
  const detailPairs = Array.isArray(row.detail_pairs)
    ? (row.detail_pairs as Array<{ label: string; value: string }>)
    : null;
  const videoUrl =
    dto?.listingVideoUrl ??
    resolveEnVentaVideoUrl({
      muxPlaybackId,
      description: rawDesc,
      detailPairs,
    });
  const hasVideo =
    dto?.hasListingVideo ??
    (Boolean(muxPlaybackId) ||
      /\bVideo:\s*https?:\/\//i.test(rawDesc) ||
      /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\b/i.test(rawDesc));

  const primaryImageUrl = resolveEnVentaHeroImageUrl(photoUrls, {
    muxPlaybackId,
    videoUrl,
  });

  return {
    photoUrls,
    primaryImageUrl,
    hasVideo,
    videoUrl,
    muxPlaybackId,
  };
}

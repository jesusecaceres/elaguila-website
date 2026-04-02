import type { AutoDealerListing } from "../types/autoDealerListing";

/**
 * Mux lifecycle (future — not invoked in draft/preview):
 * - On publish with local file: upload → muxAssetId + muxPlaybackId; serve playback from muxPlaybackId.
 * - On listing delete/unpublish: delete asset via muxAssetId.
 * Draft/preview must not upload or delete Mux assets.
 */

/** True if any playable/previewable video exists for the listing tile. */
export function hasListingVideo(data: AutoDealerListing): boolean {
  if (data.muxPlaybackId?.trim()) return true;
  if (data.videoFileDataUrl?.trim()) return true;
  if (data.videoUrl?.trim()) return true;
  return false;
}

/** Direct src for <video> — not for YouTube/Vimeo embeds (use external href instead). */
export function getListingVideoSrcForElement(data: AutoDealerListing): string | undefined {
  if (data.muxPlaybackId?.trim()) return undefined;
  const file = data.videoFileDataUrl?.trim();
  if (file) return file;
  const u = data.videoUrl?.trim();
  if (!u) return undefined;
  if (u.startsWith("data:")) return u;
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(u)) return undefined;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return undefined;
}

/** Open in new tab: external URL, Mux playback page, or normalized https. */
export function getListingVideoExternalHref(data: AutoDealerListing): string | undefined {
  const mux = data.muxPlaybackId?.trim();
  if (mux) return `https://stream.mux.com/${mux}`;
  const u = data.videoUrl?.trim();
  if (!u || u.startsWith("data:")) return undefined;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

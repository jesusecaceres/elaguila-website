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

/**
 * Direct src for `<video>`. Priority: local draft file > external URL.
 * YouTube/Vimeo URLs are not playable as `src`; use external href tile instead.
 */
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

/**
 * Open in new tab when `<video src>` is not used (e.g. YouTube/Vimeo).
 * Local draft file wins: if a file preview exists, do not fall back to `videoUrl`.
 */
export function getListingVideoExternalHref(data: AutoDealerListing): string | undefined {
  const mux = data.muxPlaybackId?.trim();
  if (mux) return `https://stream.mux.com/${mux}`;
  if (data.videoFileDataUrl?.trim()) return undefined;
  const u = data.videoUrl?.trim();
  if (!u || u.startsWith("data:")) return undefined;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

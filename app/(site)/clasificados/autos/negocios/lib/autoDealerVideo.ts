import type { AutoDealerListing } from "../types/autoDealerListing";

/**
 * Mux lifecycle:
 * - On publish with local file: client uploads → `muxAssetId` + `muxPlaybackId` persisted; serve HLS from `muxPlaybackId`.
 * - Draft/preview may use `videoFileDataUrl` locally; published/public surfaces must use `resolvePublishedAutosVideoPlayback` (no blob/data).
 */

export type PublishedAutosVideoMode = "mux-hls" | "progressive" | "external" | "none";

/** Published / public detail: durable playback inputs only (never blob, data:, or inline file bytes). */
export function resolvePublishedAutosVideoPlayback(data: AutoDealerListing): {
  mode: PublishedAutosVideoMode;
  /** HLS (.m3u8) or progressive https video for <video> */
  streamUrl?: string;
  /** YouTube/Vimeo or non-inline URL */
  externalHref?: string;
  posterUrl?: string;
} {
  const mux = data.muxPlaybackId?.trim();
  if (mux) {
    const hls = `https://stream.mux.com/${mux}.m3u8`;
    const thumb = data.muxThumbnailUrl?.trim();
    return { mode: "mux-hls", streamUrl: hls, posterUrl: thumb || undefined };
  }
  const u = data.videoUrl?.trim();
  if (!u || u.startsWith("blob:") || u.startsWith("data:")) return { mode: "none" };
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(u)) return { mode: "external", externalHref: u };
  if (u.startsWith("http://") || u.startsWith("https://")) {
    if (/\.m3u8(\?|$)/i.test(u)) return { mode: "mux-hls", streamUrl: u, posterUrl: data.muxThumbnailUrl?.trim() || undefined };
    return { mode: "progressive", streamUrl: u };
  }
  return { mode: "external", externalHref: `https://${u}` };
}

export function hasPublishedAutosListingVideo(data: AutoDealerListing): boolean {
  return resolvePublishedAutosVideoPlayback(data).mode !== "none";
}

/** True if any playable/previewable video exists for the listing tile (draft-safe). */
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

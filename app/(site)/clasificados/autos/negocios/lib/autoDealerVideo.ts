import type { AutoDealerListing } from "../types/autoDealerListing";
import {
  dedupeAutosVideoUrls,
  normalizeAutosExternalVideoUrl,
} from "@/app/lib/clasificados/autos/autosExternalVideoUrlValidation";

/**
 * Mux lifecycle (legacy):
 * - Published/public surfaces may still play durable Mux IDs from older listings.
 * - Autos publish forms use external `videoUrls` only; no new Mux uploads from publish forms.
 */

export type PublishedAutosVideoMode = "mux-hls" | "progressive" | "external" | "none";

export function getListingVideoUrls(data: AutoDealerListing): string[] {
  const fromArray = dedupeAutosVideoUrls(data.videoUrls ?? []);
  if (fromArray.length) return fromArray;
  const legacy = normalizeAutosExternalVideoUrl(data.videoUrl ?? "");
  return legacy ? [legacy] : [];
}

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
  const urls = getListingVideoUrls(data);
  const u = urls[0]?.trim();
  if (!u || u.startsWith("blob:") || u.startsWith("data:")) return { mode: "none" };
  if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|facebook\.com/i.test(u)) {
    return { mode: "external", externalHref: u };
  }
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
  return getListingVideoUrls(data).length > 0;
}

/**
 * Direct src for `<video>`. YouTube/Vimeo/TikTok/Instagram URLs are not playable as `src`.
 */
export function getListingVideoSrcForElement(data: AutoDealerListing): string | undefined {
  if (data.muxPlaybackId?.trim()) return undefined;
  const u = getListingVideoUrls(data)[0]?.trim();
  if (!u) return undefined;
  if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|facebook\.com/i.test(u)) return undefined;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return undefined;
}

/** Open in new tab when `<video src>` is not used (e.g. YouTube/Vimeo). */
export function getListingVideoExternalHref(data: AutoDealerListing): string | undefined {
  const mux = data.muxPlaybackId?.trim();
  if (mux) return `https://stream.mux.com/${mux}`;
  const u = getListingVideoUrls(data)[0]?.trim();
  if (!u || u.startsWith("data:")) return undefined;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

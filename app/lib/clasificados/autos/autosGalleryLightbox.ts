import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  getListingVideoUrls,
  resolvePublishedAutosVideoPlayback,
} from "@/app/clasificados/autos/negocios/lib/autoDealerVideo";
import { resolveAutosYoutubeEmbedUrl } from "./autosYoutubeEmbed";

export type AutosGalleryLightboxItem =
  | { kind: "photo"; src: string }
  | { kind: "youtube"; embedUrl: string; externalUrl: string }
  | { kind: "stream"; streamUrl: string; posterUrl?: string }
  | { kind: "external"; externalUrl: string };

function classifyPreviewVideo(url: string, posterUrl?: string): AutosGalleryLightboxItem | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return null;

  const youtubeEmbed = resolveAutosYoutubeEmbedUrl(trimmed);
  if (youtubeEmbed) {
    const externalUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return { kind: "youtube", embedUrl: youtubeEmbed, externalUrl };
  }

  if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|facebook\.com/i.test(trimmed)) {
    const externalUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return { kind: "external", externalUrl };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (/\.m3u8(\?|$)/i.test(trimmed)) {
      return { kind: "stream", streamUrl: trimmed, posterUrl };
    }
    return { kind: "stream", streamUrl: trimmed, posterUrl };
  }

  return { kind: "external", externalUrl: `https://${trimmed}` };
}

export function buildAutosGalleryLightboxItems(
  data: AutoDealerListing,
  imageUrls: string[],
  opts: { publicPlaybackOnly: boolean },
): AutosGalleryLightboxItem[] {
  const items: AutosGalleryLightboxItem[] = imageUrls.map((src) => ({ kind: "photo", src }));
  const posterUrl = imageUrls[0];

  if (opts.publicPlaybackOnly) {
    const pb = resolvePublishedAutosVideoPlayback(data);
    if (pb.mode === "mux-hls" || pb.mode === "progressive") {
      if (pb.streamUrl) items.push({ kind: "stream", streamUrl: pb.streamUrl, posterUrl: pb.posterUrl ?? posterUrl });
    } else if (pb.mode === "external" && pb.externalHref) {
      const classified = classifyPreviewVideo(pb.externalHref, pb.posterUrl ?? posterUrl);
      if (classified) items.push(classified);
    }
    return items;
  }

  const videoUrl = getListingVideoUrls(data)[0];
  if (!videoUrl && !data.muxPlaybackId?.trim()) return items;

  if (data.muxPlaybackId?.trim()) {
    const hls = `https://stream.mux.com/${data.muxPlaybackId.trim()}.m3u8`;
    items.push({
      kind: "stream",
      streamUrl: hls,
      posterUrl: data.muxThumbnailUrl?.trim() || posterUrl,
    });
    return items;
  }

  if (videoUrl) {
    const classified = classifyPreviewVideo(videoUrl, posterUrl);
    if (classified) items.push(classified);
  }

  return items;
}

export function firstAutosGalleryVideoIndex(items: AutosGalleryLightboxItem[]): number {
  return items.findIndex((item) => item.kind !== "photo");
}

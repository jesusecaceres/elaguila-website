import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  getListingVideoUrls,
} from "@/app/clasificados/autos/negocios/lib/autoDealerVideo";
import {
  AUTOS_MAX_EXTERNAL_VIDEO_URLS,
} from "@/app/lib/clasificados/autos/autosExternalVideoUrlValidation";
import { resolveAutosYoutubeEmbedUrl } from "./autosYoutubeEmbed";

export type AutosGalleryLightboxItem =
  | { kind: "photo"; src: string }
  | { kind: "youtube"; embedUrl: string; externalUrl: string; videoLabel?: string }
  | { kind: "stream"; streamUrl: string; posterUrl?: string; videoLabel?: string }
  | { kind: "external"; externalUrl: string; videoLabel?: string };

export type AutosGalleryVideoItem = Exclude<AutosGalleryLightboxItem, { kind: "photo" }>;

export type AutosGalleryMediaSets = {
  photoItems: Extract<AutosGalleryLightboxItem, { kind: "photo" }>[];
  videoItems: AutosGalleryVideoItem[];
  allItems: AutosGalleryLightboxItem[];
};

function classifyPreviewVideo(
  url: string,
  posterUrl: string | undefined,
  videoLabel: string,
): AutosGalleryVideoItem | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return null;

  const youtubeEmbed = resolveAutosYoutubeEmbedUrl(trimmed);
  if (youtubeEmbed) {
    const externalUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return { kind: "youtube", embedUrl: youtubeEmbed, externalUrl, videoLabel };
  }

  if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|facebook\.com/i.test(trimmed)) {
    const externalUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return { kind: "external", externalUrl, videoLabel };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return { kind: "stream", streamUrl: trimmed, posterUrl, videoLabel };
  }

  return { kind: "external", externalUrl: `https://${trimmed}`, videoLabel };
}

function buildAutosGalleryVideoItems(
  data: AutoDealerListing,
  posterUrl: string | undefined,
  opts: { publicPlaybackOnly: boolean },
): AutosGalleryVideoItem[] {
  const items: AutosGalleryVideoItem[] = [];

  if (data.muxPlaybackId?.trim()) {
    const hls = `https://stream.mux.com/${data.muxPlaybackId.trim()}.m3u8`;
    items.push({
      kind: "stream",
      streamUrl: hls,
      posterUrl: data.muxThumbnailUrl?.trim() || posterUrl,
      videoLabel: "Video 1",
    });
    return items;
  }

  const urls = getListingVideoUrls(data).slice(0, AUTOS_MAX_EXTERNAL_VIDEO_URLS);
  urls.forEach((url, index) => {
    if (opts.publicPlaybackOnly && (url.startsWith("blob:") || url.startsWith("data:"))) return;
    const classified = classifyPreviewVideo(url, posterUrl, `Video ${index + 1}`);
    if (classified) items.push(classified);
  });

  return items;
}

export function buildAutosGalleryMediaSets(
  data: AutoDealerListing,
  imageUrls: string[],
  opts: { publicPlaybackOnly: boolean },
): AutosGalleryMediaSets {
  const photoItems = imageUrls.map((src) => ({ kind: "photo" as const, src }));
  const posterUrl = imageUrls[0];
  const videoItems = buildAutosGalleryVideoItems(data, posterUrl, opts);
  return {
    photoItems,
    videoItems,
    allItems: [...photoItems, ...videoItems],
  };
}

/** @deprecated Prefer `buildAutosGalleryMediaSets` for tab-filtered galleries. */
export function buildAutosGalleryLightboxItems(
  data: AutoDealerListing,
  imageUrls: string[],
  opts: { publicPlaybackOnly: boolean },
): AutosGalleryLightboxItem[] {
  return buildAutosGalleryMediaSets(data, imageUrls, opts).allItems;
}

export function firstAutosGalleryVideoIndex(items: AutosGalleryLightboxItem[]): number {
  return items.findIndex((item) => item.kind !== "photo");
}

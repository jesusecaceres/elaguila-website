import type { AutoDealerListing, MediaImageEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { dedupeAutosVideoUrls } from "@/app/lib/clasificados/autos/autosExternalVideoUrlValidation";

/** Keep JSON payload under typical serverless body limits; inline data URLs belong in blob/Mux flows. */
const MAX_INLINE_DATA_URL_CHARS = 100_000;

function isOversizedDataUrl(value: string | null | undefined): boolean {
  const v = value?.trim() ?? "";
  return v.startsWith("data:") && v.length > MAX_INLINE_DATA_URL_CHARS;
}

function pruneMediaImages(images: MediaImageEntry[] | undefined, warnings: string[]): MediaImageEntry[] | undefined {
  if (!images?.length) return images;
  const next = images.filter((img) => {
    const u = img.url ?? "";
    if (isOversizedDataUrl(u)) {
      warnings.push("media_image_oversized_data_url_dropped");
      return false;
    }
    return true;
  });
  return next.length === images.length ? images : next;
}

/**
 * Shapes listing JSON for DB persistence: drops draft-only giant blobs and oversized data URLs.
 * Required fields (price, text, etc.) are untouched; optional heavy media is removed instead of failing the write.
 */
function isNonDurableVideoUrl(value: string | null | undefined): boolean {
  const v = value?.trim() ?? "";
  return v.startsWith("blob:") || v.startsWith("data:");
}

export function sanitizeAutosListingPayloadForPersistence(listing: AutoDealerListing): {
  listing: AutoDealerListing;
  persistWarnings: string[];
} {
  const persistWarnings: string[] = [];
  let L: AutoDealerListing = { ...listing };

  if (L.videoFileDataUrl && String(L.videoFileDataUrl).length > 0) {
    persistWarnings.push("video_file_data_url_stripped_for_persistence");
    L = {
      ...L,
      videoFileDataUrl: undefined,
      videoFileName: undefined,
      videoSourceType: L.videoUrls?.length ? "url" : null,
      videoUploadStatus: L.videoUrls?.length ? "local_preview" : null,
    };
  }

  L = {
    ...L,
    videoUrls: dedupeAutosVideoUrls(L.videoUrls ?? []),
    videoUrl: dedupeAutosVideoUrls(L.videoUrls ?? [])[0] ?? (L.videoUrl?.trim() && !isNonDurableVideoUrl(L.videoUrl) ? L.videoUrl.trim() : undefined),
  };

  const vu = L.videoUrl?.trim() ?? "";
  if (vu && isNonDurableVideoUrl(vu)) {
    persistWarnings.push("video_url_non_durable_stripped");
    L = { ...L, videoUrl: undefined, videoSourceType: null };
  }

  if (isOversizedDataUrl(L.dealerLogo ?? undefined)) {
    persistWarnings.push("dealer_logo_oversized_data_url_dropped");
    L = { ...L, dealerLogo: undefined };
  }

  const prunedMedia = pruneMediaImages(L.mediaImages, persistWarnings);
  if (prunedMedia !== undefined && prunedMedia !== L.mediaImages) {
    L = { ...L, mediaImages: prunedMedia };
  }

  return { listing: L, persistWarnings };
}

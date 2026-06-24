import type { AutoDealerListing, MediaImageEntry } from "@/app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import {
  deriveHeroImageUrls,
  migrateHeroImagesToMediaImages,
  normalizeMediaImagesOrder,
} from "@/app/(site)/clasificados/autos/negocios/lib/autoDealerHeroImages";
import {
  dedupeAutosVideoUrls,
  migrateLegacyAutosVideoUrl,
} from "@/app/lib/clasificados/autos/autosExternalVideoUrlValidation";

/** Media + external video fields shared by main Negocios vehicle and additional inventory children. */
export type AutosVehicleMediaDraftFields = Pick<
  AutoDealerListing,
  | "mediaImages"
  | "heroImages"
  | "videoUrls"
  | "videoUrl"
  | "videoSourceType"
  | "videoFileDataUrl"
  | "videoFileName"
  | "videoUploadStatus"
>;

function mediaEntryId(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

function mediaEntryUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw;
}

function stringUrlsToMediaImageEntries(raw: unknown): MediaImageEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: MediaImageEntry[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !item.trim()) continue;
    out.push({
      id: `image-url-${out.length}`,
      url: item.trim(),
      sourceType: "url",
      isPrimary: out.length === 0,
      sortOrder: out.length,
    });
  }
  return normalizeMediaImagesOrder(out);
}

/** Coerce persisted/in-memory gallery rows (URL, data URL, or IDB ref) without dropping valid entries. */
export function coerceAutosVehicleMediaImageEntries(raw: unknown): MediaImageEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: MediaImageEntry[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push({
        id: `image-url-${out.length}`,
        url: item.trim(),
        sourceType: "url",
        isPrimary: out.length === 0,
        sortOrder: out.length,
      });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    const url = mediaEntryUrl(m.url);
    if (!url) continue;
    const id = mediaEntryId(m.id) ?? `media-row-${out.length}`;
    out.push({
      id,
      url,
      sourceType: m.sourceType === "file" ? "file" : "url",
      isPrimary: m.isPrimary === true,
      sortOrder: typeof m.sortOrder === "number" && Number.isFinite(m.sortOrder) ? m.sortOrder : out.length,
    });
  }
  return normalizeMediaImagesOrder(out);
}

/**
 * Map saved-child / session / API alias fields onto canonical mediaImages + videoUrls
 * before editor hydrate or save normalization.
 */
export function expandAutosVehicleMediaSourceFields(
  raw: (Partial<AutoDealerListing> & Record<string, unknown>) | null | undefined,
): Partial<AutoDealerListing> & Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<AutoDealerListing> & Record<string, unknown> = { ...raw };

  const canonicalImages = coerceAutosVehicleMediaImageEntries(raw.mediaImages);
  const aliasPhotos = canonicalImages.length ? [] : coerceAutosVehicleMediaImageEntries(raw.photos);
  const aliasImageUrls = canonicalImages.length || aliasPhotos.length ? [] : stringUrlsToMediaImageEntries(raw.imageUrls);
  const resolvedImages = canonicalImages.length ? canonicalImages : aliasPhotos.length ? aliasPhotos : aliasImageUrls;
  if (resolvedImages.length) {
    out.mediaImages = resolvedImages;
  }

  const canonicalVideos = dedupeAutosVideoUrls(
    migrateLegacyAutosVideoUrl(
      Array.isArray(raw.videoUrls) ? raw.videoUrls.filter((x): x is string => typeof x === "string") : undefined,
      typeof raw.videoUrl === "string" ? raw.videoUrl : undefined,
    ),
  );
  const aliasVideos = canonicalVideos.length
    ? []
    : dedupeAutosVideoUrls(
        migrateLegacyAutosVideoUrl(
          Array.isArray(raw.videoLinks) ? raw.videoLinks.filter((x): x is string => typeof x === "string") : undefined,
          undefined,
        ),
      );
  const resolvedVideos = canonicalVideos.length ? canonicalVideos : aliasVideos;
  if (resolvedVideos.length) {
    out.videoUrls = resolvedVideos;
    out.videoUrl = resolvedVideos[0];
  }

  return out;
}

/**
 * Single normalization path for main vehicle + additional inventory child media/video draft fields.
 * Matches main `normalizeLoadedListing` media/video behavior without dealer-only fields.
 */
export function normalizeAutosVehicleMediaDraft(
  raw: Partial<AutoDealerListing> | null | undefined,
): AutosVehicleMediaDraftFields {
  const expanded = expandAutosVehicleMediaSourceFields(raw as (Partial<AutoDealerListing> & Record<string, unknown>) | null | undefined);
  const baseImages = coerceAutosVehicleMediaImageEntries(expanded.mediaImages);
  const legacyHero = Array.isArray(expanded.heroImages)
    ? expanded.heroImages!.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const mediaImages =
    baseImages.length > 0
      ? baseImages
      : legacyHero.length > 0
        ? migrateHeroImagesToMediaImages(legacyHero)
        : [];

  const videoUrls = dedupeAutosVideoUrls(
    migrateLegacyAutosVideoUrl(
      Array.isArray(expanded.videoUrls) ? expanded.videoUrls!.filter((x): x is string => typeof x === "string") : undefined,
      typeof expanded.videoUrl === "string" ? expanded.videoUrl : undefined,
    ),
  );

  const slice: AutoDealerListing = {
    autosLane: "negocios",
    mediaImages,
    heroImages: [],
    videoUrls,
    videoUrl: videoUrls[0],
    videoSourceType: videoUrls.length ? "url" : null,
    videoUploadStatus: videoUrls.length ? "local_preview" : null,
    videoFileDataUrl: undefined,
    videoFileName: undefined,
  };

  return {
    mediaImages,
    heroImages: deriveHeroImageUrls(slice),
    videoUrls,
    videoUrl: videoUrls[0],
    videoSourceType: videoUrls.length ? "url" : null,
    videoUploadStatus: videoUrls.length ? "local_preview" : null,
    videoFileDataUrl: undefined,
    videoFileName: undefined,
  };
}

/** Apply shared media/video normalization onto a listing-shaped object in place. */
export function applyAutosVehicleMediaDraftFields(
  target: AutoDealerListing,
  raw: Partial<AutoDealerListing> | null | undefined,
): void {
  const media = normalizeAutosVehicleMediaDraft(raw ?? target);
  target.mediaImages = media.mediaImages;
  target.heroImages = media.heroImages;
  target.videoUrls = media.videoUrls;
  target.videoUrl = media.videoUrl;
  target.videoSourceType = media.videoSourceType;
  target.videoUploadStatus = media.videoUploadStatus;
  target.videoFileDataUrl = media.videoFileDataUrl;
  target.videoFileName = media.videoFileName;
}

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

/** Coerce persisted/in-memory gallery rows (URL, data URL, or IDB ref) without dropping valid entries. */
export function coerceAutosVehicleMediaImageEntries(raw: unknown): MediaImageEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: MediaImageEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    const id = mediaEntryId(m.id);
    const url = mediaEntryUrl(m.url);
    if (!id || !url) continue;
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
 * Single normalization path for main vehicle + additional inventory child media/video draft fields.
 * Matches main `normalizeLoadedListing` media/video behavior without dealer-only fields.
 */
export function normalizeAutosVehicleMediaDraft(
  raw: Partial<AutoDealerListing> | null | undefined,
): AutosVehicleMediaDraftFields {
  const baseImages = coerceAutosVehicleMediaImageEntries(raw?.mediaImages);
  const legacyHero = Array.isArray(raw?.heroImages)
    ? raw!.heroImages!.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const mediaImages =
    baseImages.length > 0
      ? baseImages
      : legacyHero.length > 0
        ? migrateHeroImagesToMediaImages(legacyHero)
        : [];

  const videoUrls = dedupeAutosVideoUrls(
    migrateLegacyAutosVideoUrl(
      Array.isArray(raw?.videoUrls) ? raw!.videoUrls!.filter((x): x is string => typeof x === "string") : undefined,
      typeof raw?.videoUrl === "string" ? raw.videoUrl : undefined,
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

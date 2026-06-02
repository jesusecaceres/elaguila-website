import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import {
  EN_VENTA_PREVIEW_MAX_PHOTOS,
  getOrderedEnVentaImageUrls,
} from "@/app/clasificados/en-venta/preview/buildEnVentaPreviewModel";
import type { EnVentaAnuncioDTO } from "@/app/clasificados/en-venta/shared/types/enVentaListing.types";
import { resolveEnVentaVideoUrl } from "@/app/clasificados/en-venta/shared/utils/enVentaVideoEmbed";
import {
  resolveEnVentaHeroImageUrl,
  resolveEnVentaListingImageUrls,
  resolveEnVentaVideoThumbnailUrl,
} from "@/app/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls";

export type VariosDisplayMedia = {
  primaryImageUrl?: string;
  photoUrls: string[];
  hasVideo: boolean;
  videoUrl?: string;
  videoThumbnailUrl?: string;
};

export type VariosGalleryViewProps = {
  orderedImages: string[];
  videoUrl: string | null;
  showVideo: boolean;
  photoCountLabel: string;
  lang: "es" | "en";
  plan: "free" | "pro";
};

function pairsFromRow(row: Record<string, unknown>): Array<{ label: string; value: string }> {
  const dp = row.detail_pairs;
  if (!Array.isArray(dp)) return [];
  return dp
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as { label?: string; value?: string };
      if (!o.label || !o.value) return null;
      return { label: String(o.label), value: String(o.value) };
    })
    .filter((x): x is { label: string; value: string } => x != null);
}

function listingHasVideo(description: string): boolean {
  return /\bVideo:\s*https?:\/\//i.test(description) || /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\b/i.test(description);
}

function rowHasMuxVideo(row: Record<string, unknown>): boolean {
  const p1 = String(row.mux_playback_id ?? "").trim();
  const p2 = String(row.mux_playback_id_2 ?? "").trim();
  return Boolean(p1 || p2);
}

/** Published plan tier — same rules as browse DTO mapper. */
export function resolveVariosPlanFromRow(row: Record<string, unknown>): "free" | "pro" {
  const rawDesc = String(row.description ?? "");
  for (const p of pairsFromRow(row)) {
    if (p.label === "Leonix:plan") {
      const v = p.value.trim().toLowerCase();
      if (v === "pro") return "pro";
      if (v === "free") return "free";
    }
  }
  const rt = String(row.rentas_tier ?? "").trim().toLowerCase();
  if (rt === "pro" || rt === "plus") return "pro";
  if (rowHasMuxVideo(row)) return "pro";
  if (listingHasVideo(rawDesc)) return "pro";
  return "free";
}

export function resolveVariosPlanFromDetailPairs(
  detailPairs: Array<{ label: string; value: string }> | null | undefined,
  opts?: { muxPlaybackId?: string | null; description?: string }
): "free" | "pro" {
  for (const p of detailPairs ?? []) {
    if (p.label === "Leonix:plan") {
      const v = p.value.trim().toLowerCase();
      if (v === "pro") return "pro";
      if (v === "free") return "free";
    }
  }
  if (opts?.muxPlaybackId?.trim()) return "pro";
  if (opts?.description && listingHasVideo(opts.description)) return "pro";
  return "free";
}

/**
 * Canonical Varios media for cards, public detail, and browse — published row first.
 */
export function normalizeVariosDisplayMediaFromRow(
  row: Record<string, unknown>,
  dto?: Pick<EnVentaAnuncioDTO, "hasListingVideo" | "listingVideoUrl" | "muxPlaybackId">
): VariosDisplayMedia {
  const photoUrls = resolveEnVentaListingImageUrls(row);
  const muxPlaybackId =
    dto?.muxPlaybackId ??
    (row.mux_playback_id != null ? String(row.mux_playback_id).trim() || null : null);
  const rawDesc = String(row.description ?? "");
  const detailPairs = pairsFromRow(row);
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
  const videoThumbnailUrl =
    resolveEnVentaVideoThumbnailUrl({
      muxPlaybackId,
      videoUrl,
    }) ?? undefined;
  const primaryImageUrl =
    resolveEnVentaHeroImageUrl(photoUrls, {
      muxPlaybackId,
      videoUrl,
    }) ?? undefined;

  return {
    primaryImageUrl,
    photoUrls,
    hasVideo,
    videoUrl: videoUrl ?? undefined,
    videoThumbnailUrl,
  };
}

/** Preview / draft media — same field order as publish form. */
export function normalizeVariosDisplayMediaFromDraft(
  state: EnVentaFreeApplicationState,
  plan: "free" | "pro"
): VariosDisplayMedia {
  const maxPhotos = plan === "pro" ? EN_VENTA_PREVIEW_MAX_PHOTOS.pro : EN_VENTA_PREVIEW_MAX_PHOTOS.free;
  const photoUrls = getOrderedEnVentaImageUrls(state).slice(0, maxPhotos);
  const slot = state.listingVideoSlots?.[0];
  const videoUrl =
    resolveEnVentaVideoUrl({
      muxPlaybackId: slot?.playbackId ?? null,
      muxPlaybackUrl: slot?.playbackUrl ?? null,
      externalUrl: state.listingVideoUrl?.trim() || null,
    }) ?? undefined;
  const hasVideo = plan === "pro" && Boolean(videoUrl);
  const videoThumbnailUrl =
    resolveEnVentaVideoThumbnailUrl({
      muxPlaybackId: slot?.playbackId ?? null,
      muxThumbnailUrl: slot?.thumbnailUrl ?? null,
      videoUrl: videoUrl ?? null,
    }) ?? undefined;
  const primaryImageUrl =
    resolveEnVentaHeroImageUrl(photoUrls, {
      muxPlaybackId: slot?.playbackId ?? null,
      muxThumbnailUrl: slot?.thumbnailUrl ?? null,
      videoUrl: videoUrl ?? null,
    }) ?? undefined;

  return { primaryImageUrl, photoUrls, hasVideo, videoUrl, videoThumbnailUrl };
}

export function buildVariosPhotoCountLabel(
  count: number,
  maxPhotos: number,
  lang: "es" | "en"
): string {
  if (lang === "es") {
    return count === 1 ? "1 foto" : `${count} de ${maxPhotos} fotos`;
  }
  return count === 1 ? "1 photo" : `${count} of ${maxPhotos} photos`;
}

/** Props for the approved preview gallery component on preview + published detail. */
export function buildVariosGalleryViewProps(
  media: VariosDisplayMedia,
  lang: "es" | "en",
  plan: "free" | "pro"
): VariosGalleryViewProps {
  const maxPhotos = plan === "pro" ? EN_VENTA_PREVIEW_MAX_PHOTOS.pro : EN_VENTA_PREVIEW_MAX_PHOTOS.free;
  const orderedImages = media.photoUrls.slice(0, maxPhotos);
  return {
    orderedImages,
    videoUrl: media.videoUrl ?? null,
    showVideo: plan === "pro" && media.hasVideo && Boolean(media.videoUrl),
    photoCountLabel: buildVariosPhotoCountLabel(orderedImages.length, maxPhotos, lang),
    lang,
    plan,
  };
}

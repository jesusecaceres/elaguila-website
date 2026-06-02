import {
  EN_VENTA_PREVIEW_MAX_PHOTOS,
} from "../../preview/buildEnVentaPreviewModel";
import type { EnVentaAnuncioDTO } from "../types/enVentaListing.types";
import {
  resolveEnVentaHeroImageUrl,
  resolveEnVentaListingImageUrls,
  resolveEnVentaVideoThumbnailUrl,
} from "./resolveEnVentaListingImageUrls";
import { resolveEnVentaVideoUrl } from "./enVentaVideoEmbed";

export type EnVentaPublishedMedia = {
  primaryImageUrl: string | null;
  photoUrls: string[];
  hasVideo: boolean;
  videoUrl: string | null;
  videoThumbnailUrl: string | null;
};

function pairsFromRow(row: Record<string, unknown>): Array<{ label: string; value: string }> {
  const dp = row.detail_pairs;
  if (!Array.isArray(dp)) return [];
  return dp
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as { label?: string; value?: string };
      if (!o.label) return null;
      return { label: String(o.label), value: String(o.value ?? "") };
    })
    .filter((x): x is { label: string; value: string } => x != null);
}

/**
 * Build the listings row shape used by photo/video resolvers for cards + public detail.
 * Prefer the raw published row; merge DTO fields when the row is partial.
 */
export function buildEnVentaPublishedMediaRow(
  publishedSourceRow: Record<string, unknown> | null | undefined,
  dto?: Partial<
    Pick<EnVentaAnuncioDTO, "description" | "muxPlaybackId" | "listingVideoUrl" | "hasListingVideo">
  > & {
    images?: string[] | null;
    detailPairs?: Array<{ label: string; value: string }> | null;
    listingJson?: unknown;
  }
): Record<string, unknown> {
  if (publishedSourceRow) {
    return {
      ...publishedSourceRow,
      description: publishedSourceRow.description ?? dto?.description ?? "",
      images: publishedSourceRow.images ?? dto?.images ?? null,
      listing_json: publishedSourceRow.listing_json ?? dto?.listingJson ?? null,
      mux_playback_id: publishedSourceRow.mux_playback_id ?? dto?.muxPlaybackId ?? null,
      detail_pairs: publishedSourceRow.detail_pairs ?? dto?.detailPairs ?? null,
    };
  }
  return {
    description: dto?.description ?? "",
    images: dto?.images ?? null,
    listing_json: dto?.listingJson ?? null,
    mux_playback_id: dto?.muxPlaybackId ?? null,
    detail_pairs: dto?.detailPairs ?? null,
  };
}

/** Canonical published En Venta media — same resolver chain as preview photo order. */
export function normalizeEnVentaPublishedMedia(
  row: Record<string, unknown>,
  dto?: Pick<EnVentaAnuncioDTO, "hasListingVideo" | "listingVideoUrl" | "muxPlaybackId">
): EnVentaPublishedMedia {
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
  const videoThumbnailUrl = resolveEnVentaVideoThumbnailUrl({ muxPlaybackId, videoUrl });
  const primaryImageUrl = resolveEnVentaHeroImageUrl(photoUrls, { muxPlaybackId, videoUrl });

  return {
    primaryImageUrl,
    photoUrls,
    hasVideo,
    videoUrl,
    videoThumbnailUrl,
  };
}

function listingHasVideo(description: string): boolean {
  return /\bVideo:\s*https?:\/\//i.test(description) || /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\b/i.test(description);
}

function rowHasMuxVideo(row: Record<string, unknown>): boolean {
  const p1 = String(row.mux_playback_id ?? "").trim();
  const p2 = String(row.mux_playback_id_2 ?? "").trim();
  return Boolean(p1 || p2);
}

export function resolveEnVentaPlanFromRow(row: Record<string, unknown>): "free" | "pro" {
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

export function resolveEnVentaPlanFromDetailPairs(
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

export function buildEnVentaPhotoCountLabel(count: number, maxPhotos: number, lang: "es" | "en"): string {
  if (lang === "es") {
    return count === 1 ? "1 foto" : `${count} de ${maxPhotos} fotos`;
  }
  return count === 1 ? "1 photo" : `${count} of ${maxPhotos} photos`;
}

export type EnVentaGalleryViewProps = {
  orderedImages: string[];
  videoUrl: string | null;
  showVideo: boolean;
  photoCountLabel: string;
  lang: "es" | "en";
  plan: "free" | "pro";
};

export function buildEnVentaGalleryViewProps(
  media: EnVentaPublishedMedia,
  lang: "es" | "en",
  plan: "free" | "pro"
): EnVentaGalleryViewProps {
  const maxPhotos = plan === "pro" ? EN_VENTA_PREVIEW_MAX_PHOTOS.pro : EN_VENTA_PREVIEW_MAX_PHOTOS.free;
  const orderedImages = media.photoUrls.slice(0, maxPhotos);
  return {
    orderedImages,
    videoUrl: media.videoUrl,
    showVideo: plan === "pro" && media.hasVideo && Boolean(media.videoUrl),
    photoCountLabel: buildEnVentaPhotoCountLabel(orderedImages.length, maxPhotos, lang),
    lang,
    plan,
  };
}

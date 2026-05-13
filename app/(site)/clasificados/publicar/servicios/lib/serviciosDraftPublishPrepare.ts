"use client";

import type { ClasificadosServiciosApplicationState, ServiciosLang } from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import { compressServiciosImageBlobForUpload } from "./compressServiciosImage";
import { inlineServiciosHeavyMediaFromIdb } from "./clasificadosServiciosDraftMedia";
import { SERVICIOS_DRAFT_MEDIA_NAMESPACE } from "./clasificadosServiciosStorage";
import { isServiciosPublishableRemoteMediaUrl, isServiciosLocalOrTransportBlockedRef } from "./serviciosMediaTransport";
import { parseServiciosDraftMediaUploadResult } from "./serviciosDraftUploadParse";
import { SERVICIOS_DRAFT_MEDIA_MAX_BYTES, shouldSkipServiciosOversizedDraftVideo } from "./serviciosVideoDraftGate";
import { uploadServiciosGalleryVideoFileToMux } from "./serviciosMuxVideoClient";

const PUBLISH_BLOB_NS_KEY = "leonix.servicios.publishDraftBlobNs";

/** Align with route limit + small multipart overhead. */
const ROUTE_MAX_UPLOAD_BYTES = SERVICIOS_DRAFT_MEDIA_MAX_BYTES;

export type ServiciosDraftMediaResolveResult = {
  state: ClasificadosServiciosApplicationState;
  /** True when at least one optional video was omitted because it exceeded the draft upload cap. */
  skippedOversizedVideos: boolean;
  /** Non-user-facing: Mux/blob failures for optional gallery videos (merged into listing `opsMeta` on publish). */
  videoPublishDiagnostics?: { videoId: string; reason: string }[];
};

export function getServiciosPublishDraftListingId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let v = sessionStorage.getItem(PUBLISH_BLOB_NS_KEY);
    if (!v) {
      v = `sv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(PUBLISH_BLOB_NS_KEY, v);
    }
    return v;
  } catch {
    return `sv-fallback-${Date.now()}`;
  }
}

const SLOTS = new Set([
  "logo",
  "cover",
  "gallery",
  "video",
  "promoImage",
  "promoPdf",
  "licenseDoc",
  "insuranceDoc",
]);

async function prepareBlobForServiciosDraftUpload(blob: Blob, ctx: { slot: string; index?: number }): Promise<Blob> {
  const mime = (blob.type || "").toLowerCase();
  const originalKb = blob.size / 1024;

  if (mime.startsWith("image/")) {
    let next: Blob;
    try {
      next = await compressServiciosImageBlobForUpload(blob);
    } catch (e) {
      if (e instanceof Error && e.message === "image_too_large_after_compression") {
        throw e;
      }
      throw e;
    }
    const compressedKb = next.size / 1024;
    if (process.env.NODE_ENV === "development") {
      console.log("[servicios draft upload] image prepared", {
        slot: ctx.slot,
        originalKb: originalKb.toFixed(1),
        compressedKb: compressedKb.toFixed(1),
        mime: mime || "image/*",
      });
    }
    if (next.size > ROUTE_MAX_UPLOAD_BYTES) {
      throw new Error("image_too_large_after_compression");
    }
    return next;
  }

  if (mime.startsWith("video/") || mime === "application/pdf") {
    if (blob.size > ROUTE_MAX_UPLOAD_BYTES) {
      throw new Error("file_too_large_for_upload");
    }
    return blob;
  }

  if (blob.size > ROUTE_MAX_UPLOAD_BYTES) {
    throw new Error("file_too_large_for_upload");
  }
  return blob;
}

async function uploadBlobForDraft(
  blob: Blob,
  ctx: { draftListingId: string; slot: string; index?: number },
): Promise<string> {
  if (!SLOTS.has(ctx.slot)) throw new Error(`bad_slot:${ctx.slot}`);

  const prepared = await prepareBlobForServiciosDraftUpload(blob, ctx);

  const form = new FormData();
  form.set("draftListingId", ctx.draftListingId);
  form.set("slot", ctx.slot);
  if (ctx.index !== undefined) form.set("index", String(ctx.index));
  const mime = prepared.type || "image/jpeg";
  const ext =
    mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("pdf") ? "pdf" : mime.includes("webm") ? "webm" : "jpg";
  form.set("file", prepared, `upload.${ext}`);

  const res = await fetch("/api/clasificados/servicios/draft-media-upload", {
    method: "POST",
    body: form,
  });

  const raw = await res.text();
  const parsed = parseServiciosDraftMediaUploadResult(res.status, res.headers.get("content-type"), raw);

  if (!parsed.ok || !parsed.publicUrl) {
    if (parsed.error === "media_upload_payload_too_large") {
      throw new Error("media_upload_payload_too_large");
    }
    const msg = [parsed.error, parsed.detail].filter(Boolean).join(": ") || `upload_http_${res.status}`;
    throw new Error(msg);
  }
  return parsed.publicUrl;
}

async function uploadUrlIfNeeded(
  url: string,
  ctx: { draftListingId: string; slot: string; index?: number },
): Promise<string> {
  const t = url.trim();
  if (!t) return t;
  if (isServiciosPublishableRemoteMediaUrl(t)) return t;
  if (!isServiciosLocalOrTransportBlockedRef(t)) return t;

  const res = await fetch(t);
  const blob = await res.blob();
  if (!blob || blob.size < 1) throw new Error("empty_blob_after_fetch");
  return uploadBlobForDraft(blob, ctx);
}

/**
 * Expand IDB placeholders to data URLs, then replace data:/blob: media with Vercel Blob HTTPS URLs
 * so `POST /api/clasificados/servicios/publish` stays under platform limits.
 *
 * Optional videos larger than {@link SERVICIOS_DRAFT_MEDIA_MAX_BYTES} are dropped (empty URL) and
 * reported via `skippedOversizedVideos` so the UI can show a non-blocking notice after publish.
 */
export async function resolveServiciosDraftMediaToRemoteUrls(
  state: ClasificadosServiciosApplicationState,
  lang: ServiciosLang = "es",
): Promise<ServiciosDraftMediaResolveResult> {
  const draftListingId = getServiciosPublishDraftListingId();
  let skippedOversizedVideos = false;
  const videoPublishDiagnostics: { videoId: string; reason: string }[] = [];
  let working = normalizeClasificadosServiciosApplicationState(state);
  try {
    working = await inlineServiciosHeavyMediaFromIdb(SERVICIOS_DRAFT_MEDIA_NAMESPACE, working);
  } catch {
    working = normalizeClasificadosServiciosApplicationState(working);
  }
  working = normalizeClasificadosServiciosApplicationState(working);

  let logoUrl = working.logoUrl;
  if (logoUrl.trim() && !isServiciosPublishableRemoteMediaUrl(logoUrl)) {
    logoUrl = await uploadUrlIfNeeded(logoUrl, { draftListingId, slot: "logo" });
  }

  let coverUrl = working.coverUrl;
  if (coverUrl.trim() && !isServiciosPublishableRemoteMediaUrl(coverUrl)) {
    coverUrl = await uploadUrlIfNeeded(coverUrl, { draftListingId, slot: "cover" });
  }

  const gallery = await Promise.all(
    (working.gallery ?? []).map(async (g, i) => {
      const u = g.url;
      if (!u.trim() || isServiciosPublishableRemoteMediaUrl(u)) return g;
      const next = await uploadUrlIfNeeded(u, { draftListingId, slot: "gallery", index: i });
      return { ...g, url: next, source: g.source };
    }),
  );

  const videos = await Promise.all(
    (working.videos ?? []).map(async (v, i) => {
      const u = v.url;
      const t = u.trim();
      if (!t) return v;
      const muxPid = typeof (v as { muxPlaybackId?: string }).muxPlaybackId === "string" ? (v as { muxPlaybackId?: string }).muxPlaybackId!.trim() : "";
      if (muxPid && /^[a-zA-Z0-9_-]{8,200}$/.test(muxPid)) {
        const playbackUrl = `https://stream.mux.com/${muxPid}.m3u8`;
        const thumb =
          typeof (v as { muxThumbnailUrl?: string }).muxThumbnailUrl === "string"
            ? (v as { muxThumbnailUrl?: string }).muxThumbnailUrl!.trim()
            : `https://image.mux.com/${muxPid}/thumbnail.jpg`;
        return {
          ...v,
          url: playbackUrl,
          muxPlaybackId: muxPid,
          muxAssetId: typeof (v as { muxAssetId?: string }).muxAssetId === "string" ? (v as { muxAssetId?: string }).muxAssetId!.trim() : undefined,
          muxThumbnailUrl: thumb,
          source: v.source,
        };
      }
      if (isServiciosPublishableRemoteMediaUrl(t)) return v;
      if (!isServiciosLocalOrTransportBlockedRef(t)) return v;
      const res = await fetch(t);
      const blob = await res.blob();
      if (!blob || blob.size < 1) throw new Error("empty_blob_after_fetch");
      const mime = (blob.type || "").toLowerCase();
      const isVideo = mime.startsWith("video/") || /^data:video\//i.test(t);

      if (isVideo) {
        const file = new File([blob], `servicios-gallery-${i}.mp4`, { type: blob.type || "video/mp4" });
        const slot = (i >= 1 ? 1 : 0) as 0 | 1;
        const mux = await uploadServiciosGalleryVideoFileToMux(file, slot, lang);
        if (mux.ok) {
          return {
            ...v,
            url: mux.playbackUrl,
            muxPlaybackId: mux.playbackId,
            muxAssetId: mux.assetId,
            muxThumbnailUrl: mux.thumbnailUrl || `https://image.mux.com/${mux.playbackId}/thumbnail.jpg`,
            source: v.source,
          };
        }
        if (blob.size <= ROUTE_MAX_UPLOAD_BYTES) {
          try {
            const next = await uploadBlobForDraft(blob, { draftListingId, slot: "video", index: i });
            return { ...v, url: next, source: v.source };
          } catch {
            /* fall through */
          }
        }
        if (shouldSkipServiciosOversizedDraftVideo({ mimeType: mime, byteLength: blob.size, urlHint: t })) {
          skippedOversizedVideos = true;
        }
        videoPublishDiagnostics.push({ videoId: v.id, reason: mux.error.slice(0, 400) });
        return {
          ...v,
          url: "",
          source: v.source,
          muxSkipReason: mux.error.slice(0, 480),
        };
      }

      if (shouldSkipServiciosOversizedDraftVideo({ mimeType: mime, byteLength: blob.size, urlHint: t })) {
        skippedOversizedVideos = true;
        videoPublishDiagnostics.push({
          videoId: v.id,
          reason:
            lang === "en"
              ? "attachment_in_videos_slot_exceeds_blob_fallback_limit"
              : "adjunto_en_videos_supera_limite_blob",
        });
        return { ...v, url: "", source: v.source };
      }
      const next = await uploadBlobForDraft(blob, { draftListingId, slot: "video", index: i });
      return { ...v, url: next, source: v.source };
    }),
  );

  const promotions = await Promise.all(
    (working.promotions ?? []).map(async (row, i) => {
      let imageUrl = row.imageUrl;
      if (imageUrl.trim() && !isServiciosPublishableRemoteMediaUrl(imageUrl)) {
        imageUrl = await uploadUrlIfNeeded(imageUrl, { draftListingId, slot: "promoImage", index: i });
      }
      let pdfUrl = row.pdfUrl;
      if (pdfUrl.trim() && !isServiciosPublishableRemoteMediaUrl(pdfUrl)) {
        pdfUrl = await uploadUrlIfNeeded(pdfUrl, { draftListingId, slot: "promoPdf", index: i });
      }
      return { ...row, imageUrl, pdfUrl };
    }),
  );

  let licenseDocumentUrl = working.licenseDocumentUrl;
  if (licenseDocumentUrl.trim() && !isServiciosPublishableRemoteMediaUrl(licenseDocumentUrl)) {
    licenseDocumentUrl = await uploadUrlIfNeeded(licenseDocumentUrl, { draftListingId, slot: "licenseDoc" });
  }

  let insuranceDocumentUrl = working.insuranceDocumentUrl;
  if (insuranceDocumentUrl.trim() && !isServiciosPublishableRemoteMediaUrl(insuranceDocumentUrl)) {
    insuranceDocumentUrl = await uploadUrlIfNeeded(insuranceDocumentUrl, { draftListingId, slot: "insuranceDoc" });
  }

  return {
    skippedOversizedVideos,
    videoPublishDiagnostics: videoPublishDiagnostics.length ? videoPublishDiagnostics : undefined,
    state: normalizeClasificadosServiciosApplicationState({
      ...working,
      logoUrl,
      coverUrl,
      gallery,
      videos,
      promotions,
      licenseDocumentUrl,
      insuranceDocumentUrl,
    }),
  };
}

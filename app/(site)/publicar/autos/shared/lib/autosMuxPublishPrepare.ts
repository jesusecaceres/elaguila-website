"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { uploadAutosDraftVideoFileToMux } from "@/app/lib/clasificados/autos/autosMuxVideoClient";

/** Drop inline draft video bytes from API payloads (confirm sync / create) so PATCH/POST stay small. */
export function omitAutosInlineVideoForApiPayload(listing: AutoDealerListing): AutoDealerListing {
  const next = { ...listing };
  if (next.videoFileDataUrl?.trim()) {
    next.videoFileDataUrl = undefined;
  }
  return next;
}

function dataUrlToFile(dataUrl: string, fileName: string): File | null {
  const t = dataUrl.trim();
  if (!t.startsWith("data:")) return null;
  const comma = t.indexOf(",");
  if (comma < 0) return null;
  const header = t.slice(0, comma);
  const body = t.slice(comma + 1);
  const mimeMatch = /^data:([^;]+)/.exec(header);
  const mime = (mimeMatch?.[1] ?? "application/octet-stream").trim() || "application/octet-stream";
  const isBase64 = /;base64/i.test(header);
  try {
    const bytes = isBase64 ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(body));
    return new File([bytes], fileName || "video", { type: mime });
  } catch {
    return null;
  }
}

export type AutosMuxPublishPrepareResult = {
  listing: AutoDealerListing;
  /** User-facing warnings (e.g. Mux failed — listing continues without video). */
  publishWarnings: string[];
};

/**
 * Before final PATCH + checkout: upload local draft file to Mux when configured; merge durable playback fields.
 * Never throws; failures add warnings and clear optional video for publish.
 */
export async function prepareAutosListingOptionalMuxUpload(
  listing: AutoDealerListing,
  lang: "es" | "en",
): Promise<AutosMuxPublishPrepareResult> {
  const publishWarnings: string[] = [];
  const now = new Date().toISOString();
  let L: AutoDealerListing = { ...listing };

  const hasMux = Boolean(L.muxPlaybackId?.trim());
  if (hasMux) {
    L = {
      ...L,
      videoFileDataUrl: undefined,
      videoUploadStatus: "ready",
    };
    return { listing: L, publishWarnings };
  }

  const vu0 = L.videoUrl?.trim() ?? "";
  if (vu0.startsWith("blob:") || vu0.startsWith("data:")) {
    publishWarnings.push(lang === "es" ? "Se quitó un enlace de video local no publicable." : "Removed a non-durable local video URL.");
    L = {
      ...L,
      videoUrl: undefined,
      videoSourceType: null,
      autosVideoPublishDiagnostics: {
        muxUploadAttempted: false,
        muxUploadError: "non_durable_video_url_stripped",
        muxUploadAt: now,
      },
    };
  }

  if (L.videoSourceType === "file" && L.videoFileDataUrl?.trim()) {
    const fileName = (L.videoFileName?.trim() || "autos-listing-video").replace(/[^\w.\-()+ ]/g, "_") || "autos-listing-video";
    const file = dataUrlToFile(L.videoFileDataUrl, fileName);
    if (!file) {
      publishWarnings.push(
        lang === "es" ? "No se pudo leer el video local; se publicará sin video." : "Could not read the local video file; publishing without video.",
      );
      L = {
        ...L,
        videoFileDataUrl: undefined,
        videoSourceType: null,
        videoUploadStatus: "error",
        autosVideoPublishDiagnostics: {
          muxUploadAttempted: true,
          muxUploadError: "data_url_decode_failed",
          muxUploadAt: now,
        },
      };
      return { listing: L, publishWarnings };
    }

    const up = await uploadAutosDraftVideoFileToMux(file, lang);
    if (!up.ok) {
      publishWarnings.push(up.error);
      L = {
        ...L,
        videoFileDataUrl: undefined,
        videoSourceType: null,
        videoUrl: undefined,
        videoUploadStatus: "error",
        autosVideoPublishDiagnostics: {
          muxUploadAttempted: true,
          muxUploadError: up.errorType ?? "mux_upload_failed",
          muxUploadAt: now,
        },
      };
      return { listing: L, publishWarnings };
    }

    const playbackUrl = up.playbackUrl || `https://stream.mux.com/${up.playbackId}.m3u8`;
    L = {
      ...L,
      muxAssetId: up.assetId,
      muxPlaybackId: up.playbackId,
      muxThumbnailUrl: up.thumbnailUrl || undefined,
      muxPlaybackUrl: playbackUrl,
      videoUrl: playbackUrl,
      videoSourceType: "url",
      videoFileDataUrl: undefined,
      videoFileName: undefined,
      videoUploadStatus: "ready",
      autosVideoPublishDiagnostics: {
        muxUploadAttempted: true,
        muxUploadError: null,
        muxUploadAt: now,
      },
    };

    return { listing: L, publishWarnings };
  }

  L = { ...L, videoFileDataUrl: undefined };
  return { listing: L, publishWarnings };
}

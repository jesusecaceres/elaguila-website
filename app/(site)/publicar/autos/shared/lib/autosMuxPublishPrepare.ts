"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";

/** Drop inline draft video bytes from API payloads (confirm sync / create) so PATCH/POST stay small. */
export function omitAutosInlineVideoForApiPayload(listing: AutoDealerListing): AutoDealerListing {
  const next = { ...listing };
  if (next.videoFileDataUrl?.trim()) {
    next.videoFileDataUrl = undefined;
  }
  return next;
}

export type AutosMuxPublishPrepareResult = {
  listing: AutoDealerListing;
  /** User-facing warnings (e.g. Mux failed — listing continues without video). */
  publishWarnings: string[];
};

/**
 * Before final PATCH + checkout: strip legacy local video bytes. Autos publish forms use external videoUrls only (no Mux upload).
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
    publishWarnings.push(
      lang === "es"
        ? "Los formularios Autos ya no suben archivos de video; se publicará con enlaces externos solamente."
        : "Autos forms no longer upload video files; publishing with external links only.",
    );
    L = {
      ...L,
      videoFileDataUrl: undefined,
      videoFileName: undefined,
      videoSourceType: L.videoUrls?.length ? "url" : null,
      videoUploadStatus: L.videoUrls?.length ? "local_preview" : null,
      autosVideoPublishDiagnostics: {
        muxUploadAttempted: false,
        muxUploadError: "autos_external_video_only",
        muxUploadAt: now,
      },
    };
    return { listing: L, publishWarnings };
  }

  L = { ...L, videoFileDataUrl: undefined, videoFileName: undefined };
  return { listing: L, publishWarnings };
}

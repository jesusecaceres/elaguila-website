"use client";

import { uploadServiciosGalleryVideoFileToMux } from "@/app/clasificados/publicar/servicios/lib/serviciosMuxVideoClient";

export const RENTAS_MUX_UPLOAD_FAIL_ES = "No pudimos subir el video. Intenta de nuevo o publica sin video.";
export const RENTAS_MUX_UPLOAD_FAIL_EN =
  "We couldn’t upload your video. Try again or publish without a video.";

export type RentasMuxVideoUploadOk = {
  ok: true;
  assetId: string;
  playbackId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
};

export type RentasMuxVideoUploadErr = { ok: false; error: string };

/**
 * Rentas publish-time Mux direct upload (same stack as Servicios / En Venta).
 * Failures are normalized to the Rentas-specific copy requested for the publish flow.
 */
export async function uploadRentasDraftVideoFileToMux(
  file: File,
  lang: "es" | "en",
  onProgress?: (pct: number) => void,
): Promise<RentasMuxVideoUploadOk | RentasMuxVideoUploadErr> {
  const r = await uploadServiciosGalleryVideoFileToMux(file, 0, lang, onProgress);
  if (r.ok) {
    return {
      ok: true,
      assetId: r.assetId,
      playbackId: r.playbackId,
      playbackUrl: r.playbackUrl,
      thumbnailUrl: r.thumbnailUrl,
      durationSeconds: r.durationSeconds,
    };
  }
  return {
    ok: false,
    error: lang === "es" ? RENTAS_MUX_UPLOAD_FAIL_ES : RENTAS_MUX_UPLOAD_FAIL_EN,
  };
}

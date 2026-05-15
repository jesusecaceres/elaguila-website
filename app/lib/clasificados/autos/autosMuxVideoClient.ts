"use client";

/**
 * Autos-only Mux direct upload — reuses the existing browser → `/api/mux/*` pipeline
 * (same as Rentas / Servicios gallery video) without modifying those modules.
 */
import { uploadServiciosGalleryVideoFileToMux } from "@/app/clasificados/publicar/servicios/lib/serviciosMuxVideoClient";

export type AutosMuxVideoUploadOk = {
  ok: true;
  playbackId: string;
  assetId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
};

export type AutosMuxVideoUploadErr = {
  ok: false;
  error: string;
  errorType?: string;
};

export async function uploadAutosDraftVideoFileToMux(
  file: File,
  lang: "es" | "en",
  onProgress?: (pct: number) => void,
): Promise<AutosMuxVideoUploadOk | AutosMuxVideoUploadErr> {
  return uploadServiciosGalleryVideoFileToMux(file, 0, lang, onProgress);
}

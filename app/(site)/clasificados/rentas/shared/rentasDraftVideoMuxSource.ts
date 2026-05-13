"use client";

import { readRentasDraftVideo } from "@/app/clasificados/rentas/shared/rentasDraftVideoStore";

type RentasMuxableMedia = {
  videoUrl?: string;
  videoLocalDataUrl?: string;
  videoLocalDraftId?: string;
  videoLocalFileName?: string;
  videoLocalMimeType?: string;
};

function trim(s: string | undefined | null): string {
  return String(s ?? "").trim();
}

/** True when the publisher chose a file/blob/data URL that must be promoted via Mux at publish time. */
export function rentasMediaHasLocalMuxableVideo(m: RentasMuxableMedia): boolean {
  const draftId = trim(m.videoLocalDraftId);
  if (draftId) return true;
  const local = trim(m.videoLocalDataUrl);
  if (local.startsWith("blob:") || /^data:video\//i.test(local) || /^data:application\/octet-stream/i.test(local)) {
    return true;
  }
  const url = trim(m.videoUrl);
  if (!url) return false;
  if (url.startsWith("blob:") || /^data:video\//i.test(url) || /^data:application\/octet-stream/i.test(url)) return true;
  if (/^https?:\/\//i.test(url)) return false;
  return false;
}

async function blobToVideoFile(blob: Blob, name: string, mime: string): Promise<File> {
  const n = name.trim() || "video.mp4";
  const t = mime.trim() || blob.type || "video/mp4";
  return new File([blob], n, { type: t });
}

/**
 * Resolves a `File` for Mux direct upload from draft media. Returns `null` when no local muxable video.
 */
export async function rentasDraftVideoFileForMuxUpload(m: RentasMuxableMedia): Promise<File | null> {
  if (!rentasMediaHasLocalMuxableVideo(m)) return null;
  const draftId = trim(m.videoLocalDraftId);
  if (draftId) {
    const rec = await readRentasDraftVideo(draftId);
    if (!rec?.blob || rec.blob.size < 1) return null;
    return blobToVideoFile(rec.blob, rec.fileName, rec.mimeType);
  }
  const local = trim(m.videoLocalDataUrl);
  const src = local || trim(m.videoUrl);
  if (!src || !(src.startsWith("blob:") || /^data:/i.test(src))) return null;
  const res = await fetch(src);
  if (!res.ok) return null;
  const blob = await res.blob();
  return blobToVideoFile(blob, trim(m.videoLocalFileName) || "video.mp4", trim(m.videoLocalMimeType) || blob.type || "video/mp4");
}

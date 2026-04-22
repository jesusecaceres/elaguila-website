import { DEFAULT_MAX_FILE_MB } from "./constants";
import type { AcceptedMime, PrintUploadFile, PrintUploadFileSlot } from "./types";

const MIME_MAP: Record<string, AcceptedMime | undefined> = {
  "application/pdf": "application/pdf",
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/tiff": "image/tiff",
  "image/tif": "image/tiff",
};

export function isAcceptedMime(mime: string): boolean {
  return normalizeMime(mime) != null;
}

export function normalizeMime(mime: string): AcceptedMime | null {
  const normalized = mime.toLowerCase().split(";")[0].trim();
  return (MIME_MAP[normalized] ?? null) as AcceptedMime | null;
}

export async function buildPrintUploadFile(
  file: File,
  slot: PrintUploadFileSlot
): Promise<PrintUploadFile> {
  const mime = file.type || "application/octet-stream";
  const id = `${slot}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  let previewUrl: string | null = null;
  let widthPx: number | null = null;
  let heightPx: number | null = null;

  if (mime === "application/pdf") {
    previewUrl = null;
  } else if (mime.startsWith("image/")) {
    previewUrl = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        widthPx = img.naturalWidth;
        heightPx = img.naturalHeight;
        resolve();
      };
      img.onerror = () => reject(new Error("image-load"));
      img.src = previewUrl!;
    });
  }

  return {
    id,
    slot,
    file,
    previewUrl,
    mime,
    sizeBytes: file.size,
    name: file.name,
    widthPx,
    heightPx,
  };
}

export function fileExceedsMaxBytes(file: File): boolean {
  return file.size > DEFAULT_MAX_FILE_MB * 1024 * 1024;
}

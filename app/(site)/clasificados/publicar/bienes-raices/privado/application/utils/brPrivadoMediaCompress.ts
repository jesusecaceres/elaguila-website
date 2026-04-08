/**
 * BR Privado draft: shrink listing/owner images so sessionStorage JSON stays under typical ~5MB quotas.
 * No server upload — browser-only canvas resize (JPEG).
 */

const MAX_EDGE = 1920;
const JPEG_QUALITY = 0.82;

export async function compressImageFileToJpegDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return readFileAsDataUrlRaw(file);
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return readFileAsDataUrlRaw(file);
  }
  const { width: w0, height: h0 } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return readFileAsDataUrlRaw(file);
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("toBlob failed"));
          return;
        }
        const r = new FileReader();
        r.onload = () => resolve(String(r.result ?? ""));
        r.onerror = () => reject(r.error ?? new Error("read failed"));
        r.readAsDataURL(blob);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

function readFileAsDataUrlRaw(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error ?? new Error("read failed"));
    r.readAsDataURL(file);
  });
}

/** @param maxBytes soft cap — caller should warn user if file is huge */
export async function readVideoFileAsDataUrlLimited(file: File, maxBytes: number): Promise<string> {
  if (!file.type.startsWith("video/")) {
    throw new Error("not_video");
  }
  if (file.size > maxBytes) {
    throw new Error("video_too_large");
  }
  return readFileAsDataUrlRaw(file);
}

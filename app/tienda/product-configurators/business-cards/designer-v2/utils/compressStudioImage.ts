import imageCompression from "browser-image-compression";

async function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Compress studio uploads before storing on the document (same dependency family as logo drafts). */
export async function compressStudioImageDataUrl(raw: string): Promise<string> {
  if (!raw.startsWith("data:image/")) return raw;
  try {
    const res = await fetch(raw);
    const blob = await res.blob();
    const file = new File([blob], "studio.png", { type: blob.type || "image/jpeg" });
    const out = await imageCompression(file, { maxSizeMB: 1.2, maxWidthOrHeight: 1600, useWebWorker: true });
    return readFileAsDataUrl(out instanceof Blob ? out : file);
  } catch {
    return raw;
  }
}

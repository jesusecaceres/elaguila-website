"use client";

import imageCompression from "browser-image-compression";

/** Listing media: strong downscale + size cap before Vercel FormData limits. */
const PRIMARY_OPTS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1680,
  useWebWorker: true,
} as const;

const FALLBACK_OPTS = {
  maxSizeMB: 1.2,
  maxWidthOrHeight: 1400,
  useWebWorker: true,
} as const;

/** Hard ceiling after compression (multipart + overhead stays under platform limits). */
const ABSOLUTE_MAX_AFTER_COMPRESSION = 3.2 * 1024 * 1024;

/**
 * Compress raster images for draft Blob upload. Non-images are returned unchanged.
 */
export async function compressServiciosImageBlobForUpload(blob: Blob): Promise<Blob> {
  if (!blob.type.startsWith("image/")) return blob;

  const file =
    typeof File !== "undefined" && blob instanceof File
      ? blob
      : new File([blob], "servicios-upload.jpg", { type: blob.type || "image/jpeg" });

  let out: File | Blob = file;
  try {
    out = await imageCompression(file, PRIMARY_OPTS);
  } catch {
    out = file;
  }

  if (out.size > ABSOLUTE_MAX_AFTER_COMPRESSION) {
    try {
      out = await imageCompression(file, FALLBACK_OPTS);
    } catch {
      /* keep out from primary attempt */
    }
  }

  if (out.size > ABSOLUTE_MAX_AFTER_COMPRESSION) {
    throw new Error("image_too_large_after_compression");
  }

  return out;
}

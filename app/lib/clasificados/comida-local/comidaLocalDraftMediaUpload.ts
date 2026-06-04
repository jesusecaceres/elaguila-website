"use client";

import type { ComidaLocalImageRole, ComidaLocalUploadedImage } from "./comidaLocalTypes";
import { isComidaLocalAcceptedImageMime, COMIDA_LOCAL_IMAGE_MAX_BYTES } from "./comidaLocalImageValidation";

export type ComidaLocalDraftMediaUploadResult =
  | { ok: true; image: ComidaLocalUploadedImage }
  | { ok: false; error: string; detail?: string };

export function validateComidaLocalFileBeforeUpload(file: File): string | null {
  if (!file || file.size < 1) return "Elige una imagen.";
  if (!isComidaLocalAcceptedImageMime(file.type)) {
    return "Solo JPEG, PNG o WebP.";
  }
  if (file.size > COMIDA_LOCAL_IMAGE_MAX_BYTES) {
    return `La imagen es muy grande (máx. ${Math.round(COMIDA_LOCAL_IMAGE_MAX_BYTES / (1024 * 1024))} MB).`;
  }
  return null;
}

export async function uploadComidaLocalDraftImage(input: {
  file: File;
  role: ComidaLocalImageRole;
  draftListingId: string;
}): Promise<ComidaLocalDraftMediaUploadResult> {
  const clientErr = validateComidaLocalFileBeforeUpload(input.file);
  if (clientErr) return { ok: false, error: "invalid_file", detail: clientErr };

  const form = new FormData();
  form.set("draftListingId", input.draftListingId);
  form.set("role", input.role);
  form.set("file", input.file, input.file.name || "upload.jpg");

  const res = await fetch("/api/clasificados/comida-local/draft-media-upload", {
    method: "POST",
    body: form,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: "bad_response", detail: `HTTP ${res.status}` };
  }

  if (!res.ok || !body || typeof body !== "object") {
    const err =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: string }).error)
        : "upload_failed";
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: string }).detail)
        : undefined;
    return { ok: false, error: err, detail };
  }

  const image = (body as { image?: ComidaLocalUploadedImage }).image;
  if (!image?.url || !/^https?:\/\//i.test(image.url)) {
    return { ok: false, error: "missing_url" };
  }

  return { ok: true, image };
}

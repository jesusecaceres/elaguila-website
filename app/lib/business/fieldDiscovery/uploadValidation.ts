/**
 * Program 4, Gate 4A — MIME/size validation for canvassing/discovery file uploads. Mirrors
 * app/lib/ofertas-locales/ofertasLocalesClientUploadValidation.ts's validation contract shape.
 */
import { FIELD_DISCOVERY_UPLOAD_MAX_BYTES, FIELD_DISCOVERY_UPLOAD_MIME_TYPES } from "./constants";

export type FieldDiscoveryUploadMetaValidationResult = { ok: true } | { ok: false; error: string; detail: string };

export function validateFieldDiscoveryUploadMeta(input: { mimeType: string; sizeBytes: number }): FieldDiscoveryUploadMetaValidationResult {
  const mime = (input.mimeType || "").toLowerCase();
  if (!FIELD_DISCOVERY_UPLOAD_MIME_TYPES.includes(mime)) {
    return { ok: false, error: "unsupported_file_type", detail: "Only JPEG, PNG, WebP, and PDF files are allowed." };
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    return { ok: false, error: "empty_file", detail: "The file is empty." };
  }
  if (input.sizeBytes > FIELD_DISCOVERY_UPLOAD_MAX_BYTES) {
    return { ok: false, error: "upload_too_large", detail: `Maximum file size is ${Math.round(FIELD_DISCOVERY_UPLOAD_MAX_BYTES / (1024 * 1024))} MB.` };
  }
  return { ok: true };
}

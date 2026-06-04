import { randomUUID } from "crypto";
import type { OfertaLocalClientAssetKind } from "./ofertasLocalesClientUploadValidation";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]);

/** Strip unsafe path segments — no traversal, no raw business names. */
export function sanitizeOfertaLocalStorageSegment(value: string, maxLen = 80): string {
  return String(value ?? "")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\.\./g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "")
    .slice(0, maxLen);
}

export function safeOfertaLocalFileExtension(fileName: string, mimeType: string): string | null {
  const lower = fileName.toLowerCase();
  for (const ext of ALLOWED_EXTENSIONS) {
    if (lower.endsWith(ext)) return ext;
  }
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return null;
}

export function getOfertaLocalAssetStorageFolder(params: {
  ownerUserId: string;
  assetKind: OfertaLocalClientAssetKind;
  assetId: string;
}): string {
  const owner = sanitizeOfertaLocalStorageSegment(params.ownerUserId, 36);
  const kind = params.assetKind === "flyer" ? "flyer" : "coupon";
  const assetId = sanitizeOfertaLocalStorageSegment(params.assetId, 64) || "asset";
  return `ofertas-locales/drafts/${owner}/${kind}/${assetId}`;
}

export function createOfertaLocalAssetStoragePath(params: {
  ownerUserId: string;
  assetKind: OfertaLocalClientAssetKind;
  assetId: string;
  fileName: string;
  mimeType: string;
}): string | null {
  const ext = safeOfertaLocalFileExtension(params.fileName, params.mimeType);
  if (!ext) return null;
  const base = sanitizeOfertaLocalStorageSegment(
    params.fileName.replace(/\.[^.]+$/, "") || "upload",
    60
  );
  const folder = getOfertaLocalAssetStorageFolder(params);
  return `${folder}/${randomUUID()}-${base}${ext}`;
}

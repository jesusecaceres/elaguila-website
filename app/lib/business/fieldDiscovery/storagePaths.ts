/**
 * Program 4, Gate 4A — sanitized Vercel Blob storage path helpers for canvassing/discovery
 * uploads. Mirrors app/lib/ofertas-locales/ofertasLocalesStoragePaths.ts exactly: no path
 * traversal, no raw filenames trusted as-is, UUID-suffixed, allowlisted extensions only.
 */
import { randomUUID } from "crypto";
import { FIELD_DISCOVERY_BLOB_PATH_PREFIX } from "./constants";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]);

export function sanitizeFieldDiscoveryStorageSegment(value: string, maxLen = 80): string {
  return String(value ?? "")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\.\./g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "")
    .slice(0, maxLen);
}

export function safeFieldDiscoveryFileExtension(fileName: string, mimeType: string): string | null {
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

export function getFieldDiscoveryAssetStorageFolder(businessId: string): string {
  const business = sanitizeFieldDiscoveryStorageSegment(businessId, 36);
  return `${FIELD_DISCOVERY_BLOB_PATH_PREFIX}/${business}`;
}

export function createFieldDiscoveryStoragePath(params: { businessId: string; fileName: string; mimeType: string }): string | null {
  const ext = safeFieldDiscoveryFileExtension(params.fileName, params.mimeType);
  if (!ext) return null;
  const base = sanitizeFieldDiscoveryStorageSegment(params.fileName.replace(/\.[^.]+$/, "") || "upload", 60);
  const folder = getFieldDiscoveryAssetStorageFolder(params.businessId);
  return `${folder}/${randomUUID()}-${base}${ext}`;
}

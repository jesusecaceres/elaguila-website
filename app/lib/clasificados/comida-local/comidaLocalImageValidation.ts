import type { ComidaLocalImageDraft, ComidaLocalImageRole } from "./comidaLocalTypes";

export const COMIDA_LOCAL_IMAGE_MAX_BYTES = 12 * 1024 * 1024;

export const COMIDA_LOCAL_ACCEPTED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ComidaLocalAcceptedImageMime = (typeof COMIDA_LOCAL_ACCEPTED_IMAGE_MIME)[number];

export const COMIDA_LOCAL_IMAGE_ROLES = new Set<ComidaLocalImageRole>(["main", "logo", "gallery"]);

export const COMIDA_LOCAL_GALLERY_MAX = 2;

const PLACEHOLDER_HOST_RE = /placeholder|via\.placeholder|picsum|dummyimage|fakeimg/i;

export function isComidaLocalAcceptedImageMime(mime: string): boolean {
  const t = (mime ?? "").trim().toLowerCase();
  return (COMIDA_LOCAL_ACCEPTED_IMAGE_MIME as readonly string[]).includes(t);
}

export function isUnsafeComidaLocalImageUrl(url: string): boolean {
  const u = (url ?? "").trim();
  if (!u) return true;
  const lower = u.toLowerCase();
  if (lower.startsWith("data:") || lower.startsWith("blob:") || lower.startsWith("javascript:")) {
    return true;
  }
  if (lower.includes("base64")) return true;
  if (PLACEHOLDER_HOST_RE.test(u)) return true;
  return false;
}

export function isPublishableComidaLocalImageUrl(url: string): boolean {
  const u = (url ?? "").trim();
  if (isUnsafeComidaLocalImageUrl(u)) return false;
  return /^https?:\/\//i.test(u);
}

export function resolveComidaLocalImageUrl(img: ComidaLocalImageDraft | null | undefined): string | null {
  if (!img) return null;
  const direct = String(img.url ?? "").trim();
  if (direct && isPublishableComidaLocalImageUrl(direct)) return direct;
  const legacy = String(img.previewUrl ?? "").trim();
  if (legacy && isPublishableComidaLocalImageUrl(legacy)) return legacy;
  return null;
}

export function hasComidaLocalMainPhoto(draft: {
  mainPhoto: ComidaLocalImageDraft | null;
}): boolean {
  return Boolean(resolveComidaLocalImageUrl(draft.mainPhoto));
}

export function validateComidaLocalImageRole(role: string): role is ComidaLocalImageRole {
  return COMIDA_LOCAL_IMAGE_ROLES.has(role as ComidaLocalImageRole);
}

export function validateComidaLocalGalleryCount(count: number): boolean {
  return count >= 0 && count <= COMIDA_LOCAL_GALLERY_MAX;
}

export function validateComidaLocalImageMetadata(
  img: ComidaLocalImageDraft | null | undefined,
  expectedRole?: ComidaLocalImageRole
): { ok: true } | { ok: false; reason: string } {
  if (!img) return { ok: false, reason: "missing" };
  const url = resolveComidaLocalImageUrl(img);
  if (!url) return { ok: false, reason: "invalid_url" };
  if (expectedRole && img.role && img.role !== expectedRole) {
    return { ok: false, reason: "role_mismatch" };
  }
  if (img.contentType && !isComidaLocalAcceptedImageMime(img.contentType)) {
    return { ok: false, reason: "unsupported_type" };
  }
  if (typeof img.sizeBytes === "number" && img.sizeBytes > COMIDA_LOCAL_IMAGE_MAX_BYTES) {
    return { ok: false, reason: "too_large" };
  }
  return { ok: true };
}

/** DB / publish row — HTTPS metadata only. */
export function sanitizeComidaLocalImageForDb(
  img: ComidaLocalImageDraft | null | undefined
): ComidaLocalImageDraft | null {
  const check = validateComidaLocalImageMetadata(img);
  if (!check.ok || !img) return null;
  const url = resolveComidaLocalImageUrl(img)!;
  return {
    id: String(img.id ?? "").slice(0, 64) || url.slice(-48),
    role: img.role ?? "gallery",
    url: url.slice(0, 512),
    storagePath: String(img.storagePath ?? img.storageKey ?? "").slice(0, 512),
    fileName: String(img.fileName ?? "").slice(0, 200),
    contentType: String(img.contentType ?? "image/jpeg").slice(0, 64),
    sizeBytes: typeof img.sizeBytes === "number" ? Math.max(0, Math.floor(img.sizeBytes)) : 0,
    uploadedAt: String(img.uploadedAt ?? new Date(0).toISOString()).slice(0, 40),
    ...(typeof img.width === "number" ? { width: img.width } : {}),
    ...(typeof img.height === "number" ? { height: img.height } : {}),
    ...(img.altText ? { altText: String(img.altText).slice(0, 200) } : {}),
  };
}

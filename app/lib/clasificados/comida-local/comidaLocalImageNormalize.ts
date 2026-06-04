import type { ComidaLocalImageDraft, ComidaLocalImageRole } from "./comidaLocalTypes";
import {
  isPublishableComidaLocalImageUrl,
  isUnsafeComidaLocalImageUrl,
  resolveComidaLocalImageUrl,
} from "./comidaLocalImageValidation";

function safeString(v: unknown, max = 512): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max);
}

function safeNumber(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  return Math.max(0, Math.floor(v));
}

/** Tolerant merge from localStorage / API JSON; strips unsafe URLs. */
export function normalizeComidaLocalImageFromStorage(
  raw: unknown,
  defaultRole: ComidaLocalImageRole
): ComidaLocalImageDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const urlCandidate =
    safeString(r.url) ||
    safeString(r.previewUrl) ||
    "";
  if (!urlCandidate || isUnsafeComidaLocalImageUrl(urlCandidate)) {
    const storageOnly = safeString(r.storagePath) || safeString(r.storageKey);
    if (!storageOnly) return null;
    return null;
  }
  if (!isPublishableComidaLocalImageUrl(urlCandidate)) return null;

  const roleRaw = safeString(r.role, 16);
  const role =
    roleRaw === "main" || roleRaw === "logo" || roleRaw === "gallery" ? roleRaw : defaultRole;

  const storagePath = safeString(r.storagePath) || safeString(r.storageKey) || "";
  const fileName = safeString(r.fileName) || "image.jpg";
  const contentType = safeString(r.contentType, 64) || "image/jpeg";
  const sizeBytes = safeNumber(r.sizeBytes) ?? 0;
  const uploadedAt = safeString(r.uploadedAt, 40) || new Date(0).toISOString();
  const id =
    safeString(r.id, 64) ||
    (typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `img-${Date.now()}`);

  const out: ComidaLocalImageDraft = {
    id,
    role,
    url: urlCandidate,
    storagePath,
    fileName,
    contentType,
    sizeBytes,
    uploadedAt,
  };

  const w = safeNumber(r.width);
  const h = safeNumber(r.height);
  if (w !== undefined) out.width = w;
  if (h !== undefined) out.height = h;
  const alt = safeString(r.altText, 200);
  if (alt) out.altText = alt;

  return out;
}

export function normalizeComidaLocalImageListFromStorage(
  raw: unknown,
  defaultRole: ComidaLocalImageRole = "gallery"
): ComidaLocalImageDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeComidaLocalImageFromStorage(item, defaultRole))
    .filter((x): x is ComidaLocalImageDraft => x !== null);
}

export function ensureComidaLocalDraftListingId(id: string | undefined): string {
  const t = String(id ?? "").trim();
  if (t) return t.slice(0, 64);
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `draft-${Date.now()}`;
}

export function comidaLocalImageAltText(
  businessName: string,
  foodTypeLabel: string,
  role: ComidaLocalImageRole
): string {
  const name = businessName.trim() || "Comida Local";
  if (role === "logo") return `${name} logo`;
  if (role === "gallery") return `${name} — ${foodTypeLabel || "comida"}`;
  return `${name} — ${foodTypeLabel || "comida local"}`;
}

export { resolveComidaLocalImageUrl };

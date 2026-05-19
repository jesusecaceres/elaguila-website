import type { MascotasPerdidosNoticeTypeSlug, MascotasPerdidosQuickDraft } from "./mascotasPerdidosQuickTypes";

const NOTICE_SLUGS = new Set<string>([
  "mascota-perdida",
  "mascota-encontrada",
  "adopcion-mascota",
  "objeto-perdido",
  "objeto-encontrado",
]);

function newPreviewListingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mascotas-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyMascotasPerdidosQuickDraft(): MascotasPerdidosQuickDraft {
  return {
    previewListingId: newPreviewListingId(),
    noticeType: "",
    title: "",
    description: "",
    city: "",
    lastSeenLocation: "",
    contactPhone: "",
    email: "",
    imageDataUrl: "",
    imageFileName: "",
  };
}

function coerceNoticeType(raw: unknown): MascotasPerdidosNoticeTypeSlug {
  const s = String(raw ?? "").trim().toLowerCase();
  return NOTICE_SLUGS.has(s) ? (s as MascotasPerdidosNoticeTypeSlug) : "";
}

export function normalizeMascotasPerdidosQuickDraft(raw: unknown): MascotasPerdidosQuickDraft {
  const base = emptyMascotasPerdidosQuickDraft();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const previewListingId = String(o.previewListingId ?? "").trim() || newPreviewListingId();
  return {
    previewListingId,
    noticeType: coerceNoticeType(o.noticeType),
    title: String(o.title ?? ""),
    description: String(o.description ?? ""),
    city: String(o.city ?? ""),
    lastSeenLocation: String(o.lastSeenLocation ?? ""),
    contactPhone: String(o.contactPhone ?? ""),
    email: String(o.email ?? ""),
    imageDataUrl: String(o.imageDataUrl ?? ""),
    imageFileName: String(o.imageFileName ?? ""),
  };
}

import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";

import type {
  MascotasPerdidosNoticeTypeSlug,
  MascotasPerdidosPublishConfirmations,
  MascotasPerdidosQuickDraft,
  MascotasPerdidosTriState,
} from "./mascotasPerdidosQuickTypes";
import { MASCOTAS_SEX_OPTIONS, MASCOTAS_SIZE_OPTIONS } from "./mascotasPerdidosTaxonomy";

const NOTICE_SLUGS = new Set<string>([
  "mascota-perdida",
  "mascota-encontrada",
  "adopcion-mascota",
  "objeto-perdido",
  "objeto-encontrado",
]);

const TRI_STATE = new Set<string>(["si", "no", "no_se"]);
const SEX_VALUES = new Set(MASCOTAS_SEX_OPTIONS.map((o) => o.value));
const SIZE_VALUES = new Set(MASCOTAS_SIZE_OPTIONS.map((o) => o.value));

/** Owner-approved cap (Gate 3 Section E) — proven safe via the shared listings.images array contract. */
export const MAX_MASCOTAS_PHOTOS = 4;

function newPreviewListingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mascotas-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function coerceNoticeType(raw: unknown): MascotasPerdidosNoticeTypeSlug {
  const s = String(raw ?? "").trim().toLowerCase();
  return NOTICE_SLUGS.has(s) ? (s as MascotasPerdidosNoticeTypeSlug) : "";
}

function coerceTriState(raw: unknown): MascotasPerdidosTriState {
  const s = String(raw ?? "").trim().toLowerCase();
  return TRI_STATE.has(s) ? (s as MascotasPerdidosTriState) : "";
}

function coerceSex(raw: unknown): MascotasPerdidosTriState {
  const s = String(raw ?? "").trim().toLowerCase();
  return SEX_VALUES.has(s) || s === "no_se" ? (s as MascotasPerdidosTriState) : "";
}

function coerceSize(raw: unknown): string {
  const s = String(raw ?? "").trim().toLowerCase();
  return SIZE_VALUES.has(s) ? s : "";
}

function inferAttachmentMime(url: string, existing: unknown): string | undefined {
  const fromObj = typeof existing === "string" ? existing.trim() : "";
  if (fromObj) return fromObj;
  const base = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  if (base.endsWith(".pdf")) return "application/pdf";
  return undefined;
}

/** Gate 3 — mirrors the Empleos/Community image-item normalization; capped at MAX_MASCOTAS_PHOTOS. */
function normalizeImages(raw: unknown): EmpleosImageItem[] {
  if (!Array.isArray(raw)) return [];
  const out: EmpleosImageItem[] = [];
  for (const it of raw) {
    if (out.length >= MAX_MASCOTAS_PHOTOS) break;
    if (!it || typeof it !== "object") continue;
    const r = it as Partial<EmpleosImageItem>;
    const url = String(r.url ?? "").trim();
    if (!url && !r.id) continue;
    const attachmentMime = inferAttachmentMime(url, r.attachmentMime);
    out.push({
      id: String(r.id ?? `img_${Math.random().toString(36).slice(2, 9)}`),
      url,
      alt: String(r.alt ?? ""),
      isMain: Boolean(r.isMain),
      ...(attachmentMime ? { attachmentMime } : {}),
    });
  }
  return out;
}

function emptyPublishConfirmations(): MascotasPerdidosPublishConfirmations {
  return { infoTruthful: false, mediaAccurate: false, rulesAccepted: false };
}

function normalizePublishConfirmations(raw: unknown): MascotasPerdidosPublishConfirmations {
  const e = emptyPublishConfirmations();
  if (!raw || typeof raw !== "object") return e;
  const r = raw as Partial<MascotasPerdidosPublishConfirmations>;
  return {
    infoTruthful: Boolean(r.infoTruthful),
    mediaAccurate: Boolean(r.mediaAccurate),
    rulesAccepted: Boolean(r.rulesAccepted),
  };
}

export function emptyMascotasPerdidosQuickDraft(): MascotasPerdidosQuickDraft {
  return {
    previewListingId: newPreviewListingId(),
    noticeType: "",
    title: "",
    description: "",
    images: [],
    city: "",
    state: "",
    country: "",
    zip: "",
    lastSeenLocation: "",
    landmark: "",
    petName: "",
    species: "",
    breed: "",
    color: "",
    sex: "",
    ageApprox: "",
    size: "",
    identifyingMarks: "",
    hasCollar: false,
    collarNote: "",
    microchip: "",
    lastSeenDate: "",
    offersReward: false,
    rewardAmount: "",
    safetyNote: "",
    foundDate: "",
    currentStatus: "",
    claimInstructions: "",
    temperament: "",
    vaccinated: "",
    spayedNeutered: "",
    specialNeeds: "",
    adoptionDetails: "",
    objectType: "",
    phone: "",
    smsPhone: "",
    whatsapp: "",
    email: "",
    facebook: "",
    instagram: "",
    publishConfirmations: emptyPublishConfirmations(),
  };
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
    images: normalizeImages(o.images),
    city: String(o.city ?? ""),
    state: String(o.state ?? ""),
    country: String(o.country ?? ""),
    zip: String(o.zip ?? ""),
    lastSeenLocation: String(o.lastSeenLocation ?? ""),
    landmark: String(o.landmark ?? ""),
    petName: String(o.petName ?? ""),
    species: String(o.species ?? ""),
    breed: String(o.breed ?? ""),
    color: String(o.color ?? ""),
    sex: coerceSex(o.sex),
    ageApprox: String(o.ageApprox ?? ""),
    size: coerceSize(o.size),
    identifyingMarks: String(o.identifyingMarks ?? ""),
    hasCollar: Boolean(o.hasCollar),
    collarNote: String(o.collarNote ?? ""),
    microchip: coerceTriState(o.microchip),
    lastSeenDate: String(o.lastSeenDate ?? "").trim(),
    offersReward: Boolean(o.offersReward),
    rewardAmount: String(o.rewardAmount ?? "").trim(),
    safetyNote: String(o.safetyNote ?? ""),
    foundDate: String(o.foundDate ?? "").trim(),
    currentStatus: String(o.currentStatus ?? ""),
    claimInstructions: String(o.claimInstructions ?? ""),
    temperament: String(o.temperament ?? ""),
    vaccinated: coerceTriState(o.vaccinated),
    spayedNeutered: coerceTriState(o.spayedNeutered),
    specialNeeds: String(o.specialNeeds ?? ""),
    adoptionDetails: String(o.adoptionDetails ?? ""),
    objectType: String(o.objectType ?? ""),
    phone: String(o.phone ?? ""),
    smsPhone: String(o.smsPhone ?? ""),
    whatsapp: String(o.whatsapp ?? ""),
    email: String(o.email ?? ""),
    facebook: String(o.facebook ?? ""),
    instagram: String(o.instagram ?? ""),
    publishConfirmations: normalizePublishConfirmations(o.publishConfirmations),
  };
}

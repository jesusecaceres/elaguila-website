import type { BuscoPreferredContact, BuscoQuickDraft, BuscoTypeSlug, BuscoUrgency } from "./buscoQuickTypes";

const BUSCO_TYPE_SLUGS = new Set<string>([
  "articulo",
  "ayuda",
  "servicio",
  "grupo_actividad",
  "transporte",
  "voluntarios",
  "recurso_comunitario",
  "otro",
]);

function newPreviewListingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `busco-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const BUSCO_URGENCY = new Set<BuscoUrgency>(["normal", "pronto", "urgente"]);
const BUSCO_PREFERRED_CONTACT = new Set<BuscoPreferredContact>(["telefono", "whatsapp", "mensaje", "correo"]);

export function emptyBuscoQuickDraft(): BuscoQuickDraft {
  return {
    previewListingId: newPreviewListingId(),
    buscoType: "",
    buscoTypeCustom: "",
    title: "",
    description: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    zone: "",
    budget: "",
    urgency: "normal",
    phone: "",
    whatsapp: "",
    smsPhone: "",
    email: "",
    preferredContact: "telefono",
    facebook: "",
    instagram: "",
    tiktok: "",
    otherContactLabel: "",
    otherContactUrl: "",
    imageDataUrl: "",
    imageFileName: "",
  };
}

function coerceType(raw: unknown): BuscoTypeSlug {
  const s = String(raw ?? "").trim().toLowerCase();
  return BUSCO_TYPE_SLUGS.has(s) ? (s as BuscoTypeSlug) : "";
}

export function normalizeBuscoQuickDraft(raw: unknown): BuscoQuickDraft {
  const base = emptyBuscoQuickDraft();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const previewListingId = String(o.previewListingId ?? "").trim() || newPreviewListingId();
  const urgencyRaw = String(o.urgency ?? "").trim() as BuscoUrgency;
  const urgency = BUSCO_URGENCY.has(urgencyRaw) ? urgencyRaw : "normal";
  const prefRaw = String(o.preferredContact ?? "").trim() as BuscoPreferredContact;
  const preferredContact = BUSCO_PREFERRED_CONTACT.has(prefRaw) ? prefRaw : "telefono";
  return {
    previewListingId,
    buscoType: coerceType(o.buscoType),
    buscoTypeCustom: String(o.buscoTypeCustom ?? ""),
    title: String(o.title ?? ""),
    description: String(o.description ?? ""),
    city: String(o.city ?? ""),
    state: String(o.state ?? ""),
    country: String(o.country ?? ""),
    zip: String(o.zip ?? ""),
    zone: String(o.zone ?? ""),
    budget: String(o.budget ?? ""),
    urgency,
    phone: String(o.phone ?? ""),
    whatsapp: String(o.whatsapp ?? ""),
    smsPhone: String(o.smsPhone ?? ""),
    email: String(o.email ?? ""),
    preferredContact,
    facebook: String(o.facebook ?? ""),
    instagram: String(o.instagram ?? ""),
    tiktok: String(o.tiktok ?? ""),
    otherContactLabel: String(o.otherContactLabel ?? ""),
    otherContactUrl: String(o.otherContactUrl ?? ""),
    imageDataUrl: String(o.imageDataUrl ?? ""),
    imageFileName: String(o.imageFileName ?? ""),
  };
}

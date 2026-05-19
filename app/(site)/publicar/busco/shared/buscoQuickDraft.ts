import type { BuscoQuickDraft, BuscoTypeSlug } from "./buscoQuickTypes";

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

export function emptyBuscoQuickDraft(): BuscoQuickDraft {
  return {
    previewListingId: newPreviewListingId(),
    buscoType: "",
    buscoTypeCustom: "",
    title: "",
    description: "",
    city: "",
    zone: "",
    budget: "",
    phone: "",
    email: "",
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
  return {
    previewListingId,
    buscoType: coerceType(o.buscoType),
    buscoTypeCustom: String(o.buscoTypeCustom ?? ""),
    title: String(o.title ?? ""),
    description: String(o.description ?? ""),
    city: String(o.city ?? ""),
    zone: String(o.zone ?? ""),
    budget: String(o.budget ?? ""),
    phone: String(o.phone ?? ""),
    email: String(o.email ?? ""),
    imageDataUrl: String(o.imageDataUrl ?? ""),
    imageFileName: String(o.imageFileName ?? ""),
  };
}

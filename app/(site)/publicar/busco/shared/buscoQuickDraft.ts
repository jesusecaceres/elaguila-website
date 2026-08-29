import type { BuscoBudgetMode, BuscoQuickDraft, BuscoTypeSlug, BuscoUrgency } from "./buscoQuickTypes";

const BUSCO_TYPE_SLUGS = new Set<string>([
  "articulo",
  "ayuda",
  "servicio",
  "grupo_actividad",
  "transporte",
  "voluntarios",
  "recurso_comunitario",
  "trabajo",
  "otro",
]);

function newPreviewListingId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `busco-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const BUSCO_URGENCY = new Set<BuscoUrgency>(["normal", "esta_semana", "lo_antes_posible", "urgente_hoy"]);
const BUSCO_BUDGET_MODE = new Set<BuscoBudgetMode>(["tiene", "gratis", "intercambio", "convenir", "no_aplica"]);

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
    budgetMode: "no_aplica",
    budgetAmount: "",
    urgency: "normal",
    preferredCondition: "",
    workType: "",
    workSkills: "",
    workAvailability: "",
    transportOrigin: "",
    transportDestination: "",
    volunteersCount: "",
    whenNeeded: "",
    phone: "",
    whatsapp: "",
    smsPhone: "",
    email: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    otherContactLabel: "",
    otherContactUrl: "",
    imageDataUrl: "",
    imageFileName: "",
    publishConfirmations: { infoTruthful: false, mediaAccurate: false, rulesAccepted: false },
  };
}

function coerceType(raw: unknown): BuscoTypeSlug {
  const s = String(raw ?? "").trim().toLowerCase();
  return BUSCO_TYPE_SLUGS.has(s) ? (s as BuscoTypeSlug) : "";
}

/** Gate 4 — the 3-state urgency (normal/pronto/urgente) became 4 states. This mapping only
 *  matters for a stray same-session draft written before the Gate 4 session-key bump; published
 *  legacy rows are handled separately in buscoQuickAdViewModel's from-published reader. */
function coerceUrgency(raw: unknown): BuscoUrgency {
  const s = String(raw ?? "").trim();
  if (s === "pronto") return "esta_semana";
  if (s === "urgente") return "urgente_hoy";
  return BUSCO_URGENCY.has(s as BuscoUrgency) ? (s as BuscoUrgency) : "normal";
}

function coerceBudgetMode(raw: unknown): BuscoBudgetMode {
  const s = String(raw ?? "").trim();
  return BUSCO_BUDGET_MODE.has(s as BuscoBudgetMode) ? (s as BuscoBudgetMode) : "no_aplica";
}

export function normalizeBuscoQuickDraft(raw: unknown): BuscoQuickDraft {
  const base = emptyBuscoQuickDraft();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const previewListingId = String(o.previewListingId ?? "").trim() || newPreviewListingId();
  const confirmationsRaw = (o.publishConfirmations && typeof o.publishConfirmations === "object"
    ? (o.publishConfirmations as Record<string, unknown>)
    : {}) as Record<string, unknown>;
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
    budgetMode: coerceBudgetMode(o.budgetMode),
    budgetAmount: String(o.budgetAmount ?? "").replace(/[^0-9.]/g, ""),
    urgency: coerceUrgency(o.urgency),
    preferredCondition: String(o.preferredCondition ?? ""),
    workType: String(o.workType ?? ""),
    workSkills: String(o.workSkills ?? ""),
    workAvailability: String(o.workAvailability ?? ""),
    transportOrigin: String(o.transportOrigin ?? ""),
    transportDestination: String(o.transportDestination ?? ""),
    volunteersCount: String(o.volunteersCount ?? ""),
    whenNeeded: String(o.whenNeeded ?? ""),
    phone: String(o.phone ?? ""),
    whatsapp: String(o.whatsapp ?? ""),
    smsPhone: String(o.smsPhone ?? ""),
    email: String(o.email ?? ""),
    facebook: String(o.facebook ?? ""),
    instagram: String(o.instagram ?? ""),
    tiktok: String(o.tiktok ?? ""),
    youtube: String(o.youtube ?? ""),
    otherContactLabel: String(o.otherContactLabel ?? ""),
    otherContactUrl: String(o.otherContactUrl ?? ""),
    imageDataUrl: String(o.imageDataUrl ?? ""),
    imageFileName: String(o.imageFileName ?? ""),
    publishConfirmations: {
      infoTruthful: confirmationsRaw.infoTruthful === true,
      mediaAccurate: confirmationsRaw.mediaAccurate === true,
      rulesAccepted: confirmationsRaw.rulesAccepted === true,
    },
  };
}

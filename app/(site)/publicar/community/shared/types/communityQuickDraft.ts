import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";

import { COMMUNITY_DEFAULT_STATE } from "../constants/communityRegion";
import {
  emptyCommunityWeeklySchedule,
  normalizeWeeklyScheduleArray,
  type CommunityScheduleRowLegacy,
} from "../lib/communityWeeklySchedule";

export type CommunityPrimaryCta = "phone" | "whatsapp" | "email" | "website";

export type CommunitySocialLinks = {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  xTwitter: string;
  linkedin: string;
};

export type CommunityPublishConfirmations = {
  infoTruthful: boolean;
  mediaAccurate: boolean;
  rulesAccepted: boolean;
};

/** @deprecated Legacy Clases quick — migrated into `weeklySchedule`. */
export type CommunityScheduleRow = CommunityScheduleRowLegacy;

export type ClasesCostType = "gratis" | "pagada";
export type ClasesPriceFrequency =
  | "porClase"
  | "porSesion"
  | "porMes"
  | "porCursoCompleto"
  | "otro";

export type ClasesMode = "presencial" | "enLinea" | "hibrida";

export type ComunidadCostType = "gratis" | "pagado" | "donacion" | "noConfirmado";

/** Fields shared across Clases + Comunidad quick drafts. */
export type CommunityCommonDraft = {
  title: string;
  organizer: string;
  /** Class type/category for clases, event type/category for comunidad. */
  category: string;
  /** Free-form custom label when category === "otro". */
  categoryCustom: string;
  description: string;
  images: EmpleosImageItem[];
  /** Public city where the class/event happens — never replaced by NorCal. */
  publicCity: string;
  state: string;
  zip: string;
  venue: string;
  addressLine1: string;
  phone: string;
  whatsapp: string;
  /** Optional SMS number; preview/output falls back to `phone` when blank. */
  smsPhone: string;
  email: string;
  website: string;
  socialLinks: CommunitySocialLinks;
  primaryCta: CommunityPrimaryCta;
  /** Inline attestations before publish (session draft); not required for preview. */
  publishConfirmations: CommunityPublishConfirmations;
};

export type ClasesQuickDraft = CommunityCommonDraft & {
  kind: "clases";
  classCostType: ClasesCostType;
  /** Required when classCostType === "pagada". */
  priceAmount: string;
  priceFrequency: ClasesPriceFrequency;
  priceNote: string;
  mode: ClasesMode;
  /** Fixed Mon–Sun rows (Servicios-style). */
  weeklySchedule: DayHoursRow[];
};

export type ComunidadQuickDraft = CommunityCommonDraft & {
  kind: "comunidad";
  eventCost: ComunidadCostType;
  /** Used when eventCost is paid or donation. */
  admissionNote: string;
  /** Event start date YYYY-MM-DD. */
  date: string;
  /** Optional event end date YYYY-MM-DD (multi-day). */
  eventEndDate: string;
  /** Optional single session window (alternative to activating weekly rows). */
  eventSessionStart: string;
  eventSessionEnd: string;
  /** When the event runs during the date range (fixed weekdays). */
  weeklySchedule: DayHoursRow[];
};

export type CommunityQuickDraft = ClasesQuickDraft | ComunidadQuickDraft;

function emptySocialLinks(): CommunitySocialLinks {
  return {
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    xTwitter: "",
    linkedin: "",
  };
}

function emptyPublishConfirmations(): CommunityPublishConfirmations {
  return { infoTruthful: false, mediaAccurate: false, rulesAccepted: false };
}

function emptyCommon(): CommunityCommonDraft {
  return {
    title: "",
    organizer: "",
    category: "",
    categoryCustom: "",
    description: "",
    images: [],
    publicCity: "",
    state: COMMUNITY_DEFAULT_STATE,
    zip: "",
    venue: "",
    addressLine1: "",
    phone: "",
    whatsapp: "",
    smsPhone: "",
    email: "",
    website: "",
    socialLinks: emptySocialLinks(),
    primaryCta: "phone",
    publishConfirmations: emptyPublishConfirmations(),
  };
}

export function emptyClasesQuickDraft(): ClasesQuickDraft {
  return {
    ...emptyCommon(),
    kind: "clases",
    classCostType: "gratis",
    priceAmount: "",
    priceFrequency: "porClase",
    priceNote: "",
    mode: "presencial",
    weeklySchedule: emptyCommunityWeeklySchedule(),
  };
}

export function emptyComunidadQuickDraft(): ComunidadQuickDraft {
  return {
    ...emptyCommon(),
    kind: "comunidad",
    eventCost: "gratis",
    admissionNote: "",
    date: "",
    eventEndDate: "",
    eventSessionStart: "",
    eventSessionEnd: "",
    weeklySchedule: emptyCommunityWeeklySchedule(),
  };
}

const CLASES_COST = new Set<ClasesCostType>(["gratis", "pagada"]);
const CLASES_FREQ = new Set<ClasesPriceFrequency>([
  "porClase",
  "porSesion",
  "porMes",
  "porCursoCompleto",
  "otro",
]);
const CLASES_MODE = new Set<ClasesMode>(["presencial", "enLinea", "hibrida"]);

const COMUNIDAD_COST = new Set<ComunidadCostType>([
  "gratis",
  "pagado",
  "donacion",
  "noConfirmado",
]);

const PRIMARY_CTA = new Set<CommunityPrimaryCta>(["phone", "whatsapp", "email", "website"]);

function inferAttachmentMime(url: string, existing: unknown): string | undefined {
  const fromObj = typeof existing === "string" ? existing.trim() : "";
  if (fromObj) return fromObj;
  if (url.startsWith("data:application/pdf")) return "application/pdf";
  const base = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  if (base.endsWith(".pdf")) return "application/pdf";
  return undefined;
}

function normalizeImages(raw: unknown): EmpleosImageItem[] {
  if (!Array.isArray(raw)) return [];
  const out: EmpleosImageItem[] = [];
  for (const it of raw) {
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

function pickPrimaryCta(raw: unknown, fallback: CommunityPrimaryCta): CommunityPrimaryCta {
  return PRIMARY_CTA.has(raw as CommunityPrimaryCta) ? (raw as CommunityPrimaryCta) : fallback;
}

function normalizeSocialLinks(raw: unknown): CommunitySocialLinks {
  const e = emptySocialLinks();
  if (!raw || typeof raw !== "object") return e;
  const r = raw as Partial<CommunitySocialLinks>;
  return {
    facebook: String(r.facebook ?? e.facebook).trim(),
    instagram: String(r.instagram ?? e.instagram).trim(),
    tiktok: String(r.tiktok ?? e.tiktok).trim(),
    youtube: String(r.youtube ?? e.youtube).trim(),
    xTwitter: String(r.xTwitter ?? e.xTwitter).trim(),
    linkedin: String(r.linkedin ?? e.linkedin).trim(),
  };
}

function normalizePublishConfirmations(raw: unknown): CommunityPublishConfirmations {
  const e = emptyPublishConfirmations();
  if (!raw || typeof raw !== "object") return e;
  const r = raw as Partial<CommunityPublishConfirmations>;
  return {
    infoTruthful: Boolean(r.infoTruthful),
    mediaAccurate: Boolean(r.mediaAccurate),
    rulesAccepted: Boolean(r.rulesAccepted),
  };
}

function normalizeCommon(p: Partial<CommunityCommonDraft>): CommunityCommonDraft {
  const e = emptyCommon();
  const rawCity = String(p.publicCity ?? e.publicCity).trim();
  /** Prefer canonical when input resolves; keep non-canonical text only while editing (gate blocks publish). */
  const publicCity = rawCity ? getCanonicalCityName(rawCity) || rawCity : "";
  return {
    title: String(p.title ?? e.title),
    organizer: String(p.organizer ?? e.organizer),
    category: String(p.category ?? e.category),
    categoryCustom: String(p.categoryCustom ?? e.categoryCustom),
    description: String(p.description ?? e.description),
    images: normalizeImages(p.images),
    publicCity,
    state: COMMUNITY_DEFAULT_STATE,
    zip: String(p.zip ?? e.zip),
    venue: String(p.venue ?? e.venue),
    addressLine1: String(p.addressLine1 ?? e.addressLine1),
    phone: String(p.phone ?? e.phone),
    whatsapp: String(p.whatsapp ?? e.whatsapp),
    smsPhone: String(p.smsPhone ?? e.smsPhone),
    email: String(p.email ?? e.email),
    website: String(p.website ?? e.website),
    socialLinks: normalizeSocialLinks(p.socialLinks),
    primaryCta: pickPrimaryCta(p.primaryCta, e.primaryCta),
    publishConfirmations: normalizePublishConfirmations(p.publishConfirmations),
  };
}

export function normalizeClasesQuickDraft(raw: unknown): ClasesQuickDraft {
  const e = emptyClasesQuickDraft();
  if (!raw || typeof raw !== "object") return e;
  const p = raw as Partial<ClasesQuickDraft> & { scheduleRows?: unknown };
  const common = normalizeCommon(p);
  const classCostType = CLASES_COST.has(p.classCostType as ClasesCostType)
    ? (p.classCostType as ClasesCostType)
    : e.classCostType;
  const priceFrequency = CLASES_FREQ.has(p.priceFrequency as ClasesPriceFrequency)
    ? (p.priceFrequency as ClasesPriceFrequency)
    : e.priceFrequency;
  const mode = CLASES_MODE.has(p.mode as ClasesMode) ? (p.mode as ClasesMode) : e.mode;
  const legacyRows: CommunityScheduleRowLegacy[] = Array.isArray(p.scheduleRows)
    ? (p.scheduleRows as unknown[]).map((r) => ({
        day: String((r as Partial<CommunityScheduleRowLegacy> | undefined)?.day ?? "").trim(),
        time: String((r as Partial<CommunityScheduleRowLegacy> | undefined)?.time ?? "").trim(),
      }))
    : [];
  const weeklySchedule = normalizeWeeklyScheduleArray(p.weeklySchedule, legacyRows);
  return {
    ...common,
    kind: "clases",
    classCostType,
    priceAmount: String(p.priceAmount ?? e.priceAmount),
    priceFrequency,
    priceNote: String(p.priceNote ?? e.priceNote),
    mode,
    weeklySchedule,
  };
}

export function normalizeComunidadQuickDraft(raw: unknown): ComunidadQuickDraft {
  const e = emptyComunidadQuickDraft();
  if (!raw || typeof raw !== "object") return e;
  const p = raw as Partial<ComunidadQuickDraft>;
  const common = normalizeCommon(p);
  const eventCost = COMUNIDAD_COST.has(p.eventCost as ComunidadCostType)
    ? (p.eventCost as ComunidadCostType)
    : e.eventCost;
  const weeklySchedule = normalizeWeeklyScheduleArray(p.weeklySchedule);
  const eventEndDate = String(p.eventEndDate ?? e.eventEndDate).trim();
  return {
    ...common,
    kind: "comunidad",
    eventCost,
    admissionNote: String(p.admissionNote ?? e.admissionNote),
    date: String(p.date ?? e.date),
    eventEndDate,
    eventSessionStart: String(p.eventSessionStart ?? e.eventSessionStart).trim(),
    eventSessionEnd: String(p.eventSessionEnd ?? e.eventSessionEnd).trim(),
    weeklySchedule,
  };
}

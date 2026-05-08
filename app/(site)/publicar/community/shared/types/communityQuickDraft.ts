import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";

import { COMMUNITY_DEFAULT_STATE } from "../constants/communityRegion";

export type CommunityPrimaryCta = "phone" | "whatsapp" | "email" | "website";

export type CommunityScheduleRow = { day: string; time: string };

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
  email: string;
  website: string;
  primaryCta: CommunityPrimaryCta;
};

export type ClasesQuickDraft = CommunityCommonDraft & {
  kind: "clases";
  classCostType: ClasesCostType;
  /** Required when classCostType === "pagada". */
  priceAmount: string;
  priceFrequency: ClasesPriceFrequency;
  priceNote: string;
  mode: ClasesMode;
  scheduleRows: CommunityScheduleRow[];
};

export type ComunidadQuickDraft = CommunityCommonDraft & {
  kind: "comunidad";
  eventCost: ComunidadCostType;
  /** Used when eventCost is paid or donation. */
  admissionNote: string;
  /** Local date string YYYY-MM-DD. */
  date: string;
  startTime: string;
  endTime: string;
};

export type CommunityQuickDraft = ClasesQuickDraft | ComunidadQuickDraft;

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
    email: "",
    website: "",
    primaryCta: "phone",
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
    scheduleRows: [{ day: "", time: "" }],
  };
}

export function emptyComunidadQuickDraft(): ComunidadQuickDraft {
  return {
    ...emptyCommon(),
    kind: "comunidad",
    eventCost: "gratis",
    admissionNote: "",
    date: "",
    startTime: "",
    endTime: "",
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

function normalizeImages(raw: unknown): EmpleosImageItem[] {
  if (!Array.isArray(raw)) return [];
  const out: EmpleosImageItem[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const r = it as Partial<EmpleosImageItem>;
    const url = String(r.url ?? "").trim();
    if (!url && !r.id) continue;
    out.push({
      id: String(r.id ?? `img_${Math.random().toString(36).slice(2, 9)}`),
      url,
      alt: String(r.alt ?? ""),
      isMain: Boolean(r.isMain),
    });
  }
  return out;
}

function pickPrimaryCta(raw: unknown, fallback: CommunityPrimaryCta): CommunityPrimaryCta {
  return PRIMARY_CTA.has(raw as CommunityPrimaryCta) ? (raw as CommunityPrimaryCta) : fallback;
}

function normalizeCommon(p: Partial<CommunityCommonDraft>): CommunityCommonDraft {
  const e = emptyCommon();
  return {
    title: String(p.title ?? e.title),
    organizer: String(p.organizer ?? e.organizer),
    category: String(p.category ?? e.category),
    categoryCustom: String(p.categoryCustom ?? e.categoryCustom),
    description: String(p.description ?? e.description),
    images: normalizeImages(p.images),
    publicCity: String(p.publicCity ?? e.publicCity),
    state: String(p.state ?? e.state) || COMMUNITY_DEFAULT_STATE,
    zip: String(p.zip ?? e.zip),
    venue: String(p.venue ?? e.venue),
    addressLine1: String(p.addressLine1 ?? e.addressLine1),
    phone: String(p.phone ?? e.phone),
    whatsapp: String(p.whatsapp ?? e.whatsapp),
    email: String(p.email ?? e.email),
    website: String(p.website ?? e.website),
    primaryCta: pickPrimaryCta(p.primaryCta, e.primaryCta),
  };
}

export function normalizeClasesQuickDraft(raw: unknown): ClasesQuickDraft {
  const e = emptyClasesQuickDraft();
  if (!raw || typeof raw !== "object") return e;
  const p = raw as Partial<ClasesQuickDraft>;
  const common = normalizeCommon(p);
  const classCostType = CLASES_COST.has(p.classCostType as ClasesCostType)
    ? (p.classCostType as ClasesCostType)
    : e.classCostType;
  const priceFrequency = CLASES_FREQ.has(p.priceFrequency as ClasesPriceFrequency)
    ? (p.priceFrequency as ClasesPriceFrequency)
    : e.priceFrequency;
  const mode = CLASES_MODE.has(p.mode as ClasesMode) ? (p.mode as ClasesMode) : e.mode;
  let scheduleRows: CommunityScheduleRow[] = Array.isArray(p.scheduleRows)
    ? p.scheduleRows.map((r) => ({
        day: String((r as Partial<CommunityScheduleRow> | undefined)?.day ?? "").trim(),
        time: String((r as Partial<CommunityScheduleRow> | undefined)?.time ?? "").trim(),
      }))
    : [];
  if (!scheduleRows.length) scheduleRows = [{ day: "", time: "" }];
  return {
    ...common,
    kind: "clases",
    classCostType,
    priceAmount: String(p.priceAmount ?? e.priceAmount),
    priceFrequency,
    priceNote: String(p.priceNote ?? e.priceNote),
    mode,
    scheduleRows,
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
  return {
    ...common,
    kind: "comunidad",
    eventCost,
    admissionNote: String(p.admissionNote ?? e.admissionNote),
    date: String(p.date ?? e.date),
    startTime: String(p.startTime ?? e.startTime),
    endTime: String(p.endTime ?? e.endTime),
  };
}

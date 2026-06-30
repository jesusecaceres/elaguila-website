import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";

import { COMMUNITY_DEFAULT_STATE } from "../constants/communityRegion";
import {
  emptyCommunityWeeklySchedule,
  normalizeWeeklyScheduleArray,
  type CommunityScheduleRowLegacy,
} from "../lib/communityWeeklySchedule";
import {
  CLASES_CATEGORY_LEGACY_MAP,
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
  CLASES_SKILL_LEVEL_OPTIONS,
  COMUNIDAD_ACCESSIBILITY_OPTIONS,
} from "../taxonomy/communityTaxonomy";

export type CommunityPrimaryCta = "phone" | "whatsapp" | "email" | "website";

export type CommunitySocialLinks = {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  xTwitter: string;
  linkedin: string;
  snapchat: string;
  pinterest: string;
};

/** Optional class-specific useful links for Clases. */
export type ClasesClassLinks = {
  registrationUrl: string;
  paymentUrl: string;
  ticketsUrl: string;
  donationUrl: string;
  classMaterialsUrl: string;
  syllabusUrl: string;
  classGuideUrl: string;
  instructorPageUrl: string;
  studentPortalUrl: string;
  vendorsResourcesUrl: string;
  foodVendorsUrl: string;
  sponsorsUrl: string;
  customLink1Label: string;
  customLink1Url: string;
  customLink2Label: string;
  customLink2Url: string;
};

/** Optional event-specific useful links for Comunidad/Eventos. */
export type ComunidadEventLinks = {
  /** Registration link (separate from registrationRequired flag). */
  registrationUrl: string;
  ticketsUrl: string;
  donationUrl: string;
  eventProgramUrl: string;
  eventGuideUrl: string;
  vendorListUrl: string;
  foodVendorsUrl: string;
  sponsorsUrl: string;
  customLink1Label: string;
  customLink1Url: string;
  customLink2Label: string;
  customLink2Url: string;
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
  /** Country — defaults to empty (US implied) but user-editable for global events. */
  country: string;
  zip: string;
  venue: string;
  addressLine1: string;
  addressLine2: string;
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
  /** Audience slug: ninos | jovenes | adultos | familias | todos */
  audience: string;
  /** si | no | noSeguro */
  registrationRequired: string;
  /** Optional free text */
  bringNote: string;
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
  /** principiante | intermedio | avanzado | todos */
  skillLevel: string;
  /** Optional class-specific useful links. */
  classLinks: ClasesClassLinks;
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
  /** Subset of accessibility option values (multi). */
  accessibilityKeys: string[];
  /** Optional event-specific useful links. */
  eventLinks: ComunidadEventLinks;
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
    snapchat: "",
    pinterest: "",
  };
}

function emptyClassLinks(): ClasesClassLinks {
  return {
    registrationUrl: "",
    paymentUrl: "",
    ticketsUrl: "",
    donationUrl: "",
    classMaterialsUrl: "",
    syllabusUrl: "",
    classGuideUrl: "",
    instructorPageUrl: "",
    studentPortalUrl: "",
    vendorsResourcesUrl: "",
    foodVendorsUrl: "",
    sponsorsUrl: "",
    customLink1Label: "",
    customLink1Url: "",
    customLink2Label: "",
    customLink2Url: "",
  };
}

function emptyEventLinks(): ComunidadEventLinks {
  return {
    registrationUrl: "",
    ticketsUrl: "",
    donationUrl: "",
    eventProgramUrl: "",
    eventGuideUrl: "",
    vendorListUrl: "",
    foodVendorsUrl: "",
    sponsorsUrl: "",
    customLink1Label: "",
    customLink1Url: "",
    customLink2Label: "",
    customLink2Url: "",
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
    country: "",
    zip: "",
    venue: "",
    addressLine1: "",
    addressLine2: "",
    phone: "",
    whatsapp: "",
    smsPhone: "",
    email: "",
    website: "",
    socialLinks: emptySocialLinks(),
    primaryCta: "phone",
    publishConfirmations: emptyPublishConfirmations(),
    audience: "",
    registrationRequired: "",
    bringNote: "",
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
    skillLevel: "",
    classLinks: emptyClassLinks(),
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
    accessibilityKeys: [],
    eventLinks: emptyEventLinks(),
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

const ALLOWED_AUDIENCE = new Set(COMMUNITY_AUDIENCE_OPTIONS.map((o) => o.value));
const ALLOWED_REGISTRATION = new Set(COMMUNITY_REGISTRATION_OPTIONS.map((o) => o.value));
const ALLOWED_CLASES_SKILL = new Set(CLASES_SKILL_LEVEL_OPTIONS.map((o) => o.value));
const ALLOWED_ACCESSIBILITY = new Set(COMUNIDAD_ACCESSIBILITY_OPTIONS.map((o) => o.value));

function normalizeAccessibilityKeys(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const x of raw) {
      const k = String(x ?? "").trim();
      if (ALLOWED_ACCESSIBILITY.has(k)) out.push(k);
    }
    return Array.from(new Set(out));
  }
  if (typeof raw === "string" && raw.trim()) {
    return normalizeAccessibilityKeys(raw.split(","));
  }
  return [];
}

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
    snapchat: String(r.snapchat ?? e.snapchat).trim(),
    pinterest: String(r.pinterest ?? e.pinterest).trim(),
  };
}

function normalizeClassLinks(raw: unknown): ClasesClassLinks {
  const e = emptyClassLinks();
  if (!raw || typeof raw !== "object") return e;
  const r = raw as Partial<ClasesClassLinks>;
  const s = (k: keyof ClasesClassLinks) => String(r[k] ?? e[k]).trim();
  return {
    registrationUrl: s("registrationUrl"),
    paymentUrl: s("paymentUrl"),
    ticketsUrl: s("ticketsUrl"),
    donationUrl: s("donationUrl"),
    classMaterialsUrl: s("classMaterialsUrl"),
    syllabusUrl: s("syllabusUrl"),
    classGuideUrl: s("classGuideUrl"),
    instructorPageUrl: s("instructorPageUrl"),
    studentPortalUrl: s("studentPortalUrl"),
    vendorsResourcesUrl: s("vendorsResourcesUrl"),
    foodVendorsUrl: s("foodVendorsUrl"),
    sponsorsUrl: s("sponsorsUrl"),
    customLink1Label: s("customLink1Label"),
    customLink1Url: s("customLink1Url"),
    customLink2Label: s("customLink2Label"),
    customLink2Url: s("customLink2Url"),
  };
}

function normalizeEventLinks(raw: unknown): ComunidadEventLinks {
  const e = emptyEventLinks();
  if (!raw || typeof raw !== "object") return e;
  const r = raw as Partial<ComunidadEventLinks>;
  const s = (k: keyof ComunidadEventLinks) => String(r[k] ?? e[k]).trim();
  return {
    registrationUrl: s("registrationUrl"),
    ticketsUrl: s("ticketsUrl"),
    donationUrl: s("donationUrl"),
    eventProgramUrl: s("eventProgramUrl"),
    eventGuideUrl: s("eventGuideUrl"),
    vendorListUrl: s("vendorListUrl"),
    foodVendorsUrl: s("foodVendorsUrl"),
    sponsorsUrl: s("sponsorsUrl"),
    customLink1Label: s("customLink1Label"),
    customLink1Url: s("customLink1Url"),
    customLink2Label: s("customLink2Label"),
    customLink2Url: s("customLink2Url"),
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
    category: String(p.category ?? e.category).trim(),
    categoryCustom: String(p.categoryCustom ?? e.categoryCustom),
    description: String(p.description ?? e.description),
    images: normalizeImages(p.images),
    publicCity,
    state: String(p.state ?? e.state).trim() || COMMUNITY_DEFAULT_STATE,
    country: String(p.country ?? e.country).trim(),
    zip: String(p.zip ?? e.zip),
    venue: String(p.venue ?? e.venue),
    addressLine1: String(p.addressLine1 ?? e.addressLine1),
    addressLine2: String((p as Partial<CommunityCommonDraft>).addressLine2 ?? e.addressLine2),
    phone: String(p.phone ?? e.phone),
    whatsapp: String(p.whatsapp ?? e.whatsapp),
    smsPhone: String(p.smsPhone ?? e.smsPhone),
    email: String(p.email ?? e.email),
    website: String(p.website ?? e.website),
    socialLinks: normalizeSocialLinks(p.socialLinks),
    primaryCta: pickPrimaryCta(p.primaryCta, e.primaryCta),
    publishConfirmations: normalizePublishConfirmations(p.publishConfirmations),
    audience: (() => {
      const a = String((p as Partial<CommunityCommonDraft>).audience ?? e.audience).trim();
      return ALLOWED_AUDIENCE.has(a) ? a : "";
    })(),
    registrationRequired: (() => {
      const r = String((p as Partial<CommunityCommonDraft>).registrationRequired ?? e.registrationRequired).trim();
      return ALLOWED_REGISTRATION.has(r) ? r : "";
    })(),
    bringNote: String((p as Partial<CommunityCommonDraft>).bringNote ?? e.bringNote),
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
  let category = common.category;
  if (CLASES_CATEGORY_LEGACY_MAP[category]) category = CLASES_CATEGORY_LEGACY_MAP[category]!;
  const skillRaw = String((p as Partial<ClasesQuickDraft>).skillLevel ?? e.skillLevel).trim();
  const skillLevel = ALLOWED_CLASES_SKILL.has(skillRaw) ? skillRaw : "";
  return {
    ...common,
    category,
    kind: "clases",
    classCostType,
    priceAmount: String(p.priceAmount ?? e.priceAmount),
    priceFrequency,
    priceNote: String(p.priceNote ?? e.priceNote),
    mode,
    weeklySchedule,
    skillLevel,
    classLinks: normalizeClassLinks(p.classLinks),
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
  const accessibilityKeys = normalizeAccessibilityKeys((p as Partial<ComunidadQuickDraft>).accessibilityKeys);
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
    accessibilityKeys,
    eventLinks: normalizeEventLinks(p.eventLinks),
  };
}

import { ensureCommunityPreviewListingId } from "@/app/lib/clasificados/comunidad/communityPreviewListingId";
import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";
import { normalizePaymentMethods } from "@/app/publicar/clases/lib/clasesPaymentMethods";

import { COMMUNITY_DEFAULT_STATE } from "../constants/communityRegion";
import {
  emptyCommunityWeeklySchedule,
  normalizeWeeklyScheduleArray,
  type CommunityScheduleRowLegacy,
} from "../lib/communityWeeklySchedule";
import {
  CLASES_CATEGORY_LEGACY_MAP,
  CLASES_CATEGORY_OPTIONS,
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

/**
 * Gate 2D — explicit organizer-declared schedule shape, closing the owner-QA complaint that
 * "ongoing" must never be silently inferred from a blank end date. `"recurring"` covers both the
 * "recurring weekly" and "ongoing" owner-QA examples (they are the same underlying weekly-pattern
 * data — `startDate`/`endDate` set = a bounded date range, both blank = ongoing/indefinite); the
 * organizer's explicit mode choice plus that existing date-range distinction together produce all
 * 4 named owner-QA display states without inventing a redundant 4th storage value. `"one_time"` is
 * the genuinely new capability — a single date + time window, not a weekly pattern at all.
 */
export type ClasesScheduleMode = "one_time" | "recurring";

export type ComunidadCostType = "gratis" | "pagado" | "donacion" | "noConfirmado";

/** Fields shared across Clases + Comunidad quick drafts. */
export type CommunityCommonDraft = {
  /** Stable UUID for preview Leonix Ad ID before publish. */
  previewListingId: string;
  title: string;
  organizer: string;
  /** Optional logo/photo URL for organizer card. */
  organizerLogoUrl: string;
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
  /**
   * Multiple class types (Gate 2A) — e.g. Boxeo + Yoga + Pilates, max
   * MAX_CLASES_CATEGORIES. `categories[0]` always mirrors the legacy single
   * `category` field for backward compatibility with anything that only
   * knows about one class type.
   */
  categories: string[];
  /** Provider payment-method slugs (Gate 2A) — how STUDENTS pay the instructor, not the Leonix fee. */
  paymentMethods: string[];
  /** Free-text value when "otro" is among paymentMethods. */
  paymentMethodOther: string;
  /** Optional class date-range boundary layered on top of the weekly schedule (Gate 2A). Blank = ongoing/ordinary recurring class (unchanged legacy behavior). */
  startDate: string;
  endDate: string;
  /**
   * Gate 2D — multiple audiences (e.g. Jóvenes + Adultos). `audiences[0]` always mirrors the
   * legacy single `audience` field, same mirroring pattern as `categories`/`category`.
   */
  audiences: string[];
  /** Gate 2D — "Materiales / equipo", distinct from bringNote ("Qué llevar"). */
  materialsNote: string;
  /** Gate 2D — "Requisitos / antes de asistir", distinct from bringNote and materialsNote. */
  requirementsNote: string;
  /** Gate 2D — explicit organizer-declared schedule shape (see ClasesScheduleMode). Legacy listings default to "recurring" (their only prior shape). */
  scheduleMode: ClasesScheduleMode;
  /** Used only when scheduleMode === "one_time": a single date, not a weekly pattern. */
  oneTimeDate: string;
  oneTimeStart: string;
  oneTimeEnd: string;
};

/** Owner-approved cap (Gate 2A Section C) — enough for real multi-discipline classes, not endless taxonomy selection. */
export const MAX_CLASES_CATEGORIES = 4;

/** Gate 2D — sensible cap so audience selection stays a real signal, not endless taxonomy selection. */
export const MAX_CLASES_AUDIENCES = 3;

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
  /** Qué NO llevar / restricciones — comunidad-owned, separate from bringNote (what to bring/know). */
  restrictionsNote: string;
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
    previewListingId: ensureCommunityPreviewListingId(""),
    title: "",
    organizer: "",
    organizerLogoUrl: "",
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
    categories: [],
    paymentMethods: [],
    paymentMethodOther: "",
    startDate: "",
    endDate: "",
    audiences: [],
    materialsNote: "",
    requirementsNote: "",
    scheduleMode: "recurring",
    oneTimeDate: "",
    oneTimeStart: "",
    oneTimeEnd: "",
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
    restrictionsNote: "",
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
/** Valid (non-placeholder) Clases category slugs, incl. "otro". */
const ALLOWED_CLASES_CATEGORY = new Set(
  CLASES_CATEGORY_OPTIONS.filter((o) => o.value).map((o) => o.value),
);

/**
 * Normalizes the Gate 2A multi-category selection: applies the legacy slug
 * map per entry, drops unknown/blank slugs, dedupes, and caps at
 * MAX_CLASES_CATEGORIES. Falls back to `[legacyCategory]` when the caller
 * never sent a `categories` array (old drafts / old published listings) so
 * `categories[0]` always mirrors the resolved single `category`.
 */
function normalizeClasesCategories(raw: unknown, legacyCategory: string): string[] {
  const source = Array.isArray(raw) && raw.length > 0 ? raw : legacyCategory ? [legacyCategory] : [];
  const out: string[] = [];
  for (const x of source) {
    let slug = String(x ?? "").trim();
    if (!slug) continue;
    if (CLASES_CATEGORY_LEGACY_MAP[slug]) slug = CLASES_CATEGORY_LEGACY_MAP[slug]!;
    if (!ALLOWED_CLASES_CATEGORY.has(slug)) continue;
    if (!out.includes(slug)) out.push(slug);
    if (out.length >= MAX_CLASES_CATEGORIES) break;
  }
  return out;
}

/**
 * Gate 2D — normalizes the multi-audience selection: drops unknown/blank slugs, dedupes, caps at
 * MAX_CLASES_AUDIENCES. Falls back to `[legacyAudience]` when the caller never sent an
 * `audiences` array (old drafts / old published listings) so `audiences[0]` always mirrors the
 * resolved single `audience`.
 */
function normalizeClasesAudiences(raw: unknown, legacyAudience: string): string[] {
  const source = Array.isArray(raw) && raw.length > 0 ? raw : legacyAudience ? [legacyAudience] : [];
  const out: string[] = [];
  for (const x of source) {
    const slug = String(x ?? "").trim();
    if (!slug || !ALLOWED_AUDIENCE.has(slug)) continue;
    if (!out.includes(slug)) out.push(slug);
    if (out.length >= MAX_CLASES_AUDIENCES) break;
  }
  return out;
}

const CLASES_SCHEDULE_MODE = new Set<ClasesScheduleMode>(["one_time", "recurring"]);

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
    previewListingId: ensureCommunityPreviewListingId(p.previewListingId),
    title: String(p.title ?? e.title),
    organizer: String(p.organizer ?? e.organizer),
    organizerLogoUrl: String((p as Partial<CommunityCommonDraft>).organizerLogoUrl ?? e.organizerLogoUrl).trim(),
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
  const categories = normalizeClasesCategories((p as Partial<ClasesQuickDraft>).categories, category);
  /** `category` (legacy single field) always mirrors the first multi-select entry. */
  category = categories[0] ?? category;
  const skillRaw = String((p as Partial<ClasesQuickDraft>).skillLevel ?? e.skillLevel).trim();
  const skillLevel = ALLOWED_CLASES_SKILL.has(skillRaw) ? skillRaw : "";
  const paymentMethods = normalizePaymentMethods((p as Partial<ClasesQuickDraft>).paymentMethods);
  const audiences = normalizeClasesAudiences((p as Partial<ClasesQuickDraft>).audiences, common.audience);
  const audience = audiences[0] ?? common.audience;
  const scheduleModeRaw = (p as Partial<ClasesQuickDraft>).scheduleMode;
  const scheduleMode = CLASES_SCHEDULE_MODE.has(scheduleModeRaw as ClasesScheduleMode)
    ? (scheduleModeRaw as ClasesScheduleMode)
    : e.scheduleMode;
  return {
    ...common,
    audience,
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
    categories,
    paymentMethods,
    paymentMethodOther: String((p as Partial<ClasesQuickDraft>).paymentMethodOther ?? e.paymentMethodOther).trim(),
    startDate: String((p as Partial<ClasesQuickDraft>).startDate ?? e.startDate).trim(),
    endDate: String((p as Partial<ClasesQuickDraft>).endDate ?? e.endDate).trim(),
    audiences,
    materialsNote: String((p as Partial<ClasesQuickDraft>).materialsNote ?? e.materialsNote),
    requirementsNote: String((p as Partial<ClasesQuickDraft>).requirementsNote ?? e.requirementsNote),
    scheduleMode,
    oneTimeDate: String((p as Partial<ClasesQuickDraft>).oneTimeDate ?? e.oneTimeDate).trim(),
    oneTimeStart: String((p as Partial<ClasesQuickDraft>).oneTimeStart ?? e.oneTimeStart).trim(),
    oneTimeEnd: String((p as Partial<ClasesQuickDraft>).oneTimeEnd ?? e.oneTimeEnd).trim(),
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
    restrictionsNote: String((p as Partial<ComunidadQuickDraft>).restrictionsNote ?? e.restrictionsNote),
  };
}

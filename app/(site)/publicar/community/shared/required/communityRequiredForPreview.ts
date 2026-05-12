import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import { isActiveDayValid, isWeeklyScheduleSatisfied } from "../lib/communityWeeklySchedule";
import { normalizeSocialUrlForOpen, normalizeWebsiteForOpen } from "../lib/communityWebsiteAndSocial";
import type {
  ClasesQuickDraft,
  ComunidadQuickDraft,
} from "../types/communityQuickDraft";

const st = (v: unknown): string => String(v ?? "").trim();

export type GateResult = { ok: true } | { ok: false; issues: string[] };

const GATE_CLASES = {
  es: {
    title: "Título de la clase",
    organizer: "Organizador / instructor / negocio",
    category: "Tipo / categoría de la clase",
    categoryOther: "Describe la categoría (Otra)",
    cost: "Tipo de cobro (gratis o pagada)",
    priceAmount: "Precio (clase pagada)",
    priceFrequency: "Precio por (clase pagada)",
    mode: "Modalidad",
    weeklyNeedOne: "Horario semanal: activa al menos un día con hora de inicio y fin",
    weeklyIncomplete: "Horario semanal: completa inicio y fin en cada día activo",
    weeklyInvalidRange: "Horario semanal: la hora de inicio debe ser antes de la hora de fin",
    description: "Descripción corta",
    image: "Medios (imagen o PDF del flyer, o URL)",
    cta: "Al menos un método de contacto (teléfono, WhatsApp o email)",
    publicCity: "Ciudad donde se ofrece la clase",
    publicCityInvalid: "Selecciona una ciudad válida de la lista de NorCal.",
    phoneDigits: "Teléfono: ingresa 10 dígitos o déjalo vacío",
    whatsappDigits: "WhatsApp: ingresa 10 dígitos o déjalo vacío",
    smsDigits: "Mensajes de texto: ingresa 10 dígitos o déjalo vacío",
    websiteInvalid: "Sitio web: ingresa una URL válida (ej. https://… o www.…)",
    socialFacebook: "Facebook: URL no válida",
    socialInstagram: "Instagram: URL no válida",
    socialTiktok: "TikTok: URL no válida",
    socialYoutube: "YouTube: URL no válida",
    socialX: "X (Twitter): URL no válida",
    socialLinkedin: "LinkedIn: URL no válida",
  },
  en: {
    title: "Class title",
    organizer: "Organizer / instructor / business",
    category: "Class type / category",
    categoryOther: "Describe the category (Other)",
    cost: "Cost type (free or paid)",
    priceAmount: "Price (paid class)",
    priceFrequency: "Price per (paid class)",
    mode: "Mode",
    weeklyNeedOne: "Weekly schedule: enable at least one day with start and end time",
    weeklyIncomplete: "Weekly schedule: fill start and end for each active day",
    weeklyInvalidRange: "Weekly schedule: start time must be before end time",
    description: "Short description",
    image: "Media (image or flyer PDF, or URL)",
    cta: "At least one contact method (phone, WhatsApp, or email)",
    publicCity: "City where the class is offered",
    publicCityInvalid: "Select a valid city from the NorCal list.",
    phoneDigits: "Phone: enter 10 digits or leave blank",
    whatsappDigits: "WhatsApp: enter 10 digits or leave blank",
    smsDigits: "Text number: enter 10 digits or leave blank",
    websiteInvalid: "Website: enter a valid URL (e.g. https://… or www.…)",
    socialFacebook: "Facebook: invalid URL",
    socialInstagram: "Instagram: invalid URL",
    socialTiktok: "TikTok: invalid URL",
    socialYoutube: "YouTube: invalid URL",
    socialX: "X (Twitter): invalid URL",
    socialLinkedin: "LinkedIn: invalid URL",
  },
} as const;

const GATE_COMUNIDAD = {
  es: {
    title: "Título del evento",
    organizer: "Organizador",
    category: "Tipo / categoría del evento",
    categoryOther: "Describe la categoría (Otra)",
    eventCost: "Costo del evento",
    admissionNote: "Nota de admisión (cuando es pagado o donación)",
    date: "Fecha del evento",
    eventEndInvalid: "La fecha de fin no puede ser anterior a la fecha de inicio",
    weeklyNeedOne: "Días y horarios: activa al menos un día con hora de inicio y fin",
    weeklyIncomplete: "Días y horarios: completa inicio y fin en cada día activo",
    weeklyInvalidRange: "Días y horarios: la hora de inicio debe ser antes de la hora de fin",
    description: "Descripción corta",
    image: "Medios (imagen o PDF del flyer, o URL)",
    cta: "Al menos un método de contacto (teléfono, WhatsApp o email)",
    publicCity: "Ciudad donde se realiza el evento",
    publicCityInvalid: "Selecciona una ciudad válida de la lista de NorCal.",
    scheduleNeedWeeklyOrSession:
      "Cuándo ocurre el evento: activa días en el horario semanal o completa horario puntual (inicio y fin).",
    phoneDigits: "Teléfono: ingresa 10 dígitos o déjalo vacío",
    whatsappDigits: "WhatsApp: ingresa 10 dígitos o déjalo vacío",
    smsDigits: "Mensajes de texto: ingresa 10 dígitos o déjalo vacío",
    websiteInvalid: "Sitio web: ingresa una URL válida (ej. https://… o www.…)",
    socialFacebook: "Facebook: URL no válida",
    socialInstagram: "Instagram: URL no válida",
    socialTiktok: "TikTok: URL no válida",
    socialYoutube: "YouTube: URL no válida",
    socialX: "X (Twitter): URL no válida",
    socialLinkedin: "LinkedIn: URL no válida",
  },
  en: {
    title: "Event title",
    organizer: "Organizer",
    category: "Event type / category",
    categoryOther: "Describe the category (Other)",
    eventCost: "Event cost",
    admissionNote: "Admission note (when paid or donation)",
    date: "Event date",
    eventEndInvalid: "End date cannot be before the start date",
    weeklyNeedOne: "Days & times: enable at least one day with start and end time",
    weeklyIncomplete: "Days & times: fill start and end for each active day",
    weeklyInvalidRange: "Days & times: start time must be before end time",
    description: "Short description",
    image: "Media (image or flyer PDF, or URL)",
    cta: "At least one contact method (phone, WhatsApp, or email)",
    publicCity: "City where the event takes place",
    publicCityInvalid: "Select a valid city from the NorCal list.",
    scheduleNeedWeeklyOrSession:
      "When the event runs: enable days in the weekly schedule or fill one-time start and end times.",
    phoneDigits: "Phone: enter 10 digits or leave blank",
    whatsappDigits: "WhatsApp: enter 10 digits or leave blank",
    smsDigits: "Text number: enter 10 digits or leave blank",
    websiteInvalid: "Website: enter a valid URL (e.g. https://… or www.…)",
    socialFacebook: "Facebook: invalid URL",
    socialInstagram: "Instagram: invalid URL",
    socialTiktok: "TikTok: invalid URL",
    socialYoutube: "YouTube: invalid URL",
    socialX: "X (Twitter): invalid URL",
    socialLinkedin: "LinkedIn: invalid URL",
  },
} as const;

function pushSocialGateIssues(
  issues: string[],
  sl: ClasesQuickDraft["socialLinks"],
  L: {
    socialFacebook: string;
    socialInstagram: string;
    socialTiktok: string;
    socialYoutube: string;
    socialX: string;
    socialLinkedin: string;
  }
): void {
  if (st(sl.facebook) && !normalizeSocialUrlForOpen(sl.facebook)) issues.push(L.socialFacebook);
  if (st(sl.instagram) && !normalizeSocialUrlForOpen(sl.instagram)) issues.push(L.socialInstagram);
  if (st(sl.tiktok) && !normalizeSocialUrlForOpen(sl.tiktok)) issues.push(L.socialTiktok);
  if (st(sl.youtube) && !normalizeSocialUrlForOpen(sl.youtube)) issues.push(L.socialYoutube);
  if (st(sl.xTwitter) && !normalizeSocialUrlForOpen(sl.xTwitter)) issues.push(L.socialX);
  if (st(sl.linkedin) && !normalizeSocialUrlForOpen(sl.linkedin)) issues.push(L.socialLinkedin);
}

function hasContact(d: { phone: string; whatsapp: string; email: string }): boolean {
  return Boolean(st(d.phone) || st(d.whatsapp) || st(d.email));
}

function hasMainImage(d: { images: { url: string }[] }): boolean {
  return d.images.some((x) => st(x.url));
}

function pushWeeklyScheduleGateIssues(
  issues: string[],
  rows: DayHoursRow[],
  L: {
    weeklyNeedOne: string;
    weeklyIncomplete: string;
    weeklyInvalidRange: string;
  }
): void {
  if (isWeeklyScheduleSatisfied(rows)) return;
  let anyActive = false;
  for (const r of rows) {
    if (r.closed) continue;
    anyActive = true;
    if (!st(r.open) || !st(r.close)) {
      issues.push(L.weeklyIncomplete);
      return;
    }
    if (!isActiveDayValid(r)) {
      issues.push(L.weeklyInvalidRange);
      return;
    }
  }
  if (!anyActive) issues.push(L.weeklyNeedOne);
  else issues.push(L.weeklyIncomplete);
}

function comunidadScheduleOk(d: ComunidadQuickDraft): boolean {
  if (isWeeklyScheduleSatisfied(d.weeklySchedule)) return true;
  const start = st(d.eventSessionStart);
  const end = st(d.eventSessionEnd);
  if (!start || !end) return false;
  return isActiveDayValid({ day: "mon", closed: false, open: start, close: end });
}

export function gateClasesQuickPreview(d: ClasesQuickDraft, lang: Lang = "es"): GateResult {
  const L = GATE_CLASES[lang];
  const issues: string[] = [];
  if (!st(d.title)) issues.push(L.title);
  if (!st(d.organizer)) issues.push(L.organizer);
  if (!st(d.category)) issues.push(L.category);
  if (d.category === "otro" && !st(d.categoryCustom)) issues.push(L.categoryOther);
  if (d.classCostType !== "gratis" && d.classCostType !== "pagada") {
    issues.push(L.cost);
  }
  if (d.classCostType === "pagada") {
    if (!st(d.priceAmount)) issues.push(L.priceAmount);
    if (!st(d.priceFrequency)) issues.push(L.priceFrequency);
  }
  if (!d.mode) issues.push(L.mode);
  pushWeeklyScheduleGateIssues(issues, d.weeklySchedule, L);
  if (!st(d.description)) issues.push(L.description);
  if (!hasMainImage(d)) issues.push(L.image);
  if (!hasContact(d)) issues.push(L.cta);
  const cityRaw = st(d.publicCity);
  if (!cityRaw) issues.push(L.publicCity);
  else if (!getCanonicalCityName(cityRaw)) issues.push(L.publicCityInvalid);
  if (st(d.phone) && digitsOnly(d.phone).length !== 10) issues.push(L.phoneDigits);
  if (st(d.whatsapp) && digitsOnly(d.whatsapp).length !== 10) issues.push(L.whatsappDigits);
  if (st(d.smsPhone) && digitsOnly(d.smsPhone).length !== 10) issues.push(L.smsDigits);
  if (st(d.website) && !normalizeWebsiteForOpen(d.website)) issues.push(L.websiteInvalid);
  pushSocialGateIssues(issues, d.socialLinks, L);
  return issues.length ? { ok: false, issues } : { ok: true };
}

export function gateComunidadQuickPreview(d: ComunidadQuickDraft, lang: Lang = "es"): GateResult {
  const L = GATE_COMUNIDAD[lang];
  const issues: string[] = [];
  if (!st(d.title)) issues.push(L.title);
  if (!st(d.organizer)) issues.push(L.organizer);
  if (!st(d.category)) issues.push(L.category);
  if (d.category === "otro" && !st(d.categoryCustom)) issues.push(L.categoryOther);
  if (!d.eventCost) issues.push(L.eventCost);
  if ((d.eventCost === "pagado" || d.eventCost === "donacion") && !st(d.admissionNote)) {
    issues.push(L.admissionNote);
  }
  if (!st(d.date)) issues.push(L.date);
  if (st(d.eventEndDate) && st(d.date) && d.eventEndDate < d.date) {
    issues.push(L.eventEndInvalid);
  }
  if (!comunidadScheduleOk(d)) issues.push(L.scheduleNeedWeeklyOrSession);
  if (!st(d.description)) issues.push(L.description);
  if (!hasMainImage(d)) issues.push(L.image);
  if (!hasContact(d)) issues.push(L.cta);
  const cityRawC = st(d.publicCity);
  if (!cityRawC) issues.push(L.publicCity);
  else if (!getCanonicalCityName(cityRawC)) issues.push(L.publicCityInvalid);
  if (st(d.phone) && digitsOnly(d.phone).length !== 10) issues.push(L.phoneDigits);
  if (st(d.whatsapp) && digitsOnly(d.whatsapp).length !== 10) issues.push(L.whatsappDigits);
  if (st(d.smsPhone) && digitsOnly(d.smsPhone).length !== 10) issues.push(L.smsDigits);
  if (st(d.website) && !normalizeWebsiteForOpen(d.website)) issues.push(L.websiteInvalid);
  pushSocialGateIssues(issues, d.socialLinks, L);
  return issues.length ? { ok: false, issues } : { ok: true };
}

/**
 * Paid class publish gate: blocks final publish for paid clases until a paid-publishing
 * activation flow exists. Free clases skip this. Comunidad never hits this.
 */
export function shouldBlockClasesPaidPublish(d: ClasesQuickDraft): boolean {
  return d.classCostType === "pagada";
}

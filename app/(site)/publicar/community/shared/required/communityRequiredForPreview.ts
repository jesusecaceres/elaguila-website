import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import { isActiveDayValid } from "../lib/communityWeeklySchedule";
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
    publicCityInvalid: "Ciudad: elige una ciudad válida de la lista NorCal",
    phoneDigits: "Teléfono: ingresa 10 dígitos o déjalo vacío",
    whatsappDigits: "WhatsApp: ingresa 10 dígitos o déjalo vacío",
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
    publicCityInvalid: "City: pick a valid NorCal list city",
    phoneDigits: "Phone: enter 10 digits or leave blank",
    whatsappDigits: "WhatsApp: enter 10 digits or leave blank",
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
    publicCityInvalid: "Ciudad: elige una ciudad válida de la lista NorCal",
    phoneDigits: "Teléfono: ingresa 10 dígitos o déjalo vacío",
    whatsappDigits: "WhatsApp: ingresa 10 dígitos o déjalo vacío",
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
    publicCityInvalid: "City: pick a valid NorCal list city",
    phoneDigits: "Phone: enter 10 digits or leave blank",
    whatsappDigits: "WhatsApp: enter 10 digits or leave blank",
  },
} as const;

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
  let okActive = false;
  for (const r of rows) {
    if (r.closed) continue;
    if (!st(r.open) || !st(r.close)) {
      issues.push(L.weeklyIncomplete);
      return;
    }
    if (!isActiveDayValid(r)) {
      issues.push(L.weeklyInvalidRange);
      return;
    }
    okActive = true;
  }
  if (!okActive) issues.push(L.weeklyNeedOne);
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
  pushWeeklyScheduleGateIssues(issues, d.weeklySchedule, L);
  if (!st(d.description)) issues.push(L.description);
  if (!hasMainImage(d)) issues.push(L.image);
  if (!hasContact(d)) issues.push(L.cta);
  const cityRawC = st(d.publicCity);
  if (!cityRawC) issues.push(L.publicCity);
  else if (!getCanonicalCityName(cityRawC)) issues.push(L.publicCityInvalid);
  if (st(d.phone) && digitsOnly(d.phone).length !== 10) issues.push(L.phoneDigits);
  if (st(d.whatsapp) && digitsOnly(d.whatsapp).length !== 10) issues.push(L.whatsappDigits);
  return issues.length ? { ok: false, issues } : { ok: true };
}

/**
 * Paid class publish gate: blocks final publish for paid clases until a paid-publishing
 * activation flow exists. Free clases skip this. Comunidad never hits this.
 */
export function shouldBlockClasesPaidPublish(d: ClasesQuickDraft): boolean {
  return d.classCostType === "pagada";
}

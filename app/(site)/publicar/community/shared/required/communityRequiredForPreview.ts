import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

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
    schedule: "Horario / fechas",
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
    schedule: "Schedule / dates",
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
    startTime: "Hora de inicio",
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
    startTime: "Start time",
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
  const hasSchedule = d.scheduleRows.some((r) => st(r.day) || st(r.time));
  if (!hasSchedule) issues.push(L.schedule);
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
  if (!st(d.startTime)) issues.push(L.startTime);
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

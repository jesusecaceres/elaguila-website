import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import type { BuscoQuickDraft } from "./buscoQuickTypes";

const st = (v: unknown): string => String(v ?? "").trim();

export type BuscoGateResult = { ok: true } | { ok: false; issues: string[] };

const GATE = {
  es: {
    type: "Tipo de búsqueda",
    typeOther: "Describe qué buscas (Otro)",
    title: "Título",
    description: "Descripción breve",
    city: "Ciudad",
    cityInvalid: "Selecciona una ciudad válida de la lista.",
    contact: "Teléfono, mensaje de texto, WhatsApp o correo electrónico",
    phoneDigits: "Teléfono: ingresa 10 dígitos o déjalo vacío",
    emailInvalid: "Correo: ingresa un email válido",
    confirmations: "Confirma los 3 recuadros antes de continuar",
  },
  en: {
    type: "Request type",
    typeOther: "Describe what you are looking for (Other)",
    title: "Title",
    description: "Short description",
    city: "City",
    cityInvalid: "Select a valid city from the list.",
    contact: "Phone, text message, WhatsApp, or email",
    phoneDigits: "Phone: enter 10 digits or leave blank",
    emailInvalid: "Email: enter a valid email address",
    confirmations: "Check all 3 confirmation boxes before continuing",
  },
} as const;

function isProbablySafeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Section J — at least one direct contact channel (any of phone/SMS/WhatsApp/email). */
function hasAnyDirectContact(d: BuscoQuickDraft): boolean {
  const phoneDig = digitsOnly(d.phone);
  const smsDig = digitsOnly(d.smsPhone);
  const waDig = digitsOnly(d.whatsapp);
  const email = st(d.email);
  return (
    phoneDig.length >= 10 ||
    smsDig.length >= 10 ||
    waDig.length >= 10 ||
    (email.length > 0 && isProbablySafeEmail(email))
  );
}

/** Section P — Preview is blocked until required fields, at least one contact, and all 3
 *  publish confirmations are satisfied (the stricter Community-family pattern from Gate 3). */
export function gateBuscoQuickPreview(d: BuscoQuickDraft, lang: Lang = "es"): BuscoGateResult {
  const L = GATE[lang];
  const issues: string[] = [];

  if (!st(d.buscoType)) issues.push(L.type);
  if (d.buscoType === "otro" && !st(d.buscoTypeCustom)) issues.push(L.typeOther);
  if (!st(d.title)) issues.push(L.title);
  if (!st(d.description)) issues.push(L.description);

  const cityRaw = st(d.city);
  if (!cityRaw) {
    issues.push(L.city);
  } else if (!getCanonicalCityName(cityRaw)) {
    issues.push(L.cityInvalid);
  }

  const phoneDig = digitsOnly(d.phone);
  if (phoneDig.length > 0 && phoneDig.length < 10) issues.push(L.phoneDigits);
  const email = st(d.email);
  if (email.length > 0 && !isProbablySafeEmail(email)) issues.push(L.emailInvalid);
  if (!hasAnyDirectContact(d)) issues.push(L.contact);

  const c = d.publishConfirmations;
  if (!c.infoTruthful || !c.mediaAccurate || !c.rulesAccepted) issues.push(L.confirmations);

  return issues.length ? { ok: false, issues } : { ok: true };
}

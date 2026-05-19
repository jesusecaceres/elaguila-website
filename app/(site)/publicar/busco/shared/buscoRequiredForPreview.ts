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
    contact: "Teléfono / WhatsApp o correo electrónico",
    phoneDigits: "Teléfono: ingresa 10 dígitos o déjalo vacío si usas correo",
    emailInvalid: "Correo: ingresa un email válido",
  },
  en: {
    type: "Request type",
    typeOther: "Describe what you are looking for (Other)",
    title: "Title",
    description: "Short description",
    city: "City",
    cityInvalid: "Select a valid city from the list.",
    contact: "Phone / WhatsApp or email",
    phoneDigits: "Phone: enter 10 digits or leave blank if using email",
    emailInvalid: "Email: enter a valid email address",
  },
} as const;

function isProbablySafeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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
  const email = st(d.email);
  const hasPhone = phoneDig.length >= 10;
  const hasEmail = email.length > 0;

  if (!hasPhone && !hasEmail) issues.push(L.contact);
  if (phoneDig.length > 0 && phoneDig.length < 10) issues.push(L.phoneDigits);
  if (hasEmail && !isProbablySafeEmail(email)) issues.push(L.emailInvalid);

  return issues.length ? { ok: false, issues } : { ok: true };
}

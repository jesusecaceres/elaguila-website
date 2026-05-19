import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import type { MascotasPerdidosQuickDraft } from "./mascotasPerdidosQuickTypes";

const st = (v: unknown): string => String(v ?? "").trim();

export type MascotasPerdidosGateResult = { ok: true } | { ok: false; issues: string[] };

const GATE = {
  es: {
    noticeType: "Tipo de aviso",
    title: "Título",
    description: "Descripción breve",
    city: "Ciudad",
    cityInvalid: "Selecciona una ciudad válida de la lista.",
    lastSeenLocation: "Última ubicación vista / lugar",
    contactPhone: "Teléfono / WhatsApp",
    phoneDigits: "Teléfono / WhatsApp: ingresa 10 dígitos",
    emailInvalid: "Correo: ingresa un email válido",
    image: "Imagen",
  },
  en: {
    noticeType: "Notice type",
    title: "Title",
    description: "Short description",
    city: "City",
    cityInvalid: "Select a valid city from the list.",
    lastSeenLocation: "Last seen / location",
    contactPhone: "Phone / WhatsApp",
    phoneDigits: "Phone / WhatsApp: enter 10 digits",
    emailInvalid: "Email: enter a valid email address",
    image: "Image",
  },
} as const;

function isProbablySafeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function gateMascotasPerdidosQuickPreview(
  d: MascotasPerdidosQuickDraft,
  lang: Lang = "es",
): MascotasPerdidosGateResult {
  const L = GATE[lang];
  const issues: string[] = [];

  if (!st(d.noticeType)) issues.push(L.noticeType);
  if (!st(d.title)) issues.push(L.title);
  if (!st(d.description)) issues.push(L.description);

  const cityRaw = st(d.city);
  if (!cityRaw) {
    issues.push(L.city);
  } else if (!getCanonicalCityName(cityRaw)) {
    issues.push(L.cityInvalid);
  }

  if (!st(d.lastSeenLocation)) issues.push(L.lastSeenLocation);

  const phoneDig = digitsOnly(d.contactPhone);
  if (phoneDig.length < 10) {
    issues.push(phoneDig.length === 0 ? L.contactPhone : L.phoneDigits);
  }

  const email = st(d.email);
  if (email && !isProbablySafeEmail(email)) issues.push(L.emailInvalid);

  if (!st(d.imageDataUrl)) issues.push(L.image);

  return issues.length ? { ok: false, issues } : { ok: true };
}

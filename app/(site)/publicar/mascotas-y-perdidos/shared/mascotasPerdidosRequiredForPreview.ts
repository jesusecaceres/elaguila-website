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
    lastSeenLocation: "Área aproximada",
    image: "Al menos una foto",
    contact: "Al menos un método de contacto (teléfono, texto, WhatsApp o correo)",
    phoneDigits: "Teléfono: ingresa 10 dígitos o déjalo vacío",
    smsDigits: "Mensajes de texto: ingresa 10 dígitos o déjalo vacío",
    whatsappDigits: "WhatsApp: ingresa 10 dígitos o déjalo vacío",
    emailInvalid: "Correo: ingresa un email válido",
    rewardAmount: "Monto de la recompensa",
    confirmations: "Marca las tres confirmaciones de Leonix antes de continuar",
  },
  en: {
    noticeType: "Notice type",
    title: "Title",
    description: "Short description",
    city: "City",
    cityInvalid: "Select a valid city from the list.",
    lastSeenLocation: "Approximate area",
    image: "At least one photo",
    contact: "At least one contact method (phone, text, WhatsApp, or email)",
    phoneDigits: "Phone: enter 10 digits or leave blank",
    smsDigits: "Text number: enter 10 digits or leave blank",
    whatsappDigits: "WhatsApp: enter 10 digits or leave blank",
    emailInvalid: "Email: enter a valid email address",
    rewardAmount: "Reward amount",
    confirmations: "Check all three Leonix confirmations before continuing",
  },
} as const;

function isProbablySafeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function hasAnyDirectContact(d: MascotasPerdidosQuickDraft): boolean {
  return (
    digitsOnly(d.phone).length === 10 ||
    digitsOnly(d.smsPhone).length === 10 ||
    digitsOnly(d.whatsapp).length === 10 ||
    (st(d.email) !== "" && isProbablySafeEmail(d.email))
  );
}

/**
 * Gate 3 — conditional required fields per notice type, at least one direct contact method, and
 * (Section O — stricter than the Comunidad/Clases pattern by explicit owner instruction) the three
 * Leonix confirmations, all gating Preview itself here, not just the final Publish step.
 */
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
  if (d.images.length === 0) issues.push(L.image);

  if (st(d.phone) && digitsOnly(d.phone).length !== 10) issues.push(L.phoneDigits);
  if (st(d.smsPhone) && digitsOnly(d.smsPhone).length !== 10) issues.push(L.smsDigits);
  if (st(d.whatsapp) && digitsOnly(d.whatsapp).length !== 10) issues.push(L.whatsappDigits);
  const email = st(d.email);
  if (email && !isProbablySafeEmail(email)) issues.push(L.emailInvalid);
  if (!hasAnyDirectContact(d)) issues.push(L.contact);

  const rewardEligible = d.noticeType === "mascota-perdida" || d.noticeType === "objeto-perdido";
  if (rewardEligible && d.offersReward && !st(d.rewardAmount)) issues.push(L.rewardAmount);

  if (!d.publishConfirmations.infoTruthful || !d.publishConfirmations.mediaAccurate || !d.publishConfirmations.rulesAccepted) {
    issues.push(L.confirmations);
  }

  return issues.length ? { ok: false, issues } : { ok: true };
}

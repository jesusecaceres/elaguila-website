import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import {
  enVentaContactDigits,
  enVentaWhatsappDigitsValid,
  formatEnVentaPhoneDisplay,
} from "./enVentaPhoneDisplay";

export type EnVentaContactActionId = "call" | "sms" | "email" | "whatsapp";

export type EnVentaContactAction = {
  id: EnVentaContactActionId;
  label: string;
  href: string;
  /** Formatted visible number when shown alongside the CTA (display only). */
  displayNumber?: string;
};

const SMS_PREFILL_ES = "Hola, ¿sigue disponible este artículo?";
const SMS_PREFILL_EN = "Hi — is this item still available?";
const EMAIL_SUBJ_ES = "Interés en tu anuncio Leonix";
const EMAIL_SUBJ_EN = "Question about your Leonix listing";

function whatsappDigitsOnly(state: EnVentaFreeApplicationState): string {
  return enVentaContactDigits(state.whatsapp);
}

function preferredContactRank(id: EnVentaContactActionId, pref: EnVentaFreeApplicationState["contactMethod"]): number {
  const base: Record<EnVentaContactActionId, number> = {
    whatsapp: 0,
    call: 1,
    sms: 2,
    email: 3,
  };
  let rank = base[id];
  if (pref === "whatsapp" && id === "whatsapp") rank -= 10;
  if (pref === "phone" && (id === "call" || id === "sms")) rank -= 10;
  if (pref === "email" && id === "email") rank -= 10;
  if (pref === "both" && (id === "call" || id === "sms" || id === "email")) rank -= 5;
  return rank;
}

/**
 * Build buyer-facing contact actions from draft/preview fields.
 * WhatsApp appears when the seller entered a WhatsApp number — not only when preferred method is WhatsApp.
 */
export function buildEnVentaContactActions(
  state: EnVentaFreeApplicationState,
  lang: "es" | "en"
): EnVentaContactAction[] {
  const pref = state.contactMethod;
  const phoneDigits = enVentaContactDigits(state.phone);
  const phoneDisplay = formatEnVentaPhoneDisplay(state.phone);
  const email = state.email.trim();
  const waDigits = whatsappDigitsOnly(state);
  const waValid = enVentaWhatsappDigitsValid(waDigits);
  const waDisplay = formatEnVentaPhoneDisplay(state.whatsapp);

  const showPhone = (pref === "phone" || pref === "both") && Boolean(phoneDigits);
  const showEmail = (pref === "email" || pref === "both") && Boolean(email);
  const showWa = waValid;

  const actions: EnVentaContactAction[] = [];

  if (showWa) {
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${waDigits}?text=${text}`,
      displayNumber: waDisplay || undefined,
    });
  }

  if (showPhone) {
    actions.push({
      id: "call",
      label: lang === "es" ? "Llamar" : "Call",
      href: `tel:${phoneDigits}`,
      displayNumber: phoneDisplay || undefined,
    });
    const smsBody = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "sms",
      label: "SMS",
      href: `sms:${phoneDigits}?body=${smsBody}`,
      displayNumber: phoneDisplay || undefined,
    });
  }

  if (showEmail) {
    const sub = encodeURIComponent(lang === "es" ? EMAIL_SUBJ_ES : EMAIL_SUBJ_EN);
    const body = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "email",
      label: lang === "es" ? "Correo" : "Email",
      href: `mailto:${email}?subject=${sub}&body=${body}`,
    });
  }

  actions.sort((a, b) => preferredContactRank(a.id, pref) - preferredContactRank(b.id, pref));
  return actions;
}

export type EnVentaLiveContactInput = {
  lang: "es" | "en";
  contactChannel: string;
  phoneTel: string;
  /** Dedicated WhatsApp digits (Leonix:whatsapp pair or legacy channel=whatsapp on phone). */
  whatsappTel?: string;
  email: string;
  gateAllowCall?: boolean;
  gateAllowSms?: boolean;
  whatsappEnabled?: boolean;
};

/** Live detail / anuncio contact CTAs — WhatsApp when seller provided a number, regardless of preferred channel. */
export function buildEnVentaLiveContactActions(input: EnVentaLiveContactInput): EnVentaContactAction[] {
  const prefs = enVentaLiveContactPrefs(input.contactChannel);
  const phoneDigits = enVentaContactDigits(input.phoneTel);
  const phoneDisplay = formatEnVentaPhoneDisplay(input.phoneTel);
  const email = input.email.trim();
  const dedicatedWa = enVentaContactDigits(input.whatsappTel ?? "");
  const legacyWa =
    prefs.allowsWhatsApp && !dedicatedWa && phoneDigits ? phoneDigits : "";
  const waDigits = dedicatedWa || legacyWa;
  const waValid = enVentaWhatsappDigitsValid(waDigits);
  const waDisplay = formatEnVentaPhoneDisplay(input.whatsappTel ?? (legacyWa ? input.phoneTel : ""));
  const allowCall = input.gateAllowCall !== false;
  const allowSms = input.gateAllowSms !== false;
  const waOk = input.whatsappEnabled !== false;

  const actions: EnVentaContactAction[] = [];
  const lang = input.lang;
  const pref = input.contactChannel.trim().toLowerCase();

  if (waValid && waOk) {
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${waDigits}?text=${text}`,
      displayNumber: waDisplay || undefined,
    });
  }

  if (prefs.allowsPhone && phoneDigits && allowCall) {
    actions.push({
      id: "call",
      label: lang === "es" ? "Llamar" : "Call",
      href: `tel:${phoneDigits}`,
      displayNumber: phoneDisplay || undefined,
    });
  }

  if (prefs.allowsPhone && phoneDigits && allowSms) {
    const smsBody = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "sms",
      label: "SMS",
      href: `sms:${phoneDigits}?body=${smsBody}`,
      displayNumber: phoneDisplay || undefined,
    });
  }

  if (prefs.allowsEmail && email) {
    const sub = encodeURIComponent(lang === "es" ? EMAIL_SUBJ_ES : EMAIL_SUBJ_EN);
    const body = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "email",
      label: lang === "es" ? "Correo" : "Email",
      href: `mailto:${email}?subject=${sub}&body=${body}`,
    });
  }

  const rank = (id: EnVentaContactActionId): number => {
    const base: Record<EnVentaContactActionId, number> = {
      whatsapp: 0,
      call: 1,
      sms: 2,
      email: 3,
    };
    let r = base[id];
    if (pref === "whatsapp" && id === "whatsapp") r -= 10;
    if (pref === "phone" && (id === "call" || id === "sms")) r -= 10;
    if (pref === "email" && id === "email") r -= 10;
    if (pref === "both" && (id === "call" || id === "sms" || id === "email")) r -= 5;
    return r;
  };

  actions.sort((a, b) => rank(a.id) - rank(b.id));
  return actions;
}

export function buildEnVentaPrimaryContactHref(
  state: EnVentaFreeApplicationState,
  lang: "es" | "en"
): string {
  const method = state.contactMethod;
  const phoneDigits = enVentaContactDigits(state.phone);
  const email = state.email.trim();
  const waDigits = whatsappDigitsOnly(state);
  const smsBody = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
  const sub = encodeURIComponent(lang === "es" ? EMAIL_SUBJ_ES : EMAIL_SUBJ_EN);

  if (method === "phone" && phoneDigits) return `tel:${phoneDigits}`;
  if (method === "email" && email) {
    return `mailto:${email}?subject=${sub}&body=${smsBody}`;
  }
  if (method === "whatsapp" && enVentaWhatsappDigitsValid(waDigits)) {
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    return `https://wa.me/${waDigits}?text=${text}`;
  }
  if (enVentaWhatsappDigitsValid(waDigits)) {
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    return `https://wa.me/${waDigits}?text=${text}`;
  }
  if (method === "both") {
    if (phoneDigits) return `tel:${phoneDigits}`;
    if (email) return `mailto:${email}?subject=${sub}&body=${smsBody}`;
  }
  return "#";
}

export function enVentaLiveContactPrefs(contactChannel: string): {
  allowsPhone: boolean;
  allowsEmail: boolean;
  allowsWhatsApp: boolean;
} {
  const ch = contactChannel.trim().toLowerCase();
  if (ch === "phone") return { allowsPhone: true, allowsEmail: false, allowsWhatsApp: false };
  if (ch === "email") return { allowsPhone: false, allowsEmail: true, allowsWhatsApp: false };
  if (ch === "whatsapp") return { allowsPhone: false, allowsEmail: false, allowsWhatsApp: true };
  if (ch === "both") return { allowsPhone: true, allowsEmail: true, allowsWhatsApp: false };
  return { allowsPhone: true, allowsEmail: true, allowsWhatsApp: false };
}

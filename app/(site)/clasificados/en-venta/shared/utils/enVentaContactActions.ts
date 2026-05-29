import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";

export type EnVentaContactActionId = "call" | "sms" | "email" | "whatsapp";

export type EnVentaContactAction = {
  id: EnVentaContactActionId;
  label: string;
  href: string;
};

const SMS_PREFILL_ES = "Hola, ¿sigue disponible este artículo?";
const SMS_PREFILL_EN = "Hi — is this item still available?";
const EMAIL_SUBJ_ES = "Interés en tu anuncio Leonix";
const EMAIL_SUBJ_EN = "Question about your Leonix listing";

function whatsappDigitsOnly(state: EnVentaFreeApplicationState): string {
  return state.whatsapp.replace(/\D/g, "");
}

/**
 * Build buyer-facing contact actions respecting seller `contactMethod`.
 * WhatsApp only when method is `whatsapp` and a WhatsApp number exists — never phone fallback.
 */
export function buildEnVentaContactActions(
  state: EnVentaFreeApplicationState,
  lang: "es" | "en"
): EnVentaContactAction[] {
  const pref = state.contactMethod;
  const phone = state.phone.replace(/\s/g, "");
  const email = state.email.trim();
  const waDigits = whatsappDigitsOnly(state);
  const waValid = waDigits.length >= 8;

  const showPhone = (pref === "phone" || pref === "both") && Boolean(phone);
  const showEmail = (pref === "email" || pref === "both") && Boolean(email);
  const showWa = pref === "whatsapp" && waValid;

  const actions: EnVentaContactAction[] = [];

  if (showPhone) {
    actions.push({
      id: "call",
      label: lang === "es" ? "Llamar" : "Call",
      href: `tel:${phone}`,
    });
    const smsBody = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "sms",
      label: "SMS",
      href: `sms:${phone}?body=${smsBody}`,
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

  if (showWa) {
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "whatsapp",
      label: lang === "es" ? "WhatsApp" : "WhatsApp",
      href: `https://wa.me/${waDigits}?text=${text}`,
    });
  }

  const rank = (id: EnVentaContactActionId): number => {
    const order: Record<EnVentaContactActionId, number> = {
      whatsapp: 0,
      call: 1,
      sms: 2,
      email: 3,
    };
    return order[id];
  };

  actions.sort((a, b) => rank(a.id) - rank(b.id));
  return actions;
}

export type EnVentaLiveContactInput = {
  lang: "es" | "en";
  contactChannel: string;
  phoneTel: string;
  email: string;
  gateAllowCall?: boolean;
  gateAllowSms?: boolean;
  whatsappEnabled?: boolean;
};

/** Live detail / anuncio contact CTAs — WhatsApp only when channel is explicitly whatsapp. */
export function buildEnVentaLiveContactActions(input: EnVentaLiveContactInput): EnVentaContactAction[] {
  const prefs = enVentaLiveContactPrefs(input.contactChannel);
  const phone = input.phoneTel.trim();
  const email = input.email.trim();
  const waDigits =
    prefs.allowsWhatsApp && phone ? phone.replace(/\D/g, "").slice(0, 15) : "";
  const waValid = waDigits.length >= 8;
  const allowCall = input.gateAllowCall !== false;
  const allowSms = input.gateAllowSms !== false;
  const waOk = input.whatsappEnabled !== false;

  const actions: EnVentaContactAction[] = [];
  const lang = input.lang;

  if (prefs.allowsWhatsApp && waValid && waOk) {
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${waDigits}?text=${text}`,
    });
  }

  if (prefs.allowsPhone && phone && allowCall) {
    actions.push({
      id: "call",
      label: lang === "es" ? "Llamar" : "Call",
      href: `tel:${phone}`,
    });
  }

  if (prefs.allowsPhone && phone && allowSms) {
    const smsBody = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "sms",
      label: "SMS",
      href: `sms:${phone}?body=${smsBody}`,
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
    const order: Record<EnVentaContactActionId, number> = {
      whatsapp: 0,
      call: 1,
      sms: 2,
      email: 3,
    };
    return order[id];
  };

  actions.sort((a, b) => rank(a.id) - rank(b.id));
  return actions;
}

export function buildEnVentaPrimaryContactHref(
  state: EnVentaFreeApplicationState,
  lang: "es" | "en"
): string {
  const method = state.contactMethod;
  const phone = state.phone.replace(/\s/g, "");
  const email = state.email.trim();
  const waDigits = whatsappDigitsOnly(state);
  const smsBody = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
  const sub = encodeURIComponent(lang === "es" ? EMAIL_SUBJ_ES : EMAIL_SUBJ_EN);

  if (method === "phone" && phone) return `tel:${phone}`;
  if (method === "email" && email) {
    return `mailto:${email}?subject=${sub}&body=${smsBody}`;
  }
  if (method === "whatsapp" && waDigits.length >= 8) {
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    return `https://wa.me/${waDigits}?text=${text}`;
  }
  if (method === "both") {
    if (phone) return `tel:${phone}`;
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

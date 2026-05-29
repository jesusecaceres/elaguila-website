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
      label: lang === "es" ? "WhatsApp (recomendado)" : "WhatsApp (recommended)",
      href: `https://wa.me/${waDigits}?text=${text}`,
    });
  }

  const rank = (id: EnVentaContactActionId): number => {
    const orderPhone = { call: 0, sms: 1, whatsapp: 2, email: 3 } as const;
    const orderEmail = { email: 0, call: 1, sms: 2, whatsapp: 3 } as const;
    const orderWa = { whatsapp: 0, call: 1, sms: 2, email: 3 } as const;
    const orderBoth = { call: 0, sms: 1, email: 2, whatsapp: 3 } as const;
    if (pref === "phone") return orderPhone[id];
    if (pref === "email") return orderEmail[id];
    if (pref === "whatsapp") return orderWa[id];
    return orderBoth[id];
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

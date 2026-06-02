import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { trimText } from "./serviciosProfileSanitize";
import { resolveServiciosWhatsAppHref } from "./serviciosWhatsAppHref";

export type ServiciosQuoteDestinationKind = "sms" | "whatsapp" | "tel" | "mailto" | "website";

/** Universal quote / inquiry copy for Servicios (clasificados). */
export const SERVICIOS_UNIVERSAL_QUOTE_MESSAGE_ES =
  "Hola, vi tu negocio en Leonix Media y estoy buscando un servicio. ¿Estás disponible para hablar ahora?";

export const SERVICIOS_UNIVERSAL_QUOTE_MESSAGE_EN =
  "Hi, I saw your business on Leonix Media and I'm looking for a service. Are you available to talk now?";

export function serviciosUniversalQuoteMessage(lang: ServiciosLang): string {
  return lang === "en" ? SERVICIOS_UNIVERSAL_QUOTE_MESSAGE_EN : SERVICIOS_UNIVERSAL_QUOTE_MESSAGE_ES;
}

export function appendWhatsAppPrefill(href: string, text: string): string {
  const t = href.trim();
  if (!t) return t;
  const enc = encodeURIComponent(text);
  if (/[?&]text=/.test(t)) return t;
  const sep = t.includes("?") ? "&" : "?";
  return `${t}${sep}text=${enc}`;
}

export function buildQuoteSmsHref(
  rawPhone: string | undefined | null,
  lang: ServiciosLang,
): string | null {
  const d = trimText(rawPhone ?? "").replace(/\D/g, "");
  if (d.length < 8) return null;
  const body = serviciosUniversalQuoteMessage(lang);
  return `sms:${d}?body=${encodeURIComponent(body)}`;
}

export function buildMailtoQuoteHref(mailtoBase: string, lang: ServiciosLang): string {
  const subject = encodeURIComponent(
    lang === "en" ? "Quote request from Leonix Media" : "Solicitud de cotización desde Leonix Media",
  );
  const body = encodeURIComponent(serviciosUniversalQuoteMessage(lang));
  const sep = mailtoBase.includes("?") ? "&" : "?";
  return `${mailtoBase}${sep}subject=${subject}&body=${body}`;
}

/** Secondary “Correo” row — neutral inquiry (not quote-specific). */
export function buildServiciosSecondaryContactMailto(
  emailMailtoBase: string,
  lang: ServiciosLang,
): { mailtoHref: string; messagePlain: string } {
  const subject = lang === "en" ? "Inquiry from Leonix Media" : "Consulta desde Leonix Media";
  const messagePlain =
    lang === "en"
      ? "Hi, I saw your business on Leonix Media and I would like to get in touch."
      : "Hola, vi tu negocio en Leonix Media y me gustaría contactarte.";
  const sep = emailMailtoBase.includes("?") ? "&" : "?";
  const mailtoHref = `${emailMailtoBase}${sep}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messagePlain)}`;
  return { mailtoHref, messagePlain };
}

/**
 * Quote / message CTA destination for the contact panel.
 * Priority: `quoteMessagePhone` (SMS — not WhatsApp) → WhatsApp link only when provided → email.
 * `quoteMessagePhone` is the dedicated “número para mensajes/cotizaciones”; never treat it as WhatsApp.
 */
export function resolveServiciosQuoteDestination(
  profile: ServiciosProfileResolved,
  lang: ServiciosLang,
): {
  kind: ServiciosQuoteDestinationKind;
  href: string;
} | null {
  const c = profile.contact;
  if (c.quoteMessagePhone) {
    const href = buildQuoteSmsHref(c.quoteMessagePhone, lang);
    if (href) return { kind: "sms", href };
  }
  const wa = resolveServiciosWhatsAppHref({
    whatsappRaw: c.socialLinks?.whatsapp,
    websiteUrl: c.websiteHref,
  });
  if (wa) return { kind: "whatsapp", href: wa };
  if (c.emailMailtoHref) {
    return { kind: "mailto", href: buildMailtoQuoteHref(c.emailMailtoHref, lang) };
  }
  return null;
}

type SecondaryId = "whatsapp" | "call" | "callOffice" | "email" | "website";

export type ServiciosSecondaryAction = {
  id: SecondaryId;
  href: string;
  /** i18n label applied by the panel */
  labelKey: "whatsapp" | "call" | "callOffice" | "email" | "visitWebsite";
};

function normHttpOrTel(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

/** mailto:user@x.com?foo=bar → user@x.com path for dedup */
function mailtoAddrKey(h: string): string | null {
  const s = h.trim();
  if (!s.toLowerCase().startsWith("mailto:")) return null;
  const rest = s.slice(7).split("?")[0].split("#")[0];
  return decodeURIComponent(rest).toLowerCase();
}

function waMeDigits(href: string): string | null {
  const t = href.trim().toLowerCase();
  const m = /wa\.me\/(\d+)/.exec(t) || /api\.whatsapp\.com\/send\?phone=(\d+)/.exec(t);
  return m?.[1] ?? null;
}

function smsHrefDigits(href: string): string | null {
  const s = href.trim();
  const m = /^sms:([\d+]+)/i.exec(s);
  if (!m?.[1]) return null;
  return m[1].replace(/\D/g, "");
}

function sameAsPrimary(
  primary: { href: string; kind: ServiciosQuoteDestinationKind } | null,
  candidateHref: string,
  candidateKind: "whatsapp" | "tel" | "mailto" | "website",
): boolean {
  if (!primary) return false;
  if (primary.kind === "mailto" && candidateKind === "mailto") {
    const p = mailtoAddrKey(primary.href);
    const c = mailtoAddrKey(candidateHref);
    if (p && c) return p === c;
  }
  if (primary.kind === "sms" && candidateKind === "tel") {
    const pd = smsHrefDigits(primary.href);
    const cd = candidateHref.replace(/^tel:/i, "").replace(/\D/g, "");
    if (pd && cd) return pd === cd;
  }
  if (primary.kind === "whatsapp" && candidateKind === "whatsapp") {
    const pd = waMeDigits(primary.href);
    const cd = waMeDigits(candidateHref);
    if (pd && cd) return pd === cd;
  }
  return normHttpOrTel(candidateHref) === normHttpOrTel(primary.href);
}

/**
 * Live secondary actions (deduped against primary). Order: WhatsApp, mobile call, office call, email, website, maps.
 */
export function buildServiciosSecondaryActions(
  profile: ServiciosProfileResolved,
  primary: { href: string; kind: ServiciosQuoteDestinationKind } | null,
): ServiciosSecondaryAction[] {
  const c = profile.contact;
  const out: ServiciosSecondaryAction[] = [];
  const candKindById: Record<SecondaryId, "whatsapp" | "tel" | "mailto" | "website"> = {
    whatsapp: "whatsapp",
    call: "tel",
    callOffice: "tel",
    email: "mailto",
    website: "website",
  };
  const push = (a: ServiciosSecondaryAction) => {
    if (!a.href) return;
    const candKind = candKindById[a.id];
    if (primary && sameAsPrimary(primary, a.href, candKind)) return;
    if (out.some((x) => normHttpOrTel(x.href) === normHttpOrTel(a.href))) return;
    if (
      a.id === "email" &&
      out.some((x) => x.id === "email" && mailtoAddrKey(x.href) === mailtoAddrKey(a.href))
    )
      return;
    out.push(a);
  };

  const waSecondary = resolveServiciosWhatsAppHref({
    whatsappRaw: c.socialLinks?.whatsapp,
    websiteUrl: c.websiteHref,
  });
  if (waSecondary) {
    push({ id: "whatsapp", href: waSecondary, labelKey: "whatsapp" });
  }
  if (c.phoneTelHref) {
    push({ id: "call", href: c.phoneTelHref, labelKey: "call" });
  }
  if (c.phoneOfficeTelHref && c.phoneOfficeDisplay) {
    push({ id: "callOffice", href: c.phoneOfficeTelHref, labelKey: "callOffice" });
  }
  if (c.emailMailtoHref) {
    push({ id: "email", href: c.emailMailtoHref, labelKey: "email" });
  }
  if (c.websiteHref) {
    push({ id: "website", href: c.websiteHref, labelKey: "visitWebsite" });
  }
  return out;
}

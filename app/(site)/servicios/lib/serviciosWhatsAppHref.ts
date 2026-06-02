import { trimText } from "./serviciosProfileSanitize";

/** Strip spaces, parentheses, dashes, dots; keep digits only. */
export function stripServiciosWhatsAppDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Normalize advertiser WhatsApp digits for wa.me (min 8; US 10-digit → prefix 1).
 */
export function normalizeServiciosWhatsAppDigits(raw: string): string | null {
  let d = stripServiciosWhatsAppDigits(raw);
  if (d.length < 8) return null;
  if (d.length === 10) d = `1${d}`;
  return d;
}

function tryParseWhatsAppUrl(raw: string): URL | null {
  const t = trimText(raw);
  if (!t) return null;
  try {
    if (/^whatsapp:\/\//i.test(t)) return new URL(t);
    if (/^wa\.me\//i.test(t) || /^api\.whatsapp\.com\//i.test(t)) {
      return new URL(`https://${t.replace(/^\/+/, "")}`);
    }
    const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
    return new URL(withScheme);
  } catch {
    return null;
  }
}

/** True when the URL is a WhatsApp deep link or wa.me / api.whatsapp.com handoff (not a generic website). */
export function isRecognizedServiciosWhatsAppUrl(raw: string): boolean {
  const u = tryParseWhatsAppUrl(raw);
  if (!u) return false;
  if (u.protocol === "whatsapp:") return true;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "wa.me") return true;
  if (host === "api.whatsapp.com") return true;
  if (host === "chat.whatsapp.com") return true;
  if (host === "whatsapp.com" || host.endsWith(".whatsapp.com")) {
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return path !== "/" && path.length > 1;
  }
  return false;
}

/** Sanitize a stored WhatsApp URL; rejects regular http(s) websites. */
export function sanitizeServiciosWhatsAppUrl(raw: string | undefined | null): string | null {
  const t = trimText(raw ?? "");
  if (!t || !isRecognizedServiciosWhatsAppUrl(t)) return null;
  const u = tryParseWhatsAppUrl(t);
  if (!u) return null;
  if (u.protocol === "whatsapp:") return u.toString();
  if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  return null;
}

export function buildServiciosWhatsAppWaMeHrefFromDigits(digits: string): string | null {
  const d = normalizeServiciosWhatsAppDigits(digits);
  if (!d) return null;
  return `https://wa.me/${d}`;
}

export type ResolveServiciosWhatsAppInput = {
  /** Wire `whatsappUrl`, draft `socialWhatsappUrl`, or resolved `socialLinks.whatsapp`. */
  whatsappRaw?: string | null;
  /** Used to reject accidental duplicate of the business website. */
  websiteUrl?: string | null;
};

function normUrlForCompare(href: string): string {
  try {
    return new URL(href.trim()).toString().toLowerCase();
  } catch {
    return href.trim().toLowerCase();
  }
}

/**
 * Priority: valid WhatsApp URL → wa.me from number → null (never website).
 */
export function resolveServiciosWhatsAppHref(input: ResolveServiciosWhatsAppInput): string | null {
  const raw = trimText(input.whatsappRaw ?? "");
  if (!raw) return null;

  const websiteNorm = input.websiteUrl?.trim()
    ? normUrlForCompare(
        /^https?:\/\//i.test(input.websiteUrl!.trim())
          ? input.websiteUrl!.trim()
          : `https://${input.websiteUrl!.trim().replace(/^\/+/, "")}`,
      )
    : "";

  const rejectIfWebsite = (href: string): string | null => {
    if (!websiteNorm) return href;
    try {
      if (normUrlForCompare(href) === websiteNorm) return null;
    } catch {
      /* keep href */
    }
    return href;
  };

  const waUrl = sanitizeServiciosWhatsAppUrl(raw);
  if (waUrl) return rejectIfWebsite(waUrl);

  if (/^https?:\/\//i.test(raw) || /^www\./i.test(raw)) return null;

  const fromDigits = buildServiciosWhatsAppWaMeHrefFromDigits(raw);
  if (fromDigits) return rejectIfWebsite(fromDigits);

  return null;
}

/** Digits for wa.me / CTA sheet from a resolved WhatsApp href or bare number. */
export function extractServiciosWhatsAppDigits(href: string): string {
  const t = href.trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  const waMe = /wa\.me\/(\d+)/.exec(lower);
  if (waMe?.[1]) return waMe[1].replace(/\D/g, "");
  const api = /api\.whatsapp\.com\/send\?[^#]*phone=(\d+)/.exec(lower) || /phone=(\d+)/.exec(lower);
  if (api?.[1]) return api[1].replace(/\D/g, "");
  if (/^whatsapp:/i.test(t)) {
    const m = /phone=(\d+)/.exec(lower);
    if (m?.[1]) return m[1].replace(/\D/g, "");
  }
  if (!/^https?:\/\//i.test(t) && !/^whatsapp:/i.test(t)) {
    return normalizeServiciosWhatsAppDigits(t) ?? "";
  }
  return "";
}

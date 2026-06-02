import { trimText } from "./serviciosProfileSanitize";
import type { ServiciosProfileResolved } from "../types/serviciosBusinessProfile";

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

function whatsAppHost(u: URL): string {
  return u.hostname.toLowerCase().replace(/^www\./, "");
}

/** Bare whatsapp.com / www.whatsapp.com homepage — never contact or social row. */
export function isServiciosGenericWhatsAppHomepage(raw: string): boolean {
  const u = tryParseWhatsAppUrl(raw);
  if (!u) return false;
  const host = whatsAppHost(u);
  const path = u.pathname.replace(/\/+$/, "") || "/";
  if (host === "whatsapp.com") return path === "/";
  if (host === "wa.me" && path === "/") return true;
  return false;
}

/** wa.me/message, chat.whatsapp.com, whatsapp.com/channel — not direct chat by number. */
export function isServiciosWhatsAppProfileSocialUrl(raw: string): boolean {
  const u = tryParseWhatsAppUrl(raw);
  if (!u) return false;
  const host = whatsAppHost(u);
  const path = u.pathname.replace(/\/+$/, "") || "/";

  if (host === "wa.me" && /^\/message\//i.test(path)) return true;
  if (host === "chat.whatsapp.com") return true;
  if (host === "whatsapp.com" || host.endsWith(".whatsapp.com")) {
    if (path === "/") return false;
    if (path.startsWith("/channel")) return true;
    return path.length > 1;
  }
  return false;
}

/** Direct chat: wa.me/<digits>, api.whatsapp.com/send, whatsapp://send?phone= */
export function isServiciosWhatsAppDirectMessageUrl(raw: string): boolean {
  const u = tryParseWhatsAppUrl(raw);
  if (!u) return false;
  if (isServiciosWhatsAppProfileSocialUrl(raw)) return false;

  if (u.protocol === "whatsapp:") {
    return /send|phone/i.test(u.toString());
  }

  const host = whatsAppHost(u);
  if (host === "wa.me") {
    const seg = u.pathname.replace(/^\/+/, "").split("/")[0] ?? "";
    if (!seg || seg.toLowerCase() === "message") return false;
    return /^\d+$/.test(seg);
  }
  if (host === "api.whatsapp.com") {
    return u.pathname.includes("send") || u.searchParams.has("phone");
  }
  return false;
}

function normUrlForCompare(href: string): string {
  try {
    return new URL(href.trim()).toString().toLowerCase();
  } catch {
    return href.trim().toLowerCase();
  }
}

export type ResolveServiciosWhatsAppContactInput = {
  /** WhatsApp number, wa.me digits, or direct-message URL — never profile/channel links. */
  whatsappRaw?: string | null;
  websiteUrl?: string | null;
};

function rejectIfWebsite(href: string, websiteUrl?: string | null): string | null {
  const websiteNorm = websiteUrl?.trim()
    ? normUrlForCompare(
        /^https?:\/\//i.test(websiteUrl.trim())
          ? websiteUrl.trim()
          : `https://${websiteUrl.trim().replace(/^\/+/, "")}`,
      )
    : "";
  if (!websiteNorm) return href;
  try {
    if (normUrlForCompare(href) === websiteNorm) return null;
  } catch {
    /* keep href */
  }
  return href;
}

/** Contact CTA: number → wa.me; else valid direct-message URL only. */
export function resolveServiciosWhatsAppContactHref(
  input: ResolveServiciosWhatsAppContactInput,
): string | null {
  const raw = trimText(input.whatsappRaw ?? "");
  if (!raw) return null;

  if (isServiciosWhatsAppProfileSocialUrl(raw)) return null;

  if (isServiciosWhatsAppDirectMessageUrl(raw)) {
    const u = tryParseWhatsAppUrl(raw);
    if (!u) return null;
    const href = u.protocol === "whatsapp:" ? u.toString() : u.toString();
    return rejectIfWebsite(href, input.websiteUrl);
  }

  if (/^https?:\/\//i.test(raw) || /^www\./i.test(raw)) return null;

  const fromDigits = buildServiciosWhatsAppWaMeHrefFromDigits(raw);
  if (fromDigits) return rejectIfWebsite(fromDigits, input.websiteUrl);

  return null;
}

/**
 * Valid for “Síguenos” social row (profile/channel field only at map time).
 * Allows wa.me/message, wa.me/digits, api.whatsapp.com/send, whatsapp.com/channel — not generic homepages.
 */
export function isServiciosWhatsAppSocialRowUrl(raw: string): boolean {
  const t = trimText(raw);
  if (!t || isServiciosGenericWhatsAppHomepage(t)) return false;
  return isServiciosWhatsAppProfileSocialUrl(t) || isServiciosWhatsAppDirectMessageUrl(t);
}

/** Social row href from profile/channel field — opens in new tab from Contact Hub. */
export function resolveServiciosWhatsAppSocialRowHref(raw: string | undefined | null): string | null {
  const t = trimText(raw ?? "");
  if (!t || !isServiciosWhatsAppSocialRowUrl(t)) return null;
  const u = tryParseWhatsAppUrl(t);
  if (!u) return null;
  if (u.protocol === "whatsapp:") return u.toString();
  if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  return null;
}

/** @deprecated Prefer resolveServiciosWhatsAppSocialRowHref */
export function resolveServiciosWhatsAppProfileHref(raw: string | undefined | null): string | null {
  return resolveServiciosWhatsAppSocialRowHref(raw);
}

export function buildServiciosWhatsAppWaMeHrefFromDigits(digits: string): string | null {
  const d = normalizeServiciosWhatsAppDigits(digits);
  if (!d) return null;
  return `https://wa.me/${d}`;
}

/** @deprecated Use resolveServiciosWhatsAppContactHref — kept for imports that expect contact-only behavior. */
export function resolveServiciosWhatsAppHref(input: ResolveServiciosWhatsAppContactInput): string | null {
  return resolveServiciosWhatsAppContactHref(input);
}

/** Single source for all direct WhatsApp contact CTAs (number → wa.me; never profile/channel/homepage). */
export function resolveServiciosProfileDirectWhatsAppHref(
  contact: Pick<ServiciosProfileResolved["contact"], "socialLinks" | "websiteHref">,
): string | null {
  return resolveServiciosWhatsAppContactHref({
    whatsappRaw: contact.socialLinks?.whatsapp,
    websiteUrl: contact.websiteHref,
  });
}

/** Digits for wa.me / CTA sheet from a resolved WhatsApp contact href or bare number. */
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

/**
 * Comida Local contact formatting — mirrors safe En Venta phone patterns; no Restaurante imports.
 */

import type { ComidaLocalSocialPlatform } from "./comidaLocalTypes";
import {
  enVentaContactDigits,
  enVentaPhoneInputDigits,
  formatEnVentaPhoneInput,
} from "@/app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay";
import {
  buildInternationalWhatsAppWaMeHrefWithText,
  normalizeInternationalWhatsAppDigits,
} from "@/app/lib/whatsapp/internationalWhatsApp";

export function formatComidaLocalPhoneInput(raw: string): string {
  return formatEnVentaPhoneInput(raw);
}

export function normalizeComidaLocalPhoneDigits(raw: string): string {
  return enVentaPhoneInputDigits(raw);
}

export function buildComidaLocalTelHref(phone: string): string {
  const digits = enVentaContactDigits(phone);
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  const trimmed = phone.trim();
  return trimmed ? `tel:${trimmed}` : "";
}

export function buildComidaLocalSmsHref(phone: string, body?: string): string {
  const digits = enVentaContactDigits(phone);
  if (digits.length < 10) return "";
  const dest =
    digits.length === 10
      ? `+1${digits}`
      : digits.startsWith("1") && digits.length === 11
        ? `+${digits}`
        : digits;
  const base = `sms:${dest}`;
  if (body?.trim()) return `${base}?body=${encodeURIComponent(body.trim())}`;
  return base;
}

const COMIDA_LOCAL_WA_PREFILL_ES =
  "Hola, vi tu puesto de comida en Leonix Media. Me gustaría recibir más información, por favor.";

/**
 * Gate COMIDA-LOCAL-1 — adopts the shared international WhatsApp contract.
 *
 * The previous implementation was a bare digit-strip with NO country-code handling and no
 * length bounds: a US number typed the way the form itself formats it — (408) 555-1234 — became
 * `https://wa.me/4085551234`, missing the "1" country code, i.e. a WhatsApp link that does not
 * resolve to the seller. Three stray digits became `https://wa.me/123`. Both were rendered to
 * the public as a working WhatsApp CTA.
 *
 * `internationalWhatsApp` (ported in Gate SERVICIOS-1) is the platform's proven rule: a bare
 * 10-digit number is assumed US and gets its "1"; anything else is trusted to carry its own
 * country code and is accepted from 8 to 15 digits (E.164 max). It returns null when the input
 * cannot resolve to a real number — this wrapper keeps the existing `string` contract by
 * returning "", which every call site already treats as "no WhatsApp action".
 *
 * The prefilled Spanish message is unchanged.
 */
export function buildComidaLocalWhatsAppHref(
  raw: string,
  businessName?: string
): string {
  const name = (businessName ?? "").trim();
  const text = name
    ? `Hola, vi ${name} en Leonix Media. Me gustaría recibir más información, por favor.`
    : COMIDA_LOCAL_WA_PREFILL_ES;
  return buildInternationalWhatsAppWaMeHrefWithText(raw, text) ?? "";
}

/**
 * Gate COMIDA-LOCAL-1 — whether a WhatsApp value can actually produce a working link. Uses the
 * shared normalizer so validation and rendering agree exactly: previously validation counted
 * digits through `normalizeComidaLocalPhoneDigits`, which TRUNCATES to 10 digits, so it was
 * measuring a different number than the one the href was built from.
 */
export function hasUsableComidaLocalWhatsApp(raw: string): boolean {
  return normalizeInternationalWhatsAppDigits(raw) !== null;
}

function stripWww(host: string): string {
  let h = host.toLowerCase();
  while (h.startsWith("www.")) h = h.slice(4);
  return h;
}

function hostAllowedForPlatform(hostname: string, platform: ComidaLocalSocialPlatform): boolean {
  const h = stripWww(hostname);
  switch (platform) {
    case "facebook":
      return h === "facebook.com" || h.endsWith(".facebook.com") || h === "fb.com" || h.endsWith(".fb.com");
    case "instagram":
      return h === "instagram.com" || h.endsWith(".instagram.com");
    case "tiktok":
      return h === "tiktok.com" || h.endsWith(".tiktok.com");
    default:
      return false;
  }
}

export function isValidComidaLocalExternalUrl(raw: string | undefined): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return false;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize social input for a platform; returns null if empty or invalid.
 */
export function normalizeComidaLocalSocialInput(
  raw: string,
  platform: ComidaLocalSocialPlatform
): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;

  if (!t.includes(".") && !t.includes("/")) {
    const handle = t.replace(/^@+/, "");
    if (!handle) return null;
    switch (platform) {
      case "instagram":
        return `https://www.instagram.com/${handle}/`;
      case "facebook":
        return `https://www.facebook.com/${handle}`;
      case "tiktok":
        return `https://www.tiktok.com/@${handle}`;
      default:
        return null;
    }
  }

  const candidate = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!hostAllowedForPlatform(u.hostname, platform)) return null;
    return u.href;
  } catch {
    return null;
  }
}

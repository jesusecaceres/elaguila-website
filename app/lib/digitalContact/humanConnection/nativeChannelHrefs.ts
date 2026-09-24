/**
 * Pure native-channel destination builders (Build 07).
 * Shared by CTA launchers + launch asserts. No transport ownership — only hrefs.
 */

import { getCleanPhone } from "@/app/components/cta/ctaDataHelpers";
import { isValidPublicEmail, isValidPublicPhoneDigits } from "./channelValidation";

/**
 * 3-digit "N11" service codes (211/311/411/511/611/711/811/911) and the 988 crisis line are
 * dialed as their bare code — never prefixed with +1. Without this, `isValidPublicPhoneDigits`
 * (>= 8 digits) rejects them outright, and even a relaxed length check would still have produced
 * an invalid `tel:+988`/`tel:+1988`.
 */
function isShortServiceCode(digits: string): boolean {
  return digits === "988" || /^[2-9]11$/.test(digits);
}

export function buildTelHref(phone: string | null | undefined): string | null {
  const raw = String(phone ?? "").trim();
  if (!raw) return null;
  if (/^tel:/i.test(raw)) {
    if (/^tel:\s*javascript:/i.test(raw)) return null;
    return raw;
  }
  const digits = getCleanPhone(raw);
  if (isShortServiceCode(digits)) return `tel:${digits}`;
  if (!isValidPublicPhoneDigits(digits)) return null;
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:+${digits}`;
}

export function buildSmsHref(phone: string | null | undefined, body = ""): string | null {
  const digits = getCleanPhone(phone);
  if (!isValidPublicPhoneDigits(digits)) return null;
  const base =
    digits.length === 10
      ? `+1${digits}`
      : digits.length === 11 && digits.startsWith("1")
        ? `+${digits}`
        : digits;
  const b = String(body ?? "").trim();
  return b ? `sms:${base}?body=${encodeURIComponent(b)}` : `sms:${base}`;
}

export function buildWhatsAppUrl(phone: string | null | undefined, body = ""): string | null {
  const digits = getCleanPhone(phone);
  if (!isValidPublicPhoneDigits(digits)) return null;
  const b = String(body ?? "").trim();
  return b
    ? `https://wa.me/${digits}?text=${encodeURIComponent(b)}`
    : `https://wa.me/${digits}`;
}

/**
 * Servicios Absolute Final Golden Closeout (2026-09-17, Gate 11/13) — owner-reproduced mailto
 * failure (fake test email, real owner email, and a real Autos business email all failed the
 * same way — canceled/provisional navigation in DevTools). ROOT CAUSE: this previously built the
 * query string with `URLSearchParams.toString()`, which serializes as
 * `application/x-www-form-urlencoded` — spaces become `+`, not `%20`. RFC 6068 (the mailto URI
 * spec) never defines `+` as a space; it is purely an HTML-form convention. A `subject`/`body`
 * containing `+` characters instead of real spaces is enough for some mail-handler registrations
 * (notably on Windows) to treat the URI as malformed and silently fail to launch the client —
 * exactly a "canceled" navigation with no visible email app opening. Building the query manually
 * with `encodeURIComponent` (native JS percent-encoding, spaces -> `%20`) produces a spec-
 * compliant mailto URI. Verified against the owner's own Unicode business-name test case
 * ("Plomería León del Valle QA") and a multi-line body.
 */
export function buildMailtoHref(
  email: string | null | undefined,
  subject = "",
  body = "",
): string | null {
  const em = String(email ?? "").trim();
  if (!isValidPublicEmail(em)) return null;
  if (/[<>"]/.test(em) || em.toLowerCase().includes("javascript:")) return null;
  const sub = String(subject ?? "").trim();
  const bod = String(body ?? "").trim();
  const parts: string[] = [];
  if (sub) parts.push(`subject=${encodeURIComponent(sub)}`);
  if (bod) parts.push(`body=${encodeURIComponent(bod)}`);
  const qs = parts.join("&");
  return qs ? `mailto:${em}?${qs}` : `mailto:${em}`;
}

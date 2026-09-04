/**
 * Pure native-channel destination builders (Build 07).
 * Shared by CTA launchers + launch asserts. No transport ownership — only hrefs.
 */

import { getCleanPhone } from "@/app/components/cta/ctaDataHelpers";
import { isValidPublicEmail, isValidPublicPhoneDigits } from "./channelValidation";

export function buildTelHref(phone: string | null | undefined): string | null {
  const raw = String(phone ?? "").trim();
  if (!raw) return null;
  if (/^tel:/i.test(raw)) {
    if (/^tel:\s*javascript:/i.test(raw)) return null;
    return raw;
  }
  const digits = getCleanPhone(raw);
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
  const rawDigits = getCleanPhone(phone);
  if (!isValidPublicPhoneDigits(rawDigits)) return null;
  // Globalization Build D — matches the same "bare 10-digit number assumed US" prepend already
  // applied by buildTelHref/buildSmsHref above; wa.me previously got no country-code prefix at
  // all for a bare 10-digit number, silently producing a malformed international link.
  const digits = rawDigits.length === 10 ? `1${rawDigits}` : rawDigits;
  const b = String(body ?? "").trim();
  return b
    ? `https://wa.me/${digits}?text=${encodeURIComponent(b)}`
    : `https://wa.me/${digits}`;
}

export function buildMailtoHref(
  email: string | null | undefined,
  subject = "",
  body = "",
): string | null {
  const em = String(email ?? "").trim();
  if (!isValidPublicEmail(em)) return null;
  if (/[<>\"]/.test(em) || em.toLowerCase().includes("javascript:")) return null;
  const q = new URLSearchParams();
  const sub = String(subject ?? "").trim();
  const bod = String(body ?? "").trim();
  if (sub) q.set("subject", sub);
  if (bod) q.set("body", bod);
  const qs = q.toString();
  return qs ? `mailto:${em}?${qs}` : `mailto:${em}`;
}

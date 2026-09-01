/**
 * Shared international-safe WhatsApp number handling.
 *
 * Extracted from the one place on the platform that already got this right —
 * Servicios' `normalizeServiciosWhatsAppDigits` (app/(site)/servicios/lib/serviciosWhatsAppHref.ts)
 * and `formatWhatsAppInputDisplay`/`isValidWhatsAppNumber`
 * (app/(site)/clasificados/publicar/servicios/lib/serviciosPhoneUi.ts) — generalized here so
 * every other category can stop reimplementing a naive digit-strip that silently produces a
 * malformed or wrongly-rejected `wa.me` link for a non-US number.
 *
 * Rule: a WhatsApp number is frequently NOT a US number. This module never forces US
 * (XXX) XXX-XXXX grouping and never truncates to 10 digits. It only special-cases the
 * 10-digit case (assume a bare US number typed without its country code, since that is the
 * overwhelmingly common case for a user who omits a country code on this platform) — anything
 * else is trusted to already include its own country code, and is accepted from 8 digits
 * (loose international sanity floor) to 15 digits (E.164 max).
 *
 * The primary phone field intentionally stays separately US-formatted for "familiar" display
 * (contract requirement) — this module is WhatsApp-only, do not use it for the primary phone.
 */

/** Digits only. */
export function whatsAppDigitsOnly(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

/**
 * International-safe WhatsApp input display: keeps a leading "+" (country code marker) and
 * digits only — no US grouping, no 10-digit truncation. Caps at 15 digits (E.164 max).
 */
export function formatInternationalWhatsAppInputDisplay(raw: string): string {
  const hasLeadingPlus = raw.trim().startsWith("+");
  const digits = whatsAppDigitsOnly(raw).slice(0, 15);
  return (hasLeadingPlus ? "+" : "") + digits;
}

/** True when empty or 7-15 digits (loose international sanity check, no US-only 10-digit rule). */
export function isValidInternationalWhatsAppNumber(raw: string): boolean {
  const d = whatsAppDigitsOnly(raw);
  return d.length === 0 || (d.length >= 7 && d.length <= 15);
}

/**
 * Normalize WhatsApp digits for `wa.me`: a bare 10-digit number is assumed US and gets a "1"
 * prefix; anything else (8-9 digits, or 11+ digits) is trusted to already carry its own country
 * code and is passed through unmodified. Returns null below 8 digits — too short to be a real
 * international number.
 */
export function normalizeInternationalWhatsAppDigits(raw: string): string | null {
  let d = whatsAppDigitsOnly(raw);
  if (d.length < 8) return null;
  if (d.length === 10) d = `1${d}`;
  if (d.length > 15) return null;
  return d;
}

/** Build `https://wa.me/{digits}`, or null when the input can't resolve to a real number. */
export function buildInternationalWhatsAppWaMeHref(raw: string): string | null {
  const d = normalizeInternationalWhatsAppDigits(raw);
  return d ? `https://wa.me/${d}` : null;
}

/** `wa.me` accepts an optional `text` query for a prefilled chat message. */
export function buildInternationalWhatsAppWaMeHrefWithText(
  raw: string | undefined | null,
  prefilledText?: string | null,
): string | null {
  const base = buildInternationalWhatsAppWaMeHref(raw ?? "");
  if (!base) return null;
  const msg = prefilledText?.trim();
  if (!msg) return base;
  return `${base}?text=${encodeURIComponent(msg)}`;
}

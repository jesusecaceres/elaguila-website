/** Digits only — stored in application state; validation uses digit count. */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Alias for `digitsOnly` (shared US phone helpers). */
export function phoneDigits(raw: string): string {
  return digitsOnly(raw);
}

/**
 * US-style display for phone/WhatsApp fields: (XXX) XXX-XXXX.
 * Does not prepend country codes; digits beyond ten use the first ten for grouping.
 */
export function formatPhoneInputDisplay(raw: string): string {
  const d = digitsOnly(raw).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

export const formatPhoneInput = formatPhoneInputDisplay;

/** True when empty or exactly 10 US digits (ignores formatting characters). */
export function isValidUsPhone(raw: string): boolean {
  const d = digitsOnly(raw);
  return d.length === 0 || d.length === 10;
}

/**
 * International-safe WhatsApp input: keeps a leading "+" (country code marker) and digits
 * only — no US (XXX) XXX-XXXX grouping, and no truncation to 10 digits. WhatsApp numbers are
 * frequently non-US, so unlike the primary phone field this must not force US formatting or
 * silently drop a country code (see contract §3.5 — primary phone stays separately US-formatted).
 * Caps at 16 characters, generous headroom over the 15-digit E.164 max (+ up to 15 digits).
 */
export function formatWhatsAppInputDisplay(raw: string): string {
  const hasLeadingPlus = raw.trim().startsWith("+");
  const digits = digitsOnly(raw).slice(0, 15);
  return (hasLeadingPlus ? "+" : "") + digits;
}

/** True when empty or has at least 7 digits (loose international sanity check, no US-only 10-digit rule). */
export function isValidWhatsAppNumber(raw: string): boolean {
  const d = digitsOnly(raw);
  return d.length === 0 || (d.length >= 7 && d.length <= 15);
}

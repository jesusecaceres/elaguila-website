/**
 * Display-only US/Canada (NANP) formatting. Pure — no React, no browser APIs, no client-only directive.
 * Safe to import from server components and from client modules.
 *
 * Used both on the Step 6 input's blur (never while focused, to avoid the classic cursor-jump
 * bug live-reformatting causes) and to render review/profile/admin workspace pages so raw
 * canonical digits (e.g. "14088021531") are never shown. A bare 10-digit number, or an 11-digit
 * number with the "1" NANP country code (with or without a leading "+"), both format the same
 * friendly way; the leading "1" is the country code implied by the parenthesized-area-code format
 * itself, not lost information. Every other length/country code is left exactly as typed — a
 * meaningful (non-NANP) country code is never stripped, and canonical storage normalization still
 * happens separately via normalizePhone/normalizeContactValue, unchanged by this display step.
 */
export function formatUsPhoneForDisplay(raw: string): string {
  const digitsWithCountryCode = raw.replace(/\D/g, "");
  const digits = digitsWithCountryCode.length === 11 && digitsWithCountryCode.startsWith("1") ? digitsWithCountryCode.slice(1) : digitsWithCountryCode;
  if (digits.length !== 10) return raw;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

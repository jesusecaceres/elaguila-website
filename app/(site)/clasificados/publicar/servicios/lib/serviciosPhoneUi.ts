/** Digits only — stored in application state; validation uses digit count. */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
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

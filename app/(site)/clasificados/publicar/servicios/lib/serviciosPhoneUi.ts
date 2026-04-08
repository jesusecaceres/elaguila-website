/** Digits only — stored in application state; validation uses digit count. */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * US-style display for phone/WhatsApp fields (NorCal-focused).
 * Preserves leading + for WhatsApp international entry when present.
 */
export function formatPhoneInputDisplay(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("+")) {
    const rest = digitsOnly(t.slice(1));
    return `+${rest}`;
  }
  const d = digitsOnly(t);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

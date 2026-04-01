/** Mantiene sólo dígitos (10 US típicos). */
export function digitsOnly(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 10);
}

/** Formato visible (XXX) XXX-XXXX cuando hay 10 dígitos. */
export function formatUsPhoneDisplay(digits: string): string {
  const d = digitsOnly(digits);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

/** Aplica máscara mientras el usuario escribe. */
export function onPhoneInputChange(raw: string, prevDigits: string): { display: string; digits: string } {
  const nextDigits = digitsOnly(raw);
  if (nextDigits === prevDigits && raw.length < String(formatUsPhoneDisplay(prevDigits)).length) {
    const trimmed = prevDigits.slice(0, -1);
    return { digits: trimmed, display: formatUsPhoneDisplay(trimmed) };
  }
  return { digits: nextDigits, display: formatUsPhoneDisplay(nextDigits) };
}

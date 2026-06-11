import type { LeadLang } from "./leadCaptureValidation";

/** Strip non-digits; drop leading US country code when 11 digits. */
export function stripPhoneDigits(value: string): string {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/** Display/input format: (xxx)xxx-xxxx */
export function formatUsPhone(value: string): string {
  const d = stripPhoneDigits(value);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)})${d.slice(3)}`;
  return `(${d.slice(0, 3)})${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

export function isValidUsPhone(value: string, options?: { required?: boolean }): boolean {
  const digits = stripPhoneDigits(value);
  if (!digits) return !options?.required;
  return digits.length === 10;
}

/** Normalize for save/submit: formatted when 10 digits; blank when empty. */
export function normalizePhoneForSubmit(value: string): string {
  const digits = stripPhoneDigits(value);
  if (!digits) return "";
  if (digits.length === 10) return formatUsPhone(digits);
  return "";
}

export function onLeonixPhoneInputChange(
  raw: string,
  prevDigits: string,
): { display: string; digits: string } {
  const nextDigits = stripPhoneDigits(raw);
  if (nextDigits === prevDigits && raw.length < formatUsPhone(prevDigits).length) {
    const trimmed = prevDigits.slice(0, -1);
    return { digits: trimmed, display: formatUsPhone(trimmed) };
  }
  return { digits: nextDigits, display: formatUsPhone(nextDigits) };
}

export function phoneTelHref(value: string): string {
  const digits = stripPhoneDigits(value);
  return digits ? `tel:+1${digits}` : "";
}

export function getPhoneValidationMessage(lang: LeadLang | string): string {
  return lang === "en"
    ? "Enter a valid 10-digit US phone number, like (408)123-4567."
    : "Ingresa un teléfono válido de 10 dígitos, como (408)123-4567.";
}

/** Admin/export: show stored value formatted when possible. */
export function formatLeadPhoneDisplay(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const normalized = normalizePhoneForSubmit(raw);
  return normalized || raw;
}

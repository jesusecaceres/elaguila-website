/** Digits-only for validation / storage. */
export function serviciosPhoneDigitsOnly(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

/** Display mask for optional U.S. 10-digit numbers: (555) 555-5555 */
export function formatServiciosUsPhoneDisplay(raw: string): string {
  const d = serviciosPhoneDigitsOnly(raw).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Normalize for API: E.164 +1 when 10 digits, else trimmed raw (max 48). */
export function normalizeServiciosLeadPhoneForSubmit(raw: string): string {
  const d = serviciosPhoneDigitsOnly(raw).slice(0, 10);
  if (d.length === 10) return `+1${d}`;
  return String(raw ?? "").trim().slice(0, 48);
}

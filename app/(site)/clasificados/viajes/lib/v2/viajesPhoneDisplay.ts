/** Viajes-local phone display — do not edit global formatters. */

export function viajesDigitsOnly(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

/** North American display (xxx) xxx-xxxx when 10/11 digits; otherwise preserve trimmed raw. */
export function formatViajesPhoneDisplay(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const digits = viajesDigitsOnly(trimmed);
  let d = digits;
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  // International / short: keep original trimmed display, do not corrupt
  return trimmed;
}

export function viajesPhoneActionDigits(raw: string): string {
  return viajesDigitsOnly(raw);
}

export function pairViajesPhoneFields(raw: string): { display: string; actionRaw: string } {
  const actionRaw = String(raw ?? "").trim();
  return { display: formatViajesPhoneDisplay(actionRaw), actionRaw };
}

/** Leonix:whatsapp detail pair — dedicated seller WhatsApp (may differ from phone). */
export const LEONIX_DP_WHATSAPP = "Leonix:whatsapp" as const;

/** Strip to digits for tel/sms/wa.me hrefs (up to 15 E.164-style). */
export function enVentaContactDigits(raw: string): string {
  return String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 15);
}

/** US publish-form digits (10 local) — strips leading 1 from +1 pasted values. */
export function enVentaPhoneInputDigits(raw: string): string {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length >= 11 && d.startsWith("1")) return d.slice(1, 11);
  return d.slice(0, 10);
}

/**
 * Format while typing/pasting in publish Teléfono / WhatsApp inputs — (408) 802-1531.
 * Unusual lengths fall back to trimmed raw input (non-US safe).
 */
export function formatEnVentaPhoneInput(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const all = trimmed.replace(/\D/g, "");
  if (all.length > 11 || (all.length > 10 && !all.startsWith("1"))) {
    return trimmed;
  }
  const d = enVentaPhoneInputDigits(trimmed);
  if (!d.length) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * US-style display for 10-digit numbers: (408) 802-1531.
 * Non-US or partial numbers: return trimmed original (no mutation of stored value).
 */
export function formatEnVentaPhoneDisplay(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const d = enVentaContactDigits(trimmed);
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 11 && d.startsWith("1")) {
    const local = d.slice(1);
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return trimmed;
}

export function enVentaWhatsappFromDetailPairs(
  rows: Array<{ label: string; value: string }>
): string {
  for (const r of rows) {
    if (r.label.trim() === LEONIX_DP_WHATSAPP) return String(r.value ?? "").trim();
  }
  return "";
}

export function enVentaWhatsappDigitsValid(digits: string): boolean {
  return digits.length >= 8;
}

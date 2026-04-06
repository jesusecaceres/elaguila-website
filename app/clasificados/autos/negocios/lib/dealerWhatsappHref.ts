/**
 * Build https://wa.me/{digits} for dealership WhatsApp CTAs.
 * US 10-digit numbers get country code 1 when no leading country code is present.
 */

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function whatsAppHrefFromDisplay(raw: string | undefined | null): string | null {
  let d = digitsOnly(raw ?? "");
  if (d.length === 0) return null;
  if (d.length === 10) d = `1${d}`;
  if (d.length < 11) return null;
  return `https://wa.me/${d}`;
}

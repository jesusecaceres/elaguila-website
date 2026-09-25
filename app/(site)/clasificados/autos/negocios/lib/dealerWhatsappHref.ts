/**
 * Build https://wa.me/{digits} for dealership WhatsApp CTAs.
 * Delegates to the shared international-safe WhatsApp module — a bare 10-digit number is
 * assumed US, anything else (8-9 or 11+ digits) is trusted to already carry its own country
 * code, matching the platform's proven Servicios behavior instead of rejecting valid
 * shorter/longer international numbers.
 */
import {
  whatsAppDigitsOnly,
  buildInternationalWhatsAppWaMeHref,
  buildInternationalWhatsAppWaMeHrefWithText,
} from "@/app/lib/whatsapp/internationalWhatsApp";

export function digitsOnly(raw: string): string {
  return whatsAppDigitsOnly(raw);
}

export function whatsAppHrefFromDisplay(raw: string | undefined | null): string | null {
  return buildInternationalWhatsAppWaMeHref(raw ?? "");
}

/** `wa.me` accepts an optional `text` query for a prefilled chat message. */
export function whatsAppHrefFromDisplayWithText(
  raw: string | undefined | null,
  prefilledText?: string | null,
): string | null {
  return buildInternationalWhatsAppWaMeHrefWithText(raw, prefilledText);
}

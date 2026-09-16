import type { AutoDealerListing } from "../types/autoDealerListing";
import { safeExternalHref } from "./dealerDraftSanitize";

/** Primary number for `tel:` / “Llamar”: office first, then legacy `dealerPhone` from older drafts. */
export function resolveDealerOfficePhone(data: AutoDealerListing): string | undefined {
  const office = data.dealerPhoneOffice?.trim();
  if (office) return office;
  const legacy = data.dealerPhone?.trim();
  if (legacy) return legacy;
  return undefined;
}

/** Sanitized https link for booking / schedule CTAs. */
export function resolveDealerBookingHref(data: AutoDealerListing): string | undefined {
  return safeExternalHref(data.dealerBookingUrl ?? undefined);
}

/** Dedicated SMS/text number — only `dealerSmsPhone` (intentional opt-in). */
export function resolveDealerSmsPhone(data: AutoDealerListing): string | undefined {
  const sms = data.dealerSmsPhone?.trim();
  return sms || undefined;
}

/** Personal/mobile line — owner-locked final mapping: this is "Llamar". Office has its own distinct "Solicitar disponibilidad" CTA. */
export function resolveDealerMobilePhone(data: AutoDealerListing): string | undefined {
  const mobile = data.dealerPhoneMobile?.trim();
  return mobile || undefined;
}

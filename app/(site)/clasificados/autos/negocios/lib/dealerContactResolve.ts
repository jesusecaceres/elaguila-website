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

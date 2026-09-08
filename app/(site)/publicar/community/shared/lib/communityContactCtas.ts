import { normalizeWebsiteForOpen } from "./communityWebsiteAndSocial";

/**
 * Gate 2C — the old US-only tel:/sms:/WhatsApp/mailto builders that used to live here
 * (`usPhoneDigits10`, `telUriFromUs10`, `smsUri`, `whatsAppUri`, `mailtoCommunity`) were removed
 * in favor of the canonical, internationally-safe builders in
 * `@/app/lib/digitalContact/humanConnection/nativeChannelHrefs` (`buildTelHref`, `buildSmsHref`,
 * `buildWhatsAppUrl`, `buildMailtoHref`), used directly by `CommunityContactCanvas.tsx`. This file
 * now only keeps the map/website helpers below, which have no canonical-utility equivalent.
 */

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildCommunityMapQuery(parts: {
  addressLine1: string;
  publicCity: string;
  state: string;
  zip: string;
}): string | null {
  const street = parts.addressLine1.trim();
  const city = parts.publicCity.trim();
  const st = parts.state.trim();
  const zip = parts.zip.trim();
  if (street && city && st) {
    return [street, city, st, zip].filter(Boolean).join(", ");
  }
  if (city && st) {
    return [city, st, zip].filter(Boolean).join(", ");
  }
  return null;
}

export function websiteHref(raw: string): string | null {
  return normalizeWebsiteForOpen(raw);
}

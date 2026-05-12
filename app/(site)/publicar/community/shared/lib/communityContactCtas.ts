import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import { normalizeWebsiteForOpen } from "./communityWebsiteAndSocial";

export function usPhoneDigits10(raw: string): string | null {
  const d = digitsOnly(raw);
  return d.length === 10 ? d : null;
}

/** E.164-style for tel:/sms: (US +1). */
export function telUriFromUs10(d10: string): string {
  return `tel:+1${d10}`;
}

export function smsUri(d10: string, body: string): string {
  const enc = encodeURIComponent(body);
  return `sms:+1${d10}?body=${enc}`;
}

export function whatsAppUri(d10: string, prefilledText: string): string {
  const enc = encodeURIComponent(prefilledText);
  return `https://wa.me/1${d10}?text=${enc}`;
}

/** mailto:user@x.com?subject=...&body=... */
export function mailtoCommunity(opts: { to: string; subject: string; body?: string }): string {
  const sub = encodeURIComponent(opts.subject);
  const body = opts.body ? `&body=${encodeURIComponent(opts.body)}` : "";
  return `mailto:${opts.to}?subject=${sub}${body}`;
}

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

/** Shared href builders for restaurant contact CTAs (draft → shell / hub). */

import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { normalizeActionableUrl } from "../lib/urlNormalization";

export function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

/** Convert 24h time (HH:mm) to 12h format (h:mm AM/PM). Returns original if invalid. */
export function formatTime24to12(time24: string | undefined): string {
  if (!time24 || typeof time24 !== "string") return "";
  const trimmed = time24.trim();
  if (!trimmed) return "";
  
  const parts = trimmed.split(":");
  if (parts.length !== 2) return trimmed;
  
  const hourStr = parts[0];
  const minuteStr = parts[1];
  const hour = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  
  if (isNaN(hour) || isNaN(minutes) || hour < 0 || hour > 23 || minutes < 0 || minutes > 59) {
    return trimmed;
  }
  
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const minutesFormatted = minutes.toString().padStart(2, "0");
  
  return `${hour12}:${minutesFormatted} ${period}`;
}

export function normalizeRestaurantUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v}`;
}

export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${phone.trim()}`;
}

const RESTAURANT_WA_MSG_GENERIC_ES =
  "Hola, vi tu restaurante en Leonix Media. Me gustaría recibir más información, por favor.";

export function buildRestaurantWhatsAppPrefill(businessName: string | undefined): string {
  const name = (businessName ?? "").trim();
  if (name) {
    return `Hola, vi ${name} en Leonix Media. Me gustaría recibir más información, por favor.`;
  }
  return RESTAURANT_WA_MSG_GENERIC_ES;
}

export function buildCateringInquiryPrefill(businessName: string | undefined): string {
  const name = (businessName ?? "").trim();
  if (name) {
    return `Hola, vi ${name} en Leonix Media. Me interesa una cotización para catering o evento.`;
  }
  return "Hola, vi su negocio en Leonix Media. Me interesa una cotización para catering o evento.";
}

export function waHref(raw: string, businessName?: string, messageOverride?: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const base = `https://wa.me/${digits}`;
  const text = encodeURIComponent(messageOverride ?? buildRestaurantWhatsAppPrefill(businessName));
  return `${base}?text=${text}`;
}

export function smsHref(phone: string, body?: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  const dest = digits.length === 10 ? `+1${digits}` : digits.startsWith("1") && digits.length === 11 ? `+${digits}` : digits;
  const base = `sms:${dest}`;
  if (body?.trim()) return `${base}?body=${encodeURIComponent(body.trim())}`;
  return base;
}

export function isValidExternalHttpUrl(raw: string | undefined): boolean {
  if (!nonEmpty(raw)) return false;
  try {
    const u = new URL(normalizeRestaurantUrl(raw!));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function mapsSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

/** Whether the public shell may show street address lines (home-based privacy respected). */
export function shouldShowRestaurantStreetAddress(d: RestauranteListingDraft): boolean {
  if (!nonEmpty(d.addressLine1)) return false;
  if (d.homeBasedBusiness && d.showExactAddress === false) return false;
  if (d.locationPrivacyMode === "city_only" || d.locationPrivacyMode === "hidden_address_text_only") return false;
  return true;
}

/** City, state, ZIP, country line — e.g. "San José, CA 95112, USA". */
export function formatRestauranteCityStateZipLine(d: {
  cityCanonical?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}): string {
  const city = d.cityCanonical?.trim();
  const state = d.state?.trim();
  const zip = d.zipCode?.trim();
  const country = d.country?.trim();
  if (!city && !state && !zip && !country) return "";
  const parts: string[] = [];
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zip) parts.push(zip);
  if (country) parts.push(country);
  return parts.join(", ");
}

/** Public address string for maps search (street when allowed, else city/area). */
export function buildRestaurantPublicAddressQuery(
  d: RestauranteListingDraft,
  allowStreetAddress: boolean,
): string | undefined {
  const cityLine = formatRestauranteCityStateZipLine(d);
  if (allowStreetAddress && nonEmpty(d.addressLine1)) {
    const parts = [d.addressLine1!.trim(), d.addressLine2?.trim(), cityLine].filter(nonEmpty);
    const q = parts.join(", ");
    if (nonEmpty(q)) return q;
  }
  if (nonEmpty(cityLine)) return cityLine;
  if (nonEmpty(d.serviceAreaText)) return d.serviceAreaText!.trim();
  return undefined;
}

/** Maps handoff: explicit override URL, else encoded Google search from public address, else service area URL. */
export function resolveRestaurantMapsHref(d: RestauranteListingDraft, allowStreetAddress: boolean): string | undefined {
  if (nonEmpty(d.verUbicacionUrl)) {
    const normalized = normalizeActionableUrl(d.verUbicacionUrl!.trim()) ?? normalizeRestaurantUrl(d.verUbicacionUrl!);
    if (isValidExternalHttpUrl(normalized)) return normalized;
  }
  const mapsQ = buildRestaurantPublicAddressQuery(d, allowStreetAddress);
  if (mapsQ) return mapsSearchHref(mapsQ);
  if (nonEmpty(d.serviceAreaText) && !allowStreetAddress) {
    const area = normalizeActionableUrl(d.serviceAreaText!.trim());
    if (area && isValidExternalHttpUrl(area)) return area;
  }
  return undefined;
}

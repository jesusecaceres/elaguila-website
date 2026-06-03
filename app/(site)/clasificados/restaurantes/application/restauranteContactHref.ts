/** Shared href builders for restaurant contact CTAs (draft → shell / hub). */

import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { normalizeActionableUrl } from "../lib/urlNormalization";

export function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
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

/** Public address string for maps search (street when allowed, else city/area). */
export function buildRestaurantPublicAddressQuery(
  d: RestauranteListingDraft,
  allowStreetAddress: boolean,
): string | undefined {
  const cityLine = [d.cityCanonical, d.state, d.zipCode].filter(nonEmpty).join(", ");
  if (allowStreetAddress) {
    const parts = [d.addressLine1?.trim(), d.addressLine2?.trim(), cityLine].filter(nonEmpty);
    const q = parts.join(", ");
    if (nonEmpty(q)) return q;
  }
  if (nonEmpty(d.cityCanonical) && nonEmpty(cityLine)) return cityLine.trim();
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

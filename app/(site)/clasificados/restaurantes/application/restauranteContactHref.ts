/** Shared href builders for restaurant contact CTAs (draft → shell / hub). */

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

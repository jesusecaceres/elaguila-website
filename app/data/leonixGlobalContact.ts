/**
 * CANONICAL public Leonix corporate contact source.
 *
 * ALL public-facing Leonix corporate contact surfaces should import from here.
 * Do NOT duplicate these values in component-level constants.
 *
 * Do NOT use this file for customer/business-listing contact data.
 */

export const LEONIX_MEDIA_BRAND = "Leonix Media";

// ─── Email ────────────────────────────────────────────────────────────────────
export const LEONIX_GLOBAL_EMAIL = "info@leonixmedia.com";
export const LEONIX_GLOBAL_MAILTO = `mailto:${LEONIX_GLOBAL_EMAIL}`;

// ─── Phone ────────────────────────────────────────────────────────────────────
/** Canonical public company phone. */
export const LEONIX_GLOBAL_PHONE_DISPLAY = "(408) 303-6500";
export const LEONIX_GLOBAL_PHONE_TEL = "tel:+14083036500";
export const LEONIX_GLOBAL_PHONE_SMS = "sms:+14083036500";

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
/**
 * Canonical WhatsApp number — sourced from the active Leonix Digital Contact registry.
 * Display: (669) 366-4300 · Digits: 16693664300.
 * Do NOT change this value without owner approval.
 */
export const LEONIX_GLOBAL_WHATSAPP_URL = "https://wa.me/16693664300";
export const LEONIX_GLOBAL_WHATSAPP_DISPLAY = "(669) 366-4300";

// ─── Office ───────────────────────────────────────────────────────────────────
export const LEONIX_GLOBAL_OFFICE_ADDRESS = "871 Coleman Ave, Suite 201, San Jose, CA 95110";
export const LEONIX_GLOBAL_OFFICE_ADDRESS_LINE1 = "871 Coleman Ave, Suite 201";
export const LEONIX_GLOBAL_OFFICE_ADDRESS_LINE2 = "San Jose, CA 95110";
export const LEONIX_GLOBAL_MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=871%20Coleman%20Ave%20Suite%20201%20San%20Jose%20CA%2095110";

// ─── Hours ────────────────────────────────────────────────────────────────────
export const LEONIX_GLOBAL_HOURS_ES = "Lunes a viernes \u00b7 9:00\u202fa.\u202fm.\u20135:00\u202fp.\u202fm. (Pac\u00edfico)";
export const LEONIX_GLOBAL_HOURS_EN = "Monday\u2013Friday \u00b7 9:00\u202fAM\u20135:00\u202fPM Pacific";

// ─── Virtual Front Desk ───────────────────────────────────────────────────────
/** Canonical route for the Leonix Virtual Front Desk. Use this everywhere. */
export const LEONIX_VIRTUAL_FRONT_DESK_PATH = "/visitanos";

// ─── Contact route ────────────────────────────────────────────────────────────
/** Public route for general contact (Spanish default; `?lang=en` supported). */
export const LEONIX_GLOBAL_CONTACT_PATH = "/contacto";

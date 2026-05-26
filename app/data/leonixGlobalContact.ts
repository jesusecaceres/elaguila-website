/**
 * General website / company contact (navbar "Contact" → `/contacto`).
 * Not for Tienda order intake — use `app/tienda/data/leonixContact.ts` + `/tienda/contacto`.
 */

export const LEONIX_MEDIA_BRAND = "Leonix Media";

export const LEONIX_GLOBAL_EMAIL = "info@leonixmedia.com";
export const LEONIX_GLOBAL_MAILTO = `mailto:${LEONIX_GLOBAL_EMAIL}`;

/** Canonical company phone — same number used by /contacto and GlobalContactForm. */
export const LEONIX_GLOBAL_PHONE_DISPLAY = "(669) 366-4300";
export const LEONIX_GLOBAL_PHONE_TEL = "tel:+16693664300";

/** Public route for general contact (Spanish default UX; `?lang=en` supported). */
export const LEONIX_GLOBAL_CONTACT_PATH = "/contacto";

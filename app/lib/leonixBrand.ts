/**
 * Canonical public brand + SEO strings for Leonix Media.
 * Use these for metadata, schema, and visible copy — avoid hardcoding variants.
 */

export const LEONIX_MEDIA_SITE_NAME = "Leonix Media";

export const LEONIX_GLOBAL_LLC = "Leonix Global LLC";

/** Primary bilingual slogan — use selectively; do not replace every meta description with this alone. */
export const LEONIX_MEDIA_SLOGAN = "Que Ruja El León — Let The Lion Roar";

/**
 * One-line business descriptor (English) for SEO, schema, and trust copy.
 * Covers the full Leonix ecosystem: business development, media, classifieds,
 * radio, promotional products, and community connection.
 */
export const LEONIX_MEDIA_DESCRIPTOR_EN =
  "Leonix Media is a bilingual business development and media platform serving the Bay Area and Northern California — magazine, classifieds, local business profiles, radio (La Kaliente 1370), promotional products, and community connection, all under Leonix Global LLC.";

export const LEONIX_MEDIA_DESCRIPTOR_ES =
  "Leonix Media es una plataforma bilingüe de desarrollo empresarial y medios de comunicación que sirve al Área de la Bahía y el norte de California — revista, clasificados, perfiles de negocios locales, radio (La Kaliente 1370), productos promocionales y conexión comunitaria, bajo Leonix Global LLC.";

/** Root meta description: entity-first, slogan as supporting line. */
export const LEONIX_ROOT_META_DESCRIPTION_EN =
  "Leonix Media helps local businesses grow through bilingual media, classifieds, radio (La Kaliente 1370), promotional products, and trusted community connection across the Bay Area and Northern California. Leonix Global LLC — Que Ruja El León.";

export const LEONIX_ROOT_META_DESCRIPTION_ES =
  "Leonix Media ayuda a los negocios locales a crecer a través de medios bilingües, clasificados, radio (La Kaliente 1370), productos promocionales y conexión comunitaria en el Área de la Bahía y el norte de California. Leonix Global LLC — Que Ruja El León.";

export const LEONIX_SITE_ORIGIN = "https://leonixmedia.com";

/** Default `<title>` when a route does not set a segment title. */
export const LEONIX_ROOT_BROWSER_TITLE = `${LEONIX_MEDIA_SITE_NAME} — Business development & bilingual media for the Bay Area`;

export function leonixPageTitle(segment: string): string {
  const s = segment.trim();
  if (!s) return LEONIX_MEDIA_SITE_NAME;
  return `${s} | ${LEONIX_MEDIA_SITE_NAME}`;
}

export function leonixOpenGraphBase() {
  return {
    siteName: LEONIX_MEDIA_SITE_NAME,
    type: "website" as const,
    url: LEONIX_SITE_ORIGIN,
  };
}

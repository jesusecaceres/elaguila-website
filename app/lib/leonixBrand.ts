/**
 * Canonical public brand + SEO strings for Leonix Media.
 * Use these for metadata, schema, and visible copy — avoid hardcoding variants.
 */

export const LEONIX_MEDIA_SITE_NAME = "Leonix Media";

export const LEONIX_GLOBAL_LLC = "Leonix Global LLC";

/** Primary bilingual slogan — use selectively; do not replace every meta description with this alone. */
export const LEONIX_MEDIA_SLOGAN = "Que Ruja El León — Let The Lion Roar";

/** One-line business descriptor (English) for SEO and trust. */
export const LEONIX_MEDIA_DESCRIPTOR_EN =
  "Leonix Media is a bilingual business visibility, classifieds, community, and local discovery platform under Leonix Global LLC—helping businesses bring their website, social presence, services, and brand into one trusted place.";

export const LEONIX_MEDIA_DESCRIPTOR_ES =
  "Leonix Media es una plataforma bilingüe de visibilidad empresarial, clasificados, comunidad y descubrimiento local bajo Leonix Global LLC: ayuda a las empresas a reunir su sitio web, redes, servicios y marca en un solo lugar confiable.";

/** Root meta description: entity-first, slogan as supporting line. */
export const LEONIX_ROOT_META_DESCRIPTION_EN = `${LEONIX_MEDIA_DESCRIPTOR_EN} ${LEONIX_MEDIA_SLOGAN}`;

export const LEONIX_ROOT_META_DESCRIPTION_ES = `${LEONIX_MEDIA_DESCRIPTOR_ES} ${LEONIX_MEDIA_SLOGAN}`;

export const LEONIX_SITE_ORIGIN = "https://leonixmedia.com";

/** Default `<title>` when a route does not set a segment title. */
export const LEONIX_ROOT_BROWSER_TITLE = `${LEONIX_MEDIA_SITE_NAME} — Bilingual business visibility & local discovery`;

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

/** Stable keys for `site_section_content.section_key`. */
export const SITE_SECTION_KEYS = [
  "global_site",
  "tienda_storefront",
  "home_marketing",
  "contacto",
  "nosotros",
  "revista_spotlight",
  "noticias_page",
  "iglesias_page",
  "cupones_page",
  "revista_issue_registry",
] as const;

export type SiteSectionKey = (typeof SITE_SECTION_KEYS)[number];

export function isSiteSectionKey(s: string): s is SiteSectionKey {
  return (SITE_SECTION_KEYS as readonly string[]).includes(s);
}

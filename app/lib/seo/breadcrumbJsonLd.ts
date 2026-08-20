import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

/**
 * Globalization Build 04, Gate 16 — shared `schema.org/BreadcrumbList` builder. Confirmed (direct
 * whole-`app/` grep, not assumption) that no BreadcrumbList JSON-LD existed anywhere in this repo
 * before this build — many category pages already render a *visual* breadcrumb nav
 * (`aria-label="Breadcrumb"`), but none paired it with structured data. This is the one shared
 * helper every category detail page should reuse rather than each hand-rolling its own; it mirrors
 * the visible breadcrumb trail only — never a step the page doesn't actually show.
 */
export type BreadcrumbJsonLdItem = {
  /** Visible label for this crumb, exactly as shown in the page's own breadcrumb nav. */
  name: string;
  /** Path relative to the site root (e.g. "/clasificados/autos"). Absolute URL is built here. */
  path: string;
};

export function breadcrumbJsonLd(items: BreadcrumbJsonLdItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${LEONIX_SITE_ORIGIN}${item.path}`,
    })),
  };
}

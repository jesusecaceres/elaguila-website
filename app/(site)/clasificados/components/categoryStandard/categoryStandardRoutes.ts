import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { CategoryStandardKey } from "./categoryStandardTheme";

/**
 * GATE I.5.1 NOTE — do not read this file's `categoryPublishPath()` as the platform's canonical
 * route contract. `app/lib/listingIdentity/categoryRouteRegistry.ts` is that contract as of
 * Gate I.5.1. This file's map is kept separately because it is LIVE-WIRED into real navigation
 * today (`CategoryStandardLandingPage.tsx`'s default `publishHref`, and
 * `EmpleosLandingPageClient.tsx`'s CTA) — Gate I.5.1 was explicitly barred from rewiring global
 * CTAs, so this map's values were NOT changed even where they disagree with the registry's
 * decisions (confirmed disagreements: servicios, empleos, bienes-raices — see the registry
 * file's header comment for the exact decisions and evidence). Reconciling this file with the
 * registry (either by having it consume the registry directly, or updating its values to match)
 * is Gate I.5.2's job, not this file's.
 */

/** Marketplace categories in CAT-STD-ALL scope (excludes iglesias hub stub). */
export const CAT_STD_ALL_SLUGS = [
  "en-venta",
  "rentas",
  "empleos",
  "autos",
  "bienes-raices",
  "servicios",
  "restaurantes",
  "viajes",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
] as const satisfies readonly CategoryStandardKey[];

export type CatStdAllSlug = (typeof CAT_STD_ALL_SLUGS)[number];

/** English-path results segment used in gate QA and en-venta/rentas. */
export const CAT_STD_RESULTS_SEGMENT = "results" as const;

export const CAT_STD_RESULTADOS_SEGMENT = "resultados" as const;

export function categoryLandingPath(slug: CatStdAllSlug): string {
  return `/clasificados/${slug}`;
}

export type CategoryResultsSegment = typeof CAT_STD_RESULTS_SEGMENT | typeof CAT_STD_RESULTADOS_SEGMENT;

export function categoryResultsPath(
  slug: CatStdAllSlug,
  segment: CategoryResultsSegment = CAT_STD_RESULTS_SEGMENT,
): string {
  return `/clasificados/${slug}/${segment}`;
}

export function buildCategoryResultsUrl(
  slug: CatStdAllSlug,
  lang: Lang,
  params?: Record<string, string | undefined>,
  segment: CategoryResultsSegment = CAT_STD_RESULTS_SEGMENT,
): string {
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && String(v).trim() !== "") sp.set(k, String(v).trim());
    }
  }
  return `${categoryResultsPath(slug, segment)}?${sp.toString()}`;
}

export function categoryPublishPath(slug: CatStdAllSlug): string {
  const map: Record<CatStdAllSlug, string> = {
    // Globalization Package A Gate 2 — the five lanes below previously sent live CTAs straight
    // into their application (or a redirect shim to it) with no product checkpoint. They now
    // enter through their truthful checkpoint card page (registry `checkpointRoute`); each
    // application is unchanged one hop deeper, and the legacy /clasificados/publicar/* redirect
    // shims are untouched for external inbound links.
    "en-venta": "/publicar/en-venta",
    rentas: "/clasificados/publicar/rentas",
    empleos: "/clasificados/publicar/empleos",
    // "autos": confirmed LIVE, not stale — app/(site)/clasificados/publicar/autos/page.tsx is a
    // real route (renders the same PublicarAutosBranchClient chooser as /publicar/autos), present
    // in the compiled route manifest, and has a confirmed live caller
    // (app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts). Gate I.5.8 verified this before
    // acting and left it untouched — do not "fix" this entry without re-confirming both facts.
    autos: "/clasificados/publicar/autos",
    "bienes-raices": "/clasificados/publicar/bienes-raices",
    servicios: "/clasificados/publicar/servicios/checkpoint",
    restaurantes: "/clasificados/restaurantes/publicar",
    // Gate I.5.8 — corrected. The prior value ("/clasificados/publicar/viajes") mapped to a route
    // folder confirmed NOT to exist (absent from the compiled Next.js route manifest) with zero
    // confirmed live callers (categoryPublishPath("viajes") itself, and this file's only generic
    // consumer, CategoryStandardLandingPage.tsx, are not rendered for any live Viajes page today —
    // Viajes has its own dedicated landing). Corrected to the real, registry-confirmed application
    // route (categoryRouteRegistry.ts's VIAJES_ADAPTER.applicationRoute), which does exist in the
    // route manifest. Zero live behavior change, since nothing called the old value.
    viajes: "/publicar/viajes",
    clases: "/publicar/clases",
    comunidad: "/publicar/comunidad",
    busco: "/publicar/busco",
    "mascotas-y-perdidos": "/publicar/mascotas-y-perdidos",
  };
  return map[slug];
}

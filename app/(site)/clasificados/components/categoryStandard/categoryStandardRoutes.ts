import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { CategoryStandardKey } from "./categoryStandardTheme";

/**
 * GATE I.5.1 NOTE — do not read this file's `categoryPublishPath()` as the platform's canonical
 * route contract. `app/lib/listingIdentity/categoryRouteRegistry.ts` is that contract.
 *
 * Package F Build F2, Gate 12 (P1 route-authority reconciliation) — RECONCILED. The prior
 * "LIVE-WIRED into real navigation" claim above was re-verified and found stale:
 * `EmpleosLandingPageClient.tsx` was corrected in Gate I.7A to build its publish CTA directly
 * from the registry-canonical hub, bypassing this map entirely (see that file's own comment).
 * `categoryPublishPath()`'s only remaining caller repo-wide is
 * `CategoryStandardLandingPage.tsx`'s default `publishHref` fallback — and that component itself
 * has zero live callers (confirmed via repo-wide search); every category in `CAT_STD_ALL_SLUGS`
 * renders its own bespoke landing page instead. So this map is dead code in production today, not
 * a second live source of truth. Because of that, the two entries that disagreed with the
 * registry (`servicios`, `empleos`) have been corrected to match it below — a zero-live-behavior-
 * change edit, not a routing change, since nothing currently reads the old values. `bienes-raices`
 * already matched the registry's `hubRoute` (corrected there in an earlier gate, I.5.3A) and was
 * left as-is. If a future gate wires a real caller to this map again, wire it to consume
 * `categoryRouteRegistry.ts` directly rather than re-diverging.
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
    // Package F Build F2, Gate 12 — corrected from the legacy "/clasificados/publicar/empleos"
    // to match categoryRouteRegistry.ts's EMPLEOS_ADAPTER.applicationRoute (already the value
    // every live Empleos caller uses per Gate I.7A). Zero live callers of this map read empleos
    // today (see file header), so this is a truth correction, not a navigation change.
    empleos: "/publicar/empleos",
    // "autos": confirmed LIVE, not stale — app/(site)/clasificados/publicar/autos/page.tsx is a
    // real route (renders the same PublicarAutosBranchClient chooser as /publicar/autos), present
    // in the compiled route manifest, and has a confirmed live caller
    // (app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts). Gate I.5.8 verified this before
    // acting and left it untouched — do not "fix" this entry without re-confirming both facts.
    autos: "/clasificados/publicar/autos",
    // bienes-raices already matches categoryRouteRegistry.ts's BIENES_RAICES_NEGOCIO_ADAPTER /
    // BIENES_RAICES_PRIVADO_ADAPTER hubRoute (corrected there in Gate I.5.3A) — no change needed.
    "bienes-raices": "/clasificados/publicar/bienes-raices",
    // Package F Build F2, Gate 12 — corrected from the legacy "/clasificados/publicar/servicios/
    // checkpoint" to match categoryRouteRegistry.ts's SERVICIOS_ADAPTER.applicationRoute. Zero
    // live callers of this map read servicios today (see file header), so this is a truth
    // correction, not a navigation change.
    servicios: "/publicar/servicios",
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

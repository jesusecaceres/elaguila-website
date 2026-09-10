import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { recursosCategoryPath, recursosResourcePath } from "@/app/lib/recursos/recursosUrls";
import { listPublicCommunityResources } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
import { listServiciosPublicListingsRaw } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { buildLeonixSitemap } from "@/app/lib/seo/leonixDiscoveryContracts";

export {
  buildLeonixSitemap,
  leonixSitemapOmitsPerListingDetailUrls,
  LEONIX_SITEMAP_CATEGORY_HUBS,
  LEONIX_SITEMAP_MARKETING_PATHS,
} from "@/app/lib/seo/leonixDiscoveryContracts";

/**
 * Package F Build F2, Gate 16 (P1 SEO fix) — canonical public category hubs and marketing paths
 * are sourced from the shared `leonixDiscoveryContracts` module (also used by robots.ts and LEO
 * Self-Intelligence's discovery-SEO sensor) so there is one source of truth. Marketing paths added
 * on main after that module was created live in `EXTRA_MARKETING_PATHS` below until they're folded
 * into the canonical list.
 *
 * Gate SERVICIOS-2 — this header previously said per-listing detail URLs are "intentionally NOT
 * generated here" because safely enumerating only published rows "needs a dedicated DB-backed
 * sitemap generator". That generator is what a category's own safety-gated public reader already
 * is: Recursos proved the pattern, and `serviciosSitemapEntries` below now applies it to published
 * Servicios vitrinas. Remaining categories (and Iglesias `/iglesias/[slug]`) are still deferred —
 * each needs its own reader wired the same way, not a generic table sweep.
 */
const EXTRA_MARKETING_PATHS = [
  "/recursos-comunitarios",
  "/iglesias",
  "/iglesias/registrar",
  "/productos-promocion",
  "/media-kit",
];

/**
 * Recursos Build 03D — the site's first DB-backed dynamic sitemap entries. Category URLs are
 * static/permanent (the 12 locked category slugs). Resource detail URLs come ONLY from the
 * same safety-gated public query every other Recursos route uses — never a direct table query —
 * so a needs_review/stale/inactive/dropped-candidate URL can never appear here.
 */
async function recursosSitemapEntries(base: string, now: Date): Promise<MetadataRoute.Sitemap> {
  const categoryEntries: MetadataRoute.Sitemap = PRIMARY_CATEGORIES.map((c) => ({
    url: `${base}${recursosCategoryPath(c.slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const { resources } = await listPublicCommunityResources({});
  const resourceEntries: MetadataRoute.Sitemap = resources.map((r) => ({
    url: `${base}${recursosResourcePath(r.slug)}`,
    lastModified: r.verification.lastVerifiedAt ? new Date(r.verification.lastVerifiedAt) : now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...categoryEntries, ...resourceEntries];
}

/**
 * Gate SERVICIOS-2 — published Servicios vitrinas, the second DB-backed section of this sitemap
 * and the first per-listing one. Follows the Recursos precedent exactly: the entries are composed
 * HERE, in the route module, from the category's own safety-gated public reader — never inside the
 * pure `buildLeonixSitemap` contract, and never a direct table query.
 *
 * `listServiciosPublicListingsRaw` is the same published-only reader the results page runs, so a
 * paused, pending-review, pending-payment, rejected or suspended row can never reach the sitemap —
 * exactly the safety gate that made a generic per-listing generator unsafe before. The entitlement
 * overlay the discovery variant adds is deliberately skipped: it affects paid presentation, never
 * whether a URL is public, and a sitemap needs neither.
 * The URL is the canonical `/clasificados/servicios/[slug]`, matching each page's own
 * `alternates.canonical`, so the sitemap can never advertise the legacy `/servicios/perfil/[slug]`
 * redirect shim (which robots.txt also disallows).
 */
async function serviciosSitemapEntries(base: string, now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    const rows = await listServiciosPublicListingsRaw(SERVICIOS_SITEMAP_MAX);
    return rows
      .filter((row) => Boolean(row.slug?.trim()))
      .map((row) => {
        const updated = row.updated_at || row.published_at;
        const lastModified = updated ? new Date(updated) : now;
        return {
          url: `${base}/clasificados/servicios/${encodeURIComponent(row.slug)}`,
          lastModified: Number.isNaN(lastModified.getTime()) ? now : lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        };
      });
  } catch {
    // A sitemap must never fail the whole route because one DB-backed section is unavailable.
    return [];
  }
}

/** Upper bound requested from the reader. Its own internal fetch cap is 800 rows
 * (`listServiciosPublicListingsFromDb`), so 800 is the real ceiling of this section — stated
 * honestly here rather than implying a larger number this reader cannot return. Well under the
 * 50k per-sitemap limit; a larger catalog needs a paginated sitemap index, not a bigger constant. */
const SERVICIOS_SITEMAP_MAX = 800;

/** Indexable marketing surfaces — extend as major hubs stabilize. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = LEONIX_SITE_ORIGIN;
  const now = new Date();
  return [
    ...buildLeonixSitemap(now),
    ...EXTRA_MARKETING_PATHS.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(await recursosSitemapEntries(base, now)),
    ...(await serviciosSitemapEntries(base, now)),
  ];
}

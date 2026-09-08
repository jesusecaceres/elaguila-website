import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { recursosCategoryPath, recursosResourcePath } from "@/app/lib/recursos/recursosUrls";
import { listPublicCommunityResources } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
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
 * into the canonical list. Per-listing detail URLs are intentionally NOT generated here — safely
 * enumerating only published/active rows (excluding draft/preview/pending/rejected/suspended/
 * archived) needs a dedicated DB-backed sitemap generator. Iglesias `/iglesias/[slug]` church URLs
 * are deferred on the same basis.
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
  ];
}

import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { recursosCategoryPath, recursosResourcePath } from "@/app/lib/recursos/recursosUrls";
import { listPublicCommunityResources } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
import { listServiciosPublicListingsRaw } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { tryListRestaurantesPublicListingsFromDb } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { listPublishedComidaLocalListings } from "@/app/lib/clasificados/comida-local/comidaLocalPublicQueries";
import { emptyComidaLocalResultsFilters } from "@/app/lib/clasificados/comida-local/comidaLocalResultsUrl";
import { listPublishedBrListingsForSitemap } from "@/app/(site)/clasificados/bienes-raices/lib/brPublishedListingsServer";
import { leonixLiveAnuncioPath } from "@/app/(site)/clasificados/lib/leonixRealEstateListingContract";
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

/**
 * Gate RESTAURANTES-2 — published Restaurantes vitrinas, the third DB-backed section, composed the
 * same way as the Recursos and Servicios sections above: in this route module, from the category's
 * own safety-gated public reader, never inside the pure `buildLeonixSitemap` contract and never a
 * direct table query.
 *
 * `tryListRestaurantesPublicListingsFromDb` applies `.eq("status","published")`, so a
 * `pending_payment`, `archived` or `suspended` row can never reach the sitemap — the same single
 * status check the public detail route enforces (a non-published slug 404s there). Its `ok:false`
 * outcome is honoured explicitly, so a query error yields no entries rather than a partial list.
 *
 * The `restaurantesResultsInventoryServer` variant is deliberately NOT used: it exists to apply the
 * paid entitlement/placement overlay, which affects presentation, never whether a URL is public.
 *
 * The URL is the canonical `/clasificados/restaurantes/[slug]`, matching each page's own
 * `alternates.canonical` and the absolute JSON-LD `url` Gate RESTAURANTES-1 established.
 */
async function restaurantesSitemapEntries(base: string, now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    const listed = await tryListRestaurantesPublicListingsFromDb(RESTAURANTES_SITEMAP_MAX);
    if (!listed.ok) return [];
    return listed.rows
      .filter((row) => Boolean(row.slug?.trim()))
      .map((row) => {
        const updated = row.updated_at || row.published_at;
        const lastModified = updated ? new Date(updated) : now;
        return {
          url: `${base}/clasificados/restaurantes/${encodeURIComponent(row.slug)}`,
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

/**
 * Gate COMIDA-LOCAL-2 — published Comida Local vitrinas, the fourth DB-backed section, composed the
 * same way as the Recursos, Servicios and Restaurantes sections above: in this route module, from
 * the category's own safety-gated public reader, never inside the pure `buildLeonixSitemap`
 * contract and never a direct table query.
 *
 * `listPublishedComidaLocalListings` applies `.eq("status","published")`, so a `pending_payment`,
 * `draft`, `paused` or `suspended` row can never reach the sitemap — the same single status check
 * the public detail route enforces (a non-published slug 404s there). It is called with the
 * category's own empty filters so the full published pool is returned, and its non-`"published"`
 * outcomes (`inventory_unavailable` / `inventory_table_missing` / `inventory_query_failed`) are
 * honoured explicitly, so a query error yields no entries rather than a partial list.
 *
 * The URL is the canonical `/clasificados/comida-local/[slug]`, matching each page's own
 * `alternates.canonical` and the absolute JSON-LD `url` this same gate established.
 */
async function comidaLocalSitemapEntries(base: string, now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    const listed = await listPublishedComidaLocalListings(emptyComidaLocalResultsFilters());
    if (listed.source !== "published") return [];
    return listed.rows
      .filter((row) => Boolean(row.slug?.trim()))
      .map((row) => {
        const lastModified = row.published_at ? new Date(row.published_at) : now;
        return {
          url: `${base}/clasificados/comida-local/${encodeURIComponent(row.slug)}`,
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

/**
 * The Comida Local reader takes no limit argument: its own internal `FETCH_CAP` of 300 rows is the
 * real ceiling of this section, stated honestly here rather than implying a larger number it cannot
 * return. Well under the 50k per-sitemap limit; a larger catalog needs a paginated sitemap index.
 * `lastModified` uses `published_at` because that is the only timestamp this category's public
 * select projects (`COMIDA_LOCAL_PUBLIC_LISTING_SELECT` carries no `updated_at`).
 */

/**
 * Gate BIENES-NEGOCIO-2 — published Bienes Raíces property URLs, the FIFTH DB-backed section,
 * composed the same way as the Recursos, Servicios, Restaurantes and Comida Local sections above:
 * in this route module, from the category's own safety-gated reader, never inside the pure
 * `buildLeonixSitemap` contract and never a direct table query.
 *
 * Two eligibility gates, both the category's own shared predicates rather than a re-expression:
 *   1. `status="active"` + `is_published=true` + `isListingRowActiveAndPublishedForBrowse` — so a
 *      pending, paused, archived, sold or suspended row can never be advertised.
 *   2. the Gate G.2.3.4 PARENT-LIVENESS gate — a Negocio inventory child is dropped unless its
 *      canonical parent (resolved by real UUID) is itself an active, published, same-owner `main`
 *      bienes-raices business row. A suspended parent therefore removes its children from the
 *      sitemap exactly as it removes them from browse and public detail.
 *
 * `ok:false` (including a failed PARENT read) yields NO entries rather than a partial list that
 * could advertise an orphan child, and the whole section is try/catch-isolated so one unavailable
 * read cannot fail the sitemap route.
 *
 * The URL is the canonical `leonixLiveAnuncioPath(id)` — `/clasificados/anuncio/:id`, the same path
 * the detail page's JSON-LD `url` uses and the same one the branch-scoped
 * `/clasificados/bienes-raices/anuncio/[id]` alias redirects to.
 */
async function bienesRaicesSitemapEntries(base: string, now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    const listed = await listPublishedBrListingsForSitemap();
    if (!listed.ok) return [];
    return listed.rows
      .filter((row) => Boolean(row.id?.trim()))
      .map((row) => {
        const updated = row.updated_at || row.published_at || row.created_at;
        const lastModified = updated ? new Date(updated) : now;
        return {
          url: `${base}${leonixLiveAnuncioPath(row.id)}`,
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

/** Upper bound for the Restaurantes section. Unlike the Servicios reader, this one has no smaller
 * internal fetch cap — it passes the limit straight to Supabase — so 2000 is the real ceiling here.
 * Well under the 50k per-sitemap limit; a larger catalog needs a paginated sitemap index. */
const RESTAURANTES_SITEMAP_MAX = 2000;

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
    ...(await restaurantesSitemapEntries(base, now)),
    ...(await comidaLocalSitemapEntries(base, now)),
    ...(await bienesRaicesSitemapEntries(base, now)),
  ];
}

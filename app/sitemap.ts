import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { recursosCategoryPath, recursosResourcePath } from "@/app/lib/recursos/recursosUrls";
import { listPublicCommunityResources } from "@/app/lib/recursos/server/communityResourcesPublicQueries";

/**
 * Package F Build F2, Gate 16 (P1 SEO fix) — canonical public category hubs, added so a real
 * sitemap-driven discovery path exists for the catalog (previously only 8 marketing URLs).
 * Every path below is a confirmed-real, publicly indexable `page.tsx` on this branch. Per-listing
 * detail URLs are intentionally NOT generated here — safely enumerating only published/active rows
 * (excluding draft/preview/pending/rejected/suspended/archived) needs a dedicated DB-backed
 * sitemap generator. Iglesias `/iglesias/[slug]` church URLs are deferred on the same basis.
 */
const CLASIFICADOS_CATEGORY_HUBS = [
  "/clasificados/en-venta",
  "/clasificados/rentas",
  "/clasificados/empleos",
  "/clasificados/autos",
  "/clasificados/bienes-raices",
  "/clasificados/servicios",
  "/clasificados/restaurantes",
  "/clasificados/comida-local",
  "/clasificados/viajes",
  "/clasificados/comunidad",
  "/clasificados/clases",
  "/clasificados/busco",
  "/clasificados/mascotas-y-perdidos",
  "/clasificados/ofertas-locales",
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
  const main = [
    "",
    "/home",
    "/about",
    "/contacto",
    "/clasificados",
    "/noticias",
    "/legal",
    "/magazine",
    "/magazine/2026",
    "/negocios-locales",
    "/recursos-comunitarios",
    "/iglesias",
    "/iglesias/registrar",
    "/productos-promocion",
    "/media-kit",
  ];
  return [
    ...main.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: (path === "" || path === "/home" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" || path === "/home" ? 1 : 0.7,
    })),
    ...CLASIFICADOS_CATEGORY_HUBS.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...(await recursosSitemapEntries(base, now)),
  ];
}

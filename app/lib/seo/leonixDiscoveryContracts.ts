/**
 * Canonical Leonix technical discovery contracts (robots / sitemap).
 * Shared by Next.js route modules and LEO Self-Intelligence (read-only).
 * No HTTP. No Search Console. Configuration only.
 */
import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

export const LEONIX_ROBOTS_DISALLOW_PATHS = [
  "/admin",
  "/api",
  "/dashboard",
  "/clasificados/publicar",
  "/publicar",
  "/servicios/perfil",
  "/clasificados/en-venta/preview",
  "/clasificados/empleos/quick-preview",
  "/clasificados/empleos/premium-preview",
  "/clasificados/empleos/feria-preview",
  "/clasificados/restaurantes/preview",
  "/clasificados/restaurantes/shell",
  "/clasificados/autos/privado/preview",
  "/clasificados/autos/negocios/preview",
  "/clasificados/publicar/servicios/preview",
  "/clasificados/bienes-raices/preview",
  "/clasificados/bienes-raices/negocio/preview-mockup",
  "/clasificados/rentas/preview",
  "/clasificados/viajes/preview",
  "/clasificados/en-venta/launch-checklist",
] as const;

export const LEONIX_SITEMAP_CATEGORY_HUBS = [
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
] as const;

export const LEONIX_SITEMAP_MARKETING_PATHS = [
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
] as const;

/** Pure robots contract — configuration only. */
export function buildLeonixRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...LEONIX_ROBOTS_DISALLOW_PATHS],
      },
    ],
    sitemap: `${LEONIX_SITE_ORIGIN}/sitemap.xml`,
    host: LEONIX_SITE_ORIGIN.replace(/^https?:\/\//, ""),
  };
}

/**
 * Pure sitemap contract — hub/marketing only.
 * Per-listing detail URLs are intentionally omitted (deferred DB-backed generator).
 */
export function buildLeonixSitemap(now: Date = new Date()): MetadataRoute.Sitemap {
  const base = LEONIX_SITE_ORIGIN;
  return [
    ...LEONIX_SITEMAP_MARKETING_PATHS.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: (path === "" || path === "/home" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" || path === "/home" ? 1 : 0.7,
    })),
    ...LEONIX_SITEMAP_CATEGORY_HUBS.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}

export const LEO_DISCOVERY_SEO_SEARCH_PERFORMANCE_NOT_MEASURED = [
  "No Search Console performance source.",
  "No verified indexed-page count.",
  "No ranking / impression / click / CTR data.",
  "No organic landing or local-pack performance data.",
  "No AI/GEO citation visibility measurement.",
] as const;

/** Architectural fact: canonical sitemap omits per-listing detail URLs. */
export function leonixSitemapOmitsPerListingDetailUrls(): true {
  return true;
}

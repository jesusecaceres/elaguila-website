import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

/**
 * Package F Build F2, Gate 16 (P1 SEO fix) — canonical public category hubs, added so a real
 * sitemap-driven discovery path exists for the catalog (previously only 8 marketing URLs).
 * Every path below is a confirmed-real, publicly indexable `page.tsx` on this branch. Per-listing
 * detail URLs are intentionally NOT generated here — safely enumerating only published/active rows
 * (excluding draft/preview/pending/rejected/suspended/archived) needs a dedicated DB-backed
 * sitemap generator, deferred to post-launch per this gate's scope.
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

/** Indexable marketing surfaces — extend as major hubs stabilize. */
export default function sitemap(): MetadataRoute.Sitemap {
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
  ];
}

import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

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
  ];
  return main.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/home" ? "weekly" : "monthly",
    priority: path === "" || path === "/home" ? 1 : 0.7,
  }));
}

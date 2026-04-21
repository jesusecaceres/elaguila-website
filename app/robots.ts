import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/clasificados/publicar", "/publicar"],
      },
    ],
    sitemap: `${LEONIX_SITE_ORIGIN}/sitemap.xml`,
    host: LEONIX_SITE_ORIGIN.replace(/^https?:\/\//, ""),
  };
}

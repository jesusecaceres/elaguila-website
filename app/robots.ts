import type { MetadataRoute } from "next";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
      },
    ],
    sitemap: `${LEONIX_SITE_ORIGIN}/sitemap.xml`,
    host: LEONIX_SITE_ORIGIN.replace(/^https?:\/\//, ""),
  };
}

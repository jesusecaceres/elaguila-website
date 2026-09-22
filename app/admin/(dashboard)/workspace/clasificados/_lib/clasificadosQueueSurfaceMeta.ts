/**
 * Public / publish URLs and source table labels for Clasificados admin queue headers.
 * Keep aligned with `classifiedsOpsContract` and live routes under `/clasificados` and `/publicar`.
 */
// QUICK SALES ENTRY CONSOLIDATION — for the four paid categories the staff "publish" link is the
// Quick Sales cockpit (server-issued custody), never the public application on the staff browser.
import { buildQuickSalesHref } from "@/app/lib/sales/quickSalesRoutes";

export type ClasificadosQueueSurfaceLinks = {
  sourceTable: string;
  publicHref: string;
  publishHref?: string;
};

export function clasificadosQueueSurfaceForSlug(slug: string): ClasificadosQueueSurfaceLinks {
  const s = (slug ?? "").trim().toLowerCase();
  switch (s) {
    case "restaurantes":
      return {
        sourceTable: "public.restaurantes_public_listings",
        publicHref: "/clasificados/restaurantes",
        publishHref: buildQuickSalesHref({ category: "restaurantes" }),
      };
    case "servicios":
      return {
        sourceTable: "public.servicios_public_listings",
        publicHref: "/clasificados/servicios",
        publishHref: buildQuickSalesHref({ category: "servicios" }),
      };
    case "comida-local":
      return {
        sourceTable: "public.comida_local_public_listings",
        publicHref: "/clasificados/comida-local",
        publishHref: "/publicar/comida-local",
      };
    case "ofertas-locales":
      return {
        sourceTable: "public.ofertas_locales",
        publicHref: "/clasificados/ofertas-locales",
        publishHref: "/publicar/ofertas-locales",
      };
    case "empleos":
      return {
        sourceTable: "public.empleos_public_listings",
        publicHref: "/clasificados/empleos",
        publishHref: "/clasificados/publicar/empleos",
      };
    case "autos":
      return {
        sourceTable: "public.autos_classifieds_listings",
        publicHref: "/clasificados/autos",
        publishHref: buildQuickSalesHref({ category: "autos" }),
      };
    case "travel":
    case "viajes":
      return {
        sourceTable: "public.viajes_staged_listings",
        publicHref: "/clasificados/viajes",
        publishHref: "/publicar/viajes",
      };
    case "rentas":
    case "en-venta":
    case "comunidad":
    case "clases":
    case "mascotas-y-perdidos":
    case "bienes-raices":
    case "busco":
      return {
        sourceTable: "public.listings",
        publicHref: `/clasificados/${encodeURIComponent(s)}`,
        publishHref:
          s === "busco"
            ? "/publicar/busco/quick"
            : s === "bienes-raices"
              ? buildQuickSalesHref({ category: "bienes-raices" })
              : `/clasificados/publicar/${encodeURIComponent(s)}`,
      };
    default:
      return {
        sourceTable: "public.listings",
        publicHref: `/clasificados/${encodeURIComponent(s)}`,
        publishHref: `/clasificados/publicar/${encodeURIComponent(s)}`,
      };
  }
}

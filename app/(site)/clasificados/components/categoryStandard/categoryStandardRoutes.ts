import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { CategoryStandardKey } from "./categoryStandardTheme";

/** Marketplace categories in CAT-STD-ALL scope (excludes iglesias hub stub). */
export const CAT_STD_ALL_SLUGS = [
  "en-venta",
  "rentas",
  "empleos",
  "autos",
  "bienes-raices",
  "servicios",
  "restaurantes",
  "viajes",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
] as const satisfies readonly CategoryStandardKey[];

export type CatStdAllSlug = (typeof CAT_STD_ALL_SLUGS)[number];

/** English-path results segment used in gate QA and en-venta/rentas. */
export const CAT_STD_RESULTS_SEGMENT = "results" as const;

export const CAT_STD_RESULTADOS_SEGMENT = "resultados" as const;

export function categoryLandingPath(slug: CatStdAllSlug): string {
  return `/clasificados/${slug}`;
}

export type CategoryResultsSegment = typeof CAT_STD_RESULTS_SEGMENT | typeof CAT_STD_RESULTADOS_SEGMENT;

export function categoryResultsPath(
  slug: CatStdAllSlug,
  segment: CategoryResultsSegment = CAT_STD_RESULTS_SEGMENT,
): string {
  return `/clasificados/${slug}/${segment}`;
}

export function buildCategoryResultsUrl(
  slug: CatStdAllSlug,
  lang: Lang,
  params?: Record<string, string | undefined>,
  segment: CategoryResultsSegment = CAT_STD_RESULTS_SEGMENT,
): string {
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && String(v).trim() !== "") sp.set(k, String(v).trim());
    }
  }
  return `${categoryResultsPath(slug, segment)}?${sp.toString()}`;
}

export function categoryPublishPath(slug: CatStdAllSlug): string {
  const map: Record<CatStdAllSlug, string> = {
    "en-venta": "/clasificados/publicar/en-venta",
    rentas: "/clasificados/publicar/rentas",
    empleos: "/clasificados/publicar/empleos",
    autos: "/clasificados/publicar/autos",
    "bienes-raices": "/clasificados/publicar/bienes-raices",
    servicios: "/clasificados/publicar/servicios",
    restaurantes: "/clasificados/restaurantes/publicar",
    viajes: "/clasificados/publicar/viajes",
    clases: "/clasificados/publicar/clases",
    comunidad: "/clasificados/publicar/comunidad",
    busco: "/publicar/busco/quick",
    "mascotas-y-perdidos": "/clasificados/publicar/mascotas-y-perdidos",
  };
  return map[slug];
}

import { BR_PUBLICAR_HUB, BR_RESULTS } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { enVentaPublicLabel } from "@/app/clasificados/en-venta/shared/constants/enVentaPublicLabels";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Category keys for Mis anuncios command center (excludes legacy "all"). */
export type MisAnunciosCategoryKey =
  | "en-venta"
  | "autos"
  | "bienes-raices"
  | "rentas"
  | "restaurantes"
  | "empleos"
  | "viajes"
  | "servicios"
  | "comida-local"
  | "clases"
  | "comunidad"
  | "busco";

export const MIS_ANUNCIOS_CATEGORY_KEYS: MisAnunciosCategoryKey[] = [
  "en-venta",
  "restaurantes",
  "servicios",
  "comida-local",
  "autos",
  "empleos",
  "rentas",
  "bienes-raices",
  "viajes",
  "clases",
  "comunidad",
  "busco",
];

export function isMisAnunciosCategoryKey(raw: string | null | undefined): raw is MisAnunciosCategoryKey {
  return Boolean(raw && (MIS_ANUNCIOS_CATEGORY_KEYS as string[]).includes(raw));
}

export type MisAnunciosCategoryDef = {
  key: MisAnunciosCategoryKey;
  title: (lang: Lang) => string;
  description: (lang: Lang) => string;
  ready: boolean;
  manageHref: (q: string) => string | null;
  publishHref: (q: string) => string | null;
  resultsHref?: (q: string) => string | null;
};

export const MIS_ANUNCIOS_CATEGORY_DEFS: MisAnunciosCategoryDef[] = [
  {
    key: "en-venta",
    title: (lang) => enVentaPublicLabel(lang),
    description: (lang) =>
      lang === "es"
        ? "Artículos, muebles y más — cada anuncio con plan Gratis o Pro."
        : "Items, furniture, and more — each listing with Free or Pro plan.",
    ready: true,
    manageHref: (q) => `/dashboard/mis-anuncios?${q}&cat=en-venta`,
    publishHref: (q) => `/clasificados/publicar/en-venta?${q}`,
    resultsHref: (q) => `/clasificados/en-venta/results?${q}`,
  },
  {
    key: "restaurantes",
    title: (lang) => (lang === "es" ? "Restaurantes" : "Restaurants"),
    description: (lang) =>
      lang === "es" ? "Perfiles de restaurante publicados en Leonix." : "Published restaurant profiles on Leonix.",
    ready: true,
    manageHref: (q) => `/dashboard/restaurantes?${q}`,
    publishHref: (q) => `/publicar/restaurantes?${q}`,
    resultsHref: (q) => `/clasificados/restaurantes/resultados?${q}`,
  },
  {
    key: "servicios",
    title: (lang) => (lang === "es" ? "Servicios" : "Services"),
    description: (lang) =>
      lang === "es" ? "Perfiles de servicios profesionales." : "Professional service profiles.",
    ready: true,
    manageHref: (q) => `/dashboard/servicios?${q}`,
    publishHref: (q) => `/clasificados/publicar/servicios?${q}`,
    resultsHref: (q) => `/clasificados/servicios/resultados?${q}`,
  },
  {
    key: "comida-local",
    title: (lang) => (lang === "es" ? "Comida Local" : "Local Food"),
    description: (lang) =>
      lang === "es" ? "Locales de comida y antojitos." : "Local food spots and eateries.",
    ready: true,
    manageHref: (q) => `/dashboard/mis-anuncios?${q}&cat=comida-local`,
    publishHref: (q) => `/publicar/comida-local?${q}`,
  },
  {
    key: "autos",
    title: (lang) => (lang === "es" ? "Autos" : "Autos"),
    description: (lang) =>
      lang === "es" ? "Clasificados de autos y autos de pago Leonix." : "Classified and Leonix paid vehicle listings.",
    ready: true,
    manageHref: (q) => `/dashboard/mis-anuncios?${q}&cat=autos`,
    publishHref: (q) => `/publicar/autos?${q}`,
    resultsHref: (q) => `/clasificados/autos/resultados?${q}`,
  },
  {
    key: "empleos",
    title: (lang) => (lang === "es" ? "Empleos" : "Jobs"),
    description: (lang) =>
      lang === "es" ? "Vacantes y ferias de empleo." : "Job listings and job fairs.",
    ready: true,
    manageHref: (q) => `/dashboard/empleos?${q}`,
    publishHref: (q) => `/clasificados/publicar/empleos?${q}`,
    resultsHref: (q) => `/clasificados/empleos/resultados?${q}`,
  },
  {
    key: "rentas",
    title: (lang) => (lang === "es" ? "Rentas" : "Rentals"),
    description: (lang) =>
      lang === "es" ? "Propiedades en renta (privado o negocio)." : "Rental properties (private or business).",
    ready: true,
    manageHref: (q) => `/dashboard/mis-anuncios?${q}&cat=rentas`,
    publishHref: (q) => `/publicar/rentas/privado?${q}`,
    resultsHref: (q) => `/clasificados/rentas/results?${q}`,
  },
  {
    key: "bienes-raices",
    title: (lang) => (lang === "es" ? "Bienes Raíces" : "Real estate"),
    description: (lang) =>
      lang === "es" ? "Propiedades en venta (privado o negocio)." : "Properties for sale (private or business).",
    ready: true,
    manageHref: (q) => `/dashboard/mis-anuncios?${q}&cat=bienes-raices`,
    publishHref: (q) => `${BR_PUBLICAR_HUB}?${q}`,
    resultsHref: (q) => `${BR_RESULTS}?${q}`,
  },
  {
    key: "viajes",
    title: (lang) => (lang === "es" ? "Viajes" : "Travel"),
    description: (lang) =>
      lang === "es" ? "Ofertas y paquetes de viaje." : "Travel offers and packages.",
    ready: true,
    manageHref: (q) => `/dashboard/viajes?${q}`,
    publishHref: (q) => `/publicar/viajes?${q}`,
    resultsHref: (q) => `/clasificados/viajes/resultados?${q}`,
  },
  {
    key: "clases",
    title: (lang) => (lang === "es" ? "Clases" : "Classes"),
    description: (lang) =>
      lang === "es" ? "Sin inventario gestionable en el panel aún." : "No manageable inventory in the dashboard yet.",
    ready: false,
    manageHref: () => null,
    publishHref: (q) => `/clasificados/publicar/clases?${q}`,
  },
  {
    key: "comunidad",
    title: (lang) => (lang === "es" ? "Comunidad" : "Community"),
    description: (lang) =>
      lang === "es" ? "Sin inventario gestionable en el panel aún." : "No manageable inventory in the dashboard yet.",
    ready: false,
    manageHref: () => null,
    publishHref: (q) => `/clasificados/publicar/comunidad?${q}`,
  },
  {
    key: "busco",
    title: (lang) => (lang === "es" ? "Busco / Se busca" : "Looking for / Wanted"),
    description: (lang) =>
      lang === "es" ? "Anuncios de búsqueda publicados." : "Published wanted/looking-for listings.",
    ready: true,
    manageHref: (q) => `/dashboard/mis-anuncios?${q}&cat=busco`,
    publishHref: (q) => `/clasificados/publicar/busco?${q}`,
    resultsHref: (q) => `/clasificados/busco/resultados?${q}`,
  },
];

const DEFAULT_CATEGORY_ORDER: MisAnunciosCategoryKey[] = [
  "en-venta",
  "restaurantes",
  "servicios",
  "comida-local",
  "autos",
  "empleos",
  "rentas",
  "bienes-raices",
  "viajes",
  "busco",
];

export function resolveMisAnunciosDefaultCategory(
  counts: Record<MisAnunciosCategoryKey, number>,
  urlCat: string | null | undefined,
): MisAnunciosCategoryKey {
  if (isMisAnunciosCategoryKey(urlCat)) return urlCat;
  for (const key of DEFAULT_CATEGORY_ORDER) {
    if ((counts[key] ?? 0) > 0) return key;
  }
  return "en-venta";
}

/** Hide global /dashboard/analytics links for categories without per-listing proof. */
export function provenInventoryAnalyticsHref(item: { category: string; analyticsHref?: string | null }): string | null {
  const cat = item.category.toLowerCase();
  if (cat === "empleos" || cat === "viajes" || cat === "servicios" || cat === "autos" || cat === "autos_paid") {
    return item.analyticsHref ?? null;
  }
  return null;
}

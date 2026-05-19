/**
 * Clasificados category control model — code defaults merged with optional `site_category_config` (admin).
 * Lives under `app/lib` (not `app/admin`) so public routes e.g. `/clasificados/publicar` can import without
 * pulling admin bundle chunks into the site graph.
 * `/clasificados/publicar` chooser uses merged visibility + order; labels still come from `categoryConfig`.
 */
import "server-only";

import type { CategoryKey } from "@/app/clasificados/config/categoryConfig";
import { categoryConfig } from "@/app/clasificados/config/categoryConfig";
import { fetchSiteCategoryConfigMap } from "@/app/lib/siteCategory/siteCategoryConfigData";

export type ClasificadosCategoryOperationalStatus = "live" | "staged" | "coming_soon" | "hidden";

export type ClasificadosCategoryRegistryEntry = {
  slug: string;
  displayNameEs: string;
  displayNameEn: string;
  emoji: string;
  sortOrder: number;
  visibility: "public" | "hidden";
  operationalStatus: ClasificadosCategoryOperationalStatus;
  /** Target route for “open landing” — may be coming-soon interstitial. */
  landingTarget: string;
  notes: string;
  readiness: "full" | "partial" | "scaffold";
  /** Admin emphasis in category ops table. */
  highlight?: boolean;
  /** Whether posture fields come from Supabase overlay. */
  configLayer?: "code" | "database";
  /** Notes column in `site_category_config` only (not merged display copy). */
  overlayNotes?: string | null;
};

const EXCLUDE: CategoryKey[] = ["all"];

/**
 * Code defaults before `site_category_config` overlay.
 * LIVE = public/client-ready; STAGED = admin pipeline / partial public readiness; COMING SOON = not client-ready by rule.
 */
function defaultOperationalStatus(slug: string): ClasificadosCategoryOperationalStatus {
  if (slug === "en-venta" || slug === "restaurantes" || slug === "rentas" || slug === "bienes-raices" || slug === "empleos") {
    return "live";
  }
  if (slug === "servicios" || slug === "autos" || slug === "travel") return "staged";
  if (slug === "comunidad" || slug === "clases" || slug === "busco" || slug === "mascotas-y-perdidos") {
    return "coming_soon";
  }
  return "coming_soon";
}

function defaultReadiness(slug: string): "full" | "partial" | "scaffold" {
  if (slug === "en-venta" || slug === "restaurantes" || slug === "rentas" || slug === "bienes-raices" || slug === "empleos") {
    return "full";
  }
  if (slug === "servicios" || slug === "autos" || slug === "travel") return "partial";
  return "scaffold";
}

export function getClasificadosCategoryRegistry(): ClasificadosCategoryRegistryEntry[] {
  const keys = (Object.keys(categoryConfig) as CategoryKey[]).filter((k) => !EXCLUDE.includes(k));

  return keys
    .map((key, i) => {
      const cfg = categoryConfig[key];
      const slug = key;
      const op = defaultOperationalStatus(slug);
      const visibility: "public" | "hidden" = op === "hidden" ? "hidden" : "public";
      const readiness = defaultReadiness(slug);
      return {
        slug,
        displayNameEs: cfg.label.es,
        displayNameEn: cfg.label.en,
        emoji:
          slug === "en-venta"
            ? "🛒"
            : slug === "empleos"
              ? "💼"
              : slug === "rentas"
                ? "🏠"
                : slug === "bienes-raices"
                  ? "🏢"
                  : slug === "autos"
                  ? "🚗"
                  : slug === "restaurantes"
                    ? "🍽"
                    : slug === "servicios"
                      ? "🔧"
                      : slug === "clases"
                        ? "📚"
                        : slug === "comunidad"
                          ? "🤝"
                          : slug === "busco"
                            ? "🔍"
                            : slug === "mascotas-y-perdidos"
                              ? "🐾"
                              : slug === "travel"
                                ? "✈️"
                                : "📁",
        sortOrder: i,
        visibility,
        operationalStatus: op,
        landingTarget:
          slug === "restaurantes"
            ? `/clasificados/restaurantes`
            : slug === "busco"
              ? `/clasificados/busco`
              : slug === "mascotas-y-perdidos"
                ? `/clasificados/mascotas-y-perdidos`
                : `/clasificados/publicar/${slug}`,
        notes:
          slug === "mascotas-y-perdidos"
            ? "Avisos gratuitos y sencillos para mascotas perdidas o encontradas, adopciones y objetos perdidos o encontrados en tu comunidad."
            : slug === "restaurantes"
            ? "Vertical operativa: publicación→Supabase, descubrimiento (resultados/filtros desde DB+listing_json), ficha pública, admin con acciones reales, panel propietario con hidratar borrador."
            : op === "live"
              ? "Primary live Clasificados vertical — taxonomy, publish, preview, dashboard contract."
              : op === "staged"
                ? "Partial flows exist; activate carefully after QA."
                : "Route-ready registry entry — not fully operational.",
        readiness,
        highlight: false,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Async registry — overlays `site_category_config` when rows exist. */
export async function getClasificadosCategoryRegistryMerged(): Promise<ClasificadosCategoryRegistryEntry[]> {
  const map = await fetchSiteCategoryConfigMap();
  const base = getClasificadosCategoryRegistry();
  return base
    .map((e) => {
      const o = map.get(e.slug);
      if (!o) return { ...e, highlight: false, configLayer: "code" as const, overlayNotes: null };
      const visibility: "public" | "hidden" = o.visibility === "hidden" ? "hidden" : "public";
      const overlayNotes = o.notes != null ? String(o.notes) : "";
      return {
        ...e,
        visibility,
        operationalStatus: o.operational_status,
        sortOrder: o.sort_order,
        highlight: o.highlight,
        notes: o.notes?.trim() ? o.notes : e.notes,
        configLayer: "database" as const,
        overlayNotes,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function summarizeRegistryForDashboard(registry: ClasificadosCategoryRegistryEntry[]) {
  return {
    live: registry.filter((r) => r.operationalStatus === "live").length,
    staged: registry.filter((r) => r.operationalStatus === "staged").length,
    comingSoon: registry.filter((r) => r.operationalStatus === "coming_soon").length,
  };
}

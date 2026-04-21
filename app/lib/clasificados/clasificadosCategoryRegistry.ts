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

/** Repo-informed defaults: en-venta fully wired first; servicios is NOT special — treat as staged unless marked live elsewhere. */
function defaultOperationalStatus(slug: string): ClasificadosCategoryOperationalStatus {
  if (slug === "en-venta") return "live";
  if (slug === "servicios") return "staged";
  if (slug === "restaurantes") return "staged";
  return "coming_soon";
}

function defaultReadiness(slug: string): "full" | "partial" | "scaffold" {
  if (slug === "en-venta") return "full";
  if (slug === "restaurantes") return "partial";
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
                          : slug === "travel"
                            ? "✈️"
                            : "📁",
        sortOrder: i,
        visibility,
        operationalStatus: op,
        landingTarget: slug === "restaurantes" ? `/clasificados/restaurantes` : `/clasificados/publicar/${slug}`,
        notes:
          slug === "restaurantes"
            ? "Staged lane: publicación→Supabase, resultados/descubrimiento, ficha pública, admin (tabla lectura) y panel propietario; no lanzamiento masivo formal."
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

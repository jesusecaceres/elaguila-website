/**
 * Clasificados category control model — single registry for admin + future persistence.
 * Status: en-venta = live (primary). Others default to coming_soon or staged per product.
 * TODO: persist overrides in Supabase table `site_category_config` when introduced.
 */
import type { CategoryKey } from "@/app/clasificados/config/categoryConfig";
import { categoryConfig } from "@/app/clasificados/config/categoryConfig";

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
};

const EXCLUDE: CategoryKey[] = ["all"];

/** Repo-informed defaults: en-venta fully wired first; servicios is NOT special — treat as staged unless marked live elsewhere. */
function defaultOperationalStatus(slug: string): ClasificadosCategoryOperationalStatus {
  if (slug === "en-venta") return "live";
  if (slug === "servicios") return "staged";
  return "coming_soon";
}

function defaultReadiness(slug: string): "full" | "partial" | "scaffold" {
  if (slug === "en-venta") return "full";
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
        landingTarget: `/clasificados/publicar/${slug}`,
        notes:
          op === "live"
            ? "Primary live Clasificados vertical — taxonomy, publish, preview, dashboard contract."
            : op === "staged"
              ? "Partial flows exist; activate carefully after QA."
              : "Route-ready registry entry — not fully operational.",
        readiness: defaultReadiness(slug),
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

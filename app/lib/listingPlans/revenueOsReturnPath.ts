/**
 * Revenue OS safe internal return paths — shared by checkout URLs and pago result pages.
 * Gate REVENUE-OS-GLOBAL-RETURN-SAFETY-PLUS-RESTAURANTES-ADDON-ONLY-01
 */

import { safeInternalNextPath } from "@/app/lib/launchLock/previewBypass";

export type RevenueOsLang = "es" | "en";

function isUnsafeExternalReturnPath(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.startsWith("//")) return true;
  if (!trimmed.startsWith("/")) return true;
  return false;
}

/** Allow only same-origin internal paths; fall back when missing or external. */
export function sanitizeRevenueOsReturnPath(
  returnTo: string | null | undefined,
  fallback: string,
): string {
  const trimmed = returnTo?.trim();
  if (!trimmed || isUnsafeExternalReturnPath(trimmed)) {
    return safeInternalNextPath(fallback);
  }
  return safeInternalNextPath(trimmed);
}

const CATEGORY_DEFAULT_RETURN_PATHS: Record<string, string> = {
  rentas: "/clasificados/rentas",
  empleos: "/clasificados/empleos",
  autos: "/clasificados/autos",
  restaurantes: "/clasificados/restaurantes",
  servicios: "/clasificados/servicios",
  "bienes-raices": "/clasificados/bienes-raices",
};

export function resolveRevenueCategoryDefaultReturnPath(
  category: string,
  lang: RevenueOsLang = "es",
): string {
  const cat = String(category ?? "").trim().toLowerCase();
  const base = CATEGORY_DEFAULT_RETURN_PATHS[cat] ?? "/dashboard/mis-anuncios";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}lang=${lang}`;
}

export function buildDashboardMisAnunciosReturnPath(
  lang: RevenueOsLang,
  category?: string | null,
): string {
  const q = new URLSearchParams({ lang });
  const cat = category?.trim().toLowerCase();
  if (cat) q.set("category", cat);
  return `/dashboard/mis-anuncios?${q.toString()}`;
}

export function resolveRevenueOsSuccessReturnPath(input: {
  returnTo?: string | null;
  category?: string | null;
  packageKey?: string | null;
  lang?: RevenueOsLang;
}): string {
  const lang = input.lang === "en" ? "en" : "es";
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  const category = String(input.category ?? "").trim().toLowerCase();

  const dashboardFallback = buildDashboardMisAnunciosReturnPath(lang, category || null);
  const categoryFallback = resolveRevenueCategoryDefaultReturnPath(category, lang);

  if (packageKey.endsWith("_offers_addon") || packageKey.includes("_addon")) {
    return sanitizeRevenueOsReturnPath(input.returnTo, dashboardFallback);
  }

  return sanitizeRevenueOsReturnPath(input.returnTo, categoryFallback);
}

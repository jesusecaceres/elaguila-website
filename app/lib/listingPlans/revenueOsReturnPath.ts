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
  "ofertas-locales": "/dashboard/ofertas-locales",
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

/**
 * Ensures a same-origin internal path carries the current `lang` — appends it only when the path
 * doesn't already specify one (an explicit `lang` on `returnTo`, e.g. from a caller that built its
 * own return URL, is never overridden). Fixed defect: `sanitizeRevenueOsReturnPath` returns a
 * valid non-empty `returnTo` verbatim, so a raw category returnPath with no `lang` (e.g.
 * SERVICIOS_BASE_CHECKOUT.returnPath = "/clasificados/servicios") silently dropped the user's
 * locale on the post-checkout "View category" link.
 */
function withLangParam(path: string, lang: RevenueOsLang): string {
  if (/[?&]lang=/.test(path)) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${lang}`;
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
    return withLangParam(sanitizeRevenueOsReturnPath(input.returnTo, dashboardFallback), lang);
  }

  return withLangParam(sanitizeRevenueOsReturnPath(input.returnTo, categoryFallback), lang);
}

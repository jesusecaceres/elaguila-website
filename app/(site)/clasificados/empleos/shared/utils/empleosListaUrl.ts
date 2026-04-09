/**
 * Empleos landing: category-owned browse URL (query params only).
 */

import { appendLangToPath, buildCategoryBrowseUrl } from "@/app/clasificados/lib/hubUrl";

type Lang = "es" | "en";

export function buildEmpleosListaUrl(cat: string, lang: Lang, q?: string, city?: string): string {
  return buildCategoryBrowseUrl(cat, lang, { q, city });
}

/** Public job results listing (Phase 1 shell; later wired to search). */
export function buildEmpleosResultadosUrl(lang: Lang, extra?: { q?: string }): string {
  const base = appendLangToPath("/clasificados/empleos/resultados", lang);
  if (extra?.q) {
    const joiner = base.includes("?") ? "&" : "?";
    return `${base}${joiner}q=${encodeURIComponent(extra.q)}`;
  }
  return base;
}

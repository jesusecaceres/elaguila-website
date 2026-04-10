/**
 * Empleos landing: category-owned browse URL (query params only).
 */

import { appendLangToPath, buildCategoryBrowseUrl } from "@/app/clasificados/lib/hubUrl";

type Lang = "es" | "en";

export function buildEmpleosListaUrl(cat: string, lang: Lang, q?: string, city?: string): string {
  return buildCategoryBrowseUrl(cat, lang, { q, city });
}

/** Stable query keys shared with future Empleos search API. */
export type EmpleosResultadosParams = {
  q?: string;
  city?: string;
  category?: string;
  jobType?: string;
  modality?: string;
  salaryMin?: string;
  salaryMax?: string;
  experience?: string;
  companyType?: string;
  featured?: string;
  recent?: string;
  quickApply?: string;
  sort?: string;
};

/**
 * Public job results listing. Merges filters into the URL alongside `lang`.
 */
export function buildEmpleosResultadosUrl(lang: Lang, extra?: EmpleosResultadosParams): string {
  const base = appendLangToPath("/clasificados/empleos/resultados", lang);
  const url = new URL(base, "https://leonix.local");
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null && String(v).trim() !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return `${url.pathname}${url.search}`;
}

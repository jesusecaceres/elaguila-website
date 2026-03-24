/**
 * Empleos landing: category-owned browse URL (query params only).
 */

import { buildCategoryBrowseUrl } from "@/app/clasificados/lib/hubUrl";

type Lang = "es" | "en";

export function buildEmpleosListaUrl(cat: string, lang: Lang, q?: string, city?: string): string {
  return buildCategoryBrowseUrl(cat, lang, { q, city });
}

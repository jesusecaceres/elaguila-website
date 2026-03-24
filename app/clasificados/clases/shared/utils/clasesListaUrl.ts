/**
 * Clases landing: category-owned browse URL.
 */

import { buildCategoryBrowseUrl } from "@/app/clasificados/lib/hubUrl";

type Lang = "es" | "en";

export function buildClasesListaUrl(cat: string, lang: Lang, q?: string, city?: string): string {
  return buildCategoryBrowseUrl(cat, lang, { q, city });
}

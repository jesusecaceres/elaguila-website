import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

type Lang = "es" | "en";

/** Clases landing → results browse (`/clasificados/clases/results`). */
export function buildClasesListaUrl(_cat: string, lang: Lang, q?: string, city?: string): string {
  return buildCategoryResultsUrl("clases", lang, { q, city });
}

import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

type Lang = "es" | "en";

/** Comunidad landing → results browse (`/clasificados/comunidad/results`). */
export function buildComunidadListaUrl(_cat: string, lang: Lang, q?: string, city?: string): string {
  return buildCategoryResultsUrl("comunidad", lang, { q, city });
}

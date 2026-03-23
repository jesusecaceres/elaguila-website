/**
 * Autos landing: lista URL builder for `cat=autos` and optional search params.
 */

type Lang = "es" | "en";

export function buildAutosListaUrl(cat: string, lang: Lang, q?: string, city?: string): string {
  const params = new URLSearchParams();
  params.set("cat", cat);
  params.set("lang", lang);
  if (q?.trim()) params.set("q", q.trim());
  if (city?.trim()) params.set("city", city.trim());
  return `/clasificados/lista?${params.toString()}`;
}

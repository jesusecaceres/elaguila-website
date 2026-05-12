/**
 * Clases landing → published listings browse (`/clasificados/clases/resultados`).
 * `cat` kept for backward-compatible call sites (ignored; category is always Clases).
 */

type Lang = "es" | "en";

export function buildClasesListaUrl(_cat: string, lang: Lang, q?: string, city?: string): string {
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  if (q?.trim()) sp.set("q", q.trim());
  if (city?.trim()) sp.set("city", city.trim());
  return `/clasificados/clases/resultados?${sp.toString()}`;
}

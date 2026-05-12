/**
 * Comunidad landing → published listings browse (`/clasificados/comunidad/resultados`).
 */

type Lang = "es" | "en";

export function buildComunidadListaUrl(_cat: string, lang: Lang, q?: string, city?: string): string {
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  if (q?.trim()) sp.set("q", q.trim());
  if (city?.trim()) sp.set("city", city.trim());
  return `/clasificados/comunidad/resultados?${sp.toString()}`;
}

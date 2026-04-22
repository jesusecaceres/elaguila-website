export type SortId = "newest" | "price-asc" | "price-desc";

/** Short line for hero: current keyword search. */
export function buildSearchSummaryLine(q: string, lang: "es" | "en"): string | null {
  const s = q.trim();
  if (!s) return null;
  return lang === "es" ? `Búsqueda: “${s}”` : `Search: “${s}”`;
}

/** City + optional ZIP for hero (matches URL state). */
export function buildLocationSummaryLine(
  city: string,
  zip: string,
  lang: "es" | "en"
): string | null {
  const c = city.trim();
  const z = zip.trim();
  if (!c && !z) return null;
  if (c && z) return lang === "es" ? `Ubicación: ${c} · CP ${z}` : `Location: ${c} · ZIP ${z}`;
  if (z) return lang === "es" ? `CP: ${z}` : `ZIP: ${z}`;
  return lang === "es" ? `Ciudad: ${c}` : `City: ${c}`;
}

/** Explains how the main grid is ordered (honest; URL-driven). */
export function sortSectionCaption(sort: SortId, lang: "es" | "en"): string {
  if (sort === "price-asc") return lang === "es" ? "Orden: precio menor a mayor" : "Sort: price, low to high";
  if (sort === "price-desc") return lang === "es" ? "Orden: precio mayor a menor" : "Sort: price, high to low";
  return lang === "es" ? "Orden: más recientes primero" : "Sort: newest first";
}

/** Featured-only mode banner (when `featured=1`). */
export function featuredOnlyBanner(lang: "es" | "en"): string {
  return lang === "es"
    ? "Solo anuncios con visibilidad Pro renovada vigente (ventana de 48h tras renovar)."
    : "Only listings with active renewed Pro visibility (48h window after each renewal).";
}

export function promotedSectionHelp(lang: "es" | "en"): string {
  return lang === "es"
    ? "Hasta dos anuncios con visibilidad renovada activa pueden aparecer aquí; son anuncios reales de la misma base de datos y no se repiten abajo."
    : "Up to two listings with active renewed visibility may appear here; they are real rows from the same dataset and are not repeated below.";
}

export function catalogSectionTitle(lang: "es" | "en"): string {
  return lang === "es" ? "Catálogo" : "Catalog";
}

export function catalogSectionSubtitle(lang: "es" | "en"): string {
  return lang === "es"
    ? "Todos los anuncios que coinciden con tus filtros (paginado)."
    : "All listings that match your filters (paginated).";
}

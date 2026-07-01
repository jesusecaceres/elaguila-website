export type SortId = "newest" | "price-asc" | "price-desc";

/** Short line for hero: current keyword search. */
export function buildSearchSummaryLine(q: string, lang: "es" | "en"): string | null {
  const s = q.trim();
  if (!s) return null;
  return lang === "es" ? `Búsqueda: “${s}”` : `Search: “${s}”`;
}

/** City + state + ZIP + country for hero (matches URL state). */
export function buildLocationSummaryLine(
  city: string,
  state: string,
  zip: string,
  country: string,
  lang: "es" | "en"
): string | null {
  const c = city.trim();
  const st = state.trim();
  const z = zip.trim();
  const co = country.trim();
  if (!c && !st && !z && !co) return null;
  const parts: string[] = [];
  if (c) parts.push(c);
  if (st) parts.push(st);
  if (z) parts.push(`ZIP ${z}`);
  if (co && !/^(united states|estados unidos|us|usa)$/i.test(co)) parts.push(co);
  if (!parts.length) return null;
  return lang === "es" ? `Ubicación: ${parts.join(" · ")}` : `Location: ${parts.join(" · ")}`;
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
    ? "Solo anuncios recién refrescados (misma publicación, ordenados por fecha de refresco)."
    : "Only recently refreshed listings (same listing, sorted by refresh date).";
}

export function promotedSectionHelp(lang: "es" | "en"): string {
  return lang === "es"
    ? "Hasta dos anuncios recién refrescados pueden aparecer aquí; son publicaciones reales de la misma base y no se repiten abajo."
    : "Up to two recently refreshed listings may appear here; they are real rows from the same dataset and are not repeated below.";
}

export function catalogSectionTitle(lang: "es" | "en"): string {
  return lang === "es" ? "Catálogo" : "Catalog";
}

export function catalogSectionSubtitle(lang: "es" | "en"): string {
  return lang === "es"
    ? "Todos los anuncios que coinciden con tus filtros (paginado)."
    : "All listings that match your filters (paginated).";
}

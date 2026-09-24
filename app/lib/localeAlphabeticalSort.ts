/**
 * Locale-aware alphabetical sorting for hub category/lane grids (Clasificados,
 * Negocios Locales). This is a presentation-layer derivation over the canonical
 * category model — it never reorders or mutates the underlying category arrays,
 * it only produces a sorted view of whatever keys are passed in, ordered by
 * each item's rendered label in the current site language.
 *
 * Uses `Intl.Collator` with `sensitivity: "base"` (accent/case-insensitive,
 * e.g. "Á" sorts with "A") and `numeric: true` (e.g. "Clase 2" before "Clase 10").
 */
export function sortByLocaleLabel<T>(
  items: readonly T[],
  getLabel: (item: T) => string,
  locale: string,
): T[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return [...items].sort((a, b) => collator.compare(getLabel(a), getLabel(b)));
}

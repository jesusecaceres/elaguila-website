/**
 * Leonix bilingual discovery foundation — ⚠️38A (2026-09-14).
 *
 * The category adapter contract. A category plugs its OWN taxonomy (ids it already persists) into the
 * shared bilingual document + matcher; the foundation never learns category-specific types.
 *
 * Doctrine encoded here:
 *  - inventory membership is never a function of viewer, page or source language;
 *  - canonical concepts are language-neutral ids with deterministic ES/EN labels;
 *  - "languages served" are canonical ids describing whom the business can serve — never the language
 *    the listing was authored in.
 */

export type DiscoveryLocale = "es" | "en";

export type CanonicalConceptLabels = { es: string; en: string };

/** A language-neutral concept the row carries (e.g. kind "businessType", id "plomeria"). */
export type CanonicalConceptRef = { kind: string; id: string };

/** What a query means once normalized: exact canonical concepts (if any) + normalized text terms. */
export type CanonicalIntent = {
  /** Stable concept keys (`conceptKey(ref)`) the query resolves to exactly (aliases / catalog labels). */
  conceptKeys: ReadonlySet<string>;
  /** Normalized terms (query + approved aliases) for label / literal / custom-text substring matching. */
  terms: readonly string[];
  /** The normalized query itself ("" when empty). */
  normalizedQuery: string;
};

export interface CategoryDiscoveryAdapter<TRow> {
  readonly category: string;
  /** ES + EN catalog labels of a concept, or null when the id is unknown to the catalog. */
  conceptLabels(ref: CanonicalConceptRef): CanonicalConceptLabels | null;
  /** Approved bilingual aliases of a concept (colloquial forms such as "plomero" / "plumber"). */
  conceptAliases(ref: CanonicalConceptRef): readonly string[];
  /** Resolves a free-text query to canonical intent. Deterministic; never calls a translation API. */
  intentFromQuery(rawQuery: string | null | undefined): CanonicalIntent;
  /** Every canonical concept the row carries (from persisted ids, or exact catalog-label recovery). */
  rowConcepts(row: TRow): readonly CanonicalConceptRef[];
  /** Literal searchable fields (names, places, codes) — preserved verbatim, never translated. */
  rowLiterals(row: TRow): readonly string[];
  /** Owner-authored free text, searchable in its ORIGINAL language only (⚠️38B stays deferred). */
  rowCustomText(row: TRow): readonly string[];
  /** Canonical ids of the languages the business can serve customers in. */
  rowLanguagesServed(row: TRow): readonly string[];
}

export function conceptKey(ref: CanonicalConceptRef): string {
  return `${ref.kind}:${ref.id}`;
}

export function emptyCanonicalIntent(): CanonicalIntent {
  return { conceptKeys: new Set<string>(), terms: [], normalizedQuery: "" };
}

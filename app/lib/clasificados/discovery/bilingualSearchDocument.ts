/**
 * Leonix bilingual discovery foundation — ⚠️38A (2026-09-14).
 *
 * One language-neutral search document per row, derived at request time from data the row already
 * stores. Canonical concepts contribute their ids AND both catalog labels AND approved aliases, so a
 * Spanish-authored "Plomería" listing is found by "plumbing" without any translation call. Literals and
 * owner custom text are included exactly as stored (original language).
 */
import {
  conceptKey,
  type CategoryDiscoveryAdapter,
  type CanonicalConceptRef,
} from "./canonicalTaxonomyAdapter";
import { normalizeBilingualSearchParts } from "./bilingualSearchText";

export type BilingualSearchDocument = {
  /** `conceptKey(ref)` for every canonical concept on the row. */
  conceptKeys: ReadonlySet<string>;
  /** Normalized ES + EN catalog labels + aliases of every concept, newline-joined. */
  canonicalText: string;
  /** Normalized literal fields (business name, places, codes), newline-joined. */
  literalText: string;
  /** Normalized owner free text in its original language, newline-joined. */
  customText: string;
};

export function buildBilingualSearchDocument<TRow>(
  adapter: CategoryDiscoveryAdapter<TRow>,
  row: TRow,
): BilingualSearchDocument {
  const concepts: readonly CanonicalConceptRef[] = adapter.rowConcepts(row);
  const conceptKeys = new Set<string>();
  const canonicalParts: string[] = [];
  for (const ref of concepts) {
    conceptKeys.add(conceptKey(ref));
    const labels = adapter.conceptLabels(ref);
    if (labels) canonicalParts.push(labels.es, labels.en);
    canonicalParts.push(...adapter.conceptAliases(ref));
  }
  return {
    conceptKeys,
    canonicalText: normalizeBilingualSearchParts(canonicalParts).join("\n"),
    literalText: normalizeBilingualSearchParts(adapter.rowLiterals(row)).join("\n"),
    customText: normalizeBilingualSearchParts(adapter.rowCustomText(row)).join("\n"),
  };
}

export function documentHasConcept(doc: BilingualSearchDocument, ref: CanonicalConceptRef): boolean {
  return doc.conceptKeys.has(conceptKey(ref));
}

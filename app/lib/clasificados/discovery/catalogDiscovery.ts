/**
 * Leonix bilingual discovery — WAVE 4 category adoption helper (2026-09-24).
 *
 * A thin, pure layer ON TOP of the five foundation files (it does not change their behavior). A category
 * declares a small ES + EN concept catalog keyed on ids its rows ALREADY persist; this helper turns it
 * into a `CategoryDiscoveryAdapter` and compiles a free-text query into:
 *
 *   - a whole-query intent (exact concept phrase, or the raw normalized text as a substring term) — this
 *     preserves every literal / owner-text substring match the old monolingual matchers performed, and
 *   - AND-combined segments (one per recognized concept phrase, one per leftover word) so a natural
 *     bilingual query such as "house for rent" ↔ "casa en renta" means (house AND rent) rather than
 *     (house OR rent).
 *
 * A row matches when the whole-query intent matches OR every segment matches — both evaluated with the
 * shared `matchesDiscoveryIntent`. Authored / viewer / page language never appears here; no translation
 * or network call happens during search.
 */
import { buildBilingualSearchDocument, type BilingualSearchDocument } from "./bilingualSearchDocument";
import { normalizeBilingualSearchKey } from "./bilingualSearchText";
import {
  conceptKey,
  emptyCanonicalIntent,
  type CanonicalConceptLabels,
  type CanonicalConceptRef,
  type CanonicalIntent,
  type CategoryDiscoveryAdapter,
} from "./canonicalTaxonomyAdapter";
import { intentIsEmpty, matchesDiscoveryIntent } from "./discoveryMatcher";

export type CatalogConcept = {
  kind: string;
  id: string;
  es: string;
  en: string;
  /** Approved bilingual colloquial forms (recognized as query phrases; searchable on rows carrying the concept). */
  aliases?: readonly string[];
  /**
   * When false the concept's labels are NOT spread into free-text substring terms (use for short, generic
   * words such as "rent" / "used" that would otherwise substring-match unrelated prose). Default true.
   */
  expandTerms?: boolean;
};

/** Function words dropped between concept phrases ("house FOR rent", "casa EN renta"). */
const STOP_WORDS = new Set([
  "en", "de", "del", "la", "el", "los", "las", "un", "una", "para", "con", "y", "a", "por",
  "for", "in", "the", "an", "of", "with", "and", "to", "at", "near", "cerca",
]);

const MAX_PHRASE_TOKENS = 4;

function labelVariants(label: string): string[] {
  const out = new Set<string>();
  const add = (s: string) => {
    const n = normalizeBilingualSearchKey(s);
    if (n) out.add(n);
  };
  add(label);
  const noParen = label.replace(/\([^)]*\)/g, " ");
  add(noParen);
  for (const part of noParen.split(/[/,]/)) add(part);
  return [...out];
}

function queryTokens(normalizedQuery: string): string[] {
  return normalizedQuery
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^[?!.¿¡"'()]+|[?!.¿¡"'()]+$/g, ""))
    .filter((t) => /[\p{L}\p{N}]/u.test(t));
}

export type CatalogDiscoveryAdapter<TRow> = CategoryDiscoveryAdapter<TRow> & {
  /** AND-combined segments for a query; empty when the query names no catalog concept. */
  segmentsFromQuery(rawQuery: string | null | undefined): readonly CanonicalIntent[];
  /** Exact recovery of a concept id of `kind` from a stored label / alias / code (e.g. "Sedán" → "sedan"). */
  resolveConceptId(kind: string, value: string | null | undefined): string | null;
  /** Cached language-neutral search document for a row. */
  documentFor(row: TRow): BilingualSearchDocument;
};

export type CatalogDiscoveryConfig<TRow> = {
  category: string;
  catalog: readonly CatalogConcept[];
  rowConcepts(row: TRow, resolve: (kind: string, value: string | null | undefined) => string | null): readonly CanonicalConceptRef[];
  rowLiterals(row: TRow): readonly (string | null | undefined)[];
  rowCustomText(row: TRow): readonly (string | null | undefined)[];
};

export function createCatalogDiscoveryAdapter<TRow extends object>(
  cfg: CatalogDiscoveryConfig<TRow>,
): CatalogDiscoveryAdapter<TRow> {
  const byKey = new Map<string, CatalogConcept>();
  const phraseIndex = new Map<string, CatalogConcept[]>();
  const expansionByKey = new Map<string, string[]>();
  const aliasesByKey = new Map<string, string[]>();

  const indexPhrase = (phrase: string, concept: CatalogConcept) => {
    const list = phraseIndex.get(phrase) ?? [];
    if (!list.includes(concept)) list.push(concept);
    phraseIndex.set(phrase, list);
  };

  for (const concept of cfg.catalog) {
    const key = conceptKey(concept);
    byKey.set(key, concept);
    const labelForms = [...labelVariants(concept.es), ...labelVariants(concept.en)];
    const aliasForms = (concept.aliases ?? []).map((a) => normalizeBilingualSearchKey(a)).filter(Boolean);
    aliasesByKey.set(key, [...new Set([...labelForms, ...aliasForms])]);
    if (concept.expandTerms !== false) {
      expansionByKey.set(key, [...new Set(labelForms.filter((t) => t.length >= 3))]);
    }
    for (const phrase of new Set([...labelForms, ...aliasForms])) indexPhrase(phrase, concept);
  }

  const lookupPhrase = (phrase: string, allowPlural: boolean): CatalogConcept[] | null => {
    const hit = phraseIndex.get(phrase);
    if (hit) return hit;
    if (!allowPlural) return null;
    if (phrase.endsWith("es") && phrase.length > 4) {
      const p = phraseIndex.get(phrase.slice(0, -2));
      if (p) return p;
    }
    if (phrase.endsWith("s") && phrase.length > 3) {
      const p = phraseIndex.get(phrase.slice(0, -1));
      if (p) return p;
    }
    return null;
  };

  const intentForConcepts = (typedPhrase: string, concepts: readonly CatalogConcept[]): CanonicalIntent => {
    const conceptKeys = new Set<string>();
    const terms = new Set<string>([typedPhrase]);
    for (const c of concepts) {
      const key = conceptKey(c);
      conceptKeys.add(key);
      for (const t of expansionByKey.get(key) ?? []) terms.add(t);
    }
    return { conceptKeys, terms: [...terms], normalizedQuery: typedPhrase };
  };

  const documents = new WeakMap<object, BilingualSearchDocument>();

  const resolveConceptId = (kind: string, value: string | null | undefined): string | null => {
    const n = normalizeBilingualSearchKey(value);
    if (!n) return null;
    const hit = phraseIndex.get(n)?.find((c) => c.kind === kind);
    return hit ? hit.id : null;
  };

  const adapter: CatalogDiscoveryAdapter<TRow> = {
    category: cfg.category,
    conceptLabels(ref): CanonicalConceptLabels | null {
      const c = byKey.get(conceptKey(ref));
      return c ? { es: c.es, en: c.en } : null;
    },
    conceptAliases(ref) {
      return aliasesByKey.get(conceptKey(ref)) ?? [];
    },
    intentFromQuery(rawQuery) {
      const normalizedQuery = normalizeBilingualSearchKey(rawQuery);
      if (!normalizedQuery) return emptyCanonicalIntent();
      const exact = phraseIndex.get(normalizedQuery);
      if (exact) return intentForConcepts(normalizedQuery, exact);
      return { conceptKeys: new Set<string>(), terms: [normalizedQuery], normalizedQuery };
    },
    segmentsFromQuery(rawQuery) {
      const normalizedQuery = normalizeBilingualSearchKey(rawQuery);
      if (!normalizedQuery) return [];
      const tokens = queryTokens(normalizedQuery);
      const segments: CanonicalIntent[] = [];
      let recognized = 0;
      let i = 0;
      while (i < tokens.length) {
        let consumed = 0;
        for (let n = Math.min(MAX_PHRASE_TOKENS, tokens.length - i); n >= 1; n--) {
          const phrase = tokens.slice(i, i + n).join(" ");
          const hit = lookupPhrase(phrase, n === 1);
          if (hit) {
            segments.push(intentForConcepts(phrase, hit));
            recognized++;
            consumed = n;
            break;
          }
        }
        if (consumed > 0) {
          i += consumed;
          continue;
        }
        const token = tokens[i]!;
        if (!STOP_WORDS.has(token)) {
          segments.push({ conceptKeys: new Set<string>(), terms: [token], normalizedQuery: token });
        }
        i += 1;
      }
      return recognized > 0 ? segments : [];
    },
    resolveConceptId,
    rowConcepts: (row) => cfg.rowConcepts(row, resolveConceptId),
    rowLiterals: (row) => cfg.rowLiterals(row).filter((s): s is string => typeof s === "string" && s.trim().length > 0),
    rowCustomText: (row) => {
      const literals = cfg.rowLiterals(row).filter((s): s is string => typeof s === "string" && s.trim().length > 0);
      const custom = cfg.rowCustomText(row).filter((s): s is string => typeof s === "string" && s.trim().length > 0);
      // The legacy matchers searched ONE space-joined haystack (so "san jose ca" could span fields). Keep
      // that literal fallback exactly: the joined haystack is one extra owner-text part.
      return [...custom, [...literals, ...custom].join(" ")];
    },
    rowLanguagesServed: () => [],
    documentFor(row) {
      const cached = documents.get(row);
      if (cached) return cached;
      const doc = buildBilingualSearchDocument(adapter, row);
      documents.set(row, doc);
      return doc;
    },
  };
  return adapter;
}

export type CompiledDiscoveryQuery = {
  empty: boolean;
  matches(doc: BilingualSearchDocument): boolean;
};

/** Compile once per filter call; evaluate per row. */
export function compileCatalogDiscoveryQuery<TRow>(
  adapter: CatalogDiscoveryAdapter<TRow>,
  rawQuery: string | null | undefined,
): CompiledDiscoveryQuery {
  const whole = adapter.intentFromQuery(rawQuery);
  if (intentIsEmpty(whole)) return { empty: true, matches: () => true };
  const segments = adapter.segmentsFromQuery(rawQuery);
  return {
    empty: false,
    matches(doc) {
      if (matchesDiscoveryIntent(doc, whole)) return true;
      return segments.length > 0 && segments.every((s) => matchesDiscoveryIntent(doc, s));
    },
  };
}

/** Compile once per filter call; returns a per-row predicate (always-true when the query is empty). */
export function catalogKeywordMatcher<TRow>(
  adapter: CatalogDiscoveryAdapter<TRow>,
  rawQuery: string | null | undefined,
): (row: TRow) => boolean {
  const q = compileCatalogDiscoveryQuery(adapter, rawQuery);
  if (q.empty) return () => true;
  return (row) => q.matches(adapter.documentFor(row));
}

/** One-row convenience (compiles per call — prefer `filterRowsByCatalogDiscoveryKeyword` for lists). */
export function rowMatchesCatalogDiscoveryKeyword<TRow>(
  adapter: CatalogDiscoveryAdapter<TRow>,
  row: TRow,
  rawQuery: string | null | undefined,
): boolean {
  const q = compileCatalogDiscoveryQuery(adapter, rawQuery);
  return q.empty || q.matches(adapter.documentFor(row));
}

export function filterRowsByCatalogDiscoveryKeyword<TRow>(
  adapter: CatalogDiscoveryAdapter<TRow>,
  rows: readonly TRow[],
  rawQuery: string | null | undefined,
): TRow[] {
  const q = compileCatalogDiscoveryQuery(adapter, rawQuery);
  if (q.empty) return [...rows];
  return rows.filter((row) => q.matches(adapter.documentFor(row)));
}

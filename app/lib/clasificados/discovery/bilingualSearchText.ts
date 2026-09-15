/**
 * Leonix bilingual discovery foundation — ⚠️38A (2026-09-14).
 *
 * One text normalizer for every discovery surface (landing intent, results keyword filter, saved-search
 * matching and fingerprinting). Semantics are byte-identical to the proven Servicios normalizer
 * (`normalizeServiciosSearchText`): NFD → strip combining marks → trim → lowercase. No stemming, no
 * proper-name mangling, no machine translation.
 */

const COMBINING_MARKS_RE = /[̀-ͯ]/g;

/** Accent-insensitive, case-insensitive text for substring matching. Whitespace is kept as typed. */
export function normalizeBilingualSearchText(value: string | null | undefined): string {
  return (value ?? "").normalize("NFD").replace(COMBINING_MARKS_RE, "").trim().toLowerCase();
}

/**
 * Stable key form of a query (normalized + inner whitespace collapsed). Used where two spellings of the
 * same search must produce the same identity — canonical intent lookup and NEW saved-search payloads.
 */
export function normalizeBilingualSearchKey(value: string | null | undefined): string {
  return normalizeBilingualSearchText(value).replace(/\s+/g, " ");
}

/** Substring test on already-normalized inputs (empty term never matches). */
export function bilingualTextIncludes(normalizedHaystack: string, normalizedTerm: string): boolean {
  return normalizedTerm.length > 0 && normalizedHaystack.includes(normalizedTerm);
}

/** Normalizes and drops empties — for haystack assembly. */
export function normalizeBilingualSearchParts(parts: ReadonlyArray<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const part of parts) {
    const n = normalizeBilingualSearchText(part);
    if (n) out.push(n);
  }
  return out;
}

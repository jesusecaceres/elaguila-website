/**
 * Leonix bilingual discovery foundation — ⚠️38A (2026-09-14).
 *
 * The one keyword matcher live results AND saved search run. Pure and locale-free: the document already
 * carries both catalog labels, so neither viewer nor page nor source language changes the outcome.
 *
 * Precedence:
 *   1. exact canonical intent (the query IS a concept: alias or catalog label) → concept id equality;
 *   2. deterministic bilingual labels / aliases (substring);
 *   3. literal fields (substring);
 *   4. owner custom text in its original language (substring) — ⚠️38B (cross-language custom prose)
 *      is deliberately NOT attempted here.
 */
import type { BilingualSearchDocument } from "./bilingualSearchDocument";
import type { CanonicalIntent } from "./canonicalTaxonomyAdapter";
import { bilingualTextIncludes } from "./bilingualSearchText";

export function intentIsEmpty(intent: CanonicalIntent): boolean {
  return intent.terms.length === 0 && intent.conceptKeys.size === 0;
}

export function matchesDiscoveryIntent(doc: BilingualSearchDocument, intent: CanonicalIntent): boolean {
  if (intentIsEmpty(intent)) return true;
  for (const key of intent.conceptKeys) {
    if (doc.conceptKeys.has(key)) return true;
  }
  for (const term of intent.terms) {
    if (bilingualTextIncludes(doc.canonicalText, term)) return true;
  }
  for (const term of intent.terms) {
    if (bilingualTextIncludes(doc.literalText, term)) return true;
  }
  for (const term of intent.terms) {
    if (bilingualTextIncludes(doc.customText, term)) return true;
  }
  return false;
}

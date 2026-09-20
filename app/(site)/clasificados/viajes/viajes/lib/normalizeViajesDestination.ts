/**
 * Normalize destination strings for fuzzy client-side matching.
 * Safe for Spanish diacritics and common punctuation.
 */

export function normalizeViajesDestinationKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[.,;:|/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Token set for substring matching in autocomplete. */
export function viajesDestinationMatchBlob(parts: string[]): string {
  return parts.map(normalizeViajesDestinationKey).filter(Boolean).join(" ");
}

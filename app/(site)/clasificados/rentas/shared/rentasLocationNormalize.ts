/**
 * Canonical shaping for city / ZIP in public browse URLs and filter matching.
 * Aligns landing handoff, `parseRentasBrowseParams`, and `filterRentasPublicListings` without geocoding.
 */

/** Collapses whitespace, trims, strips a trailing comma from free-text city input. */
export function normalizeCityForBrowse(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,$/, "");
}

/** Digits-only postal code, max 10 (US/MX-style scaffold). */
export function normalizeZipForBrowse(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

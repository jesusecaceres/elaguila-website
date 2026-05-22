/**
 * Canonical shaping for city / ZIP in public browse URLs and filter matching.
 * Aligns landing handoff, `parseRentasBrowseParams`, and `filterRentasPublicListings` without geocoding.
 */

import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

/** Collapses whitespace, trims, strips a trailing comma from free-text city input. */
export function normalizeCityForBrowse(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,$/, "");
}

/** NorCal/CA canonical city for publish + browse filters (reuses global city list). */
export function canonicalRentasCityForPublish(raw: string): string {
  const t = normalizeCityForBrowse(raw);
  if (!t) return "";
  return getCanonicalCityName(t) || t;
}

/** Digits-only postal code, max 10 (US/MX-style scaffold). */
export function normalizeZipForBrowse(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

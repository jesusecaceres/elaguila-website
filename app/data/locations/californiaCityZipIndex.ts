/**
 * Canonical city name → ZIP codes (inverse of californiaZipMap).
 * Built from `CA_ZIP_RECORDS`; each ZIP appears under exactly one canonical city key.
 */

import { CA_ZIP_RECORDS } from "./californiaZipMap";

function buildCityToZips(): Readonly<Record<string, readonly string[]>> {
  const m: Record<string, string[]> = {};
  for (const rec of Object.values(CA_ZIP_RECORDS)) {
    if (!m[rec.city]) m[rec.city] = [];
    m[rec.city].push(rec.zip);
  }
  for (const k of Object.keys(m)) {
    m[k] = [...new Set(m[k])].sort();
  }
  return m;
}

/** Canonical `city` string (matches `CityRecord.city`) → sorted unique ZIPs known in `ZIP_GEO`. */
export const CANONICAL_CITY_TO_ZIPS: Readonly<Record<string, readonly string[]>> = buildCityToZips();

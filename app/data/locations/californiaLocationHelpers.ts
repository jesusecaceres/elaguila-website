/**
 * Shared California location utilities (Leonix).
 *
 * - City normalization: `CITY_ALIASES` + `CA_CITIES` (canonical names + record aliases).
 * - ZIP: normalized 5-digit strings; `CA_ZIP_RECORDS` for ZIP → canonical city.
 * - Nearby cities: haversine over `CA_CITIES` from a resolved city or ZIP centroid.
 */

import { CA_CITIES, CITY_ALIASES, type CityRecord } from "./norcal";
import { CA_ZIP_RECORDS, type CaZipRecord } from "./californiaZipMap";
import { CANONICAL_CITY_TO_ZIPS } from "./californiaCityZipIndex";
import { haversineMiles } from "./locationGeo";

export type { CaZipRecord };

function stripDiacritics(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Normalized lookup key for city text (matches lista / En Venta / perfil behavior). */
export function normalizeLocationKey(raw: string): string {
  return stripDiacritics((raw || "").trim().toLowerCase())
    .replace(/[.,']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** User input → canonical `CityRecord.city` string, or "" if unknown. */
export function getCanonicalCityName(raw: string): string {
  const key = normalizeLocationKey(raw);
  if (!key) return "";
  const fromAlias = (CITY_ALIASES as Record<string, string>)[key];
  if (fromAlias) return fromAlias;
  for (const record of CA_CITIES) {
    if (normalizeLocationKey(record.city) === key) return record.city;
    if (record.aliases?.some((a) => normalizeLocationKey(a) === key)) return record.city;
  }
  return "";
}

/** Resolved canonical city row, or null. */
export function getCanonicalCityRecord(raw: string): CityRecord | null {
  const name = getCanonicalCityName(raw);
  if (!name) return null;
  return CA_CITIES.find((r) => r.city === name) ?? null;
}

/** Alias for `getCanonicalCityRecord` (API name from location foundation spec). */
export function getCanonicalCity(input: string): CityRecord | null {
  return getCanonicalCityRecord(input);
}

/** Digits only, exactly 5 → usable ZIP key; otherwise "". */
export function normalizeZipInput(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "").slice(0, 5);
  return digits.length === 5 ? digits : "";
}

export function getZipRecord(zipRaw: string): CaZipRecord | null {
  const zip = normalizeZipInput(zipRaw);
  if (!zip) return null;
  return CA_ZIP_RECORDS[zip] ?? null;
}

/** ZIP → full canonical city row from `CA_CITIES` (if ZIP is in map). */
export function getCityRecordForZip(zipRaw: string): CityRecord | null {
  const row = getZipRecord(zipRaw);
  if (!row) return null;
  return CA_CITIES.find((c) => c.city === row.city) ?? null;
}

/** Alias for `getCityRecordForZip` (ZIP → canonical `CityRecord`). */
export function getCityForZip(zipRaw: string): CityRecord | null {
  return getCityRecordForZip(zipRaw);
}

/** Canonical city name → ZIPs present in `ZIP_GEO` / `CA_ZIP_RECORDS`. */
export function getCityZips(cityInput: string): readonly string[] {
  const canonical = getCanonicalCityName(cityInput) || cityInput.trim();
  if (!canonical) return [];
  return CANONICAL_CITY_TO_ZIPS[canonical] ?? [];
}

export { haversineMiles } from "./locationGeo";

/**
 * Cities within `radiusMiles` of a canonical city name or a 5-digit ZIP (uses ZIP centroid if known).
 * Results sorted by distance ascending; deduped by city name.
 */
/** Nearby canonical cities by haversine distance (miles) from a city name or 5-digit ZIP. */
export function getNearbyCities(cityOrZip: string, radiusMiles: number): CityRecord[] {
  return getNearbyCanonicalCities(cityOrZip, radiusMiles);
}

export function getNearbyCanonicalCities(cityOrZip: string, radiusMiles: number): CityRecord[] {
  const zip = normalizeZipInput(cityOrZip);
  let center: { lat: number; lng: number } | null = null;
  if (zip && CA_ZIP_RECORDS[zip]) {
    const g = CA_ZIP_RECORDS[zip];
    center = { lat: g.lat, lng: g.lng };
  } else {
    const rec = getCanonicalCityRecord(cityOrZip);
    if (rec) center = { lat: rec.lat, lng: rec.lng };
  }
  if (!center || !Number.isFinite(radiusMiles) || radiusMiles <= 0) return [];

  const scored: Array<{ rec: CityRecord; d: number }> = [];
  const seen = new Set<string>();
  for (const c of CA_CITIES) {
    const d = haversineMiles(center.lat, center.lng, c.lat, c.lng);
    if (d <= radiusMiles && !seen.has(c.city)) {
      seen.add(c.city);
      scored.push({ rec: c, d });
    }
  }
  scored.sort((a, b) => a.d - b.d);
  return scored.map((x) => x.rec);
}

/** Gap report: canonical cities with no ZIP in current `ZIP_GEO` layer (expected for many small places). */
export function getCaliforniaLocationGaps(): {
  canonicalCitiesWithoutZipCoverage: string[];
  zipRecordCount: number;
  canonicalCitiesWithAtLeastOneZip: number;
} {
  const citiesWithZip = new Set(Object.values(CA_ZIP_RECORDS).map((r) => r.city));
  const canonicalCitiesWithoutZipCoverage = CA_CITIES.map((c) => c.city).filter((name) => !citiesWithZip.has(name));
  return {
    canonicalCitiesWithoutZipCoverage,
    zipRecordCount: Object.keys(CA_ZIP_RECORDS).length,
    canonicalCitiesWithAtLeastOneZip: citiesWithZip.size,
  };
}

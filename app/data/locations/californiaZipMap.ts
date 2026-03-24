/**
 * California ZIP layer (Leonix foundation).
 *
 * `CA_ZIP_RECORDS` maps each ZIP in `ZIP_GEO` to the nearest canonical `CA_CITIES` record
 * (by haversine distance on ZIP centroid). This gives a stable ZIP → city / county grouping
 * for filters and geofencing without treating `ZIP_GEO` as authoritative USPS locality labels.
 *
 * Expand coverage by growing `ZIP_GEO` in norcal.ts or by merging manual overrides below.
 */

import { CA_CITIES, ZIP_GEO, type CityRecord } from "./norcal";
import { haversineMiles } from "./locationGeo";

export type CaZipRecord = {
  zip: string;
  /** Canonical city name from `CA_CITIES`. */
  city: string;
  county?: string;
  state: "CA";
  lat: number;
  lng: number;
};

/** Optional: force a ZIP to a canonical city when centroid-nearest is wrong (rare border cases). */
export const CA_ZIP_CITY_OVERRIDES: Record<string, string> = {
  // Example: "90210": "Beverly Hills",
};

function nearestCanonicalCity(lat: number, lng: number): CityRecord {
  let best: CityRecord = CA_CITIES[0];
  let bestD = Infinity;
  for (const c of CA_CITIES) {
    const d = haversineMiles(lat, lng, c.lat, c.lng);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function buildZipRecords(): Record<string, CaZipRecord> {
  const out: Record<string, CaZipRecord> = {};
  for (const [zip, geo] of Object.entries(ZIP_GEO)) {
    const overrideCity = CA_ZIP_CITY_OVERRIDES[zip];
    const cityRec = overrideCity
      ? CA_CITIES.find((c) => c.city === overrideCity) ?? nearestCanonicalCity(geo.lat, geo.lng)
      : nearestCanonicalCity(geo.lat, geo.lng);
    out[zip] = {
      zip,
      city: cityRec.city,
      county: cityRec.county,
      state: "CA",
      lat: geo.lat,
      lng: geo.lng,
    };
  }
  return out;
}

/** ZIP → row (centroid from `ZIP_GEO`, city/county from nearest canonical place unless overridden). */
export const CA_ZIP_RECORDS: Record<string, CaZipRecord> = buildZipRecords();

/**
 * Servicios discovery location — shared contract for hero, results filters, and geolocation fill.
 *
 * Uses Leonix canonical CA data (`app/data/locations/*`): ZIP → city, aliases → canonical names.
 * Unknown text is passed through for substring matching on profiles (`rowMatchesLocationQuery`).
 */

import {
  getCanonicalCityName,
  normalizeLocationKey,
  normalizeZipInput,
} from "@/app/data/locations/californiaLocationHelpers";

/** Normalize user-facing city/ZIP text before putting it in URL params or local prefs. */
export function normalizeServiciosDiscoveryLocationInput(raw: string): string {
  const t = raw.trim();
  if (!t) return "";

  const zipOnly = normalizeZipInput(t);
  if (zipOnly) return zipOnly;

  const parts = t
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const p of parts) {
    const z = normalizeZipInput(p);
    if (z) return z;
  }

  for (const p of parts) {
    const c = getCanonicalCityName(p);
    if (c) return c;
  }

  const whole = getCanonicalCityName(t);
  if (whole) return whole;

  return t;
}

/** True when input is exactly a known 5-digit CA ZIP in our map (for UI hints only). */
export function isLikelyCanonicalZipToken(raw: string): boolean {
  return Boolean(normalizeZipInput(raw.trim()));
}

/** Lowercase key for comparing user location tokens to listing fields (debug / future use). */
export function serviciosLocationMatchKey(raw: string): string {
  return normalizeLocationKey(normalizeServiciosDiscoveryLocationInput(raw));
}

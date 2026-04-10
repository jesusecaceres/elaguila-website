import { CA_CITIES } from "@/app/data/locations/norcal";
import { haversineMiles } from "@/app/data/locations/californiaLocationHelpers";

/**
 * Find nearest canonical CA city to a WGS84 point (browser geolocation).
 * Used only after explicit user consent; not for background tracking.
 */
export function nearestCanonicalCityFromLatLng(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let best: { city: string; d: number } | null = null;
  for (const c of CA_CITIES) {
    const d = haversineMiles(lat, lng, c.lat, c.lng);
    if (!best || d < best.d) best = { city: c.city, d };
  }
  return best?.city ?? null;
}

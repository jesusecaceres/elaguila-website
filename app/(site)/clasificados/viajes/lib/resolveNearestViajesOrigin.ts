import type { ViajesOriginDefinition } from "./viajesOrigins";
import { VIAJES_ORIGIN_BUCKETS } from "./viajesOrigins";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Pick the closest configured origin bucket to a browser geolocation fix. */
export function resolveNearestViajesOrigin(lat: number, lng: number): ViajesOriginDefinition {
  let best: ViajesOriginDefinition = VIAJES_ORIGIN_BUCKETS[0];
  let bestD = Infinity;
  for (const o of VIAJES_ORIGIN_BUCKETS) {
    const d = haversineKm(lat, lng, o.lat, o.lng);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

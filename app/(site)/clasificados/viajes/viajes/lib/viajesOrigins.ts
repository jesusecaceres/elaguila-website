/**
 * Supported departure buckets for Viajes (hero, filters, results).
 * Coordinates are airport/urban centers for coarse "nearest bucket" geolocation only.
 */

export type ViajesOriginId = "san-jose" | "san-francisco" | "oakland";

export type ViajesOriginDefinition = {
  id: ViajesOriginId;
  /** Short label for selects */
  label: string;
  /** Airport-aware subline */
  airportLine: string;
  lat: number;
  lng: number;
};

export const VIAJES_ORIGIN_BUCKETS: readonly ViajesOriginDefinition[] = [
  {
    id: "san-jose",
    label: "San José, CA",
    airportLine: "SJC",
    lat: 37.3639,
    lng: -121.9289,
  },
  {
    id: "san-francisco",
    label: "San Francisco",
    airportLine: "SFO",
    lat: 37.6213,
    lng: -122.379,
  },
  {
    id: "oakland",
    label: "Oakland",
    airportLine: "OAK",
    lat: 37.7126,
    lng: -122.2197,
  },
] as const;

export function getViajesOriginById(id: string): ViajesOriginDefinition | undefined {
  return VIAJES_ORIGIN_BUCKETS.find((o) => o.id === id);
}

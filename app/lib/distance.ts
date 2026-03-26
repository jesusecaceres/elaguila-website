import {
  getCanonicalCityRecord,
  getCityForZip,
  normalizeZipInput,
} from "@/app/data/locations/californiaLocationHelpers";
import { haversineMiles } from "@/app/data/locations/locationGeo";

function getCoordsFromCityOrZip(input: string): { lat: number; lng: number } | null {
  const zip = normalizeZipInput(input);
  if (zip) {
    const z = getCityForZip(zip);
    return z ? { lat: z.lat, lng: z.lng } : null;
  }
  const rec = getCanonicalCityRecord(input);
  return rec ? { lat: rec.lat, lng: rec.lng } : null;
}

export function getRoughDistanceMiles(viewerCityOrZip: string, listingCityOrZip: string): number | null {
  const a = getCoordsFromCityOrZip(viewerCityOrZip);
  const b = getCoordsFromCityOrZip(listingCityOrZip);
  if (!a || !b) return null;
  return haversineMiles(a.lat, a.lng, b.lat, b.lng);
}

export function getRoughDistanceMilesFromCoords(
  viewer: { lat: number; lng: number },
  listingCityOrZip: string
): number | null {
  if (!Number.isFinite(viewer.lat) || !Number.isFinite(viewer.lng)) return null;
  const b = getCoordsFromCityOrZip(listingCityOrZip);
  if (!b) return null;
  return haversineMiles(viewer.lat, viewer.lng, b.lat, b.lng);
}

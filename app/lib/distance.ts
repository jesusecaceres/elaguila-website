import { getCanonicalCityRecord } from "@/app/data/locations/californiaLocationHelpers";
import { haversineMiles } from "@/app/data/locations/locationGeo";

function getCityCoords(cityName: string): { lat: number; lng: number } | null {
  const rec = getCanonicalCityRecord(cityName);
  return rec ? { lat: rec.lat, lng: rec.lng } : null;
}

export function getRoughDistanceMiles(viewerCity: string, listingCity: string): number | null {
  const a = getCityCoords(viewerCity);
  const b = getCityCoords(listingCity);
  if (!a || !b) return null;
  return haversineMiles(a.lat, a.lng, b.lat, b.lng);
}

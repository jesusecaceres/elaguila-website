import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

/**
 * City filter for BR results: substring on address + NorCal/CA canonical name when known.
 * Freeform city still matches via `includes` when no canonical row exists.
 */
export function cityFilterMatchesListingAddress(addressLine: string, cityFilter: string): boolean {
  const raw = (cityFilter || "").trim();
  if (!raw) return true;
  const addr = (addressLine || "").toLowerCase();
  const needle = raw.toLowerCase();
  if (addr.includes(needle)) return true;
  const canon = getCanonicalCityName(raw);
  if (canon && addr.includes(canon.toLowerCase())) return true;
  return false;
}

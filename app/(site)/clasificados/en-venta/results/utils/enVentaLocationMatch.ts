import {
  getCanonicalCityName,
  normalizeZipInput,
} from "@/app/data/locations/californiaLocationHelpers";

/**
 * City filter: prefer canonical NorCal/CA name equality; fall back to substring for legacy messy `listings.city` text.
 */
export function listingMatchesCityFilter(listingCityRaw: string, filterCityRaw: string): boolean {
  const f = (filterCityRaw ?? "").trim();
  if (!f) return true;
  const filterCanon = getCanonicalCityName(f);
  const filterKey = (filterCanon || f).toLowerCase().replace(/\s+/g, " ").trim();
  const listingCanon = getCanonicalCityName(listingCityRaw);
  const listingKey = (listingCanon || (listingCityRaw ?? "").trim()).toLowerCase().replace(/\s+/g, " ").trim();
  if (filterKey && listingKey && filterKey === listingKey) return true;
  const loose = (listingCityRaw ?? "").toLowerCase();
  return loose.includes(f.toLowerCase()) || (!!filterCanon && loose.includes(filterCanon.toLowerCase()));
}

/**
 * ZIP filter: compare normalized 5-digit strings.
 * If the listing has no ZIP stored but a city filter matched, include the row (legacy sparse data).
 * Zip-only filter requires a ZIP match when the listing has a ZIP; listings without ZIP are excluded unless city matched.
 */
export function listingMatchesZipFilter(
  listingZipRaw: string | null | undefined,
  filterZipRaw: string,
  cityFilterActive: boolean,
  cityAlreadyMatches: boolean
): boolean {
  const fz = normalizeZipInput(filterZipRaw);
  if (!fz) return true;
  const lz = normalizeZipInput(listingZipRaw ?? "");
  if (lz && lz === fz) return true;
  if (!lz && cityFilterActive && cityAlreadyMatches) return true;
  return false;
}

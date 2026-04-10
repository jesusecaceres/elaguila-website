import {
  getCanonicalCityName,
  normalizeZipInput,
} from "@/app/data/locations/californiaLocationHelpers";

/**
 * City filter for Autos public browse: canonical NorCal/CA equality first; substring fallback for legacy text.
 */
export function listingMatchesAutosCityFilter(listingCityRaw: string, filterCityRaw: string): boolean {
  const f = (filterCityRaw ?? "").trim();
  if (!f) return true;
  const filterCanon = getCanonicalCityName(f);
  const filterKey = (filterCanon || f).toLowerCase().replace(/\s+/g, " ").trim();
  const listingCanon = getCanonicalCityName(listingCityRaw);
  const listingKey = (listingCanon || (listingCityRaw ?? "").trim()).toLowerCase().replace(/\s+/g, " ").trim();
  if (filterKey && listingKey && filterKey === listingKey) return true;
  const loose = (listingCityRaw ?? "").toLowerCase();
  return loose.includes(f.toLowerCase()) || (filterCanon ? loose.includes(filterCanon.toLowerCase()) : false);
}

/**
 * ZIP filter: normalized 5-digit match; allow ZIP-less listings when city already matched (sparse data).
 */
export function listingMatchesAutosZipFilter(
  listingZipRaw: string | null | undefined,
  filterZipRaw: string,
  cityFilterActive: boolean,
  cityAlreadyMatches: boolean,
): boolean {
  const fz = normalizeZipInput(filterZipRaw);
  if (!fz) return true;
  const lz = normalizeZipInput(listingZipRaw ?? "");
  if (lz && lz === fz) return true;
  if (!lz && cityFilterActive && cityAlreadyMatches) return true;
  return false;
}

import { getCanonicalCityName, normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import { normalizeEnVentaSearchText } from "../../taxonomy/synonyms";
import {
  isUsCountry,
  normalizeEnVentaCountry,
  normalizeEnVentaStateCode,
} from "../../shared/constants/enVentaLocationContract";

function cityMatchKey(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  return normalizeEnVentaSearchText(getCanonicalCityName(trimmed) || trimmed);
}

/**
 * City filter: accent-insensitive equality or substring; works for any stored city text.
 */
export function listingMatchesCityFilter(listingCityRaw: string, filterCityRaw: string): boolean {
  const f = (filterCityRaw ?? "").trim();
  if (!f) return true;
  const filterKey = cityMatchKey(f);
  const listingKey = cityMatchKey(listingCityRaw);
  if (filterKey && listingKey && filterKey === listingKey) return true;
  const loose = normalizeEnVentaSearchText(listingCityRaw ?? "");
  const fNorm = normalizeEnVentaSearchText(f);
  return loose.includes(fNorm) || fNorm.includes(loose);
}

/**
 * ZIP filter: compare normalized 5-digit strings.
 * If the listing has no ZIP stored but a city filter matched, include the row (legacy sparse data).
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

/** State filter: 2-letter code equality (case-insensitive). Legacy rows without state pass when filter is US-default CA only if listing has no state. */
export function listingMatchesStateFilter(
  listingStateRaw: string | null | undefined,
  filterStateRaw: string
): boolean {
  const f = normalizeEnVentaStateCode(filterStateRaw);
  if (!f || f === normalizeEnVentaStateCode("")) return true;
  const listing = listingStateRaw?.trim() ? normalizeEnVentaStateCode(listingStateRaw) : "";
  if (!listing) return true;
  return listing === f;
}

/** Country filter: accent-insensitive substring match; US aliases treated as equivalent. */
export function listingMatchesCountryFilter(
  listingCountryRaw: string | null | undefined,
  filterCountryRaw: string
): boolean {
  const f = normalizeEnVentaCountry(filterCountryRaw);
  if (!f || isUsCountry(f)) return true;
  const listing = listingCountryRaw?.trim() ? normalizeEnVentaCountry(listingCountryRaw) : "";
  if (!listing || isUsCountry(listing)) return isUsCountry(f);
  const a = normalizeEnVentaSearchText(listing);
  const b = normalizeEnVentaSearchText(f);
  return a.includes(b) || b.includes(a);
}

import { getCanonicalCityName, normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import { normalizeEnVentaSearchText } from "../../taxonomy/synonyms";

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

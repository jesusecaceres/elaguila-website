/** Autos publish + public browse location contract (city/state/ZIP/country). */

export const AUTOS_DEFAULT_STATE = "CA";
export const AUTOS_DEFAULT_COUNTRY = "United States";

const US_COUNTRY_ALIASES = new Set([
  "",
  "us",
  "usa",
  "u.s.",
  "u.s.a.",
  "united states",
  "united states of america",
  "estados unidos",
  "eeuu",
  "ee.uu.",
]);

/** Trim and cap postal codes; allow letters, digits, spaces, hyphens (US ZIP+4, CA, UK, etc.). */
export function normalizeAutosPostalCode(raw: unknown): string | undefined {
  const t = String(raw ?? "").trim();
  if (!t) return undefined;
  const cleaned = t
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12);
  return cleaned.length > 0 ? cleaned : undefined;
}

export function normalizeAutosCountry(raw: unknown): string {
  const t = String(raw ?? "").trim();
  return t || AUTOS_DEFAULT_COUNTRY;
}

export function isAutosUsCountry(country: string | null | undefined): boolean {
  return US_COUNTRY_ALIASES.has(String(country ?? "").trim().toLowerCase());
}

export function normalizeAutosStateCode(raw: unknown): string | undefined {
  const t = String(raw ?? "").trim().toUpperCase();
  return t || undefined;
}

export function listingMatchesAutosStateFilter(listingStateRaw: string | null | undefined, filterStateRaw: string): boolean {
  const f = normalizeAutosStateCode(filterStateRaw);
  if (!f) return true;
  const listing = normalizeAutosStateCode(listingStateRaw);
  return Boolean(listing) && listing === f;
}

export function listingMatchesAutosCountryFilter(
  listingCountryRaw: string | null | undefined,
  filterCountryRaw: string,
): boolean {
  const f = String(filterCountryRaw ?? "").trim();
  if (!f) return true;
  const listing = normalizeAutosCountry(listingCountryRaw);
  if (isAutosUsCountry(f) && isAutosUsCountry(listing)) return true;
  const fl = f.toLowerCase();
  const ll = listing.toLowerCase();
  return ll === fl || ll.includes(fl) || fl.includes(ll);
}

export function listingMatchesAutosPostalFilter(
  listingPostalRaw: string | null | undefined,
  filterPostalRaw: string,
  cityFilterActive: boolean,
  cityAlreadyMatches: boolean,
): boolean {
  const fz = normalizeAutosPostalCode(filterPostalRaw);
  if (!fz) return true;
  const lz = normalizeAutosPostalCode(listingPostalRaw ?? "");
  if (lz && lz.toLowerCase() === fz.toLowerCase()) return true;
  const fzDigits = fz.replace(/\D/g, "");
  const lzDigits = String(listingPostalRaw ?? "").replace(/\D/g, "");
  if (fzDigits.length >= 3 && lzDigits.startsWith(fzDigits)) return true;
  if (!lz && cityFilterActive && cityAlreadyMatches) return true;
  return false;
}

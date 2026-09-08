/**
 * Pure, synchronous business-address normalizers. No I/O, no network, no DB.
 *
 * `normalizeCity` deliberately does NOT duplicate `app/components/CityAutocomplete.tsx`'s
 * canonicalization logic — it defers to the same underlying canonicalizer that component already
 * depends on (`getCanonicalCityName` in `app/data/locations/californiaLocationHelpers.ts`) when a
 * city matches the known NorCal list, and only falls back to a generic text cleanup for cities
 * outside that list (e.g. a future non-NorCal category, or a business address the NorCal city
 * list doesn't cover). It is a separate, lower-level string utility a FUTURE adapter could use
 * alongside `CityAutocomplete`, not a replacement for it — `CityAutocomplete.tsx` itself is out of
 * scope and is not modified here.
 */

import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { BusinessAddress } from "./businessAddressContract";
import { DEFAULT_BUSINESS_ADDRESS_COUNTRY } from "./businessAddressContract";

/** Collapses whitespace and trims. Shared by every normalizer below. */
function collapseWhitespace(raw: string): string {
  return (raw || "").replace(/\s+/g, " ").trim();
}

/** Title-cases a plain string (used only as a last-resort fallback, never for known lookups). */
function titleCase(raw: string): string {
  return collapseWhitespace(raw)
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/**
 * Normalizes a city string. Prefers the shared canonical NorCal city list (the same source
 * `CityAutocomplete` uses) and only falls back to generic title-casing when the input doesn't
 * match a known city — it never invents a "canonical" NorCal city that wasn't actually matched.
 */
export function normalizeCity(raw: string): string {
  const trimmed = collapseWhitespace(raw);
  if (!trimmed) return "";
  const canonical = getCanonicalCityName(trimmed);
  return canonical || titleCase(trimmed);
}

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

const US_STATE_CODES = new Set(Object.values(US_STATE_NAME_TO_CODE));

/**
 * Normalizes a US state/province ("region") string. Accepts either a full state name
 * ("California") or an abbreviation ("CA", case-insensitive) and returns the two-letter code
 * when recognized. Unrecognized input (e.g. a non-US province) is returned trimmed/title-cased
 * rather than rejected — this is a normalizer, not a validator.
 */
export function normalizeStateRegion(raw: string): string {
  const trimmed = collapseWhitespace(raw);
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && US_STATE_CODES.has(upper)) return upper;
  const byName = US_STATE_NAME_TO_CODE[trimmed.toLowerCase()];
  if (byName) return byName;
  return titleCase(trimmed);
}

/**
 * Normalizes a postal code. US ZIP (5-digit) and ZIP+4 (9-digit, formatted "12345-6789") aware,
 * but does not reject other formats outright — non-US postal codes are simply trimmed/uppercased
 * rather than force-fit into the US shape.
 */
export function normalizePostalCode(raw: string, country: string = DEFAULT_BUSINESS_ADDRESS_COUNTRY): string {
  const trimmed = collapseWhitespace(raw);
  if (!trimmed) return "";
  const isUs = normalizeCountry(country) === "US";
  if (isUs) {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    if (digits.length === 5) return digits;
    // Doesn't cleanly match ZIP or ZIP+4 shape — don't over-validate, return cleaned input.
    return trimmed.toUpperCase();
  }
  return trimmed.toUpperCase();
}

const COUNTRY_ALIASES: Record<string, string> = {
  us: "US",
  usa: "US",
  "u.s.": "US",
  "u.s.a.": "US",
  "united states": "US",
  "united states of america": "US",
  mx: "MX",
  mexico: "MX",
  méxico: "MX",
  ca: "CA",
  canada: "CA",
};

/** Normalizes a country string to an uppercase ISO-ish code, defaulting to "US". */
export function normalizeCountry(raw: string | undefined | null): string {
  const trimmed = collapseWhitespace(raw || "");
  if (!trimmed) return DEFAULT_BUSINESS_ADDRESS_COUNTRY;
  const alias = COUNTRY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  if (trimmed.length <= 3) return trimmed.toUpperCase();
  return trimmed.toUpperCase();
}

/** Assembles a display string from address parts. Pure, synchronous, no I/O. */
export function buildFormattedAddress(address: BusinessAddress): string {
  const streetLine = [address.street.trim(), address.unit?.trim()].filter(Boolean).join(" ");
  const cityRegionZip = [address.city.trim(), address.region.trim()]
    .filter(Boolean)
    .join(", ");
  const cityRegionZipWithZip = [cityRegionZip, address.postalCode.trim()]
    .filter(Boolean)
    .join(" ");
  return [streetLine, cityRegionZipWithZip].filter(Boolean).join(", ");
}

/**
 * Shared location contract for Servicios + Restaurantes public discovery.
 * Application storage: Servicios `contact.physical*` / row.city; Restaurantes `cityCanonical`, `state`, `zipCode`.
 * Country is UI + URL only until a safe publish field exists (no migration in this task).
 */

import { normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";

export const LEONIX_LB_DEFAULT_STATE = "CA";
export const LEONIX_LB_DEFAULT_COUNTRY = "United States";

export const US_STATE_OPTIONS: ReadonlyArray<{ code: string; name: string }> = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

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

export function normalizeLeonixLbStateCode(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t) return LEONIX_LB_DEFAULT_STATE;
  const upper = t.toUpperCase();
  if (upper.length === 2 && US_STATE_OPTIONS.some((s) => s.code === upper)) return upper;
  const byName = US_STATE_OPTIONS.find((s) => s.name.toLowerCase() === t.toLowerCase());
  if (byName) return byName.code;
  return upper.slice(0, 10);
}

export function normalizeLeonixLbCountry(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t) return LEONIX_LB_DEFAULT_COUNTRY;
  return t.slice(0, 80);
}

export function isLeonixLbUsCountry(country: string | null | undefined): boolean {
  return US_COUNTRY_ALIASES.has(String(country ?? "").trim().toLowerCase());
}

export function normalizeLeonixLbZip(raw: string | null | undefined): string {
  const z = normalizeZipInput(String(raw ?? "").trim());
  return z || String(raw ?? "").trim().slice(0, 10);
}

export function formatLeonixLbPublicLocationLine(opts: {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}): string {
  const city = String(opts.city ?? "").trim();
  const state = opts.state?.trim() ? normalizeLeonixLbStateCode(opts.state) : "";
  const zip = opts.zip?.trim() ? normalizeLeonixLbZip(opts.zip) : "";
  const country = opts.country?.trim() ? normalizeLeonixLbCountry(opts.country) : "";

  if (!city && !zip && !state) return "";

  const us = isLeonixLbUsCountry(country);
  const parts: string[] = [];

  if (city && state && zip) {
    parts.push(`${city}, ${state} ${zip}`);
  } else if (city && state) {
    parts.push(`${city}, ${state}`);
  } else if (city && zip) {
    parts.push(`${city}, ${zip}`);
  } else if (city) {
    parts.push(city);
  } else if (zip) {
    parts.push(zip);
  } else if (state) {
    parts.push(state);
  }

  if (!us && country) {
    parts.push(country);
  }

  return parts.filter(Boolean).join(", ");
}

/** Substring match for state codes/names in discovery filters. */
export function leonixLbStateMatchesFilter(rowState: string | undefined, filterState: string): boolean {
  const want = normalizeLeonixLbStateCode(filterState);
  if (!want) return true;
  const raw = String(rowState ?? "").trim();
  if (!raw) return false;
  const rowCode = normalizeLeonixLbStateCode(raw);
  return rowCode === want || raw.toLowerCase().includes(want.toLowerCase());
}

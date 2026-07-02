/**
 * Ofertas Locales — worldwide location normalization and US state helpers.
 * NorCal examples are suggestions only; no geo lock-in.
 */

import { normalizeOfertaLocalSearchText } from "./ofertasLocalesFormatting";

export const OFERTA_LOCAL_DEFAULT_COUNTRY = "United States";

export const OFERTA_LOCAL_COUNTRY_SUGGESTIONS = [
  "United States",
  "Mexico",
  "Canada",
  "Guatemala",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Costa Rica",
  "Colombia",
  "Spain",
] as const;

export const OFERTA_LOCAL_US_STATE_CODES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
] as const;

export const OFERTA_LOCAL_US_STATE_LABELS: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export const OFERTA_LOCAL_US_STATE_SELECT_OPTIONS = OFERTA_LOCAL_US_STATE_CODES.map((code) => ({
  code,
  label: OFERTA_LOCAL_US_STATE_LABELS[code]
    ? `${code} — ${OFERTA_LOCAL_US_STATE_LABELS[code]}`
    : code,
}));

function trim(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw).trim();
}

/** Lowercase, collapse whitespace, strip diacritics — for location matching only. */
export function normalizeOfertaLocalLocationToken(value: string): string {
  return normalizeOfertaLocalSearchText(value);
}

/** Display country; blank behaves as United States for new drafts. */
export function normalizeOfertaLocalCountryDisplay(value: string): string {
  const t = trim(value);
  return t || OFERTA_LOCAL_DEFAULT_COUNTRY;
}

/** Canonical country token for matching (US aliases → united states). */
export function normalizeOfertaLocalCountry(value: string): string {
  const t = trim(value);
  if (!t) return normalizeOfertaLocalLocationToken(OFERTA_LOCAL_DEFAULT_COUNTRY);
  if (isOfertaLocalUnitedStatesCountry(t)) return "united states";
  return normalizeOfertaLocalLocationToken(t);
}

export function isOfertaLocalUnitedStatesCountry(value: string): boolean {
  const c = normalizeOfertaLocalLocationToken(value);
  return (
    c === "us" ||
    c === "usa" ||
    c === "u s" ||
    c === "u s a" ||
    c === "united states" ||
    c === "estados unidos"
  );
}

/** Normalize postal/ZIP for matching — keep letters, numbers, spaces. */
export function normalizeOfertaLocalPostalCode(value: string): string {
  return normalizeOfertaLocalLocationToken(value).replace(/\s+/g, "");
}

/** Normalize state/province/region for storage/display. */
export function normalizeOfertaLocalRegion(value: string): string {
  return trim(value).replace(/\s+/g, " ").slice(0, 80);
}

/** Resolve US state code from code or full name; preserve manual region text otherwise. */
export function resolveOfertaLocalUsStateInput(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  const upper = t.toUpperCase();
  if ((OFERTA_LOCAL_US_STATE_CODES as readonly string[]).includes(upper)) return upper;
  const byName = Object.entries(OFERTA_LOCAL_US_STATE_LABELS).find(
    ([, name]) => normalizeOfertaLocalLocationToken(name) === normalizeOfertaLocalLocationToken(t)
  );
  if (byName) return byName[0];
  if (t.length === 2) return upper;
  return t;
}

export function effectiveOfertaLocalCountryForMatching(country: string | null | undefined): string {
  return normalizeOfertaLocalCountry(country ?? "");
}

export function locationTokensMatch(filter: string, value: string): boolean {
  const needle = normalizeOfertaLocalLocationToken(filter);
  if (!needle) return true;
  const hay = normalizeOfertaLocalLocationToken(value);
  if (!hay) return false;
  return hay.includes(needle) || needle.includes(hay);
}

export function readOfertaLocalPostalFromSearchParams(params: URLSearchParams): string {
  return params.get("zip")?.trim() ?? params.get("postal")?.trim() ?? "";
}

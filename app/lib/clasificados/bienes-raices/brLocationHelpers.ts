/**
 * BR-LOCATION-FIELD-PARITY-WORLDWIDE-04 — open location support for Bienes Raíces.
 * NorCal suggestions are optional; manual city/state/country always allowed.
 */

import { brCanonicalNorCalCity } from "@/app/(site)/clasificados/bienes-raices/shared/brNorCalCity";

export const BR_DEFAULT_COUNTRY = "United States";

export const BR_COUNTRY_SUGGESTIONS = [
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

export const BR_US_STATE_OPTIONS = [
  "",
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

function trim(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw).trim();
}

/** Canonical NorCal when recognized; otherwise preserve manual city text. */
export function resolveBrListingCity(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  return brCanonicalNorCalCity(t) || t;
}

export function normalizeBrListingCountry(raw: string): string {
  const t = trim(raw);
  return t || BR_DEFAULT_COUNTRY;
}

export function isBrUsCountry(country: string): boolean {
  const c = trim(country).toLowerCase();
  return c === "us" || c === "usa" || c === "u.s." || c === "u.s.a." || c === "united states";
}

export function formatBrLocationPostal(postal: string, country: string): string {
  const p = trim(postal);
  if (!p) return "";
  if (isBrUsCountry(country)) {
    const digits = p.replace(/\D/g, "").slice(0, 10);
    if (digits.length >= 5) return digits;
  }
  return p;
}

export function formatBrCityStatePostalLine(city: string, state: string, postal: string, country: string): string {
  const c = trim(city);
  const st = trim(state);
  const p = formatBrLocationPostal(postal, country);
  const co = trim(country);
  const cityPart = [c, st, p].filter(Boolean).join(", ");
  if (!cityPart) return co || "";
  if (co && !isBrUsCountry(co)) return [cityPart, co].filter(Boolean).join(", ");
  return cityPart;
}

export function appendMapQueryPart(line: string, part: string): string {
  const p = trim(part);
  if (!p) return line.trim();
  if (!line.trim()) return p;
  if (line.toLowerCase().includes(p.toLowerCase())) return line.trim();
  return `${line.trim()}, ${p}`;
}

export function buildBrListingMapQuery(args: {
  exact: boolean;
  street?: string;
  unit?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
  legacyStreet?: string;
}): string {
  const street = trim(args.street) || trim(args.legacyStreet);
  const unit = trim(args.unit);
  const city = trim(args.city);
  const state = trim(args.state);
  const postal = formatBrLocationPostal(trim(args.postal), trim(args.country));
  const neighborhood = trim(args.neighborhood);
  const country = normalizeBrListingCountry(args.country ?? "");

  let line = "";
  if (args.exact) {
    const streetLine = [street, unit].filter(Boolean).join(" ");
    line = appendMapQueryPart(line, streetLine);
  }
  line = appendMapQueryPart(line, neighborhood);
  line = appendMapQueryPart(line, city);
  line = appendMapQueryPart(line, state);
  line = appendMapQueryPart(line, postal);
  if (!isBrUsCountry(country)) {
    line = appendMapQueryPart(line, country);
  }
  return line.trim() || city;
}

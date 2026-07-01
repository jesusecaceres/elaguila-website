/**
 * En Venta / Varios location — stored on `listings.city` + `listings.zip` and
 * machine-readable `detail_pairs` (`Leonix:state`, `Leonix:country`, `Leonix:postal_code`).
 */

import { normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import {
  LEONIX_DP_POSTAL_CODE,
  readLeonixDetailPairValue,
} from "@/app/(site)/clasificados/lib/leonixRealEstateListingContract";

export const LEONIX_EV_STATE = "Leonix:state";
export const LEONIX_EV_COUNTRY = "Leonix:country";

export const EN_VENTA_DEFAULT_STATE = "CA";
export const EN_VENTA_DEFAULT_COUNTRY = "United States";

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

export function normalizeEnVentaStateCode(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t) return EN_VENTA_DEFAULT_STATE;
  const upper = t.toUpperCase();
  if (upper.length === 2 && US_STATE_OPTIONS.some((s) => s.code === upper)) return upper;
  const byName = US_STATE_OPTIONS.find((s) => s.name.toLowerCase() === t.toLowerCase());
  if (byName) return byName.code;
  return upper.slice(0, 10);
}

export function normalizeEnVentaCountry(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t) return EN_VENTA_DEFAULT_COUNTRY;
  return t.slice(0, 80);
}

export function isUsCountry(country: string | null | undefined): boolean {
  return US_COUNTRY_ALIASES.has(String(country ?? "").trim().toLowerCase());
}

export function readEnVentaLocationFromRow(row: Record<string, unknown>): {
  city: string;
  state: string | null;
  zip: string | null;
  country: string | null;
} {
  const city = String(row.city ?? "").trim();
  let zip: string | null = row.zip != null && String(row.zip).trim() ? String(row.zip).trim() : null;
  if (!zip) {
    const fromMachine = readLeonixDetailPairValue(row.detail_pairs, LEONIX_DP_POSTAL_CODE);
    const z = normalizeZipInput(fromMachine ?? "");
    if (z) zip = z;
  }
  const stateRaw = readLeonixDetailPairValue(row.detail_pairs, LEONIX_EV_STATE);
  const countryRaw = readLeonixDetailPairValue(row.detail_pairs, LEONIX_EV_COUNTRY);
  const state = stateRaw ? normalizeEnVentaStateCode(stateRaw) : null;
  const country = countryRaw ? normalizeEnVentaCountry(countryRaw) : null;
  return { city, state, zip, country };
}

export function formatEnVentaPublicLocationLine(opts: {
  city: string;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}): string {
  const city = opts.city.trim();
  const state = opts.state?.trim() ? normalizeEnVentaStateCode(opts.state) : "";
  const zip = opts.zip?.trim() ? normalizeZipInput(opts.zip) || opts.zip.trim() : "";
  const country = opts.country?.trim() ? normalizeEnVentaCountry(opts.country) : "";

  if (!city && !zip && !state) return "";

  const us = isUsCountry(country);
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

export function stateDisplayLabel(code: string, lang: "es" | "en"): string {
  const c = normalizeEnVentaStateCode(code);
  const row = US_STATE_OPTIONS.find((s) => s.code === c);
  if (!row) return c;
  return lang === "es" && c === "CA" ? "California" : row.name;
}

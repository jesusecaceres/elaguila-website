/**
 * Rentas + Bienes Raíces location contract — `listings.city` / `listings.zip` +
 * machine-readable `detail_pairs` (`Leonix:state`, `Leonix:country`, `Leonix:postal_code`).
 */

import { readLeonixDetailPairValue } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { LEONIX_DP_POSTAL_CODE } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  formatLeonixLbPublicLocationLine,
  isLeonixLbUsCountry,
  leonixLbStateMatchesFilter,
  normalizeLeonixLbCountry,
  normalizeLeonixLbStateCode,
  normalizeLeonixLbZip,
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "./leonixLocalBusinessLocationContract";

export const LEONIX_PROP_STATE = "Leonix:state";
export const LEONIX_PROP_COUNTRY = "Leonix:country";

export {
  formatLeonixLbPublicLocationLine,
  isLeonixLbUsCountry,
  leonixLbStateMatchesFilter,
  normalizeLeonixLbCountry,
  normalizeLeonixLbStateCode,
  normalizeLeonixLbZip,
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
};

export function readLeonixPropertyLocationFromRow(row: Record<string, unknown>): {
  city: string;
  state: string | null;
  zip: string | null;
  country: string | null;
} {
  const city = String(row.city ?? "").trim();
  let zip: string | null = row.zip != null && String(row.zip).trim() ? String(row.zip).trim() : null;
  const dp = row.detail_pairs;
  if (!zip) {
    const fromMachine = readLeonixDetailPairValue(dp, LEONIX_DP_POSTAL_CODE);
    const z = normalizeLeonixLbZip(fromMachine ?? "");
    if (z) zip = z;
  }
  const stateRaw =
    readLeonixDetailPairValue(dp, LEONIX_PROP_STATE) ??
    readLeonixDetailPairValue(dp, "Estado") ??
    (row.state != null ? String(row.state) : null);
  const countryRaw = readLeonixDetailPairValue(dp, LEONIX_PROP_COUNTRY);
  const state = stateRaw ? normalizeLeonixLbStateCode(stateRaw) : null;
  const country = countryRaw ? normalizeLeonixLbCountry(countryRaw) : null;
  return { city, state, zip, country };
}

export function leonixPropertyCountryMatchesFilter(
  listingCountryRaw: string | null | undefined,
  filterCountryRaw: string
): boolean {
  const f = normalizeLeonixLbCountry(filterCountryRaw);
  if (!f || isLeonixLbUsCountry(f)) return true;
  const listing = listingCountryRaw?.trim() ? normalizeLeonixLbCountry(listingCountryRaw) : "";
  if (!listing || isLeonixLbUsCountry(listing)) return isLeonixLbUsCountry(f);
  const a = listing.toLowerCase();
  const b = f.toLowerCase();
  return a.includes(b) || b.includes(a);
}

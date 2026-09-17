/**
 * Gate G23 — real Google-backed implementation of `BusinessAddressProvider`.
 *
 * Deliberately NOT `import "server-only"` — same reasoning as googleAddressProviderConfig.ts:
 * only ever imported from an API route or scripts/verify-business-address-foundation.ts, never a
 * client component.
 *
 * Uses the Google Geocoding API (https://maps.googleapis.com/maps/api/geocode/json) — a single
 * request/response call that returns a formatted address, parsed components, lat/lng, and a
 * `place_id` in one round trip, which matches this repo's existing `BusinessAddressProvider.
 * suggest()` contract (returns fully-formed `BusinessAddress[]` candidates, not a two-step
 * autocomplete-then-details flow). No new mapping architecture: Google is already this
 * platform's configured provider elsewhere (translation — see `app/lib/translation/config.ts`).
 *
 * Server-only: the API key is never sent to the browser. The one caller is
 * `app/api/business-address/suggest/route.ts`.
 *
 * Every result this returns carries `verificationStatus: "provider_suggested"` — never
 * "verified". Per `businessAddressContract.ts`'s own doctrine, only an explicit owner
 * confirmation step (application code outside this adapter) may promote a suggestion to
 * "user_confirmed"; nothing here ever marks an address "verified" from a suggestion alone.
 */
import type { BusinessAddress } from "../businessAddressContract";
import type { BusinessAddressProvider, BusinessAddressProviderResult } from "../businessAddressProvider";
import { normalizeCountry, normalizePostalCode, normalizeStateRegion } from "../businessAddressNormalize";
import { getGoogleAddressProviderConfig } from "./googleAddressProviderConfig";

const GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResult = {
  place_id?: string;
  formatted_address?: string;
  address_components?: GoogleAddressComponent[];
  geometry?: { location?: { lat?: number; lng?: number } };
};

type GoogleGeocodeResponse = {
  status: string;
  results?: GoogleGeocodeResult[];
  error_message?: string;
};

function componentByType(components: GoogleAddressComponent[] | undefined, type: string): GoogleAddressComponent | undefined {
  return components?.find((c) => c.types.includes(type));
}

/** Pure — exported for testing without a network call. */
export function mapGoogleGeocodeResultToBusinessAddress(result: GoogleGeocodeResult): BusinessAddress | null {
  const components = result.address_components ?? [];
  const streetNumber = componentByType(components, "street_number")?.long_name ?? "";
  const route = componentByType(components, "route")?.long_name ?? "";
  const street = [streetNumber, route].filter(Boolean).join(" ").trim();
  const unit = componentByType(components, "subpremise")?.long_name;
  const cityComponent =
    componentByType(components, "locality") ??
    componentByType(components, "postal_town") ??
    componentByType(components, "sublocality");
  const stateComponent = componentByType(components, "administrative_area_level_1");
  const postalComponent = componentByType(components, "postal_code");
  const countryComponent = componentByType(components, "country");

  if (!street || !cityComponent || !stateComponent) return null;

  const country = normalizeCountry(countryComponent?.short_name);
  return {
    street,
    unit: unit?.trim() || undefined,
    city: cityComponent.long_name,
    region: normalizeStateRegion(stateComponent.short_name || stateComponent.long_name),
    postalCode: normalizePostalCode(postalComponent?.long_name ?? "", country),
    country,
    formattedAddress: result.formatted_address,
    latitude: result.geometry?.location?.lat,
    longitude: result.geometry?.location?.lng,
    verificationStatus: "provider_suggested",
    provider: "google_geocoding",
    providerPlaceId: result.place_id ?? null,
    manualEntry: false,
  };
}

export const googleAddressProvider: BusinessAddressProvider = {
  name: "google_geocoding",
  async suggest(query, opts): Promise<BusinessAddressProviderResult> {
    const trimmed = query.trim();
    if (!trimmed) return { ok: false, reason: "empty_query" };

    const config = getGoogleAddressProviderConfig();
    if (!config.isConfigured) {
      return { ok: false, reason: "no_provider_configured" };
    }

    const params = new URLSearchParams({
      address: trimmed,
      key: process.env.GOOGLE_MAPS_API_KEY as string,
    });
    if (opts?.country) params.set("region", opts.country.toLowerCase());

    let response: Response;
    try {
      response = await fetch(`${GEOCODE_ENDPOINT}?${params.toString()}`, { method: "GET" });
    } catch {
      return { ok: false, reason: "provider_network_error" };
    }
    if (!response.ok) {
      return { ok: false, reason: `provider_http_${response.status}` };
    }

    let payload: GoogleGeocodeResponse;
    try {
      payload = (await response.json()) as GoogleGeocodeResponse;
    } catch {
      return { ok: false, reason: "provider_invalid_response" };
    }

    if (payload.status === "ZERO_RESULTS") {
      return { ok: true, suggestions: [] };
    }
    if (payload.status !== "OK") {
      return { ok: false, reason: `provider_status_${payload.status.toLowerCase()}` };
    }

    const suggestions = (payload.results ?? [])
      .map(mapGoogleGeocodeResultToBusinessAddress)
      .filter((a): a is BusinessAddress => a !== null)
      .slice(0, 5);

    return { ok: true, suggestions };
  },
};

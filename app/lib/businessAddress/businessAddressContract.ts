/**
 * Shared business address contract (foundation only — not wired into any live category yet).
 *
 * Why this exists: an audit found NO street-level address autocomplete/verification primitive
 * anywhere in this repo. `app/components/CityAutocomplete.tsx` only canonicalizes city NAMES
 * (via `getCanonicalCityName` in `app/data/locations/californiaLocationHelpers.ts`), and the
 * various per-category "use my current location" buttons only reverse-geocode a browser
 * lat/lng into a coarse city — neither is a street address.
 *
 * Comida Local (`app/lib/clasificados/comida-local/`) already ships the reference PRIVACY
 * pattern this contract generalizes: a free-text `businessAddressLine` plus an explicit owner
 * opt-in (`showAddressPublicly`) that gates whether the exact address ever reaches the public
 * preview VM (see `mapComidaLocalDraftToPreviewVm.ts`). This contract keeps that separation
 * between "the address we hold" (truth) and "what the public sees" (visibility) as a first-class
 * type-level distinction — see `businessAddressPrivacy.ts`.
 *
 * No real address-verification provider (Google Places, SmartyStreets, USPS, etc.) is wired into
 * this repo today — confirmed by searching package.json and env samples. `verificationStatus`
 * therefore only ever reaches "verified" through a real provider adapter (see
 * `businessAddressProvider.ts`); manual entry is always a fully valid, first-class path and is
 * never silently upgraded.
 */

/**
 * - "unverified": address captured but nothing has attempted to confirm it yet.
 * - "manual": the merchant/owner typed it in by hand; treated as trustworthy for display, but
 *   never conflated with provider verification.
 * - "user_confirmed": the owner explicitly confirmed a provider-suggested match.
 * - "provider_suggested": a provider returned this as a candidate, not yet confirmed by anyone.
 * - "verified": a real address-verification provider confirmed this address. Only provider
 *   adapter code may set this value — see `businessAddressProvider.ts`.
 */
export type BusinessAddressVerificationStatus =
  | "unverified"
  | "manual"
  | "user_confirmed"
  | "provider_suggested"
  | "verified";

export type BusinessAddress = {
  street: string;
  /** Apartment/suite/unit number, e.g. "Apt 4B", "Suite 200". Absent when there is none. */
  unit?: string;
  city: string;
  /** State/province, e.g. "CA". */
  region: string;
  postalCode: string;
  /** ISO-3166-ish country code/name. Defaults to "US" for this NorCal-focused product — see
   * `normalizeCountry` in `businessAddressNormalize.ts`. */
  country: string;
  /** Optional pre-assembled display string (e.g. from a provider). When absent, callers should
   * use `buildFormattedAddress` from `businessAddressNormalize.ts`. */
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: BusinessAddressVerificationStatus;
  /** Name of the provider that produced/confirmed this address, if any (e.g. "google_places").
   * `null`/undefined for manual entry. */
  provider?: string | null;
  /** Provider-specific place id, if any. `null`/undefined for manual entry. */
  providerPlaceId?: string | null;
  /** True when a human typed this address in directly rather than selecting a provider
   * suggestion. Manual entry is always valid; this flag never gates whether an address can be
   * saved. */
  manualEntry: boolean;
};

export const DEFAULT_BUSINESS_ADDRESS_COUNTRY = "US";

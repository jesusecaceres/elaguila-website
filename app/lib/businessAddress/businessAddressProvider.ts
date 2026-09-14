/**
 * Provider-neutral address suggestion/verification interface.
 *
 * Provider truth (corrected 2026-09-13, Servicios Live Launch Perfection ⚠️30): one real adapter
 * implements this interface today — `providers/googleAddressProvider.ts` (Google Geocoding via
 * `GOOGLE_MAPS_API_KEY`, server-side only), served by `POST /api/business-address/suggest` and
 * consumed by `BusinessAddressVerifiedInput`. It returns `provider_suggested` candidates; it never
 * marks anything "verified".
 *
 * `manualOnlyAddressProvider` below is the honest fallback when no provider key is configured:
 * it always reports "no provider configured" rather than pretending to verify anything. Manual entry
 * (`verificationStatus: "manual"`) must always remain a fully valid, first-class path — no code
 * in this repo may require a provider result before a business address can be saved.
 *
 * When a real provider is wired in later, implement `BusinessAddressProvider` against it and set
 * `verificationStatus: "verified"` ONLY from that adapter's own confirmed results — never from
 * manual-entry code paths (see `scripts/verify-business-address-foundation.ts` for a test
 * proving this).
 */

import type { BusinessAddress } from "./businessAddressContract";

export type BusinessAddressProviderResult =
  | { ok: true; suggestions: BusinessAddress[] }
  | { ok: false; reason: string };

export type BusinessAddressProvider = {
  name: string;
  suggest: (
    query: string,
    opts?: { country?: string }
  ) => Promise<BusinessAddressProviderResult>;
};

/**
 * Honest no-op provider for when no real address-verification provider is configured. Never
 * fabricates suggestions or a "verified" status.
 */
export const manualOnlyAddressProvider: BusinessAddressProvider = {
  name: "manual_only",
  async suggest(): Promise<BusinessAddressProviderResult> {
    return { ok: false, reason: "no_provider_configured" };
  },
};

/**
 * Provider-neutral address suggestion/verification interface.
 *
 * No real address-verification provider (Google Places, SmartyStreets, USPS, etc.) is wired into
 * this repo today. This was confirmed by searching package.json dependencies and tracked env
 * samples for provider SDKs/API-key variable names — none exist. The Google Cloud packages that
 * ARE present (`@google-cloud/documentai`, `@google/generative-ai`, `googleapis`) are unrelated
 * to address lookup.
 *
 * `manualOnlyAddressProvider` below is the honest default: it always reports "no provider
 * configured" rather than pretending to verify anything. Manual entry
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

/**
 * Gate G23 — Google address-verification provider readiness.
 *
 * Deliberately NOT `import "server-only"` — matches the precedent set by
 * commercialWriteGuard.ts: this module is only ever imported from an API route or the Google
 * provider adapter (never a client component — confirmed: BusinessAddressVerifiedInput.tsx only
 * imports the plain `BusinessAddress` type, never this config), and omitting the marker is what
 * lets scripts/verify-business-address-foundation.ts import and exercise it directly via `tsx`.
 *
 * Google is already Leonix's strategic primary provider for translation
 * (`app/lib/translation/config.ts`) and the only cloud vendor already integrated in this repo
 * (`@google-cloud/documentai`, `@google/generative-ai`, `googleapis`) — this reuses that same
 * vendor rather than introducing a second mapping architecture (SmartyStreets/Mapbox/HERE).
 *
 * Never reads or logs the key's value — only whether it is present. `isConfigured: false` is the
 * expected, honest state whenever `GOOGLE_MAPS_API_KEY` is absent; callers must fail closed to
 * `manualOnlyAddressProvider`-equivalent behavior, never throw.
 */
export type GoogleAddressProviderConfig = {
  isConfigured: boolean;
  missingEnv: string[];
};

export function getGoogleAddressProviderConfig(): GoogleAddressProviderConfig {
  const hasKey = Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
  return {
    isConfigured: hasKey,
    missingEnv: hasKey ? [] : ["GOOGLE_MAPS_API_KEY"],
  };
}

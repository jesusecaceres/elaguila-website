/**
 * Non-blocking integration points for platform consent / analytics / personalization.
 * Reads the same first-party consent record as the rest of the site (`leonixPublicConsent.ts`).
 * `app/(site)/layout.tsx` mounts `LeonixCookieConsent` — Viajes does not ship duplicate legal UI or copy here.
 *
 * Future (behind `viajesPersonalizationAllowed()` only):
 * - optional `localStorage` keys such as `leonix_viajes_prefs_v1` for last sort / departure hub / dismissed hints
 * - never write cross-site identifiers here; keep Viajes prefs separate from ad profiling
 *
 * Geolocation remains **only** in `useBrowserLocationForViajes` (user gesture + browser API), not here.
 * Cookie/analytics consent is separate from browser location permission.
 */

import { leonixAnalyticsAllowed, leonixPersonalizationAllowed } from "@/app/lib/leonixPublicConsent";

/** Returns true if non-essential analytics may run. */
export function viajesAnalyticsAllowed(): boolean {
  return leonixAnalyticsAllowed();
}

/** Returns true if preference-based ranking may be tuned. */
export function viajesPersonalizationAllowed(): boolean {
  return leonixPersonalizationAllowed();
}

/** Best-effort analytics event — no-op unless `viajesAnalyticsAllowed()`. */
export function viajesTrack(_event: string, _payload?: Record<string, string | number | boolean>): void {
  if (!viajesAnalyticsAllowed()) return;
  // TODO: connect to shared `trackEvent` / Vercel Analytics / internal pipeline
}

/**
 * Non-blocking integration points for platform consent / analytics / personalization.
 * Preference flags are written by `LeonixCookieConsent` + `persistLeonixConsent`.
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

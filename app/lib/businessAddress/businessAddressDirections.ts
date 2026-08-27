/**
 * Safe "get directions" destination builder.
 *
 * URL pattern matches the existing working convention used across this repo (Restaurantes,
 * Rentas, En Venta, Bienes Raíces, etc. — see e.g.
 * `app/(site)/clasificados/restaurantes/application/restauranteContactHref.ts` and
 * `app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers.ts`):
 *   https://www.google.com/maps/search/?api=1&query=<encoded address>
 * No API key required, no new URL-encoding scheme invented.
 */

import type { BusinessAddressPublicView } from "./businessAddressPrivacy";

/**
 * Returns a Google Maps search URL ONLY when it is safe to show a "get directions" CTA at all:
 * directions are allowed, the owner has chosen to reveal the exact address, and there is an
 * actual address line to point to. Otherwise returns `null` so the caller can hide the CTA
 * entirely — this repo's established "hide when absent" doctrine (confirmed in Comida Local's
 * own detail shell), never render a dead/disabled directions button.
 */
export function buildBusinessDirectionsHref(publicView: BusinessAddressPublicView): string | null {
  if (!publicView.directionsAllowed) return null;
  if (!publicView.showExactAddress) return null;
  const line = publicView.exactAddressLine?.trim();
  if (!line) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(line)}`;
}

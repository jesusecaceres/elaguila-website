/**
 * Global Business Hub OS — shared map/location helpers.
 *
 * The `google.com/maps?q=<address>&output=embed` (no API key) formula was independently
 * duplicated in Servicios (`serviciosBusinessHubMapEmbed.ts`) and Autos Dealer
 * (`autosDealerStructuredAddress.ts`'s `buildAutosDealerMapEmbedUrl`) — both now re-export this
 * function instead of re-implementing the formula. A separate, earlier original of this same
 * formula also exists in `ofertasLocalesPreviewHelpers.ts` (Ofertas Locales, isolated worktree,
 * out of scope — left untouched).
 */

/** Safe Google Maps embed src from a display address string — no API key, no user iframe HTML. */
export function buildSharedConnectionHubMapEmbedSrc(address: string): string | undefined {
  const q = address.trim().replace(/\s+/g, " ");
  if (!q || q.length < 4) return undefined;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

/** Safe Google Maps directions/search href from a display address string. */
export function buildSharedConnectionHubDirectionsHref(addressOrUrl: string): string | undefined {
  const q = addressOrUrl.trim();
  if (!q) return undefined;
  if (/^https?:\/\//i.test(q)) return q;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** True when a display address line looks coarse (city/state/zip only) rather than street-level. */
export function isCoarseLocationLine(addressLine: string): boolean {
  const trimmed = addressLine.trim();
  if (!trimmed) return true;
  // A street-level line starts with a house/unit number; a coarse city/state/zip line does not.
  return !/^\d+\s/.test(trimmed);
}

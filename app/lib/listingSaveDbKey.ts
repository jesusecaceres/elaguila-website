/** Human-facing Leonix ad code (e.g. SALE-2026-000080) — not a saved_listings.listing_id key. */
const LEONIX_DISPLAY_ID = /^[A-Z]+-\d{4}-\d{6}$/;

export function isLeonixDisplayAdId(value: string | null | undefined): boolean {
  return LEONIX_DISPLAY_ID.test(String(value ?? "").trim());
}

export function isListingUuid(value: string | null | undefined): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? "").trim(),
  );
}

/**
 * Resolve the `saved_listings.listing_id` for `listings`-table rows (Varios / en-venta).
 * Prefers the internal listing UUID; never returns a Leonix display id.
 */
export function resolveListingsTableSavedListingKey(
  listingUuid: string | null | undefined,
  fallback?: string | null,
): string {
  const uuid = String(listingUuid ?? "").trim();
  if (uuid && isListingUuid(uuid)) return uuid;
  const fb = String(fallback ?? "").trim();
  if (fb && isListingUuid(fb)) return fb;
  if (fb && !isLeonixDisplayAdId(fb)) return fb;
  return uuid || fb;
}

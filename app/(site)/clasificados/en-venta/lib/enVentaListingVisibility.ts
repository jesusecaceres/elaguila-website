/**
 * Single source for “does this `listings` row belong on public En Venta browse?”
 * Keep in sync with `publishEnVentaFromDraft` (draft → uploads → `active` + published) and `EnVentaResultsClient`.
 * Staff may set `is_published=false` via `setListingPublishedAction` — those rows stay out of browse until republished.
 */
export function isEnVentaListingPubliclyVisible(row: Record<string, unknown>): boolean {
  if (String(row.category ?? "").toLowerCase() !== "en-venta") return false;
  if (String(row.status ?? "").toLowerCase() !== "active") return false;
  if (row.is_published === false) return false;
  return true;
}

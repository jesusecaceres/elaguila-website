/**
 * Single source for “does this `listings` row belong on public En Venta browse?”
 * Keep in sync with `publishEnVentaFromDraft` insert payload and `EnVentaResultsClient` Supabase query.
 */
export function isEnVentaListingPubliclyVisible(row: Record<string, unknown>): boolean {
  if (String(row.category ?? "").toLowerCase() !== "en-venta") return false;
  if (String(row.status ?? "").toLowerCase() !== "active") return false;
  if (row.is_published === false) return false;
  return true;
}

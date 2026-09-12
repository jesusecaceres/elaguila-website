/**
 * Canonical rules for whether a `listings` row may appear in **public browse pools**
 * (clasificados hub, Bienes Raíces landing/results live fetch, En Venta results after category check).
 *
 * Dashboard “draft / pending / sold” UI uses `resolveListingUiStatus` — different concern (owner UX).
 */

export type ListingBrowseRowLike = {
  status?: string | null;
  is_published?: boolean | null;
  expires_at?: string | null;
};

/**
 * `true` when the row is explicitly public in browse terms: not unpublished, `status` is active,
 * and — for fixed-term categories that set `expires_at` (Bienes Raíces Privado/FSBO via Gate 20;
 * Rentas uses its own separate query/index, not this shared predicate) — not yet expired. A
 * lifecycle-expired row never has its DB `status` changed away from "active" (same as Rentas), so
 * this check is the only thing that removes it from the public pool; categories that never set
 * `expires_at` are unaffected (the check is a no-op when the field is null).
 */
export function isListingRowActiveAndPublishedForBrowse(row: ListingBrowseRowLike): boolean {
  if (row.is_published === false) return false;
  if (String(row.status ?? "").toLowerCase().trim() !== "active") return false;
  if (row.expires_at) {
    const expiresMs = new Date(row.expires_at).getTime();
    if (Number.isFinite(expiresMs) && expiresMs <= Date.now()) return false;
  }
  return true;
}

/**
 * Canonical rules for whether a `listings` row may appear in **public browse pools**
 * (clasificados hub, Bienes Raíces landing/results live fetch, En Venta results after category check).
 *
 * Dashboard “draft / pending / sold” UI uses `resolveListingUiStatus` — different concern (owner UX).
 */

export type ListingBrowseRowLike = {
  status?: string | null;
  is_published?: boolean | null;
};

/** `true` when the row is explicitly public in browse terms: not unpublished and `status` is active. */
export function isListingRowActiveAndPublishedForBrowse(row: ListingBrowseRowLike): boolean {
  if (row.is_published === false) return false;
  return String(row.status ?? "").toLowerCase().trim() === "active";
}

/**
 * Saved Search 06 — pure Rentas matcher. Reuses `filterRentasPublicListings` verbatim (the exact
 * function driving the live public Rentas results page —
 * `app/(site)/clasificados/rentas/shared/rentasBrowseFilters.ts`) so match semantics can never
 * drift from what a shopper actually sees running this search themselves.
 *
 * Visibility is a TYPE-enforced precondition: this function only accepts
 * `RentasPublicEligibleListing`, a branded type only `certifyRentasPublicEligibleListing` can
 * produce.
 */
import { filterRentasPublicListings } from "@/app/clasificados/rentas/shared/rentasBrowseFilters";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { savedSearchToRentasFilterState } from "./savedSearchRentasAdapter";
import type { RentasPublicEligibleListing } from "./rentasPublicEligibleListing";

export function matchesRentasSavedSearch(
  listing: RentasPublicEligibleListing,
  savedSearch: SavedSearchNormalizedInput,
): boolean {
  const p = savedSearchToRentasFilterState(savedSearch);
  return filterRentasPublicListings([listing], p).length > 0;
}

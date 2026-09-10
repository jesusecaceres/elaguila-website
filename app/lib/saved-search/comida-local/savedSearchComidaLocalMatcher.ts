/**
 * Gate COMIDA-LOCAL-2 — pure Comida Local matcher.
 *
 * Reuses `filterComidaLocalPublicRows` verbatim — the exact function
 * `listPublishedComidaLocalListings` applies to drive the live public landing/results page — so
 * match semantics can never drift from what a shopper sees running the same search themselves. No
 * filter logic is reimplemented here.
 *
 * The row shape is already the results page's own row shape (`ComidaLocalPublicListingRow`), so
 * unlike Restaurantes there is no blueprint conversion step in between: the same row the results
 * page filters is the row the matcher filters.
 *
 * Visibility is a TYPE-enforced precondition: this only accepts `ComidaLocalPublicEligibleListing`,
 * which only `certifyComidaLocalPublicEligibleListing` can produce.
 *
 * FIND ME TODAY plays no part in matching: the saved payload carries no temporary-location facet
 * (see `savedSearchComidaLocalAdapter`) and `filterComidaLocalPublicRows` reads no
 * `location_note` / `location_url` / freshness field, so a vendor moving does not change whether a
 * saved search matches.
 */
import { filterComidaLocalPublicRows } from "@/app/lib/clasificados/comida-local/comidaLocalPublicFilter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { savedSearchToComidaLocalFilters } from "./savedSearchComidaLocalAdapter";
import type { ComidaLocalPublicEligibleListing } from "./comidaLocalPublicEligibleListing";

export function matchesComidaLocalSavedSearch(
  listing: ComidaLocalPublicEligibleListing,
  savedSearch: SavedSearchNormalizedInput,
): boolean {
  const filters = savedSearchToComidaLocalFilters(savedSearch);
  return filterComidaLocalPublicRows([listing], filters).length > 0;
}

/**
 * Gate RESTAURANTES-2 — pure Restaurantes matcher.
 *
 * Reuses `filterRestaurantesBlueprintRows` verbatim — the exact function driving the live public
 * results page (`RestaurantesResultsShell`) — so match semantics can never drift from what a
 * shopper sees running the same search themselves. No filter logic is reimplemented here.
 *
 * The DB row is converted to the same blueprint shape the results page filters over, using the
 * category's own `mapRestaurantesPublicListingDbRowToShellInventoryRow`. That mapper is also what
 * computes `openNowDemo` (timezone-pinned), so an `open=1` saved search is evaluated against real
 * current hours at match time rather than a stale flag.
 *
 * The ranking/sort step the results page applies AFTER filtering (`applyRestaurantesVisibilityRanking`,
 * `sortRestaurantesBlueprintRows`) is deliberately not run: it affects ordering and paid
 * presentation, never inclusion.
 *
 * Visibility is a TYPE-enforced precondition: this only accepts `RestaurantesPublicEligibleListing`,
 * which only `certifyRestaurantesPublicEligibleListing` can produce.
 */
import { filterRestaurantesBlueprintRows } from "@/app/(site)/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows";
import { mapRestaurantesPublicListingDbRowToShellInventoryRow } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import type { RestaurantesDiscoveryLang } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";
import { savedSearchToRestaurantesDiscoveryState } from "./savedSearchRestaurantesAdapter";
import type { RestaurantesPublicEligibleListing } from "./restaurantesPublicEligibleListing";

export function matchesRestaurantesSavedSearch(
  listing: RestaurantesPublicEligibleListing,
  savedSearch: SavedSearchNormalizedInput,
  lang: RestaurantesDiscoveryLang = "es",
): boolean {
  const state = savedSearchToRestaurantesDiscoveryState(savedSearch, lang);
  const row = mapRestaurantesPublicListingDbRowToShellInventoryRow(listing);
  // `saved` is never persisted by the adapter (device-local ids), so no savedIds option is needed.
  return filterRestaurantesBlueprintRows([row], state).length > 0;
}

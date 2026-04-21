/**
 * Rentas public data access — demo pool + section samples (`rentasLandingSampleData`).
 *
 * **Staged testing:** interactive pages also load `listings` rows on the client (`useRentasStagedInventory`) and
 * run the same section selectors against the merged pool. These sync helpers remain demo-only for SSR/tests.
 *
 * Section rules: `rentasSectionPolicy.ts` + `rentasSectionSelectors.ts`.
 */

import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import {
  getRentasPublicBrowsePool,
  getRentasResultsDemoTotal as loaderGetRentasResultsDemoTotal,
  getRentasResultsFeaturedListing as loaderGetRentasResultsFeaturedListing,
  getRentasResultsGridListings as loaderGetRentasResultsGridListings,
  resolveRentasPublicListingById,
} from "@/app/clasificados/rentas/data/rentasPublicLoader";
import {
  getRentasLandingDestacadas,
  getRentasLandingNegocios,
  getRentasLandingPrivado,
  getRentasLandingRecientes,
  rentasLandingFeaturedListing,
} from "@/app/clasificados/rentas/data/rentasLandingSampleData";

export { getRentasPublicBrowsePool };

export function getRentasResultsDemoTotal(): number {
  return loaderGetRentasResultsDemoTotal();
}

export function getRentasResultsFeaturedListing(): RentasPublicListing {
  return loaderGetRentasResultsFeaturedListing();
}

export function getRentasResultsGridListings(): RentasPublicListing[] {
  return loaderGetRentasResultsGridListings();
}

export function getRentasListingById(id: string): RentasPublicListing | undefined {
  return resolveRentasPublicListingById(id);
}

export {
  rentasLandingFeaturedListing,
  getRentasLandingDestacadas,
  getRentasLandingRecientes,
  getRentasLandingNegocios,
  getRentasLandingPrivado,
};

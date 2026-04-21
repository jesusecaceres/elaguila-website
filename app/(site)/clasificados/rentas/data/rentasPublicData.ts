/**
 * Rentas public data access — demo pool + section samples (`rentasLandingSampleData`).
 *
 * **Production:** landing/results receive server-fetched live rows; demo merges only with
 * `NEXT_PUBLIC_RENTAS_INCLUDE_DEMO_POOL=1`. These sync helpers remain demo-only for non-route utilities/tests.
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

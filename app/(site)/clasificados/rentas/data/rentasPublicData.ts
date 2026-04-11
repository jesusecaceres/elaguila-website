/**
 * Rentas public data access — **single entry** for UI: delegates to `rentasPublicLoader.ts`.
 *
 * **Source today:** `RENTAS_PUBLIC_DATA_SOURCE === "demo"` in the loader — typed demo fixtures only.
 * When a live published table/API is wired, extend the loader; keep these exports stable.
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

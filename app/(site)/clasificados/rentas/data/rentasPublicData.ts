/**
 * Rentas public data access layer (sample-backed today).
 *
 * Replace implementations with live loaders (Supabase/API) without changing UI contracts:
 * - `RentasPublicListing` in `../model/rentasPublicListing`
 * - Pages should call these helpers instead of importing demo arrays directly.
 *
 * ## Section loading policy (fairness — single reference)
 * Landing sections (`getRentasLandingDestacadas`, `getRentasLandingRecientes`, `getRentasLandingNegocios`,
 * `getRentasLandingPrivado`) and results grid (`getRentasResultsGridListings` + `filterRentasPublicListings`)
 * follow the rules documented in `rentasLandingSampleData.ts` and `rentasBrowseFilters.ts`:
 * - Recientes: newest published/active first.
 * - Negocios / Privado: branch-filtered slices; private inventory stays visible (not buried by business rows).
 * - Destacadas: scored demo fairness (diversity + privado floor), not pure pay-to-win; future billing may add
 *   weight without exclusive business control of all hero slots.
 * - Geo (`lat`/`lng`/`radius_km`): URL scaffold only until a geo index exists (no fake radius filtering).
 */

import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import {
  getRentasLandingDestacadas,
  getRentasLandingNegocios,
  getRentasLandingPrivado,
  getRentasLandingRecientes,
  rentasLandingFeaturedListing,
} from "@/app/clasificados/rentas/data/rentasLandingSampleData";
import { findRentasDemoListingById } from "@/app/clasificados/rentas/listing/rentasListingDetailModel";
import {
  rentasResultsFeatured,
  rentasResultsGridDemo,
  RENTAS_RESULTS_DEMO_TOTAL,
} from "@/app/clasificados/rentas/results/rentasResultsDemoData";

export function getRentasResultsDemoTotal(): number {
  return RENTAS_RESULTS_DEMO_TOTAL;
}

export function getRentasResultsFeaturedListing(): RentasPublicListing {
  return rentasResultsFeatured;
}

export function getRentasResultsGridListings(): RentasPublicListing[] {
  return rentasResultsGridDemo;
}

export function getRentasListingById(id: string): RentasPublicListing | undefined {
  return findRentasDemoListingById(id);
}

export {
  rentasLandingFeaturedListing,
  getRentasLandingDestacadas,
  getRentasLandingRecientes,
  getRentasLandingNegocios,
  getRentasLandingPrivado,
};

/**
 * Landing section rows — built from the public browse pool (`getRentasPublicBrowsePool` in `rentasPublicLoader`).
 * Selection rules live in `rentasSectionSelectors.ts` + `rentasSectionPolicy.ts`.
 */

import { getRentasPublicBrowsePool, getRentasResultsFeaturedListing } from "@/app/clasificados/rentas/data/rentasPublicLoader";
import {
  selectRentasLandingDestacadas,
  selectRentasLandingNegocios,
  selectRentasLandingPrivado,
  selectRentasLandingRecientes,
} from "@/app/clasificados/rentas/data/rentasSectionSelectors";
import type { RentasResultsDemoListing } from "@/app/clasificados/rentas/results/rentasResultsDemoData";

export const rentasLandingFeaturedListing = getRentasResultsFeaturedListing();

export function getRentasLandingDestacadas(): RentasResultsDemoListing[] {
  return selectRentasLandingDestacadas(getRentasPublicBrowsePool());
}

export function getRentasLandingRecientes(): RentasResultsDemoListing[] {
  return selectRentasLandingRecientes(getRentasPublicBrowsePool());
}

export function getRentasLandingNegocios(): RentasResultsDemoListing[] {
  return selectRentasLandingNegocios(getRentasPublicBrowsePool());
}

export function getRentasLandingPrivado(): RentasResultsDemoListing[] {
  return selectRentasLandingPrivado(getRentasPublicBrowsePool());
}

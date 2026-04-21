/**
 * Single boundary for Rentas **public** browse data (demo fixtures).
 *
 * **Staged testing:** client surfaces (results, landing) merge Supabase `listings` (`category=rentas`) with this
 * demo pool via `useRentasStagedInventory` + `mergeStagedRentasWithDemo`. This module stays the demo source;
 * server detail for UUID rows uses `fetchRentasListingForPublicDetail`.
 */

import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import {
  rentasResultsFeatured,
  rentasResultsGridDemo,
  RENTAS_RESULTS_DEMO_TOTAL,
} from "@/app/clasificados/rentas/results/rentasResultsDemoData";

/** What backs public Rentas UI today. */
export type RentasPublicDataSource = "demo" | "live_pending";

/** Set to `live_pending` once a live loader is wired; UI may show a non-blocking readiness note. */
export const RENTAS_PUBLIC_DATA_SOURCE: RentasPublicDataSource = "demo";

export function getRentasPublicBrowsePool(): RentasPublicListing[] {
  const map = new Map<string, RentasPublicListing>();
  for (const l of [rentasResultsFeatured, ...rentasResultsGridDemo]) {
    map.set(l.id, l);
  }
  return [...map.values()];
}

export function getRentasResultsFeaturedListing(): RentasPublicListing {
  return rentasResultsFeatured;
}

export function getRentasResultsGridListings(): RentasPublicListing[] {
  return rentasResultsGridDemo;
}

export function getRentasResultsDemoTotal(): number {
  return RENTAS_RESULTS_DEMO_TOTAL;
}

export function resolveRentasPublicListingById(id: string): RentasPublicListing | undefined {
  return getRentasPublicBrowsePool().find((l) => l.id === id);
}

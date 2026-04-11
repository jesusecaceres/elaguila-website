/**
 * Single boundary for Rentas **public** browse data (landing, results grid, detail).
 *
 * **Current status:** `RENTAS_PUBLIC_DATA_SOURCE === "demo"` — inventory comes from typed demo fixtures
 * (`rentasResultsDemoData`). No live rows are merged yet.
 *
 * **Live path (future):** Add a server loader that queries published Rentas rows (e.g. Supabase `listings` or a
 * dedicated `rentas_public_listings` table), maps rows → `RentasPublicListing`, then **merge + dedupe by id** with
 * or instead of demo. Gate with env (e.g. `RENTAS_PUBLIC_LIVE_ENABLED=1`) and keep this module the only import
 * site for public grids/detail resolution.
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

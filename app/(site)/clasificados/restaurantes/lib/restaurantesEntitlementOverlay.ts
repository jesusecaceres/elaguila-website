/**
 * Gate FINAL-MONETIZATION-VISIBILITY-STACK — Public-safe active entitlement overlay for Restaurantes.
 *
 * Inventory loaders hydrate rows server-side; this module documents the contract and
 * re-exports the shared hydration helper scoped to restaurantes_public_listings.
 */

import "server-only";

import { hydratePublicRowsWithActivePackageEntitlements } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import type { RestaurantesPublicListingDbRow } from "./restaurantesPublicListingsServer";

const RESTAURANTES_CATEGORY = "restaurantes";
const RESTAURANTES_LISTING_SOURCE = "restaurantes_public_listings";

/**
 * Overlay active package entitlements onto Restaurantes DB rows (public-safe fields only).
 */
export async function overlayActiveEntitlementsForRestaurantesResults(
  rows: RestaurantesPublicListingDbRow[],
): Promise<RestaurantesPublicListingDbRow[]> {
  if (rows.length === 0) return rows;
  try {
    return await hydratePublicRowsWithActivePackageEntitlements(rows, {
      category: RESTAURANTES_CATEGORY,
      listingSource: RESTAURANTES_LISTING_SOURCE,
    });
  } catch (err) {
    console.warn(
      "[restaurantesEntitlementOverlay] Failed to overlay entitlements; returning rows unchanged.",
      err instanceof Error ? err.message : err,
    );
    return rows;
  }
}

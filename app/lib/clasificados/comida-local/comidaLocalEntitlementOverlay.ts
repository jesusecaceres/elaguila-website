/**
 * Globalization Build C (RED #15) — public-safe active entitlement overlay for Comida Local
 * results, modeled directly on serviciosEntitlementOverlay.ts. Comida Local had zero
 * listing_package_entitlements reads anywhere (confirmed by Plan 01) despite being a live,
 * Stripe-eligible, entitlement-writing $129/mo subscription — this closes that read-side gap
 * using the existing shared reader, no new table, no new fields invented.
 *
 * If the query fails or the table is missing, original rows are returned unchanged — public
 * results must never crash on this.
 */

import "server-only";

import { hydratePublicRowsWithActivePackageEntitlements } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import type { ComidaLocalPublicListingRow } from "./comidaLocalPublicTypes";

const COMIDA_LOCAL_ENTITLEMENT_CATEGORY = "comida-local";
const COMIDA_LOCAL_ENTITLEMENT_LISTING_SOURCE = "comida_local_public_listings";

export async function overlayActiveEntitlementsForComidaLocalResults(
  filteredRows: ComidaLocalPublicListingRow[],
): Promise<ComidaLocalPublicListingRow[]> {
  if (filteredRows.length === 0) return filteredRows;
  try {
    return await hydratePublicRowsWithActivePackageEntitlements(filteredRows, {
      category: COMIDA_LOCAL_ENTITLEMENT_CATEGORY,
      listingSource: COMIDA_LOCAL_ENTITLEMENT_LISTING_SOURCE,
    });
  } catch (err) {
    console.warn(
      "[comidaLocalEntitlementOverlay] Failed to overlay active entitlements; returning organic fallback.",
      err instanceof Error ? err.message : err,
    );
    return filteredRows;
  }
}

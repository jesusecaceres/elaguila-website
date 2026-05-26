/**
 * Gate G2A-SERVICIOS — Public-safe active entitlement overlay for Servicios ranking.
 *
 * Decorates **already-filtered** Servicios listing rows with active package entitlement
 * fields so the visibility ranking helper can detect Premium / Full-page / etc. tiers.
 *
 * Pipeline: fetch → filter/search/seller → **overlay** → ranking → render
 *
 * Public-safe fields added:
 *   - package_entitlement_tier
 *   - entitlement_starts_at
 *   - entitlement_ends_at
 *
 * Fields NOT exposed:
 *   - sales_rep_id / sales_rep_name
 *   - customer_name / customer_email / customer_phone
 *   - internal notes / admin metadata
 *   - commission / payment data
 *   - promo internals
 *
 * If the Supabase query fails or the table is missing, original rows are returned
 * unchanged with a console warning. Public results must never crash.
 */

import "server-only";

import { hydratePublicRowsWithActivePackageEntitlements } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

const SERVICIOS_CATEGORY = "servicios";
const SERVICIOS_LISTING_SOURCE = "servicios_public_listings";

/**
 * Overlay active package entitlements onto filtered Servicios listing rows.
 *
 * Queries `listing_package_entitlements` for:
 * - category = "servicios"
 * - listing_source = "servicios_public_listings"
 * - listing_id matching row id/slug/leonix_ad_id
 * - active status (not revoked, starts_at <= now, ends_at > now)
 *
 * Returns new row objects with public-safe entitlement fields merged.
 * Original row objects are not mutated.
 * If the query fails, returns original rows unchanged.
 */
export async function overlayActiveEntitlementsForServiciosResults(
  filteredRows: ServiciosPublicListingRow[],
): Promise<ServiciosPublicListingRow[]> {
  if (filteredRows.length === 0) return filteredRows;
  try {
    return await hydratePublicRowsWithActivePackageEntitlements(filteredRows, {
      category: SERVICIOS_CATEGORY,
      listingSource: SERVICIOS_LISTING_SOURCE,
    });
  } catch (err) {
    console.warn(
      "[serviciosEntitlementOverlay] Failed to overlay active entitlements; returning organic fallback.",
      err instanceof Error ? err.message : err,
    );
    return filteredRows;
  }
}

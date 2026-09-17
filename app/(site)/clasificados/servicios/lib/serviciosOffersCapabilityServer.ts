/**
 * Gate SERVICIOS-EDIT-ROUNDTRIP-OFFERS-DISCOVERY-1 (F2) — read-time `coupons_offers` capability for a
 * set of Servicios rows, for discovery ("Tiene ofertas" results filter, Saved Search matching).
 *
 * Same authority as the public detail page (`resolveBusinessToolsAccess` with `coupons_offers`),
 * through its batched form: only rows that carry included-offer content are looked up, in one
 * entitlement query (plus one subscription query when a live Stripe row exists) — never a lookup per
 * row. Fails closed: on any error the map is empty, so no included offer counts as visible.
 */

import "server-only";

import { resolveBusinessToolsAccessForListings } from "@/app/lib/listingPlans/categoryCommercialPlan";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import { serviciosWireHasOfferContent } from "./serviciosPublicOffersVisibility";

export async function resolveServiciosOffersCapabilityByListingId(
  rows: readonly Pick<ServiciosPublicListingRow, "id" | "profile_json">[],
): Promise<Map<string, boolean>> {
  const listingIds = rows
    .filter((row) => serviciosWireHasOfferContent(row.profile_json))
    .map((row) => String(row.id ?? "").trim())
    .filter(Boolean);
  if (listingIds.length === 0) return new Map();
  try {
    const decisions = await resolveBusinessToolsAccessForListings({
      category: "servicios",
      listingSource: "servicios_public_listings",
      listingIds,
      capability: "coupons_offers",
    });
    return new Map([...decisions].map(([listingId, decision]) => [listingId, decision.allowed === true]));
  } catch {
    return new Map();
  }
}

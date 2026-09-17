import "server-only";

/**
 * Gate RESTAURANTES-1 — the single server-side answer to "may this Restaurante listing show
 * coupons/offers right now?".
 *
 * OWNER PRODUCT TRUTH: Restaurantes is $399/month and coupons/offers are **INCLUDED in the base
 * package**. `restaurantes_offers_addon` ($79) is retired — `stripeEligible: false`,
 * `newSalesRetired: true` in `revenuePricingMatrix.ts` — and is NOT a separate paid entitlement.
 *
 * WHAT WAS BROKEN: both the public vitrina and the publish route resolved coupon visibility by
 * looking for a live `listing_package_entitlements` row whose `package_key` is that RETIRED
 * add-on key. Nothing grants such a row from a base payment (unlike Servicios, which has
 * `grantServiciosOffersAddonEntitlementFromBasePayment`), and the key can no longer be purchased.
 * A new $399 restaurant therefore had its coupons stripped on publish and hidden on its public
 * page — permanently — while the dashboard reported the module as enabled.
 *
 * WHAT THIS DOES INSTEAD: it asks the canonical commercial-plan resolver
 * (`resolveBusinessToolsAccess`, Package C Build 3) for the `coupons_offers` capability. That
 * resolver reads the listing's real `listing_package_entitlements` rows and derives capabilities
 * from the pricing matrix, so:
 *   - a paid `restaurantes_base_monthly` entitlement yields `coupons_offers` via
 *     `capabilities: ["coupons_offers"]` on the base package — no second checkout, no new row,
 *     no revived add-on purchase path;
 *   - a historical $79 add-on holder still resolves through the policy's own
 *     `legacy_addon_entitlement` / `legacyAddonAlsoActive` branches — nobody who paid loses access;
 *   - `suspended` blocks the capability outright, and `grace` preserves it, per the locked
 *     subscription doctrine in `categoryCommercialPlanPolicy.ts`.
 *
 * The Stripe webhook remains the paid authority: this reads only entitlement state that
 * `revenueEntitlementFulfillment` wrote after a settled payment. It writes nothing and is
 * therefore trivially idempotent.
 */
import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";

export const RESTAURANTES_COUPON_CAPABILITY = "coupons_offers" as const;
const RESTAURANTES_CATEGORY = "restaurantes" as const;
const RESTAURANTES_LISTING_SOURCE = "restaurantes_public_listings" as const;

/**
 * True only when the listing currently holds the included (or historically purchased) coupon
 * capability. Fails CLOSED on any unresolved id or lookup problem — an unentitled listing must
 * never leak coupon content, exactly as the previous add-on reader failed closed.
 */
export async function restauranteCouponsCapabilityActive(
  listingId: string | null | undefined,
): Promise<boolean> {
  const id = String(listingId ?? "").trim();
  // A brand-new listing has no canonical row UUID yet and therefore can never hold a capability.
  if (!id) return false;
  try {
    const access = await resolveBusinessToolsAccess({
      category: RESTAURANTES_CATEGORY,
      listingSource: RESTAURANTES_LISTING_SOURCE,
      listingId: id,
      capability: RESTAURANTES_COUPON_CAPABILITY,
    });
    return access.allowed === true;
  } catch {
    return false;
  }
}

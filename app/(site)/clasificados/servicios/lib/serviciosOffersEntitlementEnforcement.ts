/**
 * Gate E.3.1 + Gate SERVICIOS-P7-BLOCKER-REPAIR-01 (Repair B — SERVICIOS-INCLUDED-OFFERS-1).
 *
 * The server-side offers/coupons enforcement for Servicios saves, moved verbatim out of
 * `app/api/clasificados/servicios/publish/route.ts` so it can be EXECUTED by
 * `scripts/verify-servicios-included-offers.ts`. While it lived inside the route (which imports
 * `server-only` modules) no test could run it, and B4 — every new $399 customer's INCLUDED coupons
 * silently stripped here — shipped behind a fully green verifier suite. Pure: type-only import.
 */

import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

/** Gate E.3.1 — offer content already durably stored on the existing row, trusted as-is. */
export type TrustedServiciosOfferContent = Pick<ServiciosBusinessProfile, "coupons" | "couponFlyer" | "couponMoreOffers">;

export function trustedServiciosOfferContentFromExisting(
  previousWire: ServiciosBusinessProfile | null,
): TrustedServiciosOfferContent {
  return {
    coupons: Array.isArray(previousWire?.coupons) ? previousWire.coupons : [],
    couponFlyer:
      previousWire?.couponFlyer && typeof previousWire.couponFlyer === "object"
        ? previousWire.couponFlyer
        : undefined,
    couponMoreOffers:
      previousWire?.couponMoreOffers && typeof previousWire.couponMoreOffers === "object"
        ? previousWire.couponMoreOffers
        : undefined,
  };
}

/**
 * B4 — may this save persist INCOMING offer content?
 *
 * Coupons/offers are INCLUDED in `servicios_base_monthly`. Two server truths qualify, and nothing
 * else does (never content presence, never the client's `couponsAddOn` toggle):
 *  - `capabilityAllowed`: `resolveBusinessToolsAccess({ capability: "coupons_offers" })` for the
 *    existing row — a live base plan (grace included), or a historical offers add-on;
 *  - `awaitsBasePurchase`: the save leaves the row in `pending_payment`, which only a paid
 *    `servicios_base_monthly` (a package that includes the capability) can make public.
 */
export function decideServiciosOffersPersistence(input: {
  capabilityAllowed: boolean;
  awaitsBasePurchase: boolean;
}): boolean {
  return input.capabilityAllowed === true || input.awaitsBasePurchase === true;
}

/**
 * Gate E.3.1 — Servicios offer/coupon content (`coupons`/`couponFlyer`/`couponMoreOffers`) is
 * server/payment truth only. Unlike Restaurantes there is no stored `couponUpgradeEnabled`
 * flag on the Servicios wire profile — visibility has only ever been content-presence — so this
 * function's job is narrower: it never lets an unentitled request create or modify offer
 * content, while never erasing content a customer's active purchase already produced. A client
 * can never submit new/edited coupons, a flyer, or a more-offers link into a persisted state
 * unless `decideServiciosOffersPersistence` allows it. While unentitled, the content already
 * durably stored on this row (never the incoming client draft) is what persists instead, so a
 * customer's coupon content survives an unrelated base-listing save (business hours,
 * description, etc.) made after their entitlement lapsed or was revoked.
 */
export function enforceServiciosOffersEntitlementServerTruth(
  wire: ServiciosBusinessProfile,
  entitled: boolean,
  trustedExisting: TrustedServiciosOfferContent,
): ServiciosBusinessProfile {
  if (entitled) {
    return wire;
  }
  return {
    ...wire,
    coupons: trustedExisting.coupons,
    couponFlyer: trustedExisting.couponFlyer,
    couponMoreOffers: trustedExisting.couponMoreOffers,
  };
}

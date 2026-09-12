/**
 * Gate SERVICIOS-EDIT-ROUNDTRIP-OFFERS-DISCOVERY-1 (F2) — the ONE rule for which offers are
 * publicly visible on a Servicios listing. The public detail page and discovery (the "Tiene
 * ofertas" results filter, and Saved Search, which runs that same filter) all go through it, so
 * they cannot disagree.
 *
 * Included offers — coupons, the offers flyer and the "more offers" link — belong to the
 * `coupons_offers` capability of the $399 base package. They are visible only while that capability
 * is CURRENT, read at request time (`resolveBusinessToolsAccess` for one listing,
 * `resolveBusinessToolsAccessForListings` for a result set). Stored offer content is never deleted
 * here; only what counts as visible changes. Old-style promotions are not part of that capability
 * and are never gated here, exactly as on the detail page before this gate.
 *
 * Pure — the verifier executes it directly.
 */

import type { ServiciosBusinessProfile, ServiciosProfileResolved } from "@/app/servicios/types/serviciosBusinessProfile";
import { hasPaidCouponsSectionResolved } from "@/app/servicios/lib/serviciosProfilePresence";

/** What the public may see: the resolved profile, minus included offers when the capability is not current. */
export function applyServiciosPublicOffersVisibility(
  profile: ServiciosProfileResolved,
  offersCapabilityAllowed: boolean,
): ServiciosProfileResolved {
  return offersCapabilityAllowed
    ? profile
    : { ...profile, coupons: [], couponFlyer: undefined, couponMoreOffers: undefined };
}

/** "Tiene ofertas": true exactly when the public shell would render an offers block for this profile. */
export function serviciosResolvedProfileHasVisibleOffers(profile: ServiciosProfileResolved): boolean {
  return (
    (profile.promotions?.length ?? 0) > 0 ||
    hasPaidCouponsSectionResolved(profile) ||
    Boolean(profile.couponFlyer?.imageUrl?.trim()) ||
    Boolean(profile.couponMoreOffers?.url?.trim())
  );
}

/**
 * Cheap pre-check on the stored wire profile: does this row carry ANY included-offer content? Only
 * these rows need a capability lookup, so a result set pays for the lookup only where it can matter.
 * A superset of what renders (the resolver still validates each field), never a visibility decision.
 */
export function serviciosWireHasOfferContent(profile: ServiciosBusinessProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    (Array.isArray(profile.coupons) && profile.coupons.length > 0) ||
    Boolean(String(profile.couponFlyer?.imageUrl ?? "").trim()) ||
    Boolean(String(profile.couponMoreOffers?.url ?? "").trim())
  );
}

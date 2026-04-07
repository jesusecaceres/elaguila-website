/**
 * Rentas plan tier: infer listing → display tier for anuncio / lista (cross-branch).
 */

import { isProListing } from "../../../components/planHelpers";

/** Rentas-only plan tier for display (Privado Pro / Negocio Standard / Negocio Plus). */
export type RentasPlanTier = "privado_pro" | "business_standard" | "business_plus";

/**
 * Infers display tier from a listing row (anuncio / lista / sample data).
 * Mirrors former `inferRentasPlanTier` in anuncio and lista exactly (`any` accepts lista cards without rentas fields on the TS type).
 */
export function inferRentasPlanTierFromListing(listing: any): RentasPlanTier | null {
  if (listing?.category !== "rentas") return null;
  const sellerType = listing.sellerType ?? listing.seller_type ?? "personal";
  if (sellerType === "personal" && isProListing(listing)) return "privado_pro";
  if (sellerType === "business") {
    const tier = listing.rentasTier ?? listing.rentas_tier ?? listing.servicesTier;
    if (tier === "plus" || tier === "premium") return "business_plus";
    return "business_standard";
  }
  return null;
}

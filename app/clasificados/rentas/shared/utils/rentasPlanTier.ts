/**
 * Rentas plan tier: publish details.rentasTier → DB rentas_tier, and listing → display tier.
 * Kept in sync with previous inline logic in publicar / anuncio / lista.
 */

import { isProListing } from "../../../components/planHelpers";

/** Rentas-only plan tier for display (Privado Pro / Negocio Standard / Negocio Plus). */
export type RentasPlanTier = "privado_pro" | "business_standard" | "business_plus";

/**
 * Maps publish flow `details.rentasTier` to DB `listings.rentas_tier`.
 * Preserves insert semantics: only "business_plus" and "negocio" → "plus"; else "standard".
 */
export function mapRentasNegocioDetailsTierToDb(detailsRentasTier: string): "plus" | "standard" {
  const tier = detailsRentasTier.trim();
  return tier === "business_plus" || tier === "negocio" ? "plus" : "standard";
}

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

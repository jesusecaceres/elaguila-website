/**
 * Bienes Raíces monetization visibility read model — pure, read-only helper.
 * Resolves seller kind, ad plan, and potential placement signals from listing row data.
 * Does NOT fake highlighted/featured status without real active package/placement signals.
 */

import type { BrListingBadge } from "../cards/listingTypes";

export type BrMonetizationVisibilityState = {
  /** Seller kind derived from seller_type and branch facets. */
  sellerKind: "privado" | "negocio";
  /** Ad plan key derived from seller kind and category context. */
  adPlanKey: "paid_private" | "paid_business" | "unknown";
  /** Ad plan label for display (optional, not currently shown prominently on cards). */
  adPlanLabelEs: string;
  adPlanLabelEn: string;
  /** TRUE only when a real active featured/highlighted placement signal exists. */
  isFeatured: boolean;
  /** TRUE only when a real active promoted placement signal exists. */
  isPromoted: boolean;
  /** TRUE only when a real verified signal exists (deferred until field exists). */
  isVerified: boolean;
  /** Active placement signals for debugging/future ranking (deferred). */
  activePlacementSignals: string[];
  /** Badges to add based on monetization state (currently only negocio). */
  badgesToAdd: BrListingBadge[];
  /** Warnings when monetization data is missing or ambiguous. */
  warnings: string[];
};

/**
 * Resolve monetization visibility state from a Bienes listing row.
 * Currently derives seller kind and ad plan from seller_type/category.
 * Does NOT add destacada/promocionada badges without real active placement fields.
 *
 * Future: When package/featured/promoted fields are added to listings table,
 * this function can safely parse them and add badges only when active.
 */
export function resolveBrMonetizationVisibility(row: {
  seller_type?: string | null;
  detail_pairs?: unknown;
  listing_json?: unknown;
  contact_json?: unknown;
}): BrMonetizationVisibilityState {
  const warnings: string[] = [];
  const activePlacementSignals: string[] = [];
  const badgesToAdd: BrListingBadge[] = [];

  // Derive seller kind from seller_type (existing field)
  const isNegocio = row.seller_type === "business";
  const sellerKind: "privado" | "negocio" = isNegocio ? "negocio" : "privado";

  // Derive ad plan from seller kind (Bienes context)
  // Private/FSBO = paid private, Business/Agent = paid business
  const adPlanKey: "paid_private" | "paid_business" | "unknown" = isNegocio
    ? "paid_business"
    : "paid_private";

  const adPlanLabelEs = isNegocio ? "Negocio pagado" : "Privado pagado";
  const adPlanLabelEn = isNegocio ? "Paid business" : "Paid private";

  // Add negocio badge for business listings (existing behavior)
  if (isNegocio) {
    badgesToAdd.push("negocio");
  }

  // Listing rows do not denormalize package entitlements.
  // Public Destacada/Promocionada come from `/api/clasificados/bienes-raices/public/entitlement-overlay`
  // applied after browse fetch — do NOT fake badges here from account plan or missing columns.
  const isFeatured = false;
  const isPromoted = false;
  const isVerified = false;

  activePlacementSignals.push("entitlement:overlay_api");

  return {
    sellerKind,
    adPlanKey,
    adPlanLabelEs,
    adPlanLabelEn,
    isFeatured,
    isPromoted,
    isVerified,
    activePlacementSignals,
    badgesToAdd,
    warnings,
  };
}

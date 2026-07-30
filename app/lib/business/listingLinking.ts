import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveListingSourceOwnershipContract, resolveOwnedListingIdentityKeys } from "@/app/lib/listingPlans/listingEntitlementOwnership";
import { hasVerifiedLinkForListing } from "./repositories/listingLinksRepo";

export type ListingLinkVerification =
  | { ok: true }
  | { ok: false; reasonCode: "unsupported_listing_source" | "listing_ownership_unverified" | "listing_already_linked" };

/**
 * Safe listing-linking pre-check (Phase 11). Uses the canonical
 * LISTING_SOURCE_OWNERSHIP_CONTRACT exactly as-is — never duplicates owner-column knowledge.
 * Never mutates the listing row, never transfers ownership, never infers ownership from
 * display data. Fails closed for any source not in the contract.
 */
export async function verifyListingOwnershipForLinking(
  adminClient: SupabaseClient,
  params: { userId: string; listingSource: string; listingId: string },
): Promise<ListingLinkVerification> {
  const contract = resolveListingSourceOwnershipContract(params.listingSource);
  if (!contract) {
    return { ok: false, reasonCode: "unsupported_listing_source" };
  }

  const alreadyLinked = await hasVerifiedLinkForListing(adminClient, params.listingSource, params.listingId);
  if (alreadyLinked) {
    return { ok: false, reasonCode: "listing_already_linked" };
  }

  const owned = await resolveOwnedListingIdentityKeys(adminClient, params.listingSource, [params.listingId], params.userId);
  if (!owned.has(params.listingId)) {
    return { ok: false, reasonCode: "listing_ownership_unverified" };
  }

  return { ok: true };
}

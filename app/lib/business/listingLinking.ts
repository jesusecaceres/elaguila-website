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

const KNOWN_LISTING_SOURCES = ["listings", "restaurantes_public_listings", "servicios_public_listings", "autos_classifieds_listings"] as const;

export type OwnedListingCandidate = {
  listingSource: string;
  listingId: string;
};

/**
 * Automatic owned-listing discovery (Gate BCO-3R Phase 10) — replaces manual listing-source/ID
 * entry as the primary UX. Scans every source in LISTING_SOURCE_OWNERSHIP_CONTRACT for rows
 * owned by userId, reusing the exact same contract as verifyListingOwnershipForLinking (never a
 * second ownership map). Returns only listingSource/listingId — this repo's audited knowledge
 * of each category table's exact display columns (title, city, image) was not independently
 * re-verified for this gate, so no unverified display field is fabricated; the caller must not
 * present anything beyond source/id without first confirming a real column exists.
 */
export async function discoverOwnedListingCandidates(adminClient: SupabaseClient, userId: string): Promise<OwnedListingCandidate[]> {
  const candidates: OwnedListingCandidate[] = [];

  for (const source of KNOWN_LISTING_SOURCES) {
    const contract = resolveListingSourceOwnershipContract(source);
    if (!contract) continue;

    const { data, error } = await adminClient.from(source).select("id").eq(contract.ownerColumn, userId).limit(10);
    if (error || !data) continue;

    for (const row of data as { id: string }[]) {
      candidates.push({ listingSource: source, listingId: row.id });
    }
  }

  return candidates;
}

/**
 * Non-production-only synthetic owned-listing fixture (Gate BCO-3R QA — staging has none of the
 * category tables applied, so real candidates cannot exist there; see shouldApplyTestOverride's
 * doc comment for the identical safety gate). Never used in production, never client-triggered.
 */
export function buildTestOverrideOwnedListingCandidate(): OwnedListingCandidate {
  return { listingSource: "listings", listingId: "00000000-0000-4000-f000-000000000000" };
}

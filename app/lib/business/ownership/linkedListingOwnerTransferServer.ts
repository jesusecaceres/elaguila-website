import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { AssistedListingSource } from "@/app/lib/business/assistedListingCustody";
import {
  isAssistedListingSource,
  planLinkedListingOwnerTransfer,
  type LinkedListingOwnerSnapshot,
  type ListingOwnerTransferPlan,
} from "./linkedListingOwnerTransfer";

type LinkRow = {
  listing_source: string;
  listing_id: string;
};

async function readCurrentOwner(
  supabase: ReturnType<typeof getAdminSupabase>,
  listingSource: AssistedListingSource,
  listingId: string,
): Promise<string | null | undefined> {
  const column = listingSource === "listings" ? "owner_id" : "owner_user_id";
  const { data, error } = await supabase.from(listingSource).select(column).eq("id", listingId).maybeSingle();
  if (error || !data) return undefined;
  const raw = (data as Record<string, unknown>)[column];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * After `accept_business_ownership_claim` succeeds, transfer every verified linked listing
 * that is still owner-null to the claiming customer. Same row/ID. Idempotent. Never copies.
 * Service-role is required because owner-null RLS cannot self-update.
 */
export async function transferLinkedListingsOnAcceptedClaim(input: {
  businessId: string;
  claimerUserId: string;
}): Promise<ListingOwnerTransferPlan & { recorded: boolean }> {
  const emptySkip = planLinkedListingOwnerTransfer({
    claimerUserId: input.claimerUserId,
    listings: [],
  });
  if (!emptySkip.ok) return { ...emptySkip, recorded: false };
  if (!isSupabaseAdminConfigured()) return { ...emptySkip, recorded: false };

  const supabase = getAdminSupabase();
  const { data: links, error } = await supabase
    .from("business_listing_links")
    .select("listing_source, listing_id")
    .eq("business_id", input.businessId)
    .eq("status", "verified");
  if (error || !links) return { ...emptySkip, recorded: false };

  const snapshots: LinkedListingOwnerSnapshot[] = [];
  for (const link of links as LinkRow[]) {
    if (!isAssistedListingSource(link.listing_source)) continue;
    const listingId = String(link.listing_id ?? "").trim();
    if (!listingId) continue;
    const currentOwner = await readCurrentOwner(supabase, link.listing_source, listingId);
    if (currentOwner === undefined) {
      snapshots.push({ listingSource: link.listing_source, listingId, currentOwner: null });
      continue;
    }
    snapshots.push({ listingSource: link.listing_source, listingId, currentOwner });
  }

  const plan = planLinkedListingOwnerTransfer({
    claimerUserId: input.claimerUserId,
    listings: snapshots,
  });
  if (!plan.ok) return { ...plan, recorded: false };

  for (const update of plan.updates) {
    const { error: writeError } = await supabase
      .from(update.listingSource)
      .update({ [update.ownerColumn]: update.nextOwner })
      .eq("id", update.listingId)
      .is(update.ownerColumn, null);
    if (writeError) {
      return { ...plan, recorded: false };
    }
  }

  return { ...plan, recorded: true };
}

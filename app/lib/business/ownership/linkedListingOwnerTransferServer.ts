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

type OwnerRead =
  | { ok: true; owner: string | null }
  | { ok: false; reason: "read_error" | "missing_listing" };

export type ListingOwnerTransferServerResult =
  | (Extract<ListingOwnerTransferPlan, { ok: true }> & { recorded: true })
  | (Extract<ListingOwnerTransferPlan, { ok: true }> & {
      recorded: false;
      error: "listing_update_failed" | "zero_affected_rows" | "partial_transfer";
    })
  | { ok: false; recorded: false; error: "missing_claimer" | "listing_read_failed" | "admin_unavailable"; listingIds: string[] };

async function readCurrentOwner(
  supabase: ReturnType<typeof getAdminSupabase>,
  listingSource: AssistedListingSource,
  listingId: string,
): Promise<OwnerRead> {
  const column = listingSource === "listings" ? "owner_id" : "owner_user_id";
  const { data, error } = await supabase.from(listingSource).select(column).eq("id", listingId).maybeSingle();
  if (error) return { ok: false, reason: "read_error" };
  if (!data) return { ok: false, reason: "missing_listing" };
  const raw = (data as Record<string, unknown>)[column];
  return { ok: true, owner: typeof raw === "string" && raw.trim() ? raw.trim() : null };
}

/**
 * After `accept_business_ownership_claim` succeeds, transfer every verified linked listing
 * that is still owner-null to the claiming customer. Same row/ID. Idempotent. Never copies.
 * Service-role is required because owner-null RLS cannot self-update.
 *
 * Runtime is non-atomic across tables. The additive SQL
 * `20260922180000_accept_claim_transfer_linked_listing_owners.sql` performs the same transfer
 * inside the claim RPC transaction, but that migration is unapplied. A later write failure is
 * reported as failure (`recorded: false`); it is never reported as a complete release.
 */
export async function transferLinkedListingsOnAcceptedClaim(input: {
  businessId: string;
  claimerUserId: string;
}): Promise<ListingOwnerTransferServerResult> {
  const emptySkip = planLinkedListingOwnerTransfer({
    claimerUserId: input.claimerUserId,
    listings: [],
  });
  if (!emptySkip.ok) return { ok: false, recorded: false, error: emptySkip.error, listingIds: [] };
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, recorded: false, error: "admin_unavailable", listingIds: [] };
  }

  const supabase = getAdminSupabase();
  const { data: links, error } = await supabase
    .from("business_listing_links")
    .select("listing_source, listing_id")
    .eq("business_id", input.businessId)
    .eq("status", "verified");
  if (error) {
    return { ok: false, recorded: false, error: "listing_read_failed", listingIds: [] };
  }

  const snapshots: LinkedListingOwnerSnapshot[] = [];
  for (const link of (links ?? []) as LinkRow[]) {
    if (!isAssistedListingSource(link.listing_source)) continue;
    const listingId = String(link.listing_id ?? "").trim();
    if (!listingId) continue;
    const current = await readCurrentOwner(supabase, link.listing_source, listingId);
    if (!current.ok && current.reason === "read_error") {
      return { ok: false, recorded: false, error: "listing_read_failed", listingIds: snapshots.map((s) => s.listingId) };
    }
    if (!current.ok) {
      snapshots.push({
        listingSource: link.listing_source,
        listingId,
        currentOwner: null,
        readStatus: "missing_listing",
      });
      continue;
    }
    snapshots.push({
      listingSource: link.listing_source,
      listingId,
      currentOwner: current.owner,
      readStatus: "ok",
    });
  }

  const plan = planLinkedListingOwnerTransfer({
    claimerUserId: input.claimerUserId,
    listings: snapshots,
  });
  if (!plan.ok) return { ok: false, recorded: false, error: plan.error, listingIds: [] };

  const applied: string[] = [];
  for (const update of plan.updates) {
    const { data, error: writeError } = await supabase
      .from(update.listingSource)
      .update({ [update.ownerColumn]: update.nextOwner })
      .eq("id", update.listingId)
      .is(update.ownerColumn, null)
      .select("id");
    if (writeError) {
      return {
        ...plan,
        recorded: false,
        error: applied.length ? "partial_transfer" : "listing_update_failed",
      };
    }
    const affected = Array.isArray(data) ? data.length : 0;
    if (affected < 1) {
      return {
        ...plan,
        recorded: false,
        error: applied.length ? "partial_transfer" : "zero_affected_rows",
      };
    }
    applied.push(update.listingId);
  }

  return { ...plan, recorded: true };
}

/**
 * Same-row listing owner transfer after an accepted business ownership claim.
 * Pure planner: owner-null organizational rows become the claimer's; already-claimer is
 * idempotent; a foreign owner is never stolen; listings are never copied.
 */

import type { AssistedListingSource } from "@/app/lib/business/assistedListingCustody";

export const LISTING_OWNER_COLUMN: Record<AssistedListingSource, "owner_user_id" | "owner_id"> = {
  servicios_public_listings: "owner_user_id",
  restaurantes_public_listings: "owner_user_id",
  autos_classifieds_listings: "owner_user_id",
  listings: "owner_id",
  empleos_public_listings: "owner_user_id",
  comida_local_public_listings: "owner_user_id",
};

export const STAFF_CLAIM_LISTING_SOURCES = Object.keys(LISTING_OWNER_COLUMN) as AssistedListingSource[];

export type LinkedListingOwnerSnapshot = {
  listingSource: AssistedListingSource;
  listingId: string;
  currentOwner: string | null;
  /** Read failure never becomes owner-null. Missing rows are skipped, not transferred. */
  readStatus?: "ok" | "missing_listing";
};

export type PlannedListingOwnerUpdate = {
  listingSource: AssistedListingSource;
  listingId: string;
  ownerColumn: "owner_user_id" | "owner_id";
  nextOwner: string;
};

export type SkippedListingOwnerTransfer = {
  listingSource: AssistedListingSource;
  listingId: string;
  reason: "already_claimer" | "foreign_owner" | "missing_listing";
};

export type ListingOwnerTransferPlan =
  | {
      ok: true;
      listingIds: string[];
      updates: PlannedListingOwnerUpdate[];
      skipped: SkippedListingOwnerTransfer[];
    }
  | { ok: false; error: "missing_claimer" };

export function isAssistedListingSource(value: string): value is AssistedListingSource {
  return value in LISTING_OWNER_COLUMN;
}

export function planLinkedListingOwnerTransfer(input: {
  claimerUserId: string;
  listings: readonly LinkedListingOwnerSnapshot[];
}): ListingOwnerTransferPlan {
  const claimer = input.claimerUserId.trim();
  if (!claimer) return { ok: false, error: "missing_claimer" };

  const updates: PlannedListingOwnerUpdate[] = [];
  const skipped: SkippedListingOwnerTransfer[] = [];
  const listingIds: string[] = [];

  for (const row of input.listings) {
    const listingId = row.listingId.trim();
    if (!listingId || !isAssistedListingSource(row.listingSource)) continue;
    listingIds.push(listingId);
    if (row.readStatus === "missing_listing") {
      skipped.push({ listingSource: row.listingSource, listingId, reason: "missing_listing" });
      continue;
    }
    const current = (row.currentOwner ?? "").trim() || null;
    if (!current) {
      updates.push({
        listingSource: row.listingSource,
        listingId,
        ownerColumn: LISTING_OWNER_COLUMN[row.listingSource],
        nextOwner: claimer,
      });
      continue;
    }
    if (current === claimer) {
      skipped.push({ listingSource: row.listingSource, listingId, reason: "already_claimer" });
      continue;
    }
    skipped.push({ listingSource: row.listingSource, listingId, reason: "foreign_owner" });
  }

  return { ok: true, listingIds, updates, skipped };
}

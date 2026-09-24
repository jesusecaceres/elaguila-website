import "server-only";

/**
 * ASSISTED REOPEN (Autos) — prove custody of an EXISTING Autos row before a staff session writes it.
 *
 * Composed entirely from existing primitives (no second custody system):
 *  - `isListingLinkedToBusiness` (business_listing_links, status verified) for the signed context's business;
 *  - `getAutosClassifiedsListingById` for the stored row (lane / role / owner);
 *  - `resolveAssistedAutosWriteOwner` (pure) to pick the owner scope from the STORED row.
 *
 * Never trusts a browser-supplied id on its own: callers pass the id they already bound through
 * `resolveAssistedRowBinding` / the signed context, and this re-proves the ledger at every write.
 */
import { isListingLinkedToBusiness } from "@/app/lib/business/assistedListingCustody";
import { getAutosClassifiedsListingById } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsListingRow } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { resolveAssistedAutosWriteOwner } from "@/app/lib/sales/assistedAutosRowOwner";
import { isClientAuthorizedForBusiness } from "@/app/lib/sales/assistedClientAuthorization";

export type AssistedAutosRowProof =
  | { ok: true; row: AutosClassifiedsListingRow; ownerUserId: string | null }
  | { ok: false; status: 403 | 404 | 409; error: string };

async function resolveOwner(
  row: AutosClassifiedsListingRow,
  businessId: string,
  clientUserId: string | null,
): Promise<AssistedAutosRowProof> {
  const owner = resolveAssistedAutosWriteOwner({
    rowOwnerUserId: row.owner_user_id,
    requestClientUserId: clientUserId,
  });
  if (!owner.ok) return { ok: false, status: owner.status, error: owner.error };
  if (owner.ownerUserId && !clientUserId) {
    // No client was named on this request: the stored owner must still be a member of THIS business.
    const authorized = await isClientAuthorizedForBusiness({ businessId, clientUserId: owner.ownerUserId });
    if (!authorized) return { ok: false, status: 403, error: "client_not_authorized_for_business" };
  }
  return { ok: true, row, ownerUserId: owner.ownerUserId };
}

/** Custody + lane + owner scope for the row an assisted save/reopen is about to write. */
export async function proveAssistedAutosRowForWrite(input: {
  businessId: string;
  listingId: string;
  clientUserId: string | null;
  expectedLane: "privado" | "negocios";
}): Promise<AssistedAutosRowProof> {
  const linked = await isListingLinkedToBusiness({
    businessId: input.businessId,
    listingSource: "autos_classifieds_listings",
    listingId: input.listingId,
  });
  if (!linked) return { ok: false, status: 403, error: "listing_not_linked_to_business" };
  const row = await getAutosClassifiedsListingById(input.listingId);
  if (!row) return { ok: false, status: 404, error: "listing_not_found" };
  if (row.lane !== input.expectedLane) return { ok: false, status: 409, error: "assisted_listing_lane_mismatch" };
  if (input.expectedLane === "negocios" && row.inventory_role === "inventory_vehicle") {
    return { ok: false, status: 409, error: "assisted_listing_lane_mismatch" };
  }
  return resolveOwner(row, input.businessId, input.clientUserId);
}

/**
 * Owner scope for the ONE vehicle child of a custody-proven dealer parent. The child is structural
 * (its parent column names the proven parent), so no second ledger lookup is needed — only the
 * parent/child link and the same stored-owner rule.
 */
export async function resolveAssistedDealerChildWriteOwner(input: {
  businessId: string;
  parentListingId: string;
  childListingId: string;
  clientUserId: string | null;
}): Promise<AssistedAutosRowProof> {
  const row = await getAutosClassifiedsListingById(input.childListingId);
  if (!row) return { ok: false, status: 404, error: "listing_not_found" };
  if (
    row.lane !== "negocios" ||
    row.inventory_role !== "inventory_vehicle" ||
    row.dealer_inventory_parent_listing_id !== input.parentListingId
  ) {
    return { ok: false, status: 409, error: "assisted_listing_lane_mismatch" };
  }
  return resolveOwner(row, input.businessId, input.clientUserId);
}

/**
 * Saved Search 04/05 — shared, neutral support for `certifyAutosPublicEligibleListing`. Exists
 * only so the match orchestrator and the email delivery engine can both build the same parent map
 * without importing each other (which would create an orchestrator <-> delivery circular
 * dependency). This file imports neither the orchestrator nor the delivery engine, and must never
 * be made to — it sits below both in the dependency graph, not beside either of them.
 */
import "server-only";
import { getAutosClassifiedsListingById } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosPublicParentCandidate } from "@/app/lib/clasificados/autos/autosPublicChildParentVisibility";

/** Builds the minimal parent map `certifyAutosPublicEligibleListing` needs — only fetches the ONE
 * specific parent row for a dealer-inventory child; non-child rows need no parent lookup at all.
 * Reuses the existing single-row loader, no new query shape invented. */
export async function loadParentsById(row: {
  inventory_role?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
}): Promise<ReadonlyMap<string, AutosPublicParentCandidate>> {
  if (row.inventory_role !== "inventory_vehicle") return new Map();
  const parentId = (row.dealer_inventory_parent_listing_id ?? "").trim();
  if (!parentId) return new Map();
  const parent = await getAutosClassifiedsListingById(parentId);
  if (!parent) return new Map();
  return new Map([
    [
      parent.id,
      {
        id: parent.id,
        lane: parent.lane,
        inventory_role: parent.inventory_role ?? null,
        owner_user_id: parent.owner_user_id,
        status: parent.status,
      },
    ],
  ]);
}

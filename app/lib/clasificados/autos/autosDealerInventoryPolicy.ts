import type { AutosClassifiedsListingRow, AutosDealerInventoryRole } from "./autosClassifiedsTypes";
import {
  AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";

export const STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10;

export const BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT = AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT;

export type AutosDealerInventoryCount = {
  activeCount: number;
  limit: number;
  remainingSlots: number;
  canAddActiveVehicle: boolean;
};

export function getDealerInventoryGroupId(row: Pick<AutosClassifiedsListingRow, "dealer_inventory_group_id">): string | null {
  const groupId = row.dealer_inventory_group_id?.trim();
  return groupId || null;
}

export function getDealerInventoryParentListingId(
  row: Pick<AutosClassifiedsListingRow, "dealer_inventory_parent_listing_id">,
): string | null {
  const parentId = row.dealer_inventory_parent_listing_id?.trim();
  return parentId || null;
}

export function getInventoryRole(row: Pick<AutosClassifiedsListingRow, "inventory_role">): AutosDealerInventoryRole | null {
  return row.inventory_role === "main" || row.inventory_role === "inventory_vehicle" ? row.inventory_role : null;
}

export function isDealerInventoryMainListing(row: Pick<AutosClassifiedsListingRow, "lane" | "inventory_role">): boolean {
  return row.lane === "negocios" && getInventoryRole(row) === "main";
}

export function isDealerInventoryVehicle(row: Pick<AutosClassifiedsListingRow, "lane" | "inventory_role">): boolean {
  return row.lane === "negocios" && getInventoryRole(row) === "inventory_vehicle";
}

/**
 * Gate 6C.2 — corrected to resolve to the SAME key for a dealer parent and its own children.
 * Previously a parent (no explicit `dealer_inventory_group_id`) fell back to an owner-wide
 * `owner:{owner_user_id}` key, while its children (which DO get an explicit
 * `dealer_inventory_group_id` set to the parent's own id at creation — see
 * `autosNegociosBundlePublish.ts`) resolved to that parent id instead — two different keys that
 * could never match each other. Mirrors the RPC's own group-key derivation
 * (`coalesce(dealer_inventory_group_id, id)` on the PARENT row) rather than inventing a second
 * grouping architecture: an explicit group id always wins; a vehicle child with no group id falls
 * back to its own `dealer_inventory_parent_listing_id`; anything else (the parent itself, or a
 * malformed/legacy row) falls back to its own id.
 */
export function resolveDealerInventoryGroupingKey(
  row: Pick<
    AutosClassifiedsListingRow,
    "lane" | "id" | "inventory_role" | "dealer_inventory_group_id" | "dealer_inventory_parent_listing_id"
  >,
): string | null {
  if (row.lane !== "negocios") return null;
  const explicitGroupId = getDealerInventoryGroupId(row);
  if (explicitGroupId) return explicitGroupId;
  if (getInventoryRole(row) === "inventory_vehicle") {
    const parentId = getDealerInventoryParentListingId(row);
    if (parentId) return parentId;
  }
  return row.id;
}

/** Gate 6C.2 — the dealer parent (`inventory_role='main'`) is commercial/grouping anchor, never
 * a vehicle; only `inventory_role='inventory_vehicle'` rows may consume a capacity slot. */
export function countActiveDealerVehicles(
  rows: readonly Pick<AutosClassifiedsListingRow, "lane" | "status" | "id" | "inventory_role">[],
  excludeListingId?: string,
): number {
  const exclude = excludeListingId?.trim();
  return rows.filter(
    (row) =>
      row.lane === "negocios" &&
      row.status === "active" &&
      getInventoryRole(row) === "inventory_vehicle" &&
      (!exclude || row.id !== exclude),
  ).length;
}

export function countActiveDealerInventoryVehicles(
  rows: readonly Pick<
    AutosClassifiedsListingRow,
    "lane" | "status" | "id" | "inventory_role" | "dealer_inventory_group_id" | "dealer_inventory_parent_listing_id" | "owner_user_id"
  >[],
  opts?: { groupingKey?: string | null; excludeListingId?: string | null },
): number {
  const exclude = opts?.excludeListingId?.trim();
  const groupingKey = opts?.groupingKey?.trim() || null;
  return rows.filter((row) => {
    if (row.lane !== "negocios" || row.status !== "active") return false;
    if (getInventoryRole(row) !== "inventory_vehicle") return false;
    if (exclude && row.id === exclude) return false;
    if (!groupingKey) return true;
    return resolveDealerInventoryGroupingKey(row) === groupingKey;
  }).length;
}

export function dealerInventoryRemainingSlots(activeCount: number, limit = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT): number {
  return Math.max(0, limit - Math.max(0, activeCount));
}

export function dealerCanAddActiveVehicle(activeCount: number, limit = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT): boolean {
  return activeCount < limit;
}

export function summarizeDealerInventory(activeCount: number, limit = STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT): AutosDealerInventoryCount {
  const remainingSlots = dealerInventoryRemainingSlots(activeCount, limit);
  return {
    activeCount,
    limit,
    remainingSlots,
    canAddActiveVehicle: dealerCanAddActiveVehicle(activeCount, limit),
  };
}

/** Active limit when dealer inventory pack entitlement is paid (not draft/local flags). */
export function resolveDealerActiveVehicleLimit(entitlementActive?: boolean): number {
  if (entitlementActive === true) return BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT;
  return STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT;
}

export function isAutosDealerInventoryPackActive(input: {
  entitlementActive?: boolean;
}): boolean {
  return input.entitlementActive === true;
}

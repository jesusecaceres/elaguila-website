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

export function resolveDealerInventoryGroupingKey(
  row: Pick<AutosClassifiedsListingRow, "lane" | "dealer_inventory_group_id" | "owner_user_id">,
): string | null {
  if (row.lane !== "negocios") return null;
  return getDealerInventoryGroupId(row) ?? `owner:${row.owner_user_id}`;
}

export function countActiveDealerVehicles(rows: readonly Pick<AutosClassifiedsListingRow, "lane" | "status" | "id">[], excludeListingId?: string): number {
  const exclude = excludeListingId?.trim();
  return rows.filter((row) => row.lane === "negocios" && row.status === "active" && (!exclude || row.id !== exclude)).length;
}

export function countActiveDealerInventoryVehicles(
  rows: readonly Pick<AutosClassifiedsListingRow, "lane" | "status" | "id" | "dealer_inventory_group_id" | "owner_user_id">[],
  opts?: { groupingKey?: string | null; excludeListingId?: string | null },
): number {
  const exclude = opts?.excludeListingId?.trim();
  const groupingKey = opts?.groupingKey?.trim() || null;
  return rows.filter((row) => {
    if (row.lane !== "negocios" || row.status !== "active") return false;
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

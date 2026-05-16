import type { AutosClassifiedsListingRow } from "./autosClassifiedsTypes";

export const STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10;

export type AutosDealerInventoryCount = {
  activeCount: number;
  limit: number;
  remainingSlots: number;
  canAddActiveVehicle: boolean;
};

export function countActiveDealerVehicles(rows: readonly Pick<AutosClassifiedsListingRow, "lane" | "status" | "id">[], excludeListingId?: string): number {
  const exclude = excludeListingId?.trim();
  return rows.filter((row) => row.lane === "negocios" && row.status === "active" && (!exclude || row.id !== exclude)).length;
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

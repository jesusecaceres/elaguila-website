import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";

/** @deprecated BR13B uses locked product limits below — kept for BR13A audit compatibility. */
export const BR_NEGOCIO_RECOMMENDED_ACTIVE_PROPERTY_LIMIT = 5;

export const BASE_BR_NEGOCIO_MONTHLY_PRICE = 399;
export const BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES = 3;
export const BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE = 99.99;
export const BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT = 5;
export const BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT = 8;
/** Base + upgrade monthly total (BR13D locked product). */
export const BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE = 498.99;

/** Approximate active-property value framing (single upgrade package only). */
export const BR_PROPERTY_INVENTORY_BASE_AVG_PER_PROPERTY = Math.round((BASE_BR_NEGOCIO_MONTHLY_PRICE / BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES) * 100) / 100;
export const BR_PROPERTY_INVENTORY_UPGRADE_AVG_PER_PROPERTY =
  Math.round((BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE / BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT) * 100) / 100;

export type BrPropertyInventoryLang = "es" | "en";
export type BrPropertyInventoryRole = "main" | "inventory_property";

export type BrPropertyInventoryRowLike = {
  id: string;
  leonix_ad_id?: string | null;
  owner_id?: string | null;
  category?: string | null;
  seller_type?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  detail_pairs?: unknown;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
};

export type BrPropertyInventoryCountSnapshot = {
  groupingKey: string | null;
  activeCount: number;
  baseUsed: number;
  baseLimit: number;
  additionalUsed: number;
  additionalLimit: number;
  totalLimit: number;
  upgradeActive: boolean;
  canAddProperty: boolean;
  atBaseLimit: boolean;
  atTotalLimit: boolean;
};

function trim(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

/**
 * BR property inventory add-on (+5 @ $99.99/mo → 8 total).
 * Production truth: active entitlement only (C6 Stripe). Until then, dev/QA flags are non-production.
 */
export function isBrInventoryUpgradeActive(opts?: { entitlementActive?: boolean }): boolean {
  if (opts?.entitlementActive === true) return true;
  if (process.env.NODE_ENV === "production") return false;
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem("LEONIX_BR_INVENTORY_UPGRADE") === "1") return true;
    } catch {
      /* ignore */
    }
  }
  return process.env.NEXT_PUBLIC_LEONIX_BR_INVENTORY_UPGRADE === "1";
}

export function getBrInventoryGroupId(row: Pick<BrPropertyInventoryRowLike, "br_inventory_group_id">): string | null {
  const id = trim(row.br_inventory_group_id);
  return id || null;
}

export function getBrInventoryParentListingId(
  row: Pick<BrPropertyInventoryRowLike, "br_inventory_parent_listing_id">,
): string | null {
  const id = trim(row.br_inventory_parent_listing_id);
  return id || null;
}

export function getBrInventoryRole(row: Pick<BrPropertyInventoryRowLike, "inventory_role">): BrPropertyInventoryRole | null {
  return row.inventory_role === "main" || row.inventory_role === "inventory_property" ? row.inventory_role : null;
}

export function isBrNegocioListing(row: Pick<BrPropertyInventoryRowLike, "category" | "seller_type" | "detail_pairs">): boolean {
  if (trim(row.category).toLowerCase() !== "bienes-raices") return false;
  const contract = parseLeonixListingContract(row.detail_pairs);
  return row.seller_type === "business" || contract.branch === "bienes_raices_negocio";
}

export function isBrInventoryMainListing(row: BrPropertyInventoryRowLike): boolean {
  return isBrNegocioListing(row) && getBrInventoryRole(row) === "main";
}

export function isBrInventoryProperty(row: BrPropertyInventoryRowLike): boolean {
  return isBrNegocioListing(row) && getBrInventoryRole(row) === "inventory_property";
}

export function resolveBrInventoryGroupingKey(row: BrPropertyInventoryRowLike): string | null {
  if (!isBrNegocioListing(row)) return null;
  const groupId = getBrInventoryGroupId(row);
  if (groupId) return groupId;
  const ownerId = trim(row.owner_id);
  return ownerId ? `owner:${ownerId}` : null;
}

export function isActiveBrNegocioInventoryRow(row: BrPropertyInventoryRowLike): boolean {
  if (!isBrNegocioListing(row)) return false;
  if (row.status !== "active") return false;
  if (row.is_published === false) return false;
  return true;
}

export function countActiveBrInventoryListings(
  rows: readonly BrPropertyInventoryRowLike[],
  opts?: { groupingKey?: string | null; excludeListingId?: string | null },
): number {
  const groupingKey = trim(opts?.groupingKey) || null;
  const exclude = trim(opts?.excludeListingId);
  return rows.filter((row) => {
    if (!isActiveBrNegocioInventoryRow(row)) return false;
    if (exclude && row.id === exclude) return false;
    if (!groupingKey) return true;
    return resolveBrInventoryGroupingKey(row) === groupingKey;
  }).length;
}

export function brNegocioActivePropertyLimit(upgradeActive: boolean): number {
  return upgradeActive
    ? BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT
    : BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES;
}

export function computeBrPropertyInventoryCounts(
  rows: readonly BrPropertyInventoryRowLike[],
  opts: { groupingKey: string | null; upgradeActive?: boolean; excludeListingId?: string | null },
): BrPropertyInventoryCountSnapshot {
  const upgradeActive = opts.upgradeActive ?? isBrInventoryUpgradeActive();
  const activeCount = countActiveBrInventoryListings(rows, {
    groupingKey: opts.groupingKey,
    excludeListingId: opts.excludeListingId,
  });
  const baseUsed = Math.min(activeCount, BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES);
  const additionalUsed = upgradeActive
    ? Math.min(
        Math.max(0, activeCount - BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES),
        BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT,
      )
    : 0;
  const totalLimit = brNegocioActivePropertyLimit(upgradeActive);
  return {
    groupingKey: opts.groupingKey,
    activeCount,
    baseUsed,
    baseLimit: BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES,
    additionalUsed,
    additionalLimit: BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT,
    totalLimit,
    upgradeActive,
    canAddProperty: activeCount < totalLimit,
    atBaseLimit: !upgradeActive && activeCount >= BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES,
    atTotalLimit: upgradeActive && activeCount >= BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT,
  };
}

export type BrNegocioPublishInventoryContext =
  | { mode: "main" }
  | {
      mode: "add";
      parentListingId: string;
      brInventoryGroupId: string;
    };

export function inventoryMetadataForBrNegocioPublish(
  ctx: BrNegocioPublishInventoryContext | null | undefined,
): {
  brInventoryGroupId?: string;
  brInventoryParentListingId?: string;
  brInventoryRole?: BrPropertyInventoryRole;
} {
  if (!ctx) return {};
  if (ctx.mode === "add") {
    return {
      brInventoryGroupId: ctx.brInventoryGroupId,
      brInventoryParentListingId: ctx.parentListingId,
      brInventoryRole: "inventory_property",
    };
  }
  return { brInventoryRole: "main" };
}

/** After main listing insert, group id defaults to listing id when column exists. */
export function mainListingInventoryPatchAfterInsert(listingId: string): Record<string, unknown> {
  return {
    br_inventory_group_id: listingId,
    inventory_role: "main",
  };
}

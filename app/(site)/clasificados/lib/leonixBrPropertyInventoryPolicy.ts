import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";

export const BR_NEGOCIO_RECOMMENDED_ACTIVE_PROPERTY_LIMIT = 5;

export type BrPropertyInventoryRole = "main" | "inventory_property";

export type BrPropertyInventoryRowLike = {
  id: string;
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

function trim(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
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

export function countActiveBrInventoryListings(
  rows: readonly BrPropertyInventoryRowLike[],
  opts?: { groupingKey?: string | null; excludeListingId?: string | null },
): number {
  const groupingKey = trim(opts?.groupingKey) || null;
  const exclude = trim(opts?.excludeListingId);
  return rows.filter((row) => {
    if (!isBrNegocioListing(row)) return false;
    if (row.status !== "active" || row.is_published === false) return false;
    if (exclude && row.id === exclude) return false;
    if (!groupingKey) return true;
    return resolveBrInventoryGroupingKey(row) === groupingKey;
  }).length;
}

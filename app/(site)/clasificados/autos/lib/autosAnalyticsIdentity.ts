export type AutosAnalyticsTrackMeta = {
  sourceId?: string | null;
  leonixAdId?: string | null;
  lane?: string;
  source?: string;
  [key: string]: unknown;
};

/** Public detail/contact surfaces (AUTO1 + A5.ANALYTICS-01 parent/child metadata). */
export type AutosPublicListingAnalyticsProps = {
  listingSourceId?: string;
  leonixAdId?: string | null;
  lane?: string;
  inventoryRole?: "main" | "inventory_vehicle" | null;
  dealerInventoryGroupId?: string | null;
  dealerInventoryParentListingId?: string | null;
};

export function autosSheetCtaAnalyticsProps(props?: AutosPublicListingAnalyticsProps) {
  const id = props?.listingSourceId?.trim();
  if (!id) return {};
  return {
    listingSourceId: id,
    leonixAdId: props?.leonixAdId,
    lane: props?.lane,
    inventoryRole: props?.inventoryRole,
    dealerInventoryGroupId: props?.dealerInventoryGroupId,
    dealerInventoryParentListingId: props?.dealerInventoryParentListingId,
  };
}

export function autosAnalyticsTrackMeta(args: {
  sourceId: string;
  leonixAdId?: string | null;
  lane?: string;
  source: string;
  inventoryRole?: "main" | "inventory_vehicle" | null;
  dealerInventoryGroupId?: string | null;
  dealerInventoryParentListingId?: string | null;
  extra?: Record<string, unknown>;
}): AutosAnalyticsTrackMeta {
  return {
    sourceId: args.sourceId.trim(),
    leonixAdId: args.leonixAdId?.trim() || undefined,
    lane: args.lane,
    source: args.source,
    inventoryRole: args.inventoryRole,
    dealerInventoryGroupId: args.dealerInventoryGroupId?.trim() || undefined,
    dealerInventoryParentListingId: args.dealerInventoryParentListingId?.trim() || undefined,
    ...(args.extra ?? {}),
  };
}

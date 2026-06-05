import type {
  AnalyticsCapabilityHint,
  CategoryListingMonetizationInput,
} from "@/app/lib/listingPlans/categoryListingMonetization";

export type AdminListingMonetizationHints = {
  analyticsCapability?: AnalyticsCapabilityHint | null;
  dualAnalyticsPipeline?: boolean | null;
  legacyMockAdminSource?: boolean | null;
};

function readString(row: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function inferAnalyticsCapability(
  sourceTable: string,
  row: Record<string, unknown>,
  hints?: AdminListingMonetizationHints | null,
): AnalyticsCapabilityHint | null {
  if (hints?.analyticsCapability) return hints.analyticsCapability;
  const st = sourceTable.toLowerCase();
  if (st.includes("empleos_public")) {
    if (row.apply_count != null || row.view_count != null) return "partial";
    return "unknown";
  }
  if (st.includes("servicios_public")) return "partial";
  if (st.includes("autos_classifieds")) return "partial";
  if (st.includes("restaurantes_public")) return "partial";
  if (st.includes("viajes_staged")) return "partial";
  if (st === "listings" || st.includes("public.listings")) return "partial";
  return null;
}

function inferDualAnalytics(sourceTable: string, hints?: AdminListingMonetizationHints | null): boolean {
  if (hints?.dualAnalyticsPipeline != null) return Boolean(hints.dualAnalyticsPipeline);
  const st = sourceTable.toLowerCase();
  return st.includes("servicios_public") || st.includes("autos_classifieds");
}

/**
 * Map an admin queue row (already loaded) into GA2 resolver input.
 * No Supabase calls — row data only.
 */
export function buildAdminListingMonetizationInput(args: {
  category?: string | null;
  sourceTable: string;
  row: Record<string, unknown>;
  detailPairs?: unknown;
  hints?: AdminListingMonetizationHints | null;
}): CategoryListingMonetizationInput {
  const row = args.row;
  const sourceTable = args.sourceTable.trim() || "unknown";
  const category =
    args.category ??
    readString(row, ["category", "category_slug", "listing_category"]) ??
    null;

  const sourceId = readString(row, ["id", "source_id", "sourceId"]);
  const ownerUserId = readString(row, ["owner_user_id", "owner_id", "ownerId"]);
  const lifecycleStatus = readString(row, ["lifecycle_status", "lifecycleStatus"]);
  const listingStatus = readString(row, ["listing_status", "listingStatus"]);
  const status = readString(row, ["status"]) ?? lifecycleStatus ?? listingStatus;

  return {
    category,
    categorySlug: category,
    sourceTable,
    source: sourceTable,
    sourceId,
    internalId: sourceId,
    leonixAdId: readString(row, ["leonix_ad_id", "leonixAdId"]),
    slug: readString(row, ["slug", "listing_slug"]),
    ownerId: ownerUserId,
    ownerUserId,
    status,
    lifecycleStatus,
    listing: row,
    detailPairs: args.detailPairs ?? row.detail_pairs ?? row.detailPairs,
    packageTier: readString(row, ["package_tier", "packageTier"]),
    planKind: readString(row, ["plan", "listing_plan", "ad_plan"]),
    republishedAt: readString(row, ["republished_at", "republishedAt"]),
    republishSortAt: readString(row, ["republish_sort_at", "republishSortAt"]),
    expiresAt: readString(row, ["expires_at", "expiresAt"]),
    createdAt: readString(row, ["created_at", "createdAt"]),
    updatedAt: readString(row, ["updated_at", "updatedAt"]),
    publishedAt: readString(row, ["published_at", "publishedAt"]),
    promotedUntil: readString(row, ["promoted_until", "promotedUntil"]),
    featuredUntil: readString(row, ["featured_until", "featuredUntil"]),
    boostExpiresAt: readString(row, ["boost_expires", "boostExpiresAt"]),
    analyticsCapability: inferAnalyticsCapability(sourceTable, row, args.hints),
    dualAnalyticsPipeline: inferDualAnalytics(sourceTable, args.hints),
    legacyMockAdminSource: args.hints?.legacyMockAdminSource ?? false,
  };
}

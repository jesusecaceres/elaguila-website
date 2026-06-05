/**
 * Server-side owner engagement rollups — merges `listing_analytics` with authoritative
 * `user_liked_listings` / `saved_listings` row counts (same source as public Servicios cards).
 */
import {
  fetchServiciosUserLikedCountsByKeys,
  fetchServiciosUserSavedCountsByKeys,
} from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import {
  serviciosLikeCountAliasKeys,
  serviciosNetLikeCountForPublicRow,
  serviciosSavedCountForPublicRow,
} from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";
import {
  emptyListingAnalyticsBucket,
  rollupListingAnalyticsEvents,
  type ListingAnalyticsBucket,
} from "@/app/(site)/dashboard/lib/listingAnalyticsAggregate";
import { collectOwnerListingKeysForAnalytics } from "@/app/lib/ownerEngagementListingKeys";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type ServiciosListingEngagementMetrics = {
  slug: string;
  views: number;
  likes: number;
  saves: number;
  shares: number;
  ctaClicks: number;
  /** Raw analytics bucket before table supplement (for debugging / transparency). */
  analyticsOnly: ListingAnalyticsBucket;
  likesFromTable: number;
  savesFromTable: number;
};

export type OwnerEngagementRollups = {
  serviciosBySlug: Record<string, ServiciosListingEngagementMetrics>;
  /** Sum of per-listing table likes (alias-aware, no double count within a listing). */
  serviciosTableLikesTotal: number;
  /** Sum of per-listing table saves (alias-aware). */
  serviciosTableSavesTotal: number;
  /** All listing_analytics events merged for owner keys + owner_user_id filter. */
  analyticsRollupAllKeys: ListingAnalyticsBucket;
};

type AnalyticsRow = {
  id?: string;
  listing_id: string | null;
  event_type: string;
  user_id?: string | null;
  created_at?: string;
};

function dedupeAnalyticsRows(rows: AnalyticsRow[]): AnalyticsRow[] {
  const seen = new Set<string>();
  const out: AnalyticsRow[] = [];
  for (const row of rows) {
    const id = row.id?.trim();
    const key = id
      ? id
      : `${row.listing_id ?? ""}|${row.event_type}|${row.created_at ?? ""}|${row.user_id ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function bucketToPublicMetrics(b: ListingAnalyticsBucket): Pick<
  ServiciosListingEngagementMetrics,
  "views" | "likes" | "saves" | "shares" | "ctaClicks"
> {
  return {
    views: b.views + b.profileClicks + b.listingOpens,
    likes: b.likes,
    saves: b.saves,
    shares: b.shares,
    ctaClicks: b.ctaClicks,
  };
}

export async function fetchOwnerEngagementRollupsServer(ownerUserId: string): Promise<OwnerEngagementRollups | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const ownerId = ownerUserId.trim();
  if (!ownerId) return null;

  const supabase = getAdminSupabase();
  const ownerKeys = await collectOwnerListingKeysForAnalytics(supabase, ownerId);

  const analyticsSelect = "id, listing_id, event_type, user_id, created_at";
  const eventBatches: AnalyticsRow[] = [];

  if (ownerKeys.length > 0) {
    const chunkSize = 80;
    for (let i = 0; i < ownerKeys.length; i += chunkSize) {
      const chunk = ownerKeys.slice(i, i + chunkSize);
      const { data } = await supabase.from("listing_analytics").select(analyticsSelect).in("listing_id", chunk);
      if (data?.length) eventBatches.push(...(data as AnalyticsRow[]));
    }
  }

  const { data: byOwner } = await supabase
    .from("listing_analytics")
    .select(analyticsSelect)
    .eq("owner_user_id", ownerId)
    .limit(4000);
  if (byOwner?.length) eventBatches.push(...(byOwner as AnalyticsRow[]));

  const events = dedupeAnalyticsRows(eventBatches);
  const analyticsRollupAllKeys =
    ownerKeys.length > 0 ? rollupListingAnalyticsEvents(events, ownerKeys) : emptyListingAnalyticsBucket();

  const { data: servRows } = await supabase
    .from("servicios_public_listings")
    .select("id, slug, leonix_ad_id")
    .eq("owner_user_id", ownerId);

  const serviciosBySlug: Record<string, ServiciosListingEngagementMetrics> = {};
  let serviciosTableLikesTotal = 0;
  let serviciosTableSavesTotal = 0;

  const allEngagementKeys = new Set<string>(ownerKeys);
  for (const r of servRows ?? []) {
    const row = r as { id?: string; slug?: string; leonix_ad_id?: string | null };
    for (const k of serviciosLikeCountAliasKeys({
      slug: row.slug ?? "",
      leonix_ad_id: row.leonix_ad_id ?? null,
      id: row.id ?? "",
    })) {
      allEngagementKeys.add(k);
    }
  }

  const [likeMap, saveMap] = await Promise.all([
    fetchServiciosUserLikedCountsByKeys([...allEngagementKeys]),
    fetchServiciosUserSavedCountsByKeys([...allEngagementKeys]),
  ]);

  for (const r of servRows ?? []) {
    const row = r as { id?: string; slug?: string; leonix_ad_id?: string | null };
    const slug = (row.slug ?? "").trim();
    if (!slug) continue;
    const aliasRow = { slug, leonix_ad_id: row.leonix_ad_id ?? null, id: row.id ?? "" };
    const aliasKeys = serviciosLikeCountAliasKeys(aliasRow);
    const analyticsOnly = rollupListingAnalyticsEvents(events, aliasKeys);
    const likesFromTable = serviciosNetLikeCountForPublicRow(aliasRow, likeMap);
    const savesFromTable = serviciosSavedCountForPublicRow(aliasRow, saveMap);
    serviciosTableLikesTotal += likesFromTable;
    serviciosTableSavesTotal += savesFromTable;

    const base = bucketToPublicMetrics(analyticsOnly);
    serviciosBySlug[slug] = {
      slug,
      views: base.views,
      likes: Math.max(base.likes, likesFromTable),
      saves: Math.max(base.saves, savesFromTable),
      shares: base.shares,
      ctaClicks: base.ctaClicks,
      analyticsOnly,
      likesFromTable,
      savesFromTable,
    };
  }

  return {
    serviciosBySlug,
    serviciosTableLikesTotal,
    serviciosTableSavesTotal,
    analyticsRollupAllKeys,
  };
}

/** Merge server rollups into client-computed owner totals (likes/saves use max of analytics vs table). */
export function supplementOwnerTotalsWithRollups(
  totals: import("@/app/(site)/dashboard/lib/dashboardAnalyticsSummary").OwnerAnalyticsTotals,
  rollups: OwnerEngagementRollups | null,
): import("@/app/(site)/dashboard/lib/dashboardAnalyticsSummary").OwnerAnalyticsTotals {
  if (!rollups) return totals;
  const analytics = rollups.analyticsRollupAllKeys;
  const profileViews = Math.max(totals.profileViews, analytics.profileClicks);
  const listingOpens = Math.max(totals.listingOpens, analytics.listingOpens);
  const listingViews = Math.max(totals.listingViews, analytics.views);
  const likes = Math.max(totals.likes, analytics.likes, rollups.serviciosTableLikesTotal);
  const saves = Math.max(totals.saves, analytics.saves, rollups.serviciosTableSavesTotal);
  const shares = Math.max(totals.shares, analytics.shares);
  const ctaClicks = Math.max(totals.ctaClicks, analytics.ctaClicks);
  const lastEngagement = [totals.lastEngagement, analytics.lastEngagement].filter(Boolean).sort().pop();
  return {
    ...totals,
    profileViews,
    listingOpens,
    listingViews,
    likes,
    saves,
    shares,
    ctaClicks,
    lastEngagement,
  };
}

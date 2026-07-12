import "server-only";

import { serviciosLikeCountAliasKeys } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";
import {
  bucketToDashboardListingMetrics,
  rollupEventsForListingKeys,
  type DashboardAnalyticsEventRow,
} from "@/app/lib/analytics/server/dashboardAnalyticsMetrics";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type ServiciosAdminCanonicalAnalytics = ReturnType<typeof bucketToDashboardListingMetrics>;

const EVENT_SELECT =
  "listing_id, canonical_ad_id, event_type, created_at, category, owner_user_id, event_source, source_table, source_id";

type ServiciosAdminAnalyticsRow = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
};

/** Canonical seller/admin totals from listing_analytics (same source as owner dashboard). */
export async function fetchServiciosAdminCanonicalAnalyticsByRows(
  rows: ServiciosAdminAnalyticsRow[],
): Promise<Map<string, ServiciosAdminCanonicalAnalytics>> {
  const out = new Map<string, ServiciosAdminCanonicalAnalytics>();
  if (!isSupabaseAdminConfigured() || rows.length === 0) return out;

  const sourceIds = [...new Set(rows.map((r) => r.id.trim()).filter(Boolean))];
  if (sourceIds.length === 0) return out;

  try {
    const supabase = getAdminSupabase();
    const events: DashboardAnalyticsEventRow[] = [];
    const chunkSize = 80;

    for (let i = 0; i < sourceIds.length; i += chunkSize) {
      const chunk = sourceIds.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from("listing_analytics")
        .select(EVENT_SELECT)
        .eq("source_table", "servicios_public_listings")
        .in("source_id", chunk)
        .limit(4000);
      if (error) break;
      if (data?.length) events.push(...(data as DashboardAnalyticsEventRow[]));
    }

    for (const row of rows) {
      const keys = serviciosLikeCountAliasKeys({
        slug: row.slug,
        leonix_ad_id: row.leonix_ad_id ?? null,
        id: row.id,
      });
      const bucket = rollupEventsForListingKeys(events, keys);
      out.set(row.id, bucketToDashboardListingMetrics(bucket));
    }
  } catch {
    return out;
  }

  return out;
}

/** @deprecated use fetchServiciosAdminCanonicalAnalyticsByRows */
export async function fetchServiciosAdminCanonicalAnalyticsBySourceIds(
  sourceIds: string[],
): Promise<Map<string, ServiciosAdminCanonicalAnalytics>> {
  return fetchServiciosAdminCanonicalAnalyticsByRows(
    sourceIds.map((id) => ({ id, slug: id, leonix_ad_id: null })),
  );
}

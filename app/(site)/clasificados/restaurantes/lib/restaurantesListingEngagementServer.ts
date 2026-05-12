import "server-only";

import {
  aggregateRestauranteLikeAnalyticsEvents,
  collectRestauranteListingAnalyticsQueryIds,
  normalizedRestauranteListingAnalyticsTargets,
} from "@/app/clasificados/restaurantes/lib/restaurantesListingEngagement";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import type { RestaurantesPublicListingDbRow } from "./restaurantesPublicListingsServer";

const QUERY_CHUNK = 120;

/**
 * Net likes from `listing_analytics` for published restaurant rows.
 * Batches `.in("listing_id")` queries; matches analytics rows even when `listing_id` casing differs from DB columns.
 */
export async function fetchRestaurantesNetLikeCountsForDbRows(
  rows: Pick<RestaurantesPublicListingDbRow, "id" | "leonix_ad_id">[],
): Promise<Map<string, number>> {
  if (rows.length === 0 || !isSupabaseAdminConfigured()) return new Map();
  const targets = normalizedRestauranteListingAnalyticsTargets(rows);
  const queryIds = collectRestauranteListingAnalyticsQueryIds(rows);
  if (queryIds.length === 0) return new Map();

  const mergedEvents: { listing_id: string | null; event_type: string | null }[] = [];

  try {
    const supabase = getAdminSupabase();
    for (let i = 0; i < queryIds.length; i += QUERY_CHUNK) {
      const chunk = queryIds.slice(i, i + QUERY_CHUNK);
      const { data, error } = await supabase
        .from("listing_analytics")
        .select("listing_id, event_type")
        .in("listing_id", chunk)
        .in("event_type", ["listing_like", "listing_unlike"]);
      if (error) continue;
      if (data?.length) mergedEvents.push(...(data as { listing_id: string | null; event_type: string | null }[]));
    }
  } catch {
    return new Map();
  }

  return aggregateRestauranteLikeAnalyticsEvents(mergedEvents, targets);
}

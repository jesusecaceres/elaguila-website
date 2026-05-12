import "server-only";

import { serviciosNetLikeCountMapFromAnalyticsRows } from "@/app/clasificados/servicios/lib/serviciosPublicListingSort";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** Net likes from `listing_analytics` (`listing_like` − `listing_unlike`, floor 0) for engagement keys. */
export async function fetchRestaurantesNetLikeCountsByEngagementKeys(listingKeys: string[]): Promise<Map<string, number>> {
  const keys = [...new Set(listingKeys.map((k) => k.trim()).filter(Boolean))];
  if (keys.length === 0 || !isSupabaseAdminConfigured()) return new Map();
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("listing_analytics")
      .select("listing_id, event_type")
      .in("listing_id", keys)
      .in("event_type", ["listing_like", "listing_unlike"]);
    if (error || !data) return new Map();
    return serviciosNetLikeCountMapFromAnalyticsRows(
      data as { listing_id: string | null; event_type: string | null }[],
      keys,
    );
  } catch {
    return new Map();
  }
}

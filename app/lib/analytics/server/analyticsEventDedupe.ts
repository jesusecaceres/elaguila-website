/**
 * Gate G2B — Lightweight server-side dedupe for high-volume anonymous events.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";

const DEDUPE_WINDOW_MS: Partial<Record<ListingAnalyticsEventType, number>> = {
  listing_view: 30 * 60 * 1000,
  listing_impression: 10 * 60 * 1000,
  result_card_click: 5 * 60 * 1000,
  listing_open: 5 * 60 * 1000,
};

export function dedupeWindowMsForEvent(eventType: ListingAnalyticsEventType): number | null {
  return DEDUPE_WINDOW_MS[eventType] ?? null;
}

export async function findRecentDuplicateAnalyticsEvent(
  sb: SupabaseClient,
  args: {
    canonicalAdId: string;
    eventType: ListingAnalyticsEventType;
    userId: string | null;
    anonymousSessionId: string | null;
  },
): Promise<boolean> {
  const windowMs = dedupeWindowMsForEvent(args.eventType);
  if (!windowMs) return false;

  const actorId = args.userId?.trim() || args.anonymousSessionId?.trim() || "";
  if (!actorId) return false;

  const since = new Date(Date.now() - windowMs).toISOString();
  let q = sb
    .from("listing_analytics")
    .select("id")
    .eq("canonical_ad_id", args.canonicalAdId)
    .eq("event_type", args.eventType)
    .gte("created_at", since)
    .limit(1);

  if (args.userId?.trim()) {
    q = q.eq("user_id", args.userId.trim());
  } else {
    q = q.eq("anonymous_session_id", args.anonymousSessionId!.trim());
  }

  const { data, error } = await q;
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getAutosClassifiedsListingById } from "./autosClassifiedsListingService";
import type { AutosClassifiedsEventType } from "./autosClassifiedsEventTypes";
import type { AutosClassifiedsLane } from "./autosClassifiedsTypes";

/**
 * Globalization Build D-F3 — `autos_classifieds_analytics_events` is a legacy, Autos-only table
 * that used to receive a duplicate write for nearly every client engagement event (view, click,
 * like, share, contact CTA) in parallel with the canonical shared `listing_analytics` pipeline
 * (`/api/analytics/events`, see `recordAutosGlobalAnalytics.ts`). That bulk client-side duplicate
 * write (`trackAutosListingEvent` → `/api/clasificados/autos/public/analytics/event`) has been
 * retired — it had zero readers (`rollupAutosListingEventCounts` below has no callers anywhere;
 * the real owner-facing analytics summary already reads only the canonical `listing_analytics`
 * table) and wasn't gated by the same self-engagement/dedupe guards the canonical endpoint has.
 * This table/service are left dormant for backward compatibility rather than dropped. They still
 * receive two narrow, intentionally-separate writes that were never part of that duplication and
 * are out of this gate's scope: the owner-only "publish funnel" event
 * (`/api/clasificados/autos/listings/[id]/analytics/route.ts`) and the legacy Stripe webhook's
 * payment-conversion event (`/api/clasificados/autos/stripe/webhook/route.ts`) — neither has a
 * canonical `listing_analytics` equivalent today.
 */
export async function recordAutosClassifiedsListingEvent(input: {
  listingId: string;
  eventType: AutosClassifiedsEventType | string;
  lane?: AutosClassifiedsLane | null;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const row = await getAutosClassifiedsListingById(input.listingId);
  if (!row || row.status !== "active") return false;
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("autos_classifieds_analytics_events").insert({
    listing_id: input.listingId,
    event_type: input.eventType,
    lane: input.lane ?? row.lane,
    metadata: {
      leonix_ad_id: row.leonix_ad_id ?? null,
      ...(input.metadata ?? {}),
    },
  });
  if (error) {
    console.error("recordAutosClassifiedsListingEvent", error);
    return false;
  }
  return true;
}

export async function rollupAutosListingEventCounts(listingId: string): Promise<Record<string, number>> {
  if (!isSupabaseAdminConfigured()) return {};
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("autos_classifieds_analytics_events")
    .select("event_type")
    .eq("listing_id", listingId);
  if (error || !data?.length) return {};
  const counts: Record<string, number> = {};
  for (const r of data as { event_type: string }[]) {
    counts[r.event_type] = (counts[r.event_type] ?? 0) + 1;
  }
  return counts;
}

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getAutosClassifiedsListingById } from "./autosClassifiedsListingService";
import type { AutosClassifiedsEventType } from "./autosClassifiedsEventTypes";
import type { AutosClassifiedsLane } from "./autosClassifiedsTypes";

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
    metadata: input.metadata ?? {},
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

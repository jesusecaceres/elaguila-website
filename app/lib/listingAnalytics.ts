/**
 * Listing analytics: thin `trackEvent` wrapper for legacy BR / anuncio flows.
 * Prefer `clasificadosAnalytics` for full payloads (owner_user_id, category, metadata).
 */

import { createSupabaseBrowserClient } from "./supabase/browser";
import { isListingAnalyticsEventType, type ListingAnalyticsEventType } from "./listingAnalyticsEventTypes";

export type ListingEventType = ListingAnalyticsEventType;

/**
 * Track an analytics event. Fire-and-forget (does not throw).
 * For profile_view, listingId can be null.
 */
export async function trackEvent(
  listingId: string | null,
  eventType: ListingEventType,
  userId?: string | null
): Promise<void> {
  if (!isListingAnalyticsEventType(eventType)) {
    console.warn("[trackEvent] unsupported event_type (not in DB allowlist):", eventType);
    return;
  }
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("listing_analytics").insert({
      listing_id: listingId ?? null,
      event_type: eventType,
      user_id: userId ?? null,
      event_source: "unknown",
      metadata: {},
    });
  } catch {
    // Fire-and-forget: do not block UI or throw
  }
}

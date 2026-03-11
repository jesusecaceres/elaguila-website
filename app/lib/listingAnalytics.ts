/**
 * Listing analytics: track events into listing_analytics table.
 * Events: listing_view, listing_save, listing_share, message_sent
 */

import { createSupabaseBrowserClient } from "./supabase/browser";

export type ListingEventType = "listing_view" | "listing_save" | "listing_share" | "message_sent";

/**
 * Track an analytics event for a listing. Fire-and-forget (does not throw).
 */
export async function trackEvent(
  listingId: string,
  eventType: ListingEventType,
  userId?: string | null
): Promise<void> {
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("listing_analytics").insert({
      listing_id: listingId,
      event_type: eventType,
      user_id: userId ?? null,
    });
  } catch {
    // Fire-and-forget: do not block UI or throw
  }
}

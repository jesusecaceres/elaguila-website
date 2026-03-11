/**
 * Listing analytics: track events into listing_analytics table.
 * Events: listing_view, listing_save, listing_share, message_sent, profile_view, listing_open
 */

import { createSupabaseBrowserClient } from "./supabase/browser";

export type ListingEventType = "listing_view" | "listing_save" | "listing_share" | "message_sent" | "profile_view" | "listing_open";

/**
 * Track an analytics event. Fire-and-forget (does not throw).
 * For profile_view, listingId can be null.
 */
export async function trackEvent(
  listingId: string | null,
  eventType: ListingEventType,
  userId?: string | null
): Promise<void> {
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("listing_analytics").insert({
      listing_id: listingId ?? null,
      event_type: eventType,
      user_id: userId ?? null,
    });
  } catch {
    // Fire-and-forget: do not block UI or throw
  }
}

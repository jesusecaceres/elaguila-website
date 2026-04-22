import { trackEvent } from "@/app/lib/listingAnalytics";

export function trackRentasListingView(listingId: string, userId?: string | null) {
  void trackEvent(listingId, "listing_view", userId);
}

/** Fires `listing_open` (DB-safe event_type; reserved for richer “contact_click” when analytics schema extends). */
export function trackRentasContactClick(listingId: string, userId?: string | null) {
  void trackEvent(listingId, "listing_open", userId);
}

export function trackRentasMessageSent(listingId: string, userId?: string | null) {
  void trackEvent(listingId, "message_sent", userId);
}

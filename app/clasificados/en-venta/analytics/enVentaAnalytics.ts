import { trackEvent } from "@/app/lib/listingAnalytics";

export function trackEnVentaListingView(listingId: string, userId?: string | null) {
  void trackEvent(listingId, "listing_view", userId);
}

export function trackEnVentaListingOpen(listingId: string, userId?: string | null) {
  void trackEvent(listingId, "listing_open", userId);
}

export function trackEnVentaSaveClick(listingId: string, userId?: string | null) {
  void trackEvent(listingId, "listing_save", userId);
}

export function trackEnVentaShare(listingId: string, userId?: string | null) {
  void trackEvent(listingId, "listing_share", userId);
}

export function trackEnVentaMessageIntent(listingId: string, userId?: string | null) {
  void trackEvent(listingId, "message_sent", userId);
}

/** Free MVP: hook only — extend `listing_analytics.event_type` before emitting. */
export function trackEnVentaFilterApply(_filterKey: string) {
  /* reserved */
}

export function trackEnVentaPublishSuccess(_listingId: string) {
  /* reserved: no canonical event type yet */
}

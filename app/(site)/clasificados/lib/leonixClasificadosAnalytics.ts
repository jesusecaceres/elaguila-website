/**
 * Analytics entry points for Leonix BR / Rentas discovery + lifecycle.
 * Uses `listing_analytics` via `trackEvent`; extend DB constraints when enabling new event types in production.
 */

import { trackEvent, type ListingEventType } from "@/app/lib/listingAnalytics";

export type LeonixClasificadosAnalyticsEvent = ListingEventType;

/** Fire-and-forget; safe to call from client components. */
export function trackLeonixClasificadosListingEvent(
  listingId: string | null,
  event: LeonixClasificadosAnalyticsEvent,
  userId?: string | null
): void {
  void trackEvent(listingId, event, userId);
}

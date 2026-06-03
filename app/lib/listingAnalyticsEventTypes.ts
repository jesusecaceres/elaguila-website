/**
 * Single allowlist for `public.listing_analytics.event_type` — must match DB CHECK + migrations.
 * Tracking and aggregation code should only use these literals (plus legacy `listingAnalytics.trackEvent` types below).
 */
export const LISTING_ANALYTICS_EVENT_TYPES = [
  "listing_view",
  "listing_save",
  "listing_unsave",
  "listing_share",
  "message_sent",
  "profile_view",
  "listing_open",
  "listing_like",
  "listing_unlike",
  "cta_click",
  "phone_click",
  "whatsapp_click",
  "website_click",
  "directions_click",
  "lead_created",
  "apply_started",
  "apply_submitted",
  /** Legacy BR / rentas helpers — still accepted by DB */
  "contact_click",
  "outbound_click",
  /** Gate G2A — global dashboard pipeline */
  "listing_impression",
  "result_card_click",
  "email_click",
  "message_click",
] as const;

export type ListingAnalyticsEventType = (typeof LISTING_ANALYTICS_EVENT_TYPES)[number];

const SET = new Set<string>(LISTING_ANALYTICS_EVENT_TYPES);

export function isListingAnalyticsEventType(v: string): v is ListingAnalyticsEventType {
  return SET.has(v);
}

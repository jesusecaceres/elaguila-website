/**
 * Category-owned analytics event names for Autos (align with `trackEvent(listingId, event)`).
 * Wire incrementally as instrumentation lands.
 */

export const AUTOS_ANALYTICS = {
  IMPRESSION: "autos_impression",
  RESULT_CLICK: "autos_result_click",
  DETAIL_VIEW: "autos_detail_view",
  SAVE: "autos_save",
  CALL_CLICK: "autos_call_click",
  MESSAGE_CLICK: "autos_message_click",
  SHARE_CLICK: "autos_share_click",
  FINANCING_CLICK: "autos_financing_click",
  DEALER_WEBSITE_CLICK: "autos_dealer_website_click",
  DEALER_INVENTORY_CLICK: "autos_dealer_inventory_click",
  /** Future: align with `listing_analytics` / dashboard rollups. */
  WHATSAPP_CLICK: "autos_whatsapp_click",
  WEBSITE_CLICK: "autos_website_click",
  APPOINTMENT_CLICK: "autos_appointment_click",
  PROFILE_CLICK: "autos_profile_click",
} as const;

export type AutosAnalyticsEventKey = keyof typeof AUTOS_ANALYTICS;

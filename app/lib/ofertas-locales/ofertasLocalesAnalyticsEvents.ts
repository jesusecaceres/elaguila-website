/**
 * Ofertas Locales — planned analytics event names only (Gate 1).
 * No tracking implementation, API calls, or storage in this gate.
 */

export const OFERTAS_LOCALES_ANALYTICS_VERSION_1_EVENTS = [
  "offer_view",
  "result_card_click",
  "flyer_open",
  "pdf_click",
  "coupon_click",
  "phone_click",
  "whatsapp_click",
  "email_click",
  "website_click",
  "directions_click",
  "share_click",
  "save_click",
  "like_click",
  "qr_source_click",
  "newsletter_source_click",
] as const;

export const OFERTAS_LOCALES_ANALYTICS_VERSION_2_EVENTS = [
  "item_search",
  "item_result_click",
  "item_to_flyer_open",
  "filter_apply",
  "scan_started",
  "scan_completed",
  "scan_failed",
  "scan_review_edited",
  "scan_review_approved",
  "approved_item_published",
] as const;

export type OfertaLocalAnalyticsV1Event =
  (typeof OFERTAS_LOCALES_ANALYTICS_VERSION_1_EVENTS)[number];

export type OfertaLocalAnalyticsV2Event =
  (typeof OFERTAS_LOCALES_ANALYTICS_VERSION_2_EVENTS)[number];

export type OfertaLocalAnalyticsEvent =
  | OfertaLocalAnalyticsV1Event
  | OfertaLocalAnalyticsV2Event;

/** Product namespace for future analytics payloads. */
export const OFERTAS_LOCALES_ANALYTICS_NAMESPACE = "ofertas_locales" as const;

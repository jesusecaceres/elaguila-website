/**
 * Ofertas Locales — canonical events recorded through POST /api/analytics/events.
 * Storage remains the shared `listing_analytics` table; this module is a typed event catalog only.
 */

export const OFERTAS_LOCALES_CANONICAL_ANALYTICS_EVENTS = [
  "listing_impression",
  "listing_open",
  "flyer_page_view",
  "product_impression",
  "product_open",
  "product_search",
  "product_search_result_click",
  "shopping_list_add",
  "shopping_list_remove",
  "listing_share",
  "website_click",
  "phone_click",
  "message_click",
  "whatsapp_click",
  "email_click",
  "directions_click",
  "coupon_open",
] as const;

export type OfertaLocalAnalyticsEvent =
  (typeof OFERTAS_LOCALES_CANONICAL_ANALYTICS_EVENTS)[number];

/** Product namespace for future analytics payloads. */
export const OFERTAS_LOCALES_ANALYTICS_NAMESPACE = "ofertas_locales" as const;

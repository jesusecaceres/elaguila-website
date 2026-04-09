/** Canonical event_type values for `autos_classifieds_analytics_events`. */
export const AUTOS_CLASSIFIEDS_EVENT = {
  resultCardClick: "result_card_click",
  listingOpen: "listing_open",
  ctaClick: "cta_click",
  callClick: "call_click",
  websiteClick: "website_click",
  whatsappClick: "whatsapp_click",
  appointmentClick: "appointment_click",
  mediaEngage: "media_engage",
  save: "save",
  share: "share",
  publishConversion: "publish_conversion",
  paymentConversion: "payment_conversion",
} as const;

export type AutosClassifiedsEventType = (typeof AUTOS_CLASSIFIEDS_EVENT)[keyof typeof AUTOS_CLASSIFIEDS_EVENT];

/** Session-scoped draft key for Busco quick publish (form ↔ preview, tab-local). */
export const BUSCO_QUICK_DRAFT_KEY = "leonix_busco_quick_draft_v1";

/**
 * I.6B — canonical listing id this exact in-progress submission already created. Written as
 * soon as known (before photo upload), cleared alongside BUSCO_QUICK_DRAFT_KEY on full success —
 * a bounded in-flight-retry protection, not a general "resume editing later" mechanism.
 */
export const BUSCO_QUICK_IN_FLIGHT_LISTING_ID_KEY = "leonix_busco_quick_in_flight_listing_id_v1";

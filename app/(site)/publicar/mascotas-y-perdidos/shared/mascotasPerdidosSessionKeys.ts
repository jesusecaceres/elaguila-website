/**
 * Session-scoped draft key for Mascotas y Perdidos quick publish (form ↔ preview).
 * Bumped to v2 for Gate 3 — the draft shape changed substantially (conditional pet/object fields,
 * separated contact channels, reward, multi-photo); a stale v1 session draft is simply dropped and
 * the form starts fresh rather than risking a confusing partial-shape hydration.
 */
export const MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY = "leonix_mascotas_perdidos_quick_draft_v2";

/**
 * Globalization Build 1 — canonical listing id this exact in-progress submission already
 * created. Written as soon as known (before photo upload), cleared alongside
 * MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY on full success — a bounded in-flight-retry protection,
 * matching the existing Busco/Comunidad/Clases pattern (BUSCO_QUICK_IN_FLIGHT_LISTING_ID_KEY).
 */
export const MASCOTAS_PERDIDOS_QUICK_IN_FLIGHT_LISTING_ID_KEY = "leonix_mascotas_perdidos_quick_in_flight_listing_id_v1";

/**
 * Session-scoped draft key for Mascotas y Perdidos quick publish (form ↔ preview).
 * Bumped to v2 for Gate 3 — the draft shape changed substantially (conditional pet/object fields,
 * separated contact channels, reward, multi-photo); a stale v1 session draft is simply dropped and
 * the form starts fresh rather than risking a confusing partial-shape hydration.
 */
export const MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY = "leonix_mascotas_perdidos_quick_draft_v2";

/**
 * In-flight listing id for ONE logical Mascotas publish (2026-09 category closeout). Before this the
 * publisher had no reuse branch and no attempt key, so every retry — a failed photo upload, a dropped
 * response, a double click — INSERTed another row (leaving an orphan `removed` row each time). Same
 * pattern as Busco / Clases / Comunidad / En Venta.
 */
export const MASCOTAS_PERDIDOS_QUICK_IN_FLIGHT_LISTING_ID_KEY = "leonix_mascotas_perdidos_quick_in_flight_listing_id_v1";

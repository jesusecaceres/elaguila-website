/**
 * Session-scoped draft keys for community-quick flows (Clases + Comunidad).
 *
 * Drafts survive in-tab refresh + edit↔preview round-trips, and clear when the tab closes.
 */
export const COMMUNITY_SESSION_KEYS = {
  clases: "leonix_clases_quick_draft_v1",
  comunidad: "leonix_comunidad_quick_draft_v1",
} as const;

export const COMMUNITY_STAGED_PUBLISH_KEYS = {
  clases: "leonix_clases_staged_publish_v1",
  comunidad: "leonix_comunidad_staged_publish_v1",
} as const;

/**
 * I.6B — canonical listing id this exact in-progress submission already created. Written as
 * soon as known (before photo upload), cleared alongside the draft/staged-publish keys on full
 * success — a bounded in-flight-retry protection, not a general "resume editing later" mechanism.
 */
export const COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS = {
  clases: "leonix_clases_quick_in_flight_listing_id_v1",
  comunidad: "leonix_comunidad_quick_in_flight_listing_id_v1",
} as const;

export type CommunityKind = "clases" | "comunidad";

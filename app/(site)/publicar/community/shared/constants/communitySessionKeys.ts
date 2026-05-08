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

export type CommunityKind = "clases" | "comunidad";

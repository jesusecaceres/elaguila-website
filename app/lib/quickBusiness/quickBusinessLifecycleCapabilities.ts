/**
 * Gate QB-LIFECYCLE-02 — capability-aware Quick Business lifecycle matrix.
 *
 * ONE place that maps generic customer intent (PAUSE / RESUME / END) onto each family's REAL
 * canonical state model. Pure and IO-free, so both the server route and
 * `scripts/verify-quick-lifecycle-behavior-01.ts` consume the identical truth, and so the
 * doorway can decide what to render without guessing.
 *
 * THE RULE THIS FILE ENFORCES: never invent a status that existing production readers cannot
 * understand. Each family's vocabulary below is the one its DB CHECK constraint actually allows
 * (or, for `listings`, the one its RLS policy and browse queries actually read). Where a family
 * has no state for an intent, that is recorded as `unsupported_by_schema` with the reason — it is
 * NOT silently mapped onto a neighbouring status, and NO control is rendered for it.
 *
 * VERIFIED SCHEMA TRUTH (DB CHECK constraints, not comments):
 *  - servicios_public_listings.listing_status ∈ {draft, preview_ready, publish_ready,
 *    pending_payment, pending_review, published, paused_unpublished, rejected, suspended}
 *      → has a real pause. Has NO archived/ended value.
 *  - restaurantes_public_listings.status ∈ {pending_payment, published, suspended, archived}
 *      → has a real archive. Has NO paused value. (`suspended` is staff moderation, not an
 *        owner pause: giving the owner a "pause" that writes `suspended` would misrepresent a
 *        moderation action as a self-service one.)
 *  - autos_classifieds_listings.status ∈ {draft, pending_payment, active, payment_failed,
 *    cancelled, removed}
 *      → `removed` is the owner unpublish AND the owner end; the enum has no separate pause.
 *        Reversible only while `suspended_reason` is null (that column is what distinguishes an
 *        owner unpublish from staff moderation).
 *  - listings (Bienes Negocio) has NO DB CHECK; its vocabulary is enforced by the app and by the
 *    anon RLS policy `status in ('active','sold') AND is_published = true`. It is the only family
 *    with a separate `is_published` boolean, so hiding a row requires flipping BOTH.
 */

export type QuickLifecycleIntent = "pause" | "resume" | "end";

export type QuickLifecycleCapabilityState =
  /** Executable today against a real endpoint and a real canonical status. */
  | "supported"
  /** The family's canonical state model has no such state. No control is rendered. */
  | "unsupported_by_schema"
  /** The family expresses this intent with the SAME status as another intent. */
  | "merged_with_pause";

export type QuickLifecycleCapability = {
  state: QuickLifecycleCapabilityState;
  /** Only set when `state === "supported"`. */
  endpoint?: string;
  /** The action/mutation name this endpoint expects. */
  action?: string;
  /** The canonical status value the listing lands in. Always a value the schema allows. */
  targetStatus?: string;
  /** The status(es) the listing must currently be in for the transition to be legal. */
  fromStatuses?: readonly string[];
  /** Truthful explanation when not supported. Never rendered as a working control. */
  reason?: string;
  labelEs?: string;
  labelEn?: string;
};

export type QuickLifecycleCapabilitySet = Record<QuickLifecycleIntent, QuickLifecycleCapability>;

export const QUICK_BUSINESS_LIFECYCLE_CAPABILITIES: Record<string, QuickLifecycleCapabilitySet> = {
  servicios: {
    pause: {
      state: "supported",
      endpoint: "/api/clasificados/servicios/manage",
      action: "pause",
      targetStatus: "paused_unpublished",
      fromStatuses: ["published"],
      labelEs: "Pausar",
      labelEn: "Pause",
    },
    resume: {
      state: "supported",
      endpoint: "/api/clasificados/servicios/manage",
      action: "resume",
      targetStatus: "published",
      fromStatuses: ["paused_unpublished"],
      labelEs: "Reactivar",
      labelEn: "Reactivate",
    },
    end: {
      state: "unsupported_by_schema",
      reason:
        "servicios_public_listings.listing_status has no archived/ended value; only staff moderation statuses (rejected, suspended) are terminal. An additive migration is required before an owner-facing End control can exist.",
    },
  },

  restaurantes: {
    pause: {
      state: "unsupported_by_schema",
      reason:
        "restaurantes_public_listings.status has no paused value. `suspended` is a staff moderation state, not an owner pause, and writing it from a customer control would misrepresent moderation as self-service. An additive migration is required.",
    },
    resume: {
      state: "unsupported_by_schema",
      reason: "No paused state exists to resume from.",
    },
    end: {
      state: "supported",
      endpoint: "/api/clasificados/restaurantes/manage",
      action: "archive",
      targetStatus: "archived",
      fromStatuses: ["published"],
      labelEs: "Archivar",
      labelEn: "Archive",
    },
  },

  "autos-dealer": {
    pause: {
      state: "supported",
      endpoint: "/api/clasificados/autos/listings/{listingId}/unpublish",
      action: "unpublish",
      targetStatus: "removed",
      fromStatuses: ["active"],
      // Named for what it really does. Calling it "pause" would imply a state autos does not have.
      labelEs: "Retirar del sitio",
      labelEn: "Unpublish",
    },
    resume: {
      state: "supported",
      endpoint: "/api/clasificados/autos/listings/{listingId}/restore",
      action: "restore",
      targetStatus: "active",
      fromStatuses: ["removed"],
      labelEs: "Restaurar",
      labelEn: "Restore",
    },
    end: {
      state: "merged_with_pause",
      reason:
        "autos_classifieds_listings has one owner-reachable off state, `removed`, used for both unpublish and end. A separate End control would write the same status and imply a distinction the schema does not make.",
    },
  },

  "bienes-negocio": {
    pause: {
      state: "supported",
      endpoint: "/api/clasificados/bienes-raices/listing-lifecycle",
      action: "pause",
      targetStatus: "paused",
      fromStatuses: ["active"],
      labelEs: "Pausar",
      labelEn: "Pause",
    },
    resume: {
      state: "supported",
      endpoint: "/api/clasificados/bienes-raices/listing-lifecycle",
      action: "resume",
      targetStatus: "active",
      fromStatuses: ["paused"],
      labelEs: "Reactivar",
      labelEn: "Reactivate",
    },
    end: {
      state: "supported",
      endpoint: "/api/clasificados/bienes-raices/listing-lifecycle",
      action: "archive",
      targetStatus: "removed",
      fromStatuses: ["active", "paused"],
      labelEs: "Finalizar",
      labelEn: "End listing",
    },
  },
};

export const QUICK_BUSINESS_LIFECYCLE_CATEGORIES = Object.keys(QUICK_BUSINESS_LIFECYCLE_CAPABILITIES);

/** True only when the intent is genuinely executable for that family. */
export function isLifecycleIntentSupported(category: string, intent: QuickLifecycleIntent): boolean {
  return QUICK_BUSINESS_LIFECYCLE_CAPABILITIES[category]?.[intent]?.state === "supported";
}

export function getLifecycleCapability(
  category: string,
  intent: QuickLifecycleIntent,
): QuickLifecycleCapability | null {
  return QUICK_BUSINESS_LIFECYCLE_CAPABILITIES[category]?.[intent] ?? null;
}

/**
 * Resolve the concrete endpoint for a supported intent, substituting the listing id.
 * Returns null for any intent that is not supported — a caller can therefore never construct a
 * request for a capability that does not exist.
 */
export function resolveLifecycleEndpoint(
  category: string,
  intent: QuickLifecycleIntent,
  listingId: string,
): { endpoint: string; action: string } | null {
  const cap = getLifecycleCapability(category, intent);
  if (!cap || cap.state !== "supported" || !cap.endpoint || !cap.action) return null;
  return { endpoint: cap.endpoint.replace("{listingId}", encodeURIComponent(listingId)), action: cap.action };
}

/**
 * Whether the transition is legal from the listing's CURRENT status. Used to avoid offering a
 * Pause control on an already-paused listing (and to let the server compare-and-set safely).
 */
export function isTransitionLegalFrom(
  category: string,
  intent: QuickLifecycleIntent,
  currentStatus: string,
): boolean {
  const cap = getLifecycleCapability(category, intent);
  if (!cap || cap.state !== "supported") return false;
  if (!cap.fromStatuses?.length) return true;
  return cap.fromStatuses.includes(currentStatus);
}

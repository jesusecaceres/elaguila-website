/**
 * Gate G.2.3.1 — pure BR lifecycle mutation contract: mutation-key vocabulary, error codes, and
 * state-transition eligibility rules. Zero imports, zero I/O.
 *
 * Deliberately its own file so it (and the self-test that exercises it) never transitively pulls
 * in `brListingPaymentService.ts` -> `addonEntitlementReader.ts`'s `"server-only"` guard, which
 * correctly throws when loaded outside a Next.js server runtime — including a plain `tsx`
 * self-test process. `brListingLifecycleService.ts` imports and re-exports everything here rather
 * than redefining it, so the exact vocabulary/rule the real mutation functions enforce is the
 * exact one tested by `scripts/gate-g2-3-1-br-lifecycle-mutation-selftest.ts`.
 */

export const BR_LIFECYCLE_MUTATION_KEYS = ["pause", "resume", "archive", "discontinue", "republish"] as const;
export type BrLifecycleMutationKey = (typeof BR_LIFECYCLE_MUTATION_KEYS)[number];

export const BR_LIFECYCLE_AUTH_REQUIRED_ERROR = "br_lifecycle_auth_required" as const;
export const BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR = "br_lifecycle_listing_not_found" as const;
export const BR_LIFECYCLE_OWNER_MISMATCH_ERROR = "br_lifecycle_owner_mismatch" as const;
export const BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR = "br_lifecycle_listing_not_eligible" as const;
export const BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR = "br_lifecycle_transition_not_allowed" as const;
export const BR_LIFECYCLE_PARENT_INVALID_ERROR = "br_lifecycle_parent_invalid" as const;
export const BR_LIFECYCLE_PARENT_INACTIVE_ERROR = "br_lifecycle_parent_inactive" as const;
/** Matches the existing repository convention (`supabase_not_configured`, used elsewhere in this
 * category) rather than inventing a parallel code for the same operational state. */
export const BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR = "supabase_not_configured" as const;

/**
 * The F.2.4.4 capacity-gate error code (`br_active_property_limit_reached`) is reused verbatim by
 * `applyBrResume` — deliberately re-declared as a literal string here (not re-exported from
 * `brListingPaymentService.ts`, which would reintroduce the same transitive `"server-only"`
 * import problem this file exists to avoid) and cross-checked against the real source of truth by
 * the self-test instead.
 */
export const BR_LIFECYCLE_CAPACITY_LIMIT_ERROR = "br_active_property_limit_reached" as const;

export type BrLifecycleErrorCode =
  | typeof BR_LIFECYCLE_AUTH_REQUIRED_ERROR
  | typeof BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR
  | typeof BR_LIFECYCLE_OWNER_MISMATCH_ERROR
  | typeof BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR
  | typeof BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR
  | typeof BR_LIFECYCLE_PARENT_INVALID_ERROR
  | typeof BR_LIFECYCLE_PARENT_INACTIVE_ERROR
  | typeof BR_LIFECYCLE_CAPACITY_LIMIT_ERROR
  | typeof BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR;

export type BrLifecycleRowForEligibility = {
  status?: string | null;
  is_published?: boolean | null;
};

function isBrRowActiveAndPublished(row: BrLifecycleRowForEligibility): boolean {
  return row.status === "active" && row.is_published !== false;
}

export function brPauseEligible(row: BrLifecycleRowForEligibility): boolean {
  return isBrRowActiveAndPublished(row);
}

export function brResumeEligible(row: BrLifecycleRowForEligibility): boolean {
  return row.status === "paused";
}

export function brArchiveEligible(row: BrLifecycleRowForEligibility): boolean {
  return row.status !== "removed";
}

export function brDiscontinueEligible(row: BrLifecycleRowForEligibility): boolean {
  return isBrRowActiveAndPublished(row);
}

/** The critical fix: republish is eligible ONLY for an already-active, already-published row —
 * never pending/paused/flagged/sold/removed/unknown. */
export function brRepublishEligible(row: BrLifecycleRowForEligibility): boolean {
  return isBrRowActiveAndPublished(row);
}

/**
 * Gate G.2.3.1/G.2.3.2 — pure BR lifecycle mutation contract: mutation-key vocabulary, error
 * codes, and state-transition/cascade eligibility rules. Zero imports, zero I/O.
 *
 * Deliberately its own file so it (and the self-tests that exercise it) never transitively pulls
 * in `brListingPaymentService.ts` -> `addonEntitlementReader.ts`'s `"server-only"` guard, which
 * correctly throws when loaded outside a Next.js server runtime — including a plain `tsx`
 * self-test process. `brListingLifecycleService.ts` imports and re-exports everything here rather
 * than redefining it, so the exact vocabulary/rule the real mutation functions enforce is the
 * exact one tested by the adjacent `gate-g2-3-*-br-lifecycle-*-selftest.ts` scripts.
 */

export const BR_LIFECYCLE_MUTATION_KEYS = [
  "pause",
  "resume",
  "archive",
  "discontinue",
  "republish",
  "activate_pending",
] as const;
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

/**
 * Gate G.2.3.2 — main-parent Pause cascade error codes. `CHILD_CASCADE_FAILED` covers any failure
 * pausing an eligible child (read error, write error, or a child unexpectedly no longer matching
 * its precondition) — the parent is never paused when this occurs, so the worst possible outcome
 * is "some/all children paused, parent still active", never the dangerous inverse. `PARENT_PAUSE_
 * INCOMPLETE` covers the rarer case where every eligible child paused successfully but the parent's
 * own compare-and-set then failed (e.g. a concurrent status change on the parent itself).
 */
export const BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR = "br_lifecycle_child_cascade_failed" as const;
export const BR_LIFECYCLE_PARENT_PAUSE_INCOMPLETE_ERROR = "br_lifecycle_parent_pause_incomplete" as const;

/**
 * Gate G.2.3.3 — one shared code for both main-parent Archive and Discontinue being blocked by an
 * active/public canonical child. A single code is deliberate: the owner-facing remedy is
 * identical either way ("resolve the active properties first"), so a second, narrower code would
 * add no actionable distinction for the client to react to differently.
 */
export const BR_LIFECYCLE_CHILD_DISPOSITION_REQUIRED_ERROR = "br_lifecycle_child_disposition_required" as const;

export type BrLifecycleErrorCode =
  | typeof BR_LIFECYCLE_AUTH_REQUIRED_ERROR
  | typeof BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR
  | typeof BR_LIFECYCLE_OWNER_MISMATCH_ERROR
  | typeof BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR
  | typeof BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR
  | typeof BR_LIFECYCLE_PARENT_INVALID_ERROR
  | typeof BR_LIFECYCLE_PARENT_INACTIVE_ERROR
  | typeof BR_LIFECYCLE_CAPACITY_LIMIT_ERROR
  | typeof BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR
  | typeof BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR
  | typeof BR_LIFECYCLE_PARENT_PAUSE_INCOMPLETE_ERROR
  | typeof BR_LIFECYCLE_CHILD_DISPOSITION_REQUIRED_ERROR;

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

/**
 * Package C Build 4 (C7, Gate 5) — a freshly-inserted BR negocio row whose insert-time payment
 * was skipped (already covered by existing capacity, or a dev/QA payment bypass) lands as
 * `status: "pending"`, never `"active"` (see the corrected insert path in
 * `AgenteIndividualResidencialPreviewClient.tsx`). This is the one-time transition that turns
 * that inert row live, capacity/lifecycle-checked by the same RPC as Resume — never Resume itself
 * (which requires `"paused"`, a different prior state with different history).
 */
export function brActivatePendingEligible(row: BrLifecycleRowForEligibility): boolean {
  return row.status === "pending";
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

/* ------------------------------------------------------------------------------------------ *
 * Gate G.2.3.2 — main-parent Pause cascade: canonical child selection
 * ------------------------------------------------------------------------------------------ */

export type BrLifecycleCascadeChildCandidate = {
  id?: string | null;
  category?: string | null;
  seller_type?: string | null;
  inventory_role?: string | null;
  br_inventory_parent_listing_id?: string | null;
  owner_id?: string | null;
  status?: string | null;
  is_published?: boolean | null;
};

export type BrLifecycleCascadeParent = {
  id: string;
  owner_id?: string | null;
};

/**
 * Whether one candidate row belongs to `parent`'s cascade-pause set. Every condition is required
 * — never group id, owner-alone, title, slug, or Leonix Ad ID. A parent with no resolvable
 * `owner_id` never cascades to anything (fails closed rather than matching on an empty string).
 */
export function brChildCascadePauseEligible(
  child: BrLifecycleCascadeChildCandidate,
  parent: BrLifecycleCascadeParent,
): boolean {
  const parentOwnerId = String(parent.owner_id ?? "").trim();
  if (!parentOwnerId) return false;
  const childOwnerId = String(child.owner_id ?? "").trim();
  const childParentId = String(child.br_inventory_parent_listing_id ?? "").trim();
  return (
    child.category === "bienes-raices" &&
    child.seller_type === "business" &&
    child.inventory_role === "inventory_property" &&
    childParentId === parent.id &&
    childOwnerId === parentOwnerId &&
    isBrRowActiveAndPublished(child)
  );
}

/**
 * Gate G.2.3.3 — the "active canonical child" definition that blocks main-parent Archive/
 * Discontinue is identical to the Gate G.2.3.2 cascade-pause selection rule (same seven
 * conditions). Reused verbatim under a name matching this gate's own vocabulary at call sites,
 * rather than duplicating the rule and risking the two silently diverging over time.
 */
export const brChildBlocksParentDisposition = brChildCascadePauseEligible;

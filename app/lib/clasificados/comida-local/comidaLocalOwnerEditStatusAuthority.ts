/**
 * Gate COMIDA-LOCAL-1 — pure Comida Local owner-edit status-transition authority.
 *
 * The COMIDA-LOCAL-0 MRI found the owner-facing publish/edit route resolving an existing row's
 * status as `(existing.status as "published") ?? "published"`, so a row whose status was NULL,
 * legacy or otherwise unrecognized was PROMOTED to `published` by an ordinary owner re-save —
 * no Stripe payment, no Revenue OS fulfillment event, no staff action. The normal statuses were
 * preserved correctly, so this was a narrow edge rather than the broad bypass Restaurantes had,
 * but it is the same class of defect and it is closed here the same way.
 *
 * This file is the single source of truth for what status an ordinary owner edit of an EXISTING
 * Comida Local row may target: always the row's own current status, never anything else.
 *
 * Only two paths may ever move a Comida Local row toward `published`:
 *   1. `activatePaidComidaLocalListingFromRevenueOs` (server-only, Stripe webhook fulfillment).
 *   2. The owner lifecycle route's explicit `paused -> published` resume, which is a strict,
 *      compare-and-set transition on an already-paid row.
 * This file's job is only to make sure the owner-facing publish route never becomes a third.
 *
 * Vocabulary is the table's own status CHECK (migration 20260604120000): draft, published,
 * paused, suspended, pending_payment. Nothing invented.
 *
 * Zero I/O, zero imports — safe to import from anywhere, including a plain `tsx` self-test.
 */

export const COMIDA_LOCAL_STATUS_TRANSITION_NOT_ALLOWED_ERROR =
  "comida_local_status_transition_not_allowed" as const;

export type ComidaLocalProtectedStatus =
  | "draft"
  | "published"
  | "paused"
  | "suspended"
  | "pending_payment";

const KNOWN_COMIDA_LOCAL_STATUSES: ReadonlySet<string> = new Set([
  "draft",
  "published",
  "paused",
  "suspended",
  "pending_payment",
]);

export type ComidaLocalOwnerEditStatusDecision =
  | { ok: true; targetStatus: ComidaLocalProtectedStatus }
  | { ok: false; error: typeof COMIDA_LOCAL_STATUS_TRANSITION_NOT_ALLOWED_ERROR };

/**
 * Deliberately self-preserving: whatever status the row is already in is the only status an
 * ordinary owner edit may target. The caller-supplied `activationMode` request flag is NEVER
 * consulted here — accepting it would reintroduce exactly the escalation this file exists to
 * close, so the signature does not even take it. A missing, NULL, legacy or unrecognized status
 * fails closed (the edit is rejected) rather than defaulting to `"published"`.
 */
export function resolveComidaLocalOwnerEditTargetStatus(
  existingStatus: string | null | undefined,
): ComidaLocalOwnerEditStatusDecision {
  const status = String(existingStatus ?? "").trim().toLowerCase();
  if (KNOWN_COMIDA_LOCAL_STATUSES.has(status)) {
    return { ok: true, targetStatus: status as ComidaLocalProtectedStatus };
  }
  return { ok: false, error: COMIDA_LOCAL_STATUS_TRANSITION_NOT_ALLOWED_ERROR };
}

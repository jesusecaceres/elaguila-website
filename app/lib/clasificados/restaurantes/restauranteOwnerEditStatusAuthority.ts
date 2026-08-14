/**
 * Gate G.3.1A — pure Restaurantes owner-edit status-transition authority.
 *
 * The Gate G.3A audit confirmed the owner-facing publish/edit route
 * (`app/api/clasificados/restaurantes/publish/route.ts`) could silently promote an existing
 * `pending_payment` or `archived` row straight to `published` on an ordinary re-save, with no
 * Stripe payment, no Revenue OS fulfillment event, and no staff authorization — only ownership
 * was checked. This file is the single source of truth for what status an ordinary owner edit
 * of an EXISTING row may target: always the row's own current status, never anything else.
 *
 * Only two paths may ever move a Restaurant row's status toward `published`:
 *   1. `activatePaidRestauranteListingFromRevenueOs` (server-only, Stripe webhook fulfillment) —
 *      untouched by this file.
 *   2. The staff admin route (`app/api/admin/restaurantes/listings/[id]/route.ts`) — untouched.
 * This file's job is only to make sure the owner-facing route never becomes a third path.
 *
 * Zero I/O, zero imports — safe to import from anywhere, including a plain `tsx` self-test.
 */

export const RESTAURANTE_STATUS_TRANSITION_NOT_ALLOWED_ERROR = "restaurante_status_transition_not_allowed" as const;

export type RestauranteProtectedStatus = "published" | "pending_payment" | "archived" | "suspended";

const KNOWN_RESTAURANTE_STATUSES: ReadonlySet<string> = new Set([
  "published",
  "pending_payment",
  "archived",
  "suspended",
]);

export type RestauranteOwnerEditStatusDecision =
  | { ok: true; targetStatus: RestauranteProtectedStatus }
  | { ok: false; error: typeof RESTAURANTE_STATUS_TRANSITION_NOT_ALLOWED_ERROR };

/**
 * Deliberately self-preserving: whatever status the row is already in is the only status an
 * ordinary owner edit may target. The caller-supplied `activation_mode`/`pendingPayment` request
 * flag is NEVER consulted here — passing it in would reintroduce exactly the bypass this file
 * exists to close, so the function signature doesn't even accept it. An unknown, legacy, or
 * missing status fails closed (rejects the edit) rather than ever defaulting to `"published"`.
 */
export function resolveRestauranteOwnerEditTargetStatus(
  existingStatus: string | null | undefined,
): RestauranteOwnerEditStatusDecision {
  const status = String(existingStatus ?? "").trim().toLowerCase();
  if (KNOWN_RESTAURANTE_STATUSES.has(status)) {
    return { ok: true, targetStatus: status as RestauranteProtectedStatus };
  }
  return { ok: false, error: RESTAURANTE_STATUS_TRANSITION_NOT_ALLOWED_ERROR };
}

/**
 * Admin reactivation must never override a PAYMENT hold (2026-09 Gate 5 - mutation authority).
 *
 * Doctrine: Admin is not a payment / entitlement / subscription authority. The payment engine
 * (`applyPaymentSuspension` / `liftPaymentSuspension`, subscriptionLifecycle.ts) suspends a lane row's public
 * visibility with `suspended_reason = 'payment'` (grace expired, subscription deleted, chargeback) and lifts it
 * ONLY by compare-and-swap when the payment is cured. Admin Restore / Republish that flips such a row back to
 * live is a second publication authority: it launders a payment suspension.
 *
 * Two independent holds are decided here (PURE - no I/O, client-safe):
 *  1. PAYMENT SUSPENSION HOLD - the row carries `suspended_reason = 'payment'` (or a payment-engine sibling), or,
 *     for `public.listings`, sits in the engine-owned `suspended` status (no staff path writes it there: staff
 *     suspend writes `flagged`). Reactivation is refused; the payment system owns the lift.
 *  2. ENTITLEMENT LAPSE HOLD - the lane sells a base package (Servicios, Restaurantes, Comida Local, Autos
 *     dealer, Bienes Raices Negocio), the listing HAS a base-package entitlement on record, and NONE is live
 *     (active + `ends_at` in the future). A canceled / expired / revoked entitlement cannot be re-activated by
 *     Admin. A listing with NO entitlement on record (free application, legacy row) is not blocked here - the
 *     absence of evidence is not proof of lapse - and stays governed by its lane's own gates.
 * A read that fails is never treated as "no hold": reactivation fails closed with a 503-class code.
 */

/** `suspended_reason` values written by the payment engine (`payment`) or its subscription events. */
const PAYMENT_OWNED_REASONS: ReadonlySet<string> = new Set(["payment", "chargeback", "payment_failure", "grace_expired"]);

/** Base packages whose entitlement lapse blocks Admin reactivation. Mirrors REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS. */
export const ADMIN_BASE_ENTITLEMENT_PACKAGE_KEYS: readonly string[] = [
  "autos_dealer_monthly",
  "br_agent_monthly",
  "restaurantes_base_monthly",
  "servicios_base_monthly",
  "comida_local_base_monthly",
];

export type AdminEntitlementEvidence = "live" | "lapsed" | "none" | "unreadable";

export type AdminSuspendedReasonRead = { read: true; value: string | null } | { read: false };

export type AdminReactivationHoldCode =
  | "payment_suspension_active"
  | "entitlement_lapsed"
  | "suspension_state_unreadable"
  | "entitlement_state_unreadable";

export type AdminReactivationHoldDecision =
  | { blocked: false }
  | { blocked: true; code: AdminReactivationHoldCode; httpStatus: 409 | 503; message: string };

function lc(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

export function isPaymentOwnedSuspendedReason(reason: unknown): boolean {
  return PAYMENT_OWNED_REASONS.has(lc(reason));
}

/** Classify `listing_package_entitlements` rows (already filtered to this listing + base package keys). */
export function classifyAdminEntitlementRows(
  rows: readonly { status?: unknown; ends_at?: unknown }[] | null | undefined,
  nowMs: number = Date.now(),
): AdminEntitlementEvidence {
  if (!rows || rows.length === 0) return "none";
  const live = rows.some((r) => {
    if (lc(r.status) !== "active") return false;
    const endsMs = typeof r.ends_at === "string" ? new Date(r.ends_at).getTime() : NaN;
    return Number.isFinite(endsMs) && endsMs > nowMs;
  });
  return live ? "live" : "lapsed";
}

export const ADMIN_PAYMENT_HOLD_MESSAGES: Readonly<Record<AdminReactivationHoldCode, string>> = {
  payment_suspension_active:
    "This listing is suspended by the payment system (grace period expired, canceled subscription or chargeback). Admin cannot restore it - it returns only when the payment is cured.",
  entitlement_lapsed:
    "This listing's paid package has expired or was canceled and no active entitlement is on record. Admin cannot reactivate it - the owner must renew through checkout.",
  suspension_state_unreadable:
    "Could not verify whether a payment suspension applies to this listing, so it was not changed. Try again.",
  entitlement_state_unreadable:
    "Could not verify this listing's paid package state, so it was not changed. Try again.",
};

/**
 * Decide whether an Admin reactivation (unsuspend / restore / a republish that flips a non-live row live) is
 * refused by a payment hold. Call ONLY for reactivating actions.
 *
 * `paymentEngineStatus` - for `public.listings`, the status only the payment engine writes (`suspended`); a row in
 * that status is held even when `suspended_reason` was never stamped.
 * `entitlement` - pass the loaded evidence for lanes that sell a base package; omit (undefined) for lanes that do not.
 */
export function decideAdminReactivationHold(input: {
  status?: string | null;
  suspendedReason: AdminSuspendedReasonRead;
  paymentEngineStatus?: string | null;
  entitlement?: AdminEntitlementEvidence | null;
}): AdminReactivationHoldDecision {
  const block = (code: AdminReactivationHoldCode): AdminReactivationHoldDecision => ({
    blocked: true,
    code,
    httpStatus: code === "suspension_state_unreadable" || code === "entitlement_state_unreadable" ? 503 : 409,
    message: ADMIN_PAYMENT_HOLD_MESSAGES[code],
  });
  if (!input.suspendedReason.read) return block("suspension_state_unreadable");
  if (isPaymentOwnedSuspendedReason(input.suspendedReason.value)) return block("payment_suspension_active");
  const engineStatus = lc(input.paymentEngineStatus);
  if (engineStatus && lc(input.status) === engineStatus) return block("payment_suspension_active");
  if (input.entitlement === "unreadable") return block("entitlement_state_unreadable");
  if (input.entitlement === "lapsed") return block("entitlement_lapsed");
  return { blocked: false };
}

/**
 * Generic `listings` route only: staff `suspend` writes `flagged`. Applied to a row the payment engine already
 * suspended (`suspended`) it would overwrite the engine-owned state, after which the engine's compare-and-swap lift
 * can never match and the row is stranded. The row is already non-public, so the request is refused, not applied.
 */
export function decideAdminSuspendOverPaymentHold(input: { status?: string | null; paymentEngineStatus?: string | null }): AdminReactivationHoldDecision {
  const engineStatus = lc(input.paymentEngineStatus);
  if (engineStatus && lc(input.status) === engineStatus) {
    return {
      blocked: true,
      code: "payment_suspension_active",
      httpStatus: 409,
      message: "This listing is already suspended by the payment system, so it is not public. Staff suspend would overwrite that state; nothing was changed.",
    };
  }
  return { blocked: false };
}

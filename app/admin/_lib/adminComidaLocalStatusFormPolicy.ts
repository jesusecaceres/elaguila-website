/**
 * Comida Local - legacy staff STATUS FORM guard (golden-survivor port of the 2026-09 closeout doctrine).
 *
 * Golden still ships the raw status <select> (`updateComidaLocalPublicListingStatusAction`), which wrote whatever
 * status staff picked: an UNPAID `pending_payment` row could be flipped straight to `published`, and a row the
 * payment engine suspended (`suspended_reason = 'payment'`) could be restored by hand. The source branch replaced
 * the form with a lifecycle route whose rules live in app/lib (outside this port's scope); this module applies the
 * SAME rules to the form that golden still has, so the form is no longer a second publication authority.
 *
 * Rules (PURE - no I/O):
 *  - `draft` / `pending_payment` are commercial states. Staff never writes them, and a row in them is never moved by
 *    this form (it goes live only through the verified payment fulfilment).
 *  - a row the payment engine suspended (any payment-owned `suspended_reason`) is never moved by this form.
 *  - a change TO `published` is an activation: it needs payment proof on the row (`paid` / `waived`, or a legacy
 *    `not_required_for_l5b` row that was live) AND must clear the payment hold (reason read, no lapsed / unreadable
 *    base entitlement).
 *  - `suspended` is written with `suspended_reason = 'moderation'`; leaving `suspended` clears a moderation reason.
 */
import {
  ADMIN_PAYMENT_HOLD_MESSAGES,
  isPaymentOwnedSuspendedReason,
  type AdminEntitlementEvidence,
} from "@/app/admin/_lib/adminPaymentSuspensionPolicy";

export const COMIDA_LOCAL_FORM_STAFF_TARGETS: ReadonlySet<string> = new Set(["published", "paused", "suspended"]);
export const COMIDA_LOCAL_FORM_PRE_PAYMENT_STATUSES: ReadonlySet<string> = new Set(["draft", "pending_payment"]);
export const COMIDA_LOCAL_STAFF_SUSPENSION_REASON = "moderation" as const;

const LEGACY_NO_PAYMENT_STATUS = "not_required_for_l5b";

export type ComidaLocalStatusFormRow = {
  status?: string | null;
  payment_status?: string | null;
  published_at?: string | null;
  suspended_reason?: string | null;
  /** false when the reason column could not be read (fails closed for every change). */
  suspended_reason_read: boolean;
};

export type ComidaLocalStatusFormDecision =
  | {
      allowed: true;
      patch: { status: string; suspended_reason?: string | null };
      /** Compare-and-set: the status the decision was made against. */
      expectStatus: string;
    }
  | {
      allowed: false;
      code:
        | "unchanged"
        | "invalid_target"
        | "pre_payment_row"
        | "payment_required"
        | "payment_suspension_active"
        | "suspension_state_unreadable"
        | "entitlement_lapsed"
        | "entitlement_state_unreadable";
      message: string;
    };

function lc(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

export function comidaLocalRowHasPaymentProof(row: Pick<ComidaLocalStatusFormRow, "payment_status" | "published_at">): boolean {
  const p = lc(row.payment_status);
  if (p === "paid" || p === "waived") return true;
  if (p === LEGACY_NO_PAYMENT_STATUS) return Boolean(String(row.published_at ?? "").trim());
  return false;
}

export function decideComidaLocalStatusFormChange(input: {
  row: ComidaLocalStatusFormRow;
  requested: string | null | undefined;
  /** Read-only base-package entitlement evidence. Required (not undefined) when `requested` is `published`. */
  entitlement?: AdminEntitlementEvidence | null;
}): ComidaLocalStatusFormDecision {
  const current = lc(input.row.status);
  const requested = lc(input.requested);
  if (!COMIDA_LOCAL_FORM_STAFF_TARGETS.has(requested)) {
    return {
      allowed: false,
      code: "invalid_target",
      message: "Staff can only set Published, Paused or Suspended. Draft / pending payment are payment states.",
    };
  }
  if (current === requested) return { allowed: false, code: "unchanged", message: "The listing already has that status." };
  if (COMIDA_LOCAL_FORM_PRE_PAYMENT_STATUSES.has(current)) {
    return {
      allowed: false,
      code: "pre_payment_row",
      message: "This listing is awaiting payment. Its status changes only through a verified payment.",
    };
  }
  if (!input.row.suspended_reason_read) {
    return { allowed: false, code: "suspension_state_unreadable", message: ADMIN_PAYMENT_HOLD_MESSAGES.suspension_state_unreadable };
  }
  if (isPaymentOwnedSuspendedReason(input.row.suspended_reason)) {
    return { allowed: false, code: "payment_suspension_active", message: ADMIN_PAYMENT_HOLD_MESSAGES.payment_suspension_active };
  }
  if (requested === "published") {
    if (!comidaLocalRowHasPaymentProof(input.row)) {
      return {
        allowed: false,
        code: "payment_required",
        message: "This listing has no payment on record. It goes live only through a verified payment.",
      };
    }
    if (input.entitlement === "unreadable" || input.entitlement === undefined) {
      return { allowed: false, code: "entitlement_state_unreadable", message: ADMIN_PAYMENT_HOLD_MESSAGES.entitlement_state_unreadable };
    }
    if (input.entitlement === "lapsed") {
      return { allowed: false, code: "entitlement_lapsed", message: ADMIN_PAYMENT_HOLD_MESSAGES.entitlement_lapsed };
    }
    return { allowed: true, patch: { status: "published", suspended_reason: null }, expectStatus: current };
  }
  if (requested === "suspended") {
    return { allowed: true, patch: { status: "suspended", suspended_reason: COMIDA_LOCAL_STAFF_SUSPENSION_REASON }, expectStatus: current };
  }
  // paused
  return current === "suspended"
    ? { allowed: true, patch: { status: "paused", suspended_reason: null }, expectStatus: current }
    : { allowed: true, patch: { status: "paused" }, expectStatus: current };
}

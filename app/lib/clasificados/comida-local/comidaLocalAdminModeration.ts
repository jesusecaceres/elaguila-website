/**
 * Comida Local — canonical STAFF lifecycle policy (closeout 2). Pure: zero I/O, zero imports from
 * server-only modules, so the admin API route, the admin list UI and the verifier all read the SAME rules.
 *
 * Why this exists: the admin used to be a raw status <select> (draft / published / paused / suspended /
 * pending_payment) whose server action wrote whatever was picked — staff could flip an UNPAID
 * `pending_payment` row straight to `published`, with no payment proof, no audit row and no reason
 * marker. A staff surface must never manufacture payment truth. This policy replaces it.
 *
 * Status vocabulary is the table's own CHECK (migration 20260604120000): draft, published, paused,
 * suspended, pending_payment. There is NO `archived` / `rejected` status for this table, so:
 *   - suspend   published|paused  -> suspended   (suspended_reason = 'moderation')
 *   - unsuspend suspended         -> published   (restore; payment-suspended rows are refused)
 *   - archive   published         -> paused      (hidden, reversible; the table has no `archived` status)
 *   - republish paused            -> published   (payment-proof gated)
 * `draft` / `pending_payment` rows can NEVER be made live by staff: they go live only through the verified
 * payment fulfilment (`activatePaidComidaLocalListingFromRevenueOs`) or a cleared manual payment.
 *
 * `suspended_reason` ownership: the payment engine writes 'payment' (grace expired / chargeback) and its
 * restore is a CAS on that value. Staff writes 'moderation'. Staff restore must NEVER overwrite a
 * 'payment' suspension — that row comes back only when the payment is cured.
 *
 * Gate 5 (2026-09): the reason is now REQUIRED input, never guessed. A row whose reason could not be read is
 * refused (`suspension_reason_unreadable`, no write); any payment-engine reason (payment / chargeback / ...) blocks
 * Restore AND Republish; a lapsed / canceled base entitlement (read-only evidence supplied by the caller) blocks
 * Restore AND Republish. Staff never creates payment truth.
 */
import {
  ADMIN_PAYMENT_HOLD_MESSAGES,
  isPaymentOwnedSuspendedReason,
  type AdminEntitlementEvidence,
} from "@/app/admin/_lib/adminPaymentSuspensionPolicy";

export type ComidaLocalAdminAction = "suspend" | "unsuspend" | "archive" | "republish";

export const COMIDA_LOCAL_ADMIN_ACTIONS: readonly ComidaLocalAdminAction[] = [
  "suspend",
  "unsuspend",
  "archive",
  "republish",
] as const;

export function isComidaLocalAdminAction(x: unknown): x is ComidaLocalAdminAction {
  return typeof x === "string" && (COMIDA_LOCAL_ADMIN_ACTIONS as readonly string[]).includes(x);
}

/** Value staff suspensions write to `suspended_reason` (the payment engine writes 'payment'). */
export const COMIDA_LOCAL_STAFF_SUSPENSION_REASON = "moderation" as const;
export const COMIDA_LOCAL_PAYMENT_SUSPENSION_REASON = "payment" as const;
/** Staff archive (`paused` + this marker): the owner lifecycle route must not resume a staff-archived row. */
export const COMIDA_LOCAL_STAFF_ARCHIVE_REASON = "staff_archived" as const;

/** The status vocabulary the table CHECK accepts — nothing else is ever written by staff. */
export const COMIDA_LOCAL_STATUS_VOCAB = ["published", "pending_payment", "draft", "paused", "suspended"] as const;

/** Legacy dev-era rows (FOOD-L5B) were inserted straight to published with no Stripe involved. */
const LEGACY_NO_PAYMENT_STATUS = "not_required_for_l5b";

export type ComidaLocalAdminActionRow = {
  status?: string | null;
  payment_status?: string | null;
  published_at?: string | null;
  suspended_reason?: string | null;
  /** `false` when the reason column was not returned by the read (fail closed for reactivations). Default: read. */
  suspended_reason_read?: boolean;
  /** Read-only base-package entitlement evidence for Restore / Republish. undefined = not supplied (UI hints). */
  entitlement?: AdminEntitlementEvidence | null;
};

function s(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

/**
 * Does the row carry proof that it was a paid / legitimately-live listing?
 *   - `paid` (Stripe webhook) or `waived` (explicit staff/dev waiver): yes.
 *   - `not_required_for_l5b`: legacy rows that were live before payments existed — yes, but only when
 *     `published_at` is set (they were live).
 *   - anything else (`pending`, `failed`, blank, unknown): NO.
 * NOTE: `published_at` alone is NOT proof — the column is NOT NULL DEFAULT now(), so an unpaid
 * `pending_payment` row already has one. Payment status is what counts.
 */
export function comidaLocalRowHasPaymentProof(row: ComidaLocalAdminActionRow): boolean {
  const p = s(row.payment_status);
  if (p === "paid" || p === "waived") return true;
  if (p === LEGACY_NO_PAYMENT_STATUS) return Boolean(String(row.published_at ?? "").trim());
  return false;
}

export type ComidaLocalAdminActionDecision =
  | {
      ok: true;
      action: ComidaLocalAdminAction;
      /** Compare-and-set: the update only applies while the row is still in this status. */
      expectStatus: "published" | "paused" | "suspended";
      /** Fields to write (in addition to updated_at). */
      patch: { status: "published" | "paused" | "suspended"; suspended_reason?: string | null };
      /**
       * For `unsuspend`: the CAS must also require the reason to be NULL or 'moderation' so a concurrent payment
       * suspension is never overwritten.
       */
      requireNonPaymentReason: boolean;
    }
  | { ok: false; httpStatus: 400 | 409 | 500; error: string; message: string };

const refuse = (httpStatus: 400 | 409 | 500, error: string, message: string): ComidaLocalAdminActionDecision => ({
  ok: false,
  httpStatus,
  error,
  message,
});

/** Entitlement evidence -> refusal (lapsed = 409, unreadable = 500 fail closed). Lanes without evidence pass. */
function entitlementRefusal(evidence: AdminEntitlementEvidence | null | undefined): ComidaLocalAdminActionDecision | null {
  if (evidence === "lapsed") return refuse(409, "entitlement_lapsed", ADMIN_PAYMENT_HOLD_MESSAGES.entitlement_lapsed);
  if (evidence === "unreadable") return refuse(500, "entitlement_state_unreadable", ADMIN_PAYMENT_HOLD_MESSAGES.entitlement_state_unreadable);
  return null;
}

/** The ONE decision function for a staff action on a Comida Local row. */
export function decideComidaLocalAdminAction(
  action: ComidaLocalAdminAction,
  row: ComidaLocalAdminActionRow,
): ComidaLocalAdminActionDecision {
  const status = s(row.status);
  const reason = s(row.suspended_reason);

  switch (action) {
    case "suspend":
      if (status !== "published" && status !== "paused") {
        return refuse(409, "invalid_status_transition", `Only a published or paused listing can be suspended (this one is "${status || "unknown"}").`);
      }
      return {
        ok: true,
        action,
        expectStatus: status === "paused" ? "paused" : "published",
        patch: { status: "suspended", suspended_reason: COMIDA_LOCAL_STAFF_SUSPENSION_REASON },
        requireNonPaymentReason: false,
      };

    case "archive":
      if (status !== "published") {
        return refuse(409, "invalid_status_transition", `Only a published listing can be archived / paused (this one is "${status || "unknown"}").`);
      }
      return {
        ok: true,
        action,
        expectStatus: "published",
        patch: { status: "paused", suspended_reason: COMIDA_LOCAL_STAFF_ARCHIVE_REASON },
        requireNonPaymentReason: false,
      };

    case "unsuspend":
      if (status !== "suspended") {
        return refuse(409, "invalid_status_transition", `Only a suspended listing can be restored (this one is "${status || "unknown"}").`);
      }
      if (row.suspended_reason_read === false) {
        return refuse(500, "suspension_reason_unreadable", ADMIN_PAYMENT_HOLD_MESSAGES.suspension_state_unreadable);
      }
      if (reason === COMIDA_LOCAL_PAYMENT_SUSPENSION_REASON || isPaymentOwnedSuspendedReason(reason)) {
        return refuse(
          409,
          "payment_suspended",
          "This listing was suspended by the payment system (grace expired or chargeback). It is restored automatically when the payment is cured — staff cannot restore it here.",
        );
      }
      if (!comidaLocalRowHasPaymentProof(row)) {
        return refuse(
          409,
          "payment_required",
          "This listing has no verified payment (payment_status is not paid / waived). Staff cannot make it public — it goes live through a verified payment or a cleared manual payment.",
        );
      }
      {
        const lapsed = entitlementRefusal(row.entitlement);
        if (lapsed) return lapsed;
      }
      return {
        ok: true,
        action,
        expectStatus: "suspended",
        patch: { status: "published", suspended_reason: null },
        requireNonPaymentReason: true,
      };

    case "republish":
      if (status !== "paused") {
        return refuse(
          409,
          status === "draft" || status === "pending_payment" ? "payment_required" : "invalid_status_transition",
          status === "draft" || status === "pending_payment"
            ? "Draft / payment-pending listings cannot be published by staff — they go live through a verified payment or a cleared manual payment."
            : `Only a paused listing can be republished (this one is "${status || "unknown"}"). Use Restore for a suspended listing.`,
        );
      }
      if (!comidaLocalRowHasPaymentProof(row)) {
        return refuse(
          409,
          "payment_required",
          "This listing has no verified payment (payment_status is not paid / waived). Staff cannot make it public.",
        );
      }
      if (row.suspended_reason_read === false) {
        return refuse(500, "suspension_reason_unreadable", ADMIN_PAYMENT_HOLD_MESSAGES.suspension_state_unreadable);
      }
      if (isPaymentOwnedSuspendedReason(reason)) {
        return refuse(409, "payment_suspended", ADMIN_PAYMENT_HOLD_MESSAGES.payment_suspension_active);
      }
      {
        const lapsed = entitlementRefusal(row.entitlement);
        if (lapsed) return lapsed;
      }
      return {
        ok: true,
        action,
        expectStatus: "paused",
        patch: { status: "published", suspended_reason: null },
        // CAS: a payment suspension that lands after the read is never overwritten.
        requireNonPaymentReason: true,
      };
  }
}

/** Which staff actions the UI should offer for this row (each is still re-decided server-side). */
export function comidaLocalAvailableAdminActions(row: ComidaLocalAdminActionRow): ComidaLocalAdminAction[] {
  return COMIDA_LOCAL_ADMIN_ACTIONS.filter((a) => decideComidaLocalAdminAction(a, row).ok);
}

/**
 * Human reason a NON-available lifecycle action is unavailable (UI hint). Returns null when it is available.
 */
export function comidaLocalActionBlockedReason(action: ComidaLocalAdminAction, row: ComidaLocalAdminActionRow): string | null {
  const d = decideComidaLocalAdminAction(action, row);
  return d.ok ? null : d.message;
}

/** Comida Local status filter options that actually exist in the table (CHECK vocabulary). */
export const COMIDA_LOCAL_STATUS_FILTER_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "published", label: "Published" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused / archived" },
  { value: "suspended", label: "Suspended" },
];

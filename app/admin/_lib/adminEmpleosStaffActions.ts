/**
 * EMPLEOS ADMIN — the ONE staff lifecycle decision (2026-09 closeout 2). PURE (no I/O).
 *
 * Before this module the Empleos admin page carried TWO competing lifecycle systems in the same row:
 *  (1) legacy Pub / Review / Pause / Arch / Reject buttons -> POST /api/admin/empleos/listings/moderate
 *      (any status string, no audit log, rewrote `published_at` on every "Pub"), and
 *  (2) the canonical staff actions -> PATCH /api/admin/empleos/listings/[id] (audit log, but NO
 *      status/payment precondition: `unsuspend` set `published` on ANY row, so an unpaid paid-lane
 *      `draft` could be published for free by staff).
 * Both routes now call `runEmpleosStaffAction` (adminEmpleosStaffActionsServer.ts), which applies this
 * decision. Doctrine (same as adminReactivationPolicy): Restore / Republish are for rows that WERE live;
 * they must never double as a "publish without paying" button. Staff never fabricate payment truth —
 * the only thing this module reads about payment is a boolean the caller derived from a verified,
 * read-only payment record.
 */
import { isEmpleosFreeLane } from "@/app/clasificados/empleos/lib/empleosPublishLifecyclePolicy";
import { empleosRowIsPublicLive, republishCapabilityReasonEmpleos } from "@/app/admin/_lib/classifiedsRepublishCapability";

export const EMPLEOS_STAFF_ACTIONS = [
  "suspend",
  "unsuspend",
  "promote_on",
  "promote_off",
  "verify_on",
  "verify_off",
  "archive",
  "republish",
  "reject",
  "send_to_review",
] as const;

export type EmpleosStaffAction = (typeof EMPLEOS_STAFF_ACTIONS)[number];

export function isEmpleosStaffAction(x: unknown): x is EmpleosStaffAction {
  return typeof x === "string" && (EMPLEOS_STAFF_ACTIONS as readonly string[]).includes(x);
}

/** Moderation markers. Any non-empty `moderation_reason` blocks the owner from self-resuming a held row. */
export const EMPLEOS_STAFF_SUSPENDED_MARKER = "staff_suspended";
export const EMPLEOS_STAFF_REJECTED_MARKER = "staff_rejected";
export const EMPLEOS_STAFF_REVIEW_MARKER = "staff_review";

export const EMPLEOS_PAYMENT_REQUIRED_MESSAGE =
  "This paid-lane job post has never been live and no verified payment is on record. It goes live only through a verified payment or a cleared manual payment — Restore / Republish cannot publish it.";

export type EmpleosStaffRowState = {
  lifecycle_status?: string | null;
  lane?: string | null;
  published_at?: string | null;
  moderation_reason?: string | null;
  republish_count?: number | null;
  republish_override?: boolean | null;
};

export type EmpleosStaffDecision =
  | { ok: true; patch: Record<string, unknown>; auditAction: string; /** true when the patch changes lifecycle_status */ lifecycle: boolean }
  | { ok: false; status: 400 | 409; error: string; message: string };

function lc(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

/** A paid-lane (quick, premium, unknown) row that has never been live: its publication depends on payment. */
export function empleosRowAwaitsPayment(row: Pick<EmpleosStaffRowState, "lane" | "published_at">): boolean {
  return !isEmpleosFreeLane(row.lane) && !String(row.published_at ?? "").trim();
}

/**
 * Whether the payment record must be read for this action (so the route reads it only when needed).
 * Only a publish-like transition on a not-yet-live, never-live, paid-lane row depends on payment.
 */
export function empleosStaffActionNeedsPaymentCheck(action: EmpleosStaffAction, row: EmpleosStaffRowState): boolean {
  if (action !== "unsuspend" && action !== "republish") return false;
  if (empleosRowIsPublicLive(row as Record<string, unknown>)) return false;
  return empleosRowAwaitsPayment(row);
}

/**
 * UI hint for the Restore button: the reason it would be refused, or null. The server re-decides.
 * `paymentCleared` = a read-only, verified paid record exists for this listing (null/undefined = unknown → not cleared).
 */
export function empleosStaffRestoreBlockedReason(row: EmpleosStaffRowState, paymentCleared: boolean | null | undefined): string | null {
  if (empleosRowIsPublicLive(row as Record<string, unknown>)) return null;
  if (empleosRowAwaitsPayment(row) && paymentCleared !== true) return EMPLEOS_PAYMENT_REQUIRED_MESSAGE;
  return null;
}

export function normalizeEmpleosStaffReason(reason: unknown): string | null {
  if (typeof reason !== "string") return null;
  const t = reason.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 300) : null;
}

/**
 * A never-paid paid-lane `draft` is the ONLY state the Revenue OS checkout pre-flight accepts (owned `draft`).
 * Moving it to `paused` / `pending_review` would strand it: the owner could no longer pay and Restore stays
 * payment-gated. Staff may still `reject` or `archive` it (terminal, honest decisions).
 */
export const EMPLEOS_UNPAID_DRAFT_MESSAGE =
  "This paid-lane job post is an unpaid draft — nothing is live to suspend or review, and moving it would leave the owner unable to pay. Reject or archive it instead.";

export function empleosActionStrandsUnpaidDraft(action: EmpleosStaffAction, row: EmpleosStaffRowState): boolean {
  return (action === "suspend" || action === "send_to_review") && lc(row.lifecycle_status) === "draft" && empleosRowAwaitsPayment(row);
}

function invalidTransition(action: string, status: string): EmpleosStaffDecision {
  return {
    ok: false,
    status: 409,
    error: "invalid_transition",
    message: `Cannot ${action.replace(/_/g, " ")} an ${status || "unknown"} listing. Restore it first.`,
  };
}

/**
 * Decide one staff action. `paymentCleared` is required only when `empleosStaffActionNeedsPaymentCheck`
 * is true; a missing value is treated as NOT cleared (fail closed).
 */
export function decideEmpleosStaffAction(input: {
  action: EmpleosStaffAction;
  row: EmpleosStaffRowState;
  reason?: unknown;
  now: string;
  paymentCleared?: boolean | null;
}): EmpleosStaffDecision {
  const { action, row, now } = input;
  const status = lc(row.lifecycle_status);
  const reason = normalizeEmpleosStaffReason(input.reason);
  const patch: Record<string, unknown> = { updated_at: now };

  if (empleosActionStrandsUnpaidDraft(action, row)) {
    return { ok: false, status: 409, error: "unpaid_draft", message: EMPLEOS_UNPAID_DRAFT_MESSAGE };
  }

  const gate = (): EmpleosStaffDecision | null => {
    if (empleosRowIsPublicLive(row as Record<string, unknown>)) return null;
    if (empleosRowAwaitsPayment(row) && input.paymentCleared !== true) {
      return { ok: false, status: 409, error: "payment_required", message: EMPLEOS_PAYMENT_REQUIRED_MESSAGE };
    }
    return null;
  };
  /** Publishing a not-live row: keep an original `published_at`; stamp one only when the row never had it. */
  const publishPatch = () => {
    patch.lifecycle_status = "published";
    patch.moderation_reason = null;
    if (!String(row.published_at ?? "").trim()) patch.published_at = now;
  };

  switch (action) {
    case "republish": {
      if (status === "archived") {
        return { ok: false, status: 400, error: "cannot_republish_archived", message: "Restore an archived listing before republishing it." };
      }
      if (republishCapabilityReasonEmpleos(row as Record<string, unknown>) !== null) {
        return { ok: false, status: 400, error: "republish_not_eligible", message: "Staff disabled republish for this row." };
      }
      Object.assign(patch, {
        republished_at: now,
        republish_count: Number(row.republish_count ?? 0) + 1,
        last_republished_source: "admin",
        last_republished_by: null,
      });
      if (!empleosRowIsPublicLive(row as Record<string, unknown>)) {
        const blocked = gate();
        if (blocked) return blocked;
        publishPatch();
        return { ok: true, patch, auditAction: "republish", lifecycle: true };
      }
      return { ok: true, patch, auditAction: "republish", lifecycle: false };
    }
    case "unsuspend": {
      const blocked = gate();
      if (blocked) return blocked;
      publishPatch();
      return { ok: true, patch, auditAction: "empleos_admin_unsuspend", lifecycle: true };
    }
    case "suspend":
      if (status === "archived") return invalidTransition("suspend", status);
      patch.lifecycle_status = "paused";
      // Marker so the owner-side policy cannot self-resume a STAFF suspension; lifting (unsuspend) clears it.
      patch.moderation_reason = reason ?? EMPLEOS_STAFF_SUSPENDED_MARKER;
      return { ok: true, patch, auditAction: "empleos_admin_suspend", lifecycle: true };
    case "reject":
      if (status === "archived") return invalidTransition("reject", status);
      patch.lifecycle_status = "rejected";
      patch.moderation_reason = reason ?? EMPLEOS_STAFF_REJECTED_MARKER;
      return { ok: true, patch, auditAction: "empleos_admin_reject", lifecycle: true };
    case "send_to_review":
      if (status === "archived") return invalidTransition("send to review", status);
      patch.lifecycle_status = "pending_review";
      patch.moderation_reason = reason ?? EMPLEOS_STAFF_REVIEW_MARKER;
      return { ok: true, patch, auditAction: "empleos_admin_send_to_review", lifecycle: true };
    case "archive":
      patch.lifecycle_status = "archived";
      return { ok: true, patch, auditAction: "empleos_admin_archive", lifecycle: true };
    case "promote_on":
      patch.admin_promoted = true;
      return { ok: true, patch, auditAction: "empleos_admin_promote_on", lifecycle: false };
    case "promote_off":
      patch.admin_promoted = false;
      return { ok: true, patch, auditAction: "empleos_admin_promote_off", lifecycle: false };
    case "verify_on":
      patch.leonix_verified = true;
      patch.verified_employer = true;
      return { ok: true, patch, auditAction: "empleos_admin_verify_on", lifecycle: false };
    case "verify_off":
      patch.leonix_verified = false;
      patch.verified_employer = false;
      return { ok: true, patch, auditAction: "empleos_admin_verify_off", lifecycle: false };
    default:
      return { ok: false, status: 400, error: "invalid_action", message: "Unknown staff action." };
  }
}

/** Legacy `/moderate` body value -> the canonical action. `draft` is not a staff action (returns null). */
export const EMPLEOS_LEGACY_STATUS_TO_ACTION: Readonly<Record<string, EmpleosStaffAction>> = {
  published: "unsuspend",
  pending_review: "send_to_review",
  paused: "suspend",
  archived: "archive",
  rejected: "reject",
};

export function legacyEmpleosStatusToAction(status: string): EmpleosStaffAction | null {
  return Object.prototype.hasOwnProperty.call(EMPLEOS_LEGACY_STATUS_TO_ACTION, status) ? EMPLEOS_LEGACY_STATUS_TO_ACTION[status] : null;
}

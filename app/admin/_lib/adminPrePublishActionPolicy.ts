/**
 * Dedicated-table lanes (Servicios, Restaurantes) - Admin lifecycle actions must not launder a never-paid row live
 * (2026-09 forensic closeout). These routes wrote `published` on `unsuspend` / a reactivating `republish` from ANY
 * status and allowed `suspend` / `archive` on `pending_payment`, so `pending_payment -> suspended -> published`
 * published an unpaid listing with no payment record.
 *
 * Rules (PURE):
 *  - a pre-publish row (draft / pending / pending_payment / payment_failed) has nothing live to suspend or archive
 *    -> `suspend` / `archive` are refused (`not_published`), so it can never become a "restorable" suspended row;
 *  - `unsuspend` / reactivating `republish` on a pre-publish row is refused (`payment_required`): it goes live only
 *    through a verified payment (Revenue OS fulfilment), never through Admin.
 * Restoring a suspended / archived / rejected row is unaffected: only a once-published row can reach those states.
 */
export const ADMIN_PRE_PUBLISH_STATUSES: ReadonlySet<string> = new Set(["draft", "pending", "pending_payment", "payment_failed"]);

/**
 * Legacy Servicios "listing_status" form (ServiciosAdminOpsListingCard). It is a free status setter, so it gets the same
 * doctrine as the lifecycle route (Gate 5): a row that is NOT yet a paid / once-published listing (any pre-payment
 * status) cannot be moved by it at all - not to `published`, and not to `suspended` / `rejected` (which would turn a
 * never-paid row into a "restorable" one) - and a change TO `published` from any other status is a REACTIVATION that
 * the caller must clear through the payment hold (suspended_reason / entitlement) before writing.
 */
export const SERVICIOS_FORM_PRE_PAYMENT_STATUSES: ReadonlySet<string> = new Set([
  ...ADMIN_PRE_PUBLISH_STATUSES,
  "preview_ready",
  "publish_ready",
]);

export type ServiciosStatusFormDecision =
  | { allowed: true; reactivates: boolean }
  | { allowed: false; code: "pre_publish_row" | "unchanged"; message: string };

export function decideServiciosStatusFormChange(input: {
  current: string | null | undefined;
  requested: string | null | undefined;
}): ServiciosStatusFormDecision {
  const current = String(input.current ?? "").trim().toLowerCase();
  const requested = String(input.requested ?? "").trim().toLowerCase();
  if (current === requested) return { allowed: false, code: "unchanged", message: "The listing already has that status." };
  if (SERVICIOS_FORM_PRE_PAYMENT_STATUSES.has(current)) {
    return {
      allowed: false,
      code: "pre_publish_row",
      message: "This listing has not been published (awaiting payment). Its status is commercial truth - it changes only through a verified payment.",
    };
  }
  return { allowed: true, reactivates: requested === "published" };
}

export type AdminPrePublishDecision =
  | { blocked: false }
  | { blocked: true; code: "payment_required" | "not_published"; message: string };

export function decideAdminPrePublishAction(input: {
  action: "suspend" | "unsuspend" | "archive" | "republish" | string;
  status: string | null | undefined;
  /** republish only: true when the row is not publicly live (i.e. the action would reactivate it). */
  reactivates?: boolean;
}): AdminPrePublishDecision {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (!ADMIN_PRE_PUBLISH_STATUSES.has(status)) return { blocked: false };
  if (input.action === "suspend" || input.action === "archive") {
    return {
      blocked: true,
      code: "not_published",
      message: "This listing has never been published (awaiting payment) - there is nothing live to suspend or archive.",
    };
  }
  if (input.action === "unsuspend" || (input.action === "republish" && input.reactivates)) {
    return {
      blocked: true,
      code: "payment_required",
      message: "This listing is awaiting payment. It goes live only through a verified payment - Restore / Republish cannot publish it.",
    };
  }
  return { blocked: false };
}

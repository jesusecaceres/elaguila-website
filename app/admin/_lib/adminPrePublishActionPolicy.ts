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

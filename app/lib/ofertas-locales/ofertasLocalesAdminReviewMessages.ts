/**
 * Ofertas Locales admin review — pure helpers shared by the server action, both admin routes and the verifier
 * (no I/O, no server-only imports). Closeout 2.
 */
import type { OfertaLocalAdminReviewAction } from "./ofertasLocalesAdminReviewMutations";

export const OFERTAS_LOCALES_ADMIN_REVIEW_ACTIONS: readonly OfertaLocalAdminReviewAction[] = [
  "approve",
  "reject",
  "archive",
  "restore",
] as const;

export function isOfertaLocalAdminReviewAction(x: unknown): x is OfertaLocalAdminReviewAction {
  return typeof x === "string" && (OFERTAS_LOCALES_ADMIN_REVIEW_ACTIONS as readonly string[]).includes(x);
}

/** Human message for a mutation error code (never a bare "failed": staff need the actual gate that blocked). */
export function ofertaReviewErrorMessage(error: string): string {
  switch (error) {
    case "rejection_reason_required":
      return "Rejection reason is required.";
    case "unresolved_review_items":
      return "Resolve all pending or needs_review AI items before approval.";
    case "invalid_transition":
      return "This offer cannot move to that review state from its current status.";
    case "not_found":
      return "Offer was not found.";
    case "confirmation_required":
      return "Confirm the operational review before executing this action.";
    case "commercial_entitlement_required":
      return "Approval needs a paid, active entitlement (or an eligible partner courtesy). Staff cannot mark an offer paid from here.";
    case "leonix_ad_id_required":
      return "Approval needs a valid Leonix Ad ID (LNX-XXXXXXXX).";
    case "term_elapsed_renewal_required":
      return "This offer's paid term has ended. Approval never grants a new term - the owner must renew through checkout.";
    case "public_source_asset_required":
    case "source_parent_lookup_failed":
    case "source_item_lookup_failed":
      return "Approval needs a current public source asset with approved items.";
    case "source_replacement_pending":
      return "A replacement source asset is pending review — resolve it before approval.";
    case "blocking_scan_pages":
      return "Some scan pages are still queued, processing or failed — wait for the scan or re-run it.";
    case "approved_source_items_required":
      return "Approval needs at least one approved item on the active source.";
    default:
      return "Review action failed. Try again or inspect the offer state.";
  }
}

/** HTTP status for a mutation error code (the admin API routes). */
export function ofertaReviewErrorHttpStatus(error: string): number {
  switch (error) {
    case "not_found":
      return 404;
    case "invalid_transition":
      return 409;
    case "confirmation_required":
      return 400;
    case "rejection_reason_required":
    case "unresolved_review_items":
    case "term_elapsed_renewal_required":
    case "commercial_entitlement_required":
    case "leonix_ad_id_required":
    case "public_source_asset_required":
    case "source_replacement_pending":
    case "blocking_scan_pages":
    case "approved_source_items_required":
      return 422;
    default:
      return 500;
  }
}

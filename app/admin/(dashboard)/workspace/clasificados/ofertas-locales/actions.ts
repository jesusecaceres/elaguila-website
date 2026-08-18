"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  mutateOfertaLocalAdminReview,
  type OfertaLocalAdminReviewAction,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations";
import { buildAdminActionReturnUrl } from "@/app/admin/_lib/adminQueueActionFlow";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

const ALLOWED_ACTIONS: ReadonlySet<OfertaLocalAdminReviewAction> = new Set([
  "approve",
  "reject",
  "archive",
]);

function adminReviewActionMessage(error: string): string {
  switch (error) {
    case "rejection_reason_required":
      return "Rejection reason is required.";
    case "unresolved_review_items":
      return "Resolve all pending or needs_review AI items before approval.";
    case "invalid_transition":
      return "This offer cannot move to that review state.";
    case "not_found":
      return "Offer was not found.";
    case "confirmation_required":
      return "Confirm the operational review before executing this action.";
    default:
      return "Review action failed. Try again or inspect the offer state.";
  }
}

function redirectWithReviewResult(params: {
  returnTo: string;
  status: "success" | "error";
  action: OfertaLocalAdminReviewAction;
  id: string;
  label: string;
  error?: string | null;
}): never {
  redirect(
    buildAdminActionReturnUrl({
      returnTo: params.returnTo || "/admin/workspace/clasificados/ofertas-locales",
      action_status: params.status,
      action: params.action,
      target: params.id,
      target_label: params.label,
      target_ad_id: params.id,
      action_error: params.error,
    })
  );
}

export async function reviewOfertaLocalAdminAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const id = String(formData.get("offer_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim() as OfertaLocalAdminReviewAction;
  const note = String(formData.get("admin_note") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "").trim();
  const label = String(formData.get("target_label") ?? "").trim();
  const confirmed = String(formData.get("confirmed") ?? "") === "true";

  if (!id || !ALLOWED_ACTIONS.has(action)) {
    if (returnTo) {
      redirectWithReviewResult({
        returnTo,
        status: "error",
        action: ALLOWED_ACTIONS.has(action) ? action : "archive",
        id: id || "unknown",
        label,
        error: "Invalid review action.",
      });
    }
    return;
  }

  if (!confirmed) {
    redirectWithReviewResult({
      returnTo,
      status: "error",
      action,
      id,
      label,
      error: adminReviewActionMessage("confirmation_required"),
    });
  }

  const supabase = getAdminSupabase();
  const result = await mutateOfertaLocalAdminReview(supabase, id, action, note || null);
  if (!result.ok) {
    redirectWithReviewResult({
      returnTo,
      status: "error",
      action,
      id,
      label,
      error: adminReviewActionMessage(result.error),
    });
  }

  revalidatePath("/clasificados/ofertas-locales");
  revalidatePath("/admin/workspace/clasificados/ofertas-locales");
  redirectWithReviewResult({
    returnTo,
    status: "success",
    action,
    id: result.id,
    label,
  });
}

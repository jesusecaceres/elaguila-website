"use server";

import { isVerifiedAdminSession } from "@/app/admin/_lib/adminVerifiedSession";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { OfertaLocalAdminReviewAction } from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations";
import {
  isOfertaLocalAdminReviewAction,
  ofertaReviewErrorMessage,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewMessages";
import { runOfertaLocalAdminReview } from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewService";
import { buildAdminActionReturnUrl } from "@/app/admin/_lib/adminQueueActionFlow";
import { getAdminSupabase } from "@/app/lib/supabase/server";

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
  if (!(await isVerifiedAdminSession(c))) throw new Error("Unauthorized");

  const id = String(formData.get("offer_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim() as OfertaLocalAdminReviewAction;
  const note = String(formData.get("admin_note") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "").trim();
  const label = String(formData.get("target_label") ?? "").trim();
  const confirmed = String(formData.get("confirmed") ?? "") === "true";

  if (!id || !isOfertaLocalAdminReviewAction(action)) {
    if (returnTo) {
      redirectWithReviewResult({
        returnTo,
        status: "error",
        action: isOfertaLocalAdminReviewAction(action) ? action : "archive",
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
      error: ofertaReviewErrorMessage("confirmation_required"),
    });
  }

  // One engine for every staff entry point: mutation (all approve gates intact) + audit row + revalidation.
  const supabase = getAdminSupabase();
  const result = await runOfertaLocalAdminReview(supabase, { id, action, note: note || null });
  if (!result.ok) {
    redirectWithReviewResult({
      returnTo,
      status: "error",
      action,
      id,
      label,
      error: ofertaReviewErrorMessage(result.error),
    });
  }

  redirectWithReviewResult({
    returnTo,
    status: "success",
    action,
    id: result.id,
    label,
  });
}

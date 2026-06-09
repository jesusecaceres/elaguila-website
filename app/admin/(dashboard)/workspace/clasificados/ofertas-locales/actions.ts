"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  mutateOfertaLocalAdminReview,
  type OfertaLocalAdminReviewAction,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

const ALLOWED_ACTIONS: ReadonlySet<OfertaLocalAdminReviewAction> = new Set([
  "approve",
  "reject",
  "archive",
]);

export async function reviewOfertaLocalAdminAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const id = String(formData.get("offer_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim() as OfertaLocalAdminReviewAction;
  const note = String(formData.get("admin_note") ?? "").trim();

  if (!id || !ALLOWED_ACTIONS.has(action)) return;

  const supabase = getAdminSupabase();
  const result = await mutateOfertaLocalAdminReview(supabase, id, action, note || null);
  if (!result.ok) return;

  revalidatePath("/clasificados/ofertas-locales");
  revalidatePath("/admin/workspace/clasificados/ofertas-locales");
}

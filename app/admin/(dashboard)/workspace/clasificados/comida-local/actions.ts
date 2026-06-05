"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { updateAdminComidaLocalListingStatus } from "@/app/lib/clasificados/comida-local/comidaLocalAdminQueries";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

const ALLOWED_STATUS = new Set([
  "draft",
  "published",
  "paused",
  "suspended",
  "pending_payment",
]);

export async function updateComidaLocalPublicListingStatusAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const id = String(formData.get("listing_id") ?? "").trim();
  const status = String(formData.get("listing_status") ?? "").trim();
  if (!id || !ALLOWED_STATUS.has(status)) return;

  const supabase = getAdminSupabase();
  const { ok } = await updateAdminComidaLocalListingStatus(supabase, id, status);
  if (!ok) return;

  revalidatePath("/clasificados/comida-local");
  revalidatePath("/admin/workspace/clasificados/comida-local");
}

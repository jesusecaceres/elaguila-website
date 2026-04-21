"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

const ALLOWED_STATUS = new Set([
  "draft",
  "preview_ready",
  "publish_ready",
  "published",
  "paused_unpublished",
  "pending_review",
  "rejected",
  "suspended",
]);

export async function updateServiciosPublicListingStatusAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const id = String(formData.get("listing_id") ?? "").trim();
  const status = String(formData.get("listing_status") ?? "").trim();
  if (!id || !ALLOWED_STATUS.has(status)) return;

  const supabase = getAdminSupabase();
  await supabase
    .from("servicios_public_listings")
    .update({ listing_status: status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/clasificados/servicios");
  revalidatePath("/clasificados/servicios/resultados");
  revalidatePath("/admin/workspace/clasificados/servicios");
}

export async function setServiciosListingLeonixVerifiedAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const id = String(formData.get("listing_id") ?? "").trim();
  const verified = String(formData.get("leonix_verified") ?? "0") === "1";
  if (!id) return;

  const supabase = getAdminSupabase();
  await supabase
    .from("servicios_public_listings")
    .update({ leonix_verified: verified, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/clasificados/servicios");
  revalidatePath("/clasificados/servicios/resultados");
  revalidatePath("/admin/workspace/clasificados/servicios");
}

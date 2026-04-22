"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { insertServiciosAnalyticsEvent } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
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

  const notesRaw = String(formData.get("moderation_notes") ?? "");
  const moderation_notes = notesRaw.trim().length > 0 ? notesRaw.trim().slice(0, 8000) : null;

  const supabase = getAdminSupabase();
  const { data: row } = await supabase.from("servicios_public_listings").select("slug").eq("id", id).maybeSingle();
  const slug = row && typeof (row as { slug?: string }).slug === "string" ? (row as { slug: string }).slug : null;

  await supabase
    .from("servicios_public_listings")
    .update({ listing_status: status, updated_at: new Date().toISOString(), moderation_notes })
    .eq("id", id);

  if (slug) {
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "admin_moderation",
      meta: { action: "listing_status", listing_status: status },
    });
  }

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
  const { data: row } = await supabase.from("servicios_public_listings").select("slug").eq("id", id).maybeSingle();
  const slug = row && typeof (row as { slug?: string }).slug === "string" ? (row as { slug: string }).slug : null;

  await supabase
    .from("servicios_public_listings")
    .update({ leonix_verified: verified, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (slug) {
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "admin_moderation",
      meta: { action: "leonix_verified", value: verified },
    });
  }

  revalidatePath("/clasificados/servicios");
  revalidatePath("/clasificados/servicios/resultados");
  revalidatePath("/admin/workspace/clasificados/servicios");
}

const REVIEW_STATUS = new Set(["approved", "rejected"]);

export async function setServiciosReviewModerationStatusAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const reviewId = String(formData.get("review_id") ?? "").trim();
  const status = String(formData.get("review_status") ?? "").trim();
  const listingSlug = String(formData.get("listing_slug") ?? "").trim();
  if (!reviewId || !REVIEW_STATUS.has(status)) return;

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  await supabase
    .from("servicios_listing_reviews")
    .update({ status, moderated_at: now })
    .eq("id", reviewId);

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(listingSlug) && listingSlug.length <= 120) {
    await insertServiciosAnalyticsEvent({
      listingSlug,
      eventType: status === "approved" ? "review_approved" : "review_rejected",
      meta: { reviewId, channel: "admin_moderation" },
    });
  }

  revalidatePath("/clasificados/servicios");
  revalidatePath("/admin/workspace/clasificados/servicios");
}

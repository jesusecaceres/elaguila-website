"use server";

import { isVerifiedAdminSession } from "@/app/admin/_lib/adminVerifiedSession";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { insertServiciosAnalyticsEvent } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { serviciosStatusFormAllowsMutation } from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { decideServiciosStatusFormChange } from "@/app/admin/_lib/adminPrePublishActionPolicy";
import { evaluateAdminReactivationHold } from "@/app/admin/_lib/adminPaymentSuspensionPolicyServer";

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

/** Moderation notes only — never touches listing_status. Safe to call regardless of lifecycle state. */
export async function updateServiciosModerationNotesAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!(await isVerifiedAdminSession(c))) throw new Error("Unauthorized");

  const id = String(formData.get("listing_id") ?? "").trim();
  if (!id) return;

  const notesRaw = String(formData.get("moderation_notes") ?? "");
  const moderation_notes = notesRaw.trim().length > 0 ? notesRaw.trim().slice(0, 8000) : null;

  const supabase = getAdminSupabase();
  await supabase
    .from("servicios_public_listings")
    .update({ moderation_notes, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/workspace/clasificados/servicios");
}

export async function updateServiciosPublicListingStatusAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!(await isVerifiedAdminSession(c))) throw new Error("Unauthorized");

  const id = String(formData.get("listing_id") ?? "").trim();
  const status = String(formData.get("listing_status") ?? "").trim();
  if (!id || !ALLOWED_STATUS.has(status)) return;

  const notesRaw = String(formData.get("moderation_notes") ?? "");
  const moderation_notes = notesRaw.trim().length > 0 ? notesRaw.trim().slice(0, 8000) : null;

  const supabase = getAdminSupabase();
  const { data: row } = await supabase
    .from("servicios_public_listings")
    .select("slug, listing_status")
    .eq("id", id)
    .maybeSingle();
  const slug = row && typeof (row as { slug?: string }).slug === "string" ? (row as { slug: string }).slug : null;

  // Server-side twin of the client-side guard: a pending_payment row's listing_status is commercial
  // truth, never staff-editable through this legacy form, regardless of what was submitted.
  if (!serviciosStatusFormAllowsMutation((row as { listing_status?: string } | null)?.listing_status)) {
    await supabase
      .from("servicios_public_listings")
      .update({ moderation_notes, updated_at: new Date().toISOString() })
      .eq("id", id);
    revalidatePath("/admin/workspace/clasificados/servicios");
    return;
  }

  // Gate 5: this legacy form is not a publication authority. Pre-payment rows cannot be moved by it, and a change TO
  // `published` is a reactivation that must clear the payment hold (payment suspension / lapsed entitlement, read-only,
  // fail-closed). A refusal saves the moderation notes only (same shape as the pending_payment branch above) and is audited.
  const currentStatus = String((row as { listing_status?: string } | null)?.listing_status ?? "");
  const change = decideServiciosStatusFormChange({ current: currentStatus, requested: status });
  let refusal: string | null = change.allowed ? null : change.code;
  if (change.allowed && change.reactivates) {
    const hold = await evaluateAdminReactivationHold(supabase, {
      table: "servicios_public_listings",
      id,
      status: currentStatus,
      requireEntitlement: true,
    });
    if (hold.blocked) refusal = hold.code;
  }
  if (refusal) {
    await supabase
      .from("servicios_public_listings")
      .update({ moderation_notes, updated_at: new Date().toISOString() })
      .eq("id", id);
    void appendAdminAuditLog({
      action: "servicios_admin_status_form_refused",
      targetType: "servicios_public_listing",
      targetId: id,
      meta: { slug, from: currentStatus, requested: status, code: refusal },
    });
    revalidatePath("/admin/workspace/clasificados/servicios");
    return;
  }

  let statusUpdate = supabase
    .from("servicios_public_listings")
    .update({ listing_status: status, updated_at: new Date().toISOString(), moderation_notes })
    .eq("id", id)
    // Compare-and-set on the status the decision was made against (a webhook / payment suspension may have moved it).
    .eq("listing_status", currentStatus);
  if (status === "published") statusUpdate = statusUpdate.or("suspended_reason.is.null,suspended_reason.neq.payment");
  await statusUpdate;
  void appendAdminAuditLog({
    action: "servicios_admin_status_form",
    targetType: "servicios_public_listing",
    targetId: id,
    meta: { slug, from: currentStatus, to: status },
  });

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
  if (!(await isVerifiedAdminSession(c))) throw new Error("Unauthorized");

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
  if (!(await isVerifiedAdminSession(c))) throw new Error("Unauthorized");

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

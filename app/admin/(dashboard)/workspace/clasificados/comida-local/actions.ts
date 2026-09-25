"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { decideComidaLocalStatusFormChange } from "@/app/admin/_lib/adminComidaLocalStatusFormPolicy";
import { readAdminBaseEntitlementEvidence } from "@/app/admin/_lib/adminPaymentSuspensionPolicyServer";
import { isVerifiedAdminSession } from "@/app/admin/_lib/adminVerifiedSession";
import { getAdminSupabase } from "@/app/lib/supabase/server";

/**
 * Legacy Comida Local status form. Not a publication authority (see adminComidaLocalStatusFormPolicy.ts):
 * pre-payment and payment-suspended rows are never moved, `published` needs payment proof and a clear payment hold,
 * and every write is a compare-and-set on the status the decision was made against. Refusals write nothing and are
 * audited.
 */
export async function updateComidaLocalPublicListingStatusAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!(await isVerifiedAdminSession(c))) throw new Error("Unauthorized");

  const id = String(formData.get("listing_id") ?? "").trim();
  const status = String(formData.get("listing_status") ?? "").trim();
  if (!id || !status) return;

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("comida_local_public_listings")
    .select("id, slug, status, payment_status, published_at, suspended_reason")
    .eq("id", id)
    .maybeSingle();
  if (readError || !row) return;

  const rec = row as Record<string, unknown>;
  const reasonRead = Object.prototype.hasOwnProperty.call(rec, "suspended_reason");
  const entitlement =
    status.trim().toLowerCase() === "published" ? await readAdminBaseEntitlementEvidence(supabase, id) : undefined;
  const decision = decideComidaLocalStatusFormChange({
    row: {
      status: rec.status as string | null,
      payment_status: rec.payment_status as string | null,
      published_at: rec.published_at as string | null,
      suspended_reason: reasonRead ? (rec.suspended_reason as string | null) : null,
      suspended_reason_read: reasonRead,
    },
    requested: status,
    entitlement,
  });
  const slug = typeof rec.slug === "string" ? rec.slug : null;

  if (!decision.allowed) {
    if (decision.code !== "unchanged") {
      void appendAdminAuditLog({
        action: "comida_local_admin_status_form_refused",
        targetType: "comida_local_public_listing",
        targetId: id,
        meta: { slug, from: rec.status ?? null, requested: status, code: decision.code },
      });
    }
    return;
  }

  let update = supabase
    .from("comida_local_public_listings")
    .update({ ...decision.patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", decision.expectStatus);
  // A payment-engine suspension that lands after the read above wins (compare-and-set excludes it).
  update = update.or("suspended_reason.is.null,suspended_reason.not.in.(payment,chargeback,payment_failure,grace_expired)");
  const { error } = await update;
  if (error) return;

  void appendAdminAuditLog({
    action: "comida_local_admin_status_form",
    targetType: "comida_local_public_listing",
    targetId: id,
    meta: { slug, from: decision.expectStatus, to: decision.patch.status },
  });

  revalidatePath("/clasificados/comida-local");
  revalidatePath("/admin/workspace/clasificados/comida-local");
  if (slug) revalidatePath(`/clasificados/comida-local/${slug}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";
import { getAdminAuthUserIdFromCookies, getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";

async function assertPrayerAdmin() {
  await requireLeonixAdminPermission("can_manage_prayer_wall");
}

async function moderatorId(): Promise<string> {
  const c = await cookies();
  return getAdminAuthUserIdFromCookies(c) || getAdminOperatorEmailFromCookies(c) || "admin";
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function writeEvent(args: {
  prayerId: string;
  action: "APPROVE" | "REJECT" | "REMOVE" | "REDACT_PII_AND_APPROVE" | "CLOSE" | "MARK_REVIEWED";
  reasonCode: string | null;
  note?: string | null;
}) {
  const admin = getAdminSupabase();
  await admin.from("prayer_moderation_events").insert({
    prayer_request_id: args.prayerId,
    action: args.action,
    moderator_user_id: await moderatorId(),
    reason_code: args.reasonCode,
    note: args.note ?? null,
  });
}

function backTo(prayerId: string, tab: string) {
  revalidatePath("/iglesias");
  revalidatePath("/admin/workspace/iglesias");
  revalidatePath("/admin/workspace/iglesias/prayers");
  redirect(`/admin/workspace/iglesias/prayers?tab=${encodeURIComponent(tab)}&id=${prayerId}&saved=1`);
}

export async function approvePrayerAction(formData: FormData) {
  await assertPrayerAdmin();
  const id = str(formData, "prayer_id");
  if (!id) throw new Error("Missing prayer");
  const admin = getAdminSupabase();
  const now = new Date().toISOString();
  const { data: row } = await admin.from("prayer_requests").select("visibility").eq("id", id).maybeSingle();
  const publish = row?.visibility === "PUBLIC_NAMED" || row?.visibility === "PUBLIC_ANONYMOUS";
  const { error } = await admin
    .from("prayer_requests")
    .update({
      moderation_status: "CLEARLY_SAFE",
      status: "OPEN",
      published_at: publish ? now : null,
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await writeEvent({ prayerId: id, action: "APPROVE", reasonCode: str(formData, "reason_code") || "APPROVE" });
  auditAdminWrite("iglesias_prayer_approved", "prayer_request", id, {});
  if (row?.visibility === "PRIVATE_PRAYER_TEAM") {
    const { orchestratePrivatePrayerRouting } = await import("@/app/lib/iglesias/prayerNetworkOrchestrate");
    await orchestratePrivatePrayerRouting(id);
  }
  backTo(id, "approved");
}

export async function rejectPrayerAction(formData: FormData) {
  await assertPrayerAdmin();
  const id = str(formData, "prayer_id");
  if (!id) throw new Error("Missing prayer");
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("prayer_requests")
    .update({
      moderation_status: "DISALLOWED",
      status: "MODERATION_HOLD",
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await writeEvent({ prayerId: id, action: "REJECT", reasonCode: str(formData, "reason_code") || "REJECT" });
  auditAdminWrite("iglesias_prayer_rejected", "prayer_request", id, {});
  backTo(id, "rejected");
}

export async function removePrayerAction(formData: FormData) {
  await assertPrayerAdmin();
  const id = str(formData, "prayer_id");
  if (!id) throw new Error("Missing prayer");
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("prayer_requests")
    .update({
      status: "REMOVED",
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await writeEvent({ prayerId: id, action: "REMOVE", reasonCode: str(formData, "reason_code") || "REMOVE" });
  auditAdminWrite("iglesias_prayer_removed", "prayer_request", id, {});
  backTo(id, "rejected");
}

export async function redactAndApprovePrayerAction(formData: FormData) {
  await assertPrayerAdmin();
  const id = str(formData, "prayer_id");
  const redacted = str(formData, "redacted_body");
  if (!id || redacted.length < 20) throw new Error("Missing redaction");
  const admin = getAdminSupabase();
  const { data: row } = await admin.from("prayer_requests").select("body, visibility").eq("id", id).maybeSingle();
  if (!row) throw new Error("Missing prayer");
  const now = new Date().toISOString();
  const publish = row.visibility === "PUBLIC_NAMED" || row.visibility === "PUBLIC_ANONYMOUS";
  const { error } = await admin
    .from("prayer_requests")
    .update({
      body_original_internal: row.body,
      body: redacted.slice(0, 2000),
      moderation_status: "CLEARLY_SAFE",
      status: "OPEN",
      published_at: publish ? now : null,
      contains_private_info: false,
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await writeEvent({
    prayerId: id,
    action: "REDACT_PII_AND_APPROVE",
    reasonCode: "REDACT_PII",
    note: "Original body stored in body_original_internal; public body redacted.",
  });
  auditAdminWrite("iglesias_prayer_redacted_approved", "prayer_request", id, {});
  if (row.visibility === "PRIVATE_PRAYER_TEAM") {
    const { orchestratePrivatePrayerRouting } = await import("@/app/lib/iglesias/prayerNetworkOrchestrate");
    await orchestratePrivatePrayerRouting(id);
  }
  backTo(id, "approved");
}

export async function closePrayerAction(formData: FormData) {
  await assertPrayerAdmin();
  const id = str(formData, "prayer_id");
  if (!id) throw new Error("Missing prayer");
  const admin = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("prayer_requests")
    .update({
      status: "CLOSED",
      closed_at: now,
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await writeEvent({ prayerId: id, action: "CLOSE", reasonCode: "CLOSE" });
  auditAdminWrite("iglesias_prayer_closed", "prayer_request", id, {});
  backTo(id, "approved");
}

export async function markPrayerReviewedAction(formData: FormData) {
  await assertPrayerAdmin();
  const id = str(formData, "prayer_id");
  if (!id) throw new Error("Missing prayer");
  await writeEvent({
    prayerId: id,
    action: "MARK_REVIEWED",
    reasonCode: str(formData, "reason_code") || "REVIEWED",
  });
  auditAdminWrite("iglesias_prayer_reviewed", "prayer_request", id, {});
  backTo(id, "review");
}

export async function retryPrayerEmailDeliveryAction(formData: FormData) {
  await assertPrayerAdmin();
  const id = str(formData, "prayer_id");
  if (!id) throw new Error("Missing prayer");
  const { orchestratePrivatePrayerRouting } = await import("@/app/lib/iglesias/prayerNetworkOrchestrate");
  await orchestratePrivatePrayerRouting(id);
  auditAdminWrite("iglesias_prayer_delivery_retry", "prayer_request", id, {});
  backTo(id, "approved");
}

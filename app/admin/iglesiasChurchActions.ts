"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { getAdminSupabase } from "@/app/lib/supabase/server";

async function assertIglesiasAdmin() {
  await requireLeonixAdminPermission("can_manage_website_content");
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function approveChurchAction(formData: FormData) {
  await assertIglesiasAdmin();
  const id = str(formData, "church_id");
  if (!id) throw new Error("Missing church");
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("churches")
    .update({
      approval_status: "approved",
      is_active: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await admin.from("church_submissions").update({ reviewed_at: new Date().toISOString(), reject_reason: null }).eq("church_id", id);
  auditAdminWrite("iglesias_church_approved", "church", id, {});
  revalidatePath("/iglesias");
  revalidatePath(`/admin/workspace/iglesias/${id}`);
  redirect(`/admin/workspace/iglesias/${id}?saved=1`);
}

export async function deactivateChurchAction(formData: FormData) {
  await assertIglesiasAdmin();
  const id = str(formData, "church_id");
  if (!id) throw new Error("Missing church");
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("churches")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  auditAdminWrite("iglesias_church_deactivated", "church", id, {});
  revalidatePath("/iglesias");
  revalidatePath(`/admin/workspace/iglesias/${id}`);
  redirect(`/admin/workspace/iglesias/${id}?saved=1`);
}

export async function rejectChurchAction(formData: FormData) {
  await assertIglesiasAdmin();
  const id = str(formData, "church_id");
  const reason = str(formData, "reject_reason");
  if (!id) throw new Error("Missing church");
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("churches")
    .update({
      approval_status: "rejected",
      is_active: false,
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await admin
    .from("church_submissions")
    .update({ reviewed_at: new Date().toISOString(), reject_reason: reason || "rejected" })
    .eq("church_id", id);
  auditAdminWrite("iglesias_church_rejected", "church", id, {});
  revalidatePath("/iglesias");
  redirect(`/admin/workspace/iglesias/${id}?saved=1`);
}

export async function saveChurchEssentialsAction(formData: FormData) {
  await assertIglesiasAdmin();
  const id = str(formData, "church_id");
  if (!id) throw new Error("Missing church");
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("churches")
    .update({
      name: str(formData, "name"),
      denomination: str(formData, "denomination") || null,
      city: str(formData, "city") || null,
      state: str(formData, "state") || null,
      country: str(formData, "country") || null,
      zip: str(formData, "zip") || null,
      phone: str(formData, "phone") || null,
      website: str(formData, "website") || null,
      mission: str(formData, "mission") || null,
      public_location: str(formData, "public_location") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  auditAdminWrite("iglesias_church_edited", "church", id, {});
  revalidatePath("/iglesias");
  redirect(`/admin/workspace/iglesias/${id}?saved=1`);
}

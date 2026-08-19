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

function formChecked(form: FormData, key: string): boolean {
  return str(form, key) === "on" || str(form, key) === "true";
}

export async function savePrayerNetworkAction(formData: FormData) {
  await assertIglesiasAdmin();
  const id = str(formData, "church_id");
  if (!id) throw new Error("Missing church");
  const statusRaw = str(formData, "prayer_status");
  const status = statusRaw === "ACTIVE" || statusRaw === "PAUSED" || statusRaw === "DISABLED" ? statusRaw : "DISABLED";
  const enabled = formChecked(formData, "prayer_enabled");
  const acceptsPrivate = formChecked(formData, "accepts_private");
  const languages = formData.getAll("supported_languages").map(String).filter((v) => v === "es" || v === "en" || v === "bilingual");
  const categories = formData.getAll("supported_categories").map(String);
  const admin = getAdminSupabase();
  const enrolled = enabled && status === "ACTIVE" && acceptsPrivate;
  const { error } = await admin.from("church_prayer_teams").upsert(
    {
      church_id: id,
      enabled,
      accepts_private_requests: acceptsPrivate,
      accepts_general_requests: formChecked(formData, "accepts_general"),
      accepts_high_priority_requests: formChecked(formData, "accepts_high_priority"),
      supported_languages: languages,
      supported_categories: categories,
      geographic_scope: str(formData, "geographic_scope") || null,
      primary_contact_email: str(formData, "primary_contact_email") || null,
      primary_contact_phone: str(formData, "primary_contact_phone") || null,
      delivery_email_enabled: formChecked(formData, "delivery_email_enabled"),
      delivery_dashboard_enabled: formChecked(formData, "delivery_dashboard_enabled"),
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "church_id" },
  );
  if (error) throw new Error(error.message);
  await admin
    .from("churches")
    .update({ prayer_network_enrolled: enrolled, updated_at: new Date().toISOString() })
    .eq("id", id);
  auditAdminWrite("iglesias_prayer_network_saved", "church", id, { enrolled });
  revalidatePath("/iglesias");
  revalidatePath(`/admin/workspace/iglesias/${id}`);
  redirect(`/admin/workspace/iglesias/${id}?saved=1`);
}

export async function addPrayerTeamMemberAction(formData: FormData) {
  await assertIglesiasAdmin();
  const churchId = str(formData, "church_id");
  const teamId = str(formData, "prayer_team_id");
  const name = str(formData, "member_name");
  const email = str(formData, "member_email");
  if (!churchId || !teamId || !name || !email.includes("@")) throw new Error("Missing member");
  const roleRaw = str(formData, "member_role");
  const langRaw = str(formData, "member_language");
  const admin = getAdminSupabase();
  const { error } = await admin.from("church_prayer_team_members").insert({
    prayer_team_id: teamId,
    name,
    email,
    phone: str(formData, "member_phone") || null,
    preferred_language: langRaw === "es" || langRaw === "en" || langRaw === "bilingual" ? langRaw : null,
    role: roleRaw === "COORDINATOR" ? "COORDINATOR" : "MEMBER",
    is_active: true,
  });
  if (error) throw new Error(error.message);
  auditAdminWrite("iglesias_prayer_team_member_added", "church", churchId, {});
  revalidatePath(`/admin/workspace/iglesias/${churchId}`);
  redirect(`/admin/workspace/iglesias/${churchId}?saved=1`);
}

export async function deactivatePrayerTeamMemberAction(formData: FormData) {
  await assertIglesiasAdmin();
  const churchId = str(formData, "church_id");
  const memberId = str(formData, "member_id");
  if (!churchId || !memberId) throw new Error("Missing member");
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("church_prayer_team_members")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  auditAdminWrite("iglesias_prayer_team_member_deactivated", "church", churchId, {});
  revalidatePath(`/admin/workspace/iglesias/${churchId}`);
  redirect(`/admin/workspace/iglesias/${churchId}?saved=1`);
}

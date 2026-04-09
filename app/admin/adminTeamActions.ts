"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { ALL_ADMIN_PERMISSION_KEYS, type AdminPermissionKey } from "@/app/admin/_lib/teamTypes";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";

const PERM_SET = new Set<string>(ALL_ADMIN_PERMISSION_KEYS);

const ROLES = new Set([
  "super_admin",
  "content_manager",
  "ads_moderator",
  "support_agent",
  "billing_support",
  "magazine_editor",
  "read_only",
]);

async function assertTeamAdmin(): Promise<void> {
  await requireLeonixAdminPermission("can_manage_team");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Records invite intent in Supabase. Does NOT create Auth users or send email —
 * staff must complete in Supabase Auth or your IdP.
 */
export async function createTeamInviteIntentAction(formData: FormData) {
  await assertTeamAdmin();
  const email = str(formData, "email").toLowerCase();
  const role = str(formData, "role");
  const note = str(formData, "note") || null;

  if (!email || !email.includes("@")) {
    redirect("/admin/team?invite_error=1");
  }
  if (!ROLES.has(role)) {
    redirect("/admin/team?invite_error=1");
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase.from("admin_team_invites").insert({
    email,
    role,
    status: "pending",
    note,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/admin/team?invite_error=duplicate");
    }
    redirect("/admin/team?invite_error=1");
  }

  await appendAdminAuditLog({
    action: "team_invite_intent_recorded",
    targetType: "admin_team_invites",
    targetId: email,
    meta: { role },
  });

  revalidatePath("/admin/team");
  redirect("/admin/team?invite_saved=1");
}

/** Inserts a roster row — does not create a Supabase Auth user. */
export async function createTeamMemberRecordAction(formData: FormData) {
  await assertTeamAdmin();
  const email = str(formData, "email").toLowerCase();
  const displayName = str(formData, "display_name") || null;
  const role = str(formData, "role");
  const notes = str(formData, "notes") || null;

  if (!email || !email.includes("@")) {
    redirect("/admin/team?member_error=1");
  }
  if (!ROLES.has(role)) {
    redirect("/admin/team?member_error=1");
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase.from("admin_team_members").insert({
    email,
    display_name: displayName,
    role,
    is_active: true,
    permissions: [],
    notes,
    updated_at: now,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/admin/team?member_error=duplicate");
    }
    redirect("/admin/team?member_error=1");
  }

  await appendAdminAuditLog({
    action: "team_member_created",
    targetType: "admin_team_members",
    targetId: email,
    meta: { role },
  });

  revalidatePath("/admin/team");
  redirect("/admin/team?member_saved=1");
}

/** Updates `permissions` JSON array on roster row. Does not change Supabase Auth. */
export async function updateTeamMemberPermissionsAction(formData: FormData) {
  await assertTeamAdmin();
  const id = str(formData, "member_id");
  if (!id) redirect("/admin/team?member_error=1");

  const raw = formData.getAll("permissions");
  const next: AdminPermissionKey[] = [];
  for (const x of raw) {
    if (typeof x === "string" && PERM_SET.has(x)) {
      next.push(x as AdminPermissionKey);
    }
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("admin_team_members")
    .update({ permissions: next, updated_at: now })
    .eq("id", id);
  if (error) redirect("/admin/team?member_error=1");

  await appendAdminAuditLog({
    action: "team_member_permissions_updated",
    targetType: "admin_team_members",
    targetId: id,
    meta: { permissions: next, source: "leonix_admin" },
  });

  revalidatePath("/admin/team");
  redirect("/admin/team?member_saved=1");
}

export async function toggleTeamMemberActiveAction(formData: FormData) {
  await assertTeamAdmin();
  const id = str(formData, "id");
  const nextActive = str(formData, "next_active") === "1";
  if (!id) redirect("/admin/team?member_error=1");

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("admin_team_members")
    .update({ is_active: nextActive, updated_at: now })
    .eq("id", id);
  if (error) redirect("/admin/team?member_error=1");

  await appendAdminAuditLog({
    action: nextActive ? "team_member_activated" : "team_member_deactivated",
    targetType: "admin_team_members",
    targetId: id,
    meta: {},
  });

  revalidatePath("/admin/team");
  redirect("/admin/team?member_saved=1");
}

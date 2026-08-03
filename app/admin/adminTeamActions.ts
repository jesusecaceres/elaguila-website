"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { ALL_ADMIN_PERMISSION_KEYS, type AdminPermissionKey } from "@/app/admin/_lib/teamTypes";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { isUnconfirmedSelfDeactivation, wouldDeactivateLastSuperAdmin, writeRosterAuditLog } from "@/app/admin/_lib/adminRosterAudit";

const PERM_SET = new Set<string>(ALL_ADMIN_PERMISSION_KEYS);

const ROLES = new Set([
  "super_admin",
  "sales_manager",
  "sales_rep",
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
    redirect("/admin/team/roster?invite_error=1");
  }
  if (!ROLES.has(role)) {
    redirect("/admin/team/roster?invite_error=1");
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
      redirect("/admin/team/roster?invite_error=duplicate");
    }
    redirect("/admin/team/roster?invite_error=1");
  }

  await appendAdminAuditLog({
    action: "team_invite_intent_recorded",
    targetType: "admin_team_invites",
    targetId: email,
    meta: { role },
  });

  revalidatePath("/admin/team/roster");
  redirect("/admin/team/roster?invite_saved=1");
}

/** Inserts a roster row — does not create a Supabase Auth user. */
export async function createTeamMemberRecordAction(formData: FormData) {
  await assertTeamAdmin();
  const email = str(formData, "email").toLowerCase();
  const displayName = str(formData, "display_name") || null;
  const role = str(formData, "role");
  const notes = str(formData, "notes") || null;

  if (!email || !email.includes("@")) {
    redirect("/admin/team/roster?member_error=1");
  }
  if (!ROLES.has(role)) {
    redirect("/admin/team/roster?member_error=1");
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
      redirect("/admin/team/roster?member_error=duplicate");
    }
    redirect("/admin/team/roster?member_error=1");
  }

  await appendAdminAuditLog({
    action: "team_member_created",
    targetType: "admin_team_members",
    targetId: email,
    meta: { role },
  });

  const { data: created } = await supabase.from("admin_team_members").select("id").eq("email", email).maybeSingle();
  if (created) {
    await writeRosterAuditLog("staff_row_created", String((created as { id: string }).id), { role, path: "roster_only" });
  }

  revalidatePath("/admin/team/roster");
  redirect("/admin/team/roster?member_saved=1");
}

/** Updates `permissions` JSON array on roster row. Does not change Supabase Auth. */
export async function updateTeamMemberPermissionsAction(formData: FormData) {
  await assertTeamAdmin();
  const id = str(formData, "member_id");
  if (!id) redirect("/admin/team/roster?member_error=1");

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
  if (error) redirect("/admin/team/roster?member_error=1");

  await appendAdminAuditLog({
    action: "team_member_permissions_updated",
    targetType: "admin_team_members",
    targetId: id,
    meta: { permissions: next, source: "leonix_admin" },
  });
  await writeRosterAuditLog("permissions_changed", id, { permissions: next });

  revalidatePath("/admin/team/roster");
  redirect("/admin/team/roster?member_saved=1");
}

/**
 * Deactivating/activating a roster row. Two safety guards run before the write:
 * - the last currently-active super_admin can never be deactivated (would lock every super_admin
 *   out of staff management permanently);
 * - deactivating your OWN roster row requires an explicit second confirmation
 *   (confirm_self_deactivate=1), which the roster page only submits from its dedicated "yes, this
 *   is me" control — a plain "Deactivate" click on your own row is blocked and redirected with a
 *   warning instead of silently succeeding.
 */
export async function toggleTeamMemberActiveAction(formData: FormData) {
  await assertTeamAdmin();
  const id = str(formData, "id");
  const nextActive = str(formData, "next_active") === "1";
  const confirmedSelf = str(formData, "confirm_self_deactivate") === "1";
  if (!id) redirect("/admin/team/roster?member_error=1");

  if (await wouldDeactivateLastSuperAdmin(id, nextActive)) {
    redirect("/admin/team/roster?member_error=last_super_admin");
  }
  if (await isUnconfirmedSelfDeactivation(id, nextActive, confirmedSelf)) {
    redirect("/admin/team/roster?member_error=confirm_self_deactivate");
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("admin_team_members")
    .update({ is_active: nextActive, updated_at: now })
    .eq("id", id);
  if (error) redirect("/admin/team/roster?member_error=1");

  await appendAdminAuditLog({
    action: nextActive ? "team_member_activated" : "team_member_deactivated",
    targetType: "admin_team_members",
    targetId: id,
    meta: {},
  });
  await writeRosterAuditLog(nextActive ? "activated" : "deactivated", id, {});

  revalidatePath("/admin/team/roster");
  redirect("/admin/team/roster?member_saved=1");
}

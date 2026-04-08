"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";

const ROLES = new Set([
  "super_admin",
  "content_manager",
  "ads_moderator",
  "support_agent",
  "billing_support",
  "magazine_editor",
  "read_only",
]);

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
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
  await assertAdmin();
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

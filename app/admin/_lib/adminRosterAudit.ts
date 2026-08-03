/**
 * Gate BCO-4A.3 — staff-roster safety guards and attributable audit logging for
 * admin_team_members mutations. Server-only. Separate from businessWorkspaceAccess.ts (Sales
 * Workspace's own strict boundary) — this module governs the legacy /admin/team/roster surface,
 * which still allows cookie+bootstrap access when ADMIN_ENFORCE_ROSTER_PERMISSIONS is unset (see
 * leonixAdminGate.ts's header comment). Because of that, the acting operator's roster identity is
 * not always resolvable here — every function below degrades safely instead of throwing when it
 * isn't: the last-active-super_admin guard needs no actor identity at all, the self-deactivation
 * guard simply cannot compare "am I deactivating myself" without one (and allows the action, same
 * as today's behavior, rather than blocking staff management entirely), and audit logging falls
 * back to the legacy unattributed admin_audit_log rather than fabricating a roster identity.
 */
import "server-only";

import { cookies } from "next/headers";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getAdminAuthUserIdFromCookies, getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";

export type ActingRosterIdentity = {
  rosterId: string;
  authUserId: string;
  email: string;
  role: string;
};

/** Resolves the current operator's own admin_team_members row, when resolvable. */
export async function resolveActingRosterIdentity(): Promise<ActingRosterIdentity | null> {
  const jar = await cookies();
  const email = getAdminOperatorEmailFromCookies(jar);
  const authUserId = getAdminAuthUserIdFromCookies(jar);
  if (!email || !authUserId) return null;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("admin_team_members")
    .select("id, role, is_active")
    .eq("email", email)
    .maybeSingle();
  if (error || !data || !(data as { is_active: boolean }).is_active) return null;

  return {
    rosterId: String((data as { id: string }).id),
    authUserId,
    email,
    role: String((data as { role: string }).role ?? ""),
  };
}

/**
 * Blocks deactivating the last currently-active super_admin roster row — without this, staff
 * management could lock every super_admin out of /admin/team permanently.
 */
export async function wouldDeactivateLastSuperAdmin(targetId: string, nextActive: boolean): Promise<boolean> {
  if (nextActive) return false;
  const supabase = getAdminSupabase();
  const { data: target } = await supabase.from("admin_team_members").select("role, is_active").eq("id", targetId).maybeSingle();
  if (!target || (target as { role: string }).role !== "super_admin" || !(target as { is_active: boolean }).is_active) {
    return false;
  }
  const { count } = await supabase
    .from("admin_team_members")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("is_active", true);
  return (count ?? 0) <= 1;
}

/**
 * True when the acting operator is deactivating their own roster row and has not passed the
 * explicit confirmation flag — the caller should block the action and prompt for confirmation.
 */
export async function isUnconfirmedSelfDeactivation(targetId: string, nextActive: boolean, confirmed: boolean): Promise<boolean> {
  if (nextActive || confirmed) return false;
  const actor = await resolveActingRosterIdentity();
  if (!actor) return false;
  return actor.rosterId === targetId;
}

export type RosterAuditAction =
  | "staff_row_created"
  | "role_changed"
  | "activated"
  | "deactivated"
  | "auth_user_linked"
  | "display_name_changed"
  | "permissions_changed";

/**
 * Best-effort attributable audit write. Writes to admin_roster_audit_log (real actor FK) when the
 * acting operator's roster identity is resolvable; always also writes the legacy admin_audit_log
 * entry so nothing is silently lost when it isn't (e.g. bootstrap-only sessions with roster
 * enforcement off) — see this file's header comment for why that fallback exists.
 */
export async function writeRosterAuditLog(action: RosterAuditAction, targetRosterId: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const actor = await resolveActingRosterIdentity();
  const supabase = getAdminSupabase();

  if (actor) {
    const { error } = await supabase.from("admin_roster_audit_log").insert({
      action,
      target_roster_id: targetRosterId,
      actor_roster_id: actor.rosterId,
      actor_auth_user_id: actor.authUserId,
      actor_email: actor.email,
      actor_role: actor.role,
      metadata,
    });
    if (error) {
      console.error(`[admin-roster-audit] failed to write attributed audit log for ${action} on ${targetRosterId}:`, error.message);
    }
  }

  await appendAdminAuditLog({
    action: `roster_${action}`,
    targetType: "admin_team_members",
    targetId: targetRosterId,
    meta: actor ? { ...metadata, actorEmail: actor.email, actorRole: actor.role } : metadata,
  });
}

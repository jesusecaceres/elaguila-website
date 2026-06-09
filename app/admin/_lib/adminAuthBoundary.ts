import "server-only";

import type { AdminAccessContext, NormalizedAdminRole } from "@/app/admin/_lib/adminAccessControl";
import {
  isOwnerAdminRole,
  isSalesRepRole,
  isSalesManagerRole,
} from "@/app/admin/_lib/adminAccessControl";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  getAdminOperatorEmailFromCookies,
  isAdminBootstrapSession,
  lookupActiveAdminRosterByEmail,
  type RosterLookupResult,
} from "@/app/lib/supabase/adminSession";
import type { CookieStore } from "@/app/lib/supabase/server";

export type AdminTeamMemberRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  permissions: unknown;
  notes: string | null;
};

export { isAdminBootstrapSession };

export function canAccessFullAdminFromRosterRole(role: string): boolean {
  const r = role.trim().toLowerCase();
  return (
    r === "super_admin" ||
    r === "owner_admin" ||
    r === "sales_manager" ||
    r === "content_manager" ||
    r === "billing_support" ||
    r === "ads_moderator" ||
    r === "magazine_editor" ||
    r === "read_only"
  );
}

export function canCreateStaffUsers(ctx: AdminAccessContext): boolean {
  return ctx.hasAdminCookie && isOwnerAdminRole(ctx.normalizedRole) && ctx.rosterResolved;
}

export function canAccessStaffAdminFromMember(role: string): boolean {
  const r = role.trim().toLowerCase();
  return (
    r === "super_admin" ||
    r === "sales_manager" ||
    r === "sales_rep" ||
    r === "support_agent" ||
    r === "content_manager" ||
    r === "billing_support" ||
    r === "ads_moderator" ||
    r === "magazine_editor" ||
    r === "read_only"
  );
}

export async function getAdminTeamMemberForEmail(email: string): Promise<AdminTeamMemberRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return null;

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_team_members")
      .select("id, email, display_name, role, is_active, permissions, notes")
      .eq("email", normalized)
      .maybeSingle();

    if (error || !data) return null;
    return data as AdminTeamMemberRow;
  } catch {
    return null;
  }
}

/**
 * Dashboard guard: Supabase Auth alone is insufficient — require bootstrap OR active roster.
 * Returns redirect error code when access must be denied.
 */
export async function resolveAdminDashboardAccessDenial(
  cookies: CookieStore,
): Promise<"not_roster" | "inactive" | null> {
  if (isAdminBootstrapSession(cookies)) {
    return null;
  }

  const operatorEmail =
    getAdminOperatorEmailFromCookies(cookies) ??
    ((process.env.ADMIN_OPERATOR_EMAIL ?? "").trim().toLowerCase() || null);

  if (!operatorEmail) {
    return "not_roster";
  }

  const roster: RosterLookupResult = await lookupActiveAdminRosterByEmail(operatorEmail);
  if (!roster.ok) {
    return roster.code === "inactive" ? "inactive" : "not_roster";
  }

  if (!canAccessStaffAdminFromMember(roster.role)) {
    return "not_roster";
  }

  return null;
}

export function describeStaffAccessForRole(role: NormalizedAdminRole): string {
  if (isOwnerAdminRole(role)) return "Full admin";
  if (isSalesManagerRole(role)) return "Full sales records + staff tools";
  if (isSalesRepRole(role)) return "Staff admin (/admin/team) only";
  if (role === "support_admin") return "Support + staff tools where allowed";
  if (role === "content_admin") return "Content + monetization nav";
  return "Limited admin";
}

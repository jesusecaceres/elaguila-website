/**
 * Leonix admin access control.
 *
 * **Layer 1 (always):** HTTP-only cookie `leonix_admin=1` after shared `ADMIN_PASSWORD` login.
 *
 * **Layer 2 (optional):** When `ADMIN_ENFORCE_ROSTER_PERMISSIONS=1` and `ADMIN_OPERATOR_EMAIL` matches a row in
 * `admin_team_members` (active), require that the operator has `can_*` permission or role `super_admin`.
 * This ties checkbox permissions to mutations without changing the shared-password login — set the env vars on
 * single-operator or staging deployments. Multi-identity admin still needs a future auth story (e.g. Supabase Auth).
 *
 * **Enforcement map (when layer 2 is on):**
 * - `can_manage_team` → adminTeamActions
 * - `can_manage_magazine` → magazineIssuesActions
 * - `can_manage_categories` → siteCategoryConfigActions
 * - `can_manage_website_content` → globalSiteActions
 * - `can_manage_reports` → supportTicketActions (internal ops proxy; not a full helpdesk ACL)
 * - `can_manage_ads` → deleteListingAction
 * - `can_manage_reports` → updateListingReportStatusAction
 * - `can_edit_users` → setUserDisabledAction
 *
 * Not yet gated by roster (cookie only): many section editors, tienda actions, home marketing, etc. — extend here when needed.
 */
import "server-only";

import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import type { AdminPermissionKey } from "@/app/admin/_lib/teamTypes";

export async function requireLeonixAdminCookie(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) {
    throw new Error("Unauthorized");
  }
}

export async function requireLeonixAdminPermission(permission: AdminPermissionKey): Promise<void> {
  await requireLeonixAdminCookie();

  const enforce = process.env.ADMIN_ENFORCE_ROSTER_PERMISSIONS === "1";
  const email = (process.env.ADMIN_OPERATOR_EMAIL ?? "").trim().toLowerCase();
  if (!enforce || !email) {
    return;
  }

  const supabase = getAdminSupabase();
  const { data: row, error } = await supabase
    .from("admin_team_members")
    .select("role, permissions, is_active")
    .eq("email", email)
    .maybeSingle();

  if (error || !row || !row.is_active) {
    throw new Error("Forbidden: operator email not in active admin_team_members");
  }

  const role = String((row as { role?: string }).role ?? "");
  if (role === "super_admin") {
    return;
  }

  const raw = (row as { permissions?: unknown }).permissions;
  const list = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  if (!list.includes(permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`);
  }
}

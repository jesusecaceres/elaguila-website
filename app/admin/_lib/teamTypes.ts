/**
 * Team / workforce model — roster rows in `admin_team_members` (migration `20260408183000_control_center_extensions.sql`).
 * Invite **intent** persists in `admin_team_invites` (`20260410120000_admin_audit_log_and_team_invites.sql`).
 */

export type AdminTeamRole =
  | "super_admin"
  | "sales_manager"
  | "sales_rep"
  | "content_manager"
  | "ads_moderator"
  | "support_agent"
  | "billing_support"
  | "magazine_editor"
  | "read_only";

/**
 * Launch Truth Doctrine — `can_view_users`, `can_reset_passwords`, `can_view_activity_logs`, and
 * `can_use_replica_mode` were removed from this list (2026-09) because none of them controlled
 * any real capability: they were checkboxes in the Team permission UI with zero enforcement
 * anywhere in the codebase (confirmed by a full-repo search for every call site of
 * `requireLeonixAdminPermission`/`hasLeonixAdminPermission`). Showing them implied a capability
 * that did not exist. `can_reset_passwords` in particular is a real, desired future capability
 * (staff triggering a Supabase recovery email for a customer, never knowing/setting a password
 * directly) — see docs/admin-os/ADMIN_OS_PROGRESS.md for the dormant design note. Re-add a key
 * here only once it is actually wired to a real, enforced action.
 */
export type AdminPermissionKey =
  | "can_edit_users"
  | "can_manage_ads"
  | "can_manage_reports"
  | "can_manage_categories"
  | "can_manage_magazine"
  | "can_manage_website_content"
  | "can_manage_prayer_wall"
  | "can_view_payments"
  | "can_manage_team"
  | "can_manage_recursos";

/** All keys storable in `admin_team_members.permissions` (JSON array of strings). */
export const ALL_ADMIN_PERMISSION_KEYS: readonly AdminPermissionKey[] = [
  "can_edit_users",
  "can_manage_ads",
  "can_manage_reports",
  "can_manage_categories",
  "can_manage_magazine",
  "can_manage_website_content",
  "can_manage_prayer_wall",
  "can_view_payments",
  "can_manage_team",
  "can_manage_recursos",
] as const;

export type AdminTeamMember = {
  id: string;
  email: string;
  displayName: string;
  role: AdminTeamRole;
  isActive: boolean;
  permissions: AdminPermissionKey[];
};

export const ROLE_LABELS: Record<AdminTeamRole, string> = {
  super_admin: "Super admin",
  sales_manager: "Sales manager (all reps)",
  sales_rep: "Sales rep (own records only)",
  content_manager: "Content manager",
  ads_moderator: "Ads moderator",
  support_agent: "Support agent",
  billing_support: "Billing support",
  magazine_editor: "Magazine editor",
  read_only: "Read only",
};

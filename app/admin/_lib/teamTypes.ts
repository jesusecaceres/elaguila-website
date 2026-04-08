/**
 * Team / workforce model — roster rows in `admin_team_members` (migration `20260408183000_control_center_extensions.sql`).
 * Invite **intent** persists in `admin_team_invites` (`20260410120000_admin_audit_log_and_team_invites.sql`).
 */

export type AdminTeamRole =
  | "super_admin"
  | "content_manager"
  | "ads_moderator"
  | "support_agent"
  | "billing_support"
  | "magazine_editor"
  | "read_only";

export type AdminPermissionKey =
  | "can_view_users"
  | "can_edit_users"
  | "can_reset_passwords"
  | "can_manage_ads"
  | "can_manage_reports"
  | "can_manage_categories"
  | "can_manage_magazine"
  | "can_manage_website_content"
  | "can_view_payments"
  | "can_manage_team"
  | "can_view_activity_logs"
  | "can_use_replica_mode";

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
  content_manager: "Content manager",
  ads_moderator: "Ads moderator",
  support_agent: "Support agent",
  billing_support: "Billing support",
  magazine_editor: "Magazine editor",
  read_only: "Read only",
};

/** @deprecated Prefer `admin_team_members` via admin Team page. */
export function getPlaceholderTeamMembers(): AdminTeamMember[] {
  return [];
}

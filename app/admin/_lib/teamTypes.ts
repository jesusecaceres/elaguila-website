/**
 * Team / workforce model — roster still placeholder until `admin_team_members`.
 * Invite **intent** can persist in `admin_team_invites` (migration `20260410120000_admin_audit_log_and_team_invites.sql`).
 *
 * Future: admin_team_members (id, email, display_name, role, is_active, invited_at, created_at, permissions jsonb)
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

/** Demo roster — replace with DB fetch when `admin_team_members` exists. */
export function getPlaceholderTeamMembers(): AdminTeamMember[] {
  return [
    {
      id: "placeholder-1",
      email: "owner@leonixmedia",
      displayName: "Root owner",
      role: "super_admin",
      isActive: true,
      permissions: [
        "can_view_users",
        "can_edit_users",
        "can_reset_passwords",
        "can_manage_ads",
        "can_manage_reports",
        "can_manage_categories",
        "can_manage_magazine",
        "can_manage_website_content",
        "can_view_payments",
        "can_manage_team",
        "can_view_activity_logs",
        "can_use_replica_mode",
      ],
    },
  ];
}

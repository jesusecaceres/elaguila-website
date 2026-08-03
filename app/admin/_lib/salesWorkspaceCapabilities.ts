/**
 * Gate BCO-4A.1 — explicit capability matrix for the Sales Team Business Workspace. Kept
 * separate from salesWorkspaceLogic.ts (deterministic sales-recommendation rules) because this
 * file is a security boundary, not product logic — it is imported by
 * businessWorkspaceAccess.ts and every server route that shapes or gates data.
 *
 * Only the roster roles that actually exist in admin_team_members.role (confirmed during the
 * Gate B security review: super_admin, sales_manager, sales_rep, billing_support,
 * content_manager, ads_moderator, magazine_editor, read_only) are considered. Least privilege:
 * only the three that are plausibly sales-relevant get ANY Sales Workspace access at all —
 * billing_support/content_manager/ads_moderator/magazine_editor/read_only are denied entirely,
 * not just missing capabilities. This is intentionally stricter than the legacy
 * `canAccessSalesTools()` (which effectively allows any cookie holder).
 */

/** Only these three roster role strings may access the Sales Workspace at all. */
export type SalesWorkspaceRole = "super_admin" | "sales_manager" | "sales_rep";

export const SALES_WORKSPACE_ROLES: readonly SalesWorkspaceRole[] = ["super_admin", "sales_manager", "sales_rep"];

export function isSalesWorkspaceRole(value: string): value is SalesWorkspaceRole {
  return (SALES_WORKSPACE_ROLES as readonly string[]).includes(value);
}

export type SalesWorkspaceCapability =
  | "view_business_list"
  | "view_business_detail"
  | "view_private_contacts"
  | "create_internal_note"
  | "create_follow_up"
  | "update_sales_status"
  | "archive_sales_record"
  | "view_all_staff_notes"
  | "manage_staff_assignments";

export const SALES_WORKSPACE_CAPABILITIES: readonly SalesWorkspaceCapability[] = [
  "view_business_list",
  "view_business_detail",
  "view_private_contacts",
  "create_internal_note",
  "create_follow_up",
  "update_sales_status",
  "archive_sales_record",
  "view_all_staff_notes",
  "manage_staff_assignments",
];

/**
 * Role -> capability matrix. `sales_rep` deliberately never receives `archive_sales_record` or
 * `manage_staff_assignments` — a sales rep must not automatically get owner_admin-level actions.
 * `manage_staff_assignments` is granted to nobody today (no safe assignment feature exists yet —
 * see the Gate B data contract) but is defined now so it's ready, capability-gated, the moment
 * that feature is built, instead of being bolted on as an afterthought.
 */
const ROLE_CAPABILITIES: Readonly<Record<SalesWorkspaceRole, readonly SalesWorkspaceCapability[]>> = {
  super_admin: [
    "view_business_list",
    "view_business_detail",
    "view_private_contacts",
    "create_internal_note",
    "create_follow_up",
    "update_sales_status",
    "archive_sales_record",
    "view_all_staff_notes",
    "manage_staff_assignments",
  ],
  sales_manager: [
    "view_business_list",
    "view_business_detail",
    "view_private_contacts",
    "create_internal_note",
    "create_follow_up",
    "update_sales_status",
    "archive_sales_record",
    "view_all_staff_notes",
  ],
  sales_rep: [
    "view_business_list",
    "view_business_detail",
    "view_private_contacts",
    "create_internal_note",
    "create_follow_up",
    "update_sales_status",
    "view_all_staff_notes",
  ],
};

export function capabilitiesForRole(role: SalesWorkspaceRole): ReadonlySet<SalesWorkspaceCapability> {
  return new Set(ROLE_CAPABILITIES[role]);
}

export function hasCapability(capabilities: ReadonlySet<SalesWorkspaceCapability>, capability: SalesWorkspaceCapability): boolean {
  return capabilities.has(capability);
}

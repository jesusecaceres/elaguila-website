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
  | "manage_staff_assignments"
  // Gate BCO-5A — Living Business Book capabilities. Kept in this same matrix rather than a
  // parallel one, per the explicit instruction to extend the Package 4A matrix carefully.
  | "view_business_book"
  | "view_private_business_facts"
  | "create_business_fact"
  | "confirm_business_fact"
  | "create_evidence"
  | "manage_unknowns"
  | "resolve_contradictions"
  | "conduct_discovery"
  | "review_owner_corrections"
  | "view_business_history"
  // Gate BCO-6A — Explainable Business Health Map capabilities. Kept in this same matrix rather
  // than a parallel one, matching the Gate BCO-5A precedent.
  | "view_business_health_map"
  | "run_business_health_assessment"
  | "view_private_health_support"
  | "mark_health_human_review"
  // Gate BCO-TODAY-2 — DIY Concierge paid-request capabilities. Kept in this same matrix rather
  // than a parallel one, matching the Gate BCO-5A/6A precedent. Deliberately withheld from
  // sales_rep — deciding a paid Guide Me / Let Leonix Handle It request is a manager+ action.
  | "view_diy_concierge_requests"
  | "decide_concierge_guidance_request"
  | "decide_managed_service_request"
  // Gate BCO-TODAY-3 — Next Right Move / Stewardship Engine capabilities. Kept in this same
  // matrix rather than a parallel one. Every sales role may view; only manager+ may
  // create/approve/override a recommendation — a sales_rep may never approve, override, or
  // create one, matching the Living Book/Health Map/DIY Concierge review-action precedent.
  | "view_recommendations"
  | "create_recommendation"
  | "approve_recommendation"
  | "override_recommendation"
  | "view_stewardship_ledger"
  // Program 4, Gates 4A-4D — Field Discovery + AI Research Engine capabilities. Kept in this
  // same matrix rather than a parallel one, matching the Gate BCO-5A/6A/TODAY-2/TODAY-3
  // precedent. sales_rep may canvass, capture sources/files, and participate in discovery, but
  // may never run AI research or review/promote an AI briefing draft — those are manager+
  // actions, matching the "AI drafts never directly become facts without staff review" doctrine
  // and the existing confirm_business_fact/resolve_contradictions precedent (a sales_rep already
  // cannot silently confirm a fact or resolve a contradiction; an AI-authored draft item is held
  // to the same or a stricter standard).
  | "view_field_discovery"
  | "conduct_canvassing"
  | "manage_discovery_sources"
  | "upload_discovery_files"
  | "run_ai_research"
  | "review_ai_briefing"
  | "promote_ai_briefing";

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
  "view_business_book",
  "view_private_business_facts",
  "create_business_fact",
  "confirm_business_fact",
  "create_evidence",
  "manage_unknowns",
  "resolve_contradictions",
  "conduct_discovery",
  "review_owner_corrections",
  "view_business_history",
  "view_business_health_map",
  "run_business_health_assessment",
  "view_private_health_support",
  "mark_health_human_review",
  "view_diy_concierge_requests",
  "decide_concierge_guidance_request",
  "decide_managed_service_request",
  "view_recommendations",
  "create_recommendation",
  "approve_recommendation",
  "override_recommendation",
  "view_stewardship_ledger",
  "view_field_discovery",
  "conduct_canvassing",
  "manage_discovery_sources",
  "upload_discovery_files",
  "run_ai_research",
  "review_ai_briefing",
  "promote_ai_briefing",
];

/**
 * Role -> capability matrix. `sales_rep` deliberately never receives `archive_sales_record` or
 * `manage_staff_assignments` — a sales rep must not automatically get owner_admin-level actions.
 * `manage_staff_assignments` is granted to nobody today (no safe assignment feature exists yet —
 * see the Gate B data contract) but is defined now so it's ready, capability-gated, the moment
 * that feature is built, instead of being bolted on as an afterthought.
 */
/**
 * Gate BCO-5A Living Business Book tier, added to each role below:
 * - super_admin: all 10 (full Package 5 staff capability).
 * - sales_manager: all 10 — "full discovery and fact-management capability except super-admin-only
 *   security or roster functions" (none of the 10 Living Business Book capabilities are security/
 *   roster functions, so nothing is withheld here).
 * - sales_rep: only view_business_book, create_business_fact, manage_unknowns, create_evidence,
 *   conduct_discovery, view_business_history. Deliberately WITHOUT view_private_business_facts,
 *   confirm_business_fact, resolve_contradictions, review_owner_corrections — a sales rep may
 *   propose (create facts/evidence/unknowns, run discovery) but never silently confirm a fact,
 *   resolve a contradiction, or decide an owner correction. Those remain manager+ review actions.
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
    "view_business_book",
    "view_private_business_facts",
    "create_business_fact",
    "confirm_business_fact",
    "create_evidence",
    "manage_unknowns",
    "resolve_contradictions",
    "conduct_discovery",
    "review_owner_corrections",
    "view_business_history",
    "view_business_health_map",
    "run_business_health_assessment",
    "view_private_health_support",
    "mark_health_human_review",
    "view_diy_concierge_requests",
    "decide_concierge_guidance_request",
    "decide_managed_service_request",
    "view_recommendations",
    "create_recommendation",
    "approve_recommendation",
    "override_recommendation",
    "view_stewardship_ledger",
    "view_field_discovery",
    "conduct_canvassing",
    "manage_discovery_sources",
    "upload_discovery_files",
    "run_ai_research",
    "review_ai_briefing",
    "promote_ai_briefing",
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
    "view_business_book",
    "view_private_business_facts",
    "create_business_fact",
    "confirm_business_fact",
    "create_evidence",
    "manage_unknowns",
    "resolve_contradictions",
    "conduct_discovery",
    "review_owner_corrections",
    "view_business_history",
    "view_business_health_map",
    "run_business_health_assessment",
    "view_private_health_support",
    "mark_health_human_review",
    "view_diy_concierge_requests",
    "decide_concierge_guidance_request",
    "decide_managed_service_request",
    "view_recommendations",
    "create_recommendation",
    "approve_recommendation",
    "override_recommendation",
    "view_stewardship_ledger",
    "view_field_discovery",
    "conduct_canvassing",
    "manage_discovery_sources",
    "upload_discovery_files",
    "run_ai_research",
    "review_ai_briefing",
    "promote_ai_briefing",
  ],
  sales_rep: [
    "view_business_list",
    "view_business_detail",
    "view_private_contacts",
    "create_internal_note",
    "create_follow_up",
    "update_sales_status",
    "view_all_staff_notes",
    "view_business_book",
    "create_business_fact",
    "manage_unknowns",
    "create_evidence",
    "conduct_discovery",
    "view_business_history",
    "view_business_health_map",
    "view_recommendations",
    "view_stewardship_ledger",
    "view_field_discovery",
    "conduct_canvassing",
    "manage_discovery_sources",
    "upload_discovery_files",
  ],
};

export function capabilitiesForRole(role: SalesWorkspaceRole): ReadonlySet<SalesWorkspaceCapability> {
  return new Set(ROLE_CAPABILITIES[role]);
}

export function hasCapability(capabilities: ReadonlySet<SalesWorkspaceCapability>, capability: SalesWorkspaceCapability): boolean {
  return capabilities.has(capability);
}

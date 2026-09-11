/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — blueprint persistence. Server-only, always
 * via getAdminSupabase(). Mirrors Gate 1's repository.ts business-scoping convention exactly: every
 * read/write filters on BOTH id and business_id, never id alone.
 *
 * This file is pure CRUD + lifecycle-transition guards over business_project_blueprints — it never
 * builds a packet or Markdown itself (blueprintEngine.ts / blueprintMarkdown.ts own that, and the
 * API route layer orchestrates calling them before handing a ready packet+markdown+fingerprint to
 * createDraftBlueprintVersion), mirroring how architectureApproval.ts stays a thin persistence layer
 * over a packet architectureDecisionEngine.ts already built.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { updateProjectDiscoveryStatus } from "./repository";
import type { BlueprintStatus, WebsiteProjectBlueprintPacket } from "./blueprintEngine";
import type { ProjectDiscoveryActor } from "./types";

export type BlueprintHandoffStatus = "not_started" | "pending_assignment" | "assigned" | "in_progress" | "complete";

export interface BusinessProjectBlueprint {
  id: string;
  businessId: string;
  discoveryId: string;
  projectIntentId: string;
  blueprintType: string;
  version: number;
  status: BlueprintStatus;
  packet: WebsiteProjectBlueprintPacket;
  markdownSnapshot: string;
  inputFingerprint: string;
  discoveryCatalogVersion: string;
  platformRegistryVersion: string;

  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;

  reviewedByRosterId: string | null;
  reviewedByAuthUserId: string | null;
  reviewedByEmail: string | null;
  reviewedByRole: string | null;
  reviewedAt: string | null;

  approvedByRosterId: string | null;
  approvedByAuthUserId: string | null;
  approvedByEmail: string | null;
  approvedByRole: string | null;
  approvedAt: string | null;

  supersedesBlueprintId: string | null;

  handoffStatus: BlueprintHandoffStatus;
  handoffAssigneeRosterId: string | null;
  handoffDueDate: string | null;
  handoffNotes: string | null;

  createdAt: string;
  updatedAt: string;
}

const BLUEPRINT_COLUMNS =
  "id, business_id, discovery_id, project_intent_id, blueprint_type, version, status, packet_json, markdown_snapshot, input_fingerprint, discovery_catalog_version, platform_registry_version, " +
  "created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, " +
  "reviewed_by_roster_id, reviewed_by_auth_user_id, reviewed_by_email, reviewed_by_role, reviewed_at, " +
  "approved_by_roster_id, approved_by_auth_user_id, approved_by_email, approved_by_role, approved_at, " +
  "supersedes_blueprint_id, handoff_status, handoff_assignee_roster_id, handoff_due_date, handoff_notes, created_at, updated_at";

function actorRosterId(actor: ProjectDiscoveryActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorAuthUserId(actor: ProjectDiscoveryActor): string | null {
  return actor.type === "system" ? null : actor.authUserId;
}
function actorEmail(actor: ProjectDiscoveryActor): string | null {
  return actor.type === "system" ? null : actor.email;
}
function actorRole(actor: ProjectDiscoveryActor): string {
  return actor.type === "owner" ? (actor.role ?? "owner") : actor.role;
}

function mapBlueprintRow(row: Record<string, unknown>): BusinessProjectBlueprint {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    discoveryId: String(row.discovery_id),
    projectIntentId: String(row.project_intent_id),
    blueprintType: String(row.blueprint_type),
    version: Number(row.version),
    status: row.status as BlueprintStatus,
    packet: row.packet_json as WebsiteProjectBlueprintPacket,
    markdownSnapshot: String(row.markdown_snapshot),
    inputFingerprint: String(row.input_fingerprint),
    discoveryCatalogVersion: String(row.discovery_catalog_version),
    platformRegistryVersion: String(row.platform_registry_version),

    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),

    reviewedByRosterId: (row.reviewed_by_roster_id as string | null) ?? null,
    reviewedByAuthUserId: (row.reviewed_by_auth_user_id as string | null) ?? null,
    reviewedByEmail: (row.reviewed_by_email as string | null) ?? null,
    reviewedByRole: (row.reviewed_by_role as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,

    approvedByRosterId: (row.approved_by_roster_id as string | null) ?? null,
    approvedByAuthUserId: (row.approved_by_auth_user_id as string | null) ?? null,
    approvedByEmail: (row.approved_by_email as string | null) ?? null,
    approvedByRole: (row.approved_by_role as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,

    supersedesBlueprintId: (row.supersedes_blueprint_id as string | null) ?? null,

    handoffStatus: row.handoff_status as BlueprintHandoffStatus,
    handoffAssigneeRosterId: (row.handoff_assignee_roster_id as string | null) ?? null,
    handoffDueDate: (row.handoff_due_date as string | null) ?? null,
    handoffNotes: (row.handoff_notes as string | null) ?? null,

    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// =================================================================================================
// Reads
// =================================================================================================
export async function listBlueprintVersionsForIntent(businessId: string, projectIntentId: string): Promise<BusinessProjectBlueprint[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_blueprints")
    .select(BLUEPRINT_COLUMNS)
    .eq("business_id", businessId)
    .eq("project_intent_id", projectIntentId)
    .order("version", { ascending: false });
  if (error || !data) return [];
  return data.map(mapBlueprintRow);
}

export async function getLatestBlueprintForIntent(businessId: string, projectIntentId: string): Promise<BusinessProjectBlueprint | null> {
  const versions = await listBlueprintVersionsForIntent(businessId, projectIntentId);
  return versions[0] ?? null;
}

export async function getBlueprintById(businessId: string, blueprintId: string): Promise<BusinessProjectBlueprint | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_blueprints")
    .select(BLUEPRINT_COLUMNS)
    .eq("id", blueprintId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapBlueprintRow(data);
}

// =================================================================================================
// Create a new DRAFT version (MD <versioning>) — the ONLY way a new row is ever inserted. If
// `supersedesBlueprintId` names a prior version for the same intent, that prior version is marked
// 'superseded' in the SAME operation, so an approved version is never left ambiguous about whether
// a newer one now supersedes it.
// =================================================================================================
export type CreateDraftBlueprintResult = { ok: true; blueprint: BusinessProjectBlueprint } | { ok: false; reason: "insert_failed" | "supersede_failed" | "supersedes_wrong_intent" };

export async function createDraftBlueprintVersion(
  input: {
    businessId: string;
    discoveryId: string;
    projectIntentId: string;
    blueprintType?: string;
    packet: WebsiteProjectBlueprintPacket;
    markdown: string;
    inputFingerprint: string;
    supersedesBlueprintId?: string | null;
  },
  actor: Extract<ProjectDiscoveryActor, { type: "staff" | "owner" }>,
): Promise<CreateDraftBlueprintResult> {
  const supabase = getAdminSupabase();

  if (input.supersedesBlueprintId) {
    const prior = await getBlueprintById(input.businessId, input.supersedesBlueprintId);
    if (!prior || prior.projectIntentId !== input.projectIntentId) return { ok: false, reason: "supersedes_wrong_intent" };
  }

  const existing = await listBlueprintVersionsForIntent(input.businessId, input.projectIntentId);
  const nextVersion = existing.length > 0 ? Math.max(...existing.map((v) => v.version)) + 1 : 1;

  const { data, error } = await supabase
    .from("business_project_blueprints")
    .insert({
      business_id: input.businessId,
      discovery_id: input.discoveryId,
      project_intent_id: input.projectIntentId,
      blueprint_type: input.blueprintType ?? "website",
      version: nextVersion,
      status: "draft",
      packet_json: input.packet,
      markdown_snapshot: input.markdown,
      input_fingerprint: input.inputFingerprint,
      discovery_catalog_version: input.packet.discoveryCatalogVersion,
      platform_registry_version: input.packet.platformRegistryVersion,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
      supersedes_blueprint_id: input.supersedesBlueprintId ?? null,
    })
    .select(BLUEPRINT_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "insert_failed" };

  if (input.supersedesBlueprintId) {
    const { error: supersedeError } = await supabase
      .from("business_project_blueprints")
      .update({ status: "superseded", updated_at: new Date().toISOString() })
      .eq("id", input.supersedesBlueprintId)
      .eq("business_id", input.businessId);
    if (supersedeError) return { ok: false, reason: "supersede_failed" };
  }

  return { ok: true, blueprint: mapBlueprintRow(data) };
}

// =================================================================================================
// Lifecycle transitions (MD <versioning>, <internal_review>, <client_confirmation>) — each one
// checks the CURRENT status before writing, so a status button can never skip a required step.
// =================================================================================================
type TransitionFailureReason = "not_found" | "invalid_transition" | "update_failed";
export type TransitionResult = { ok: true; blueprint: BusinessProjectBlueprint } | { ok: false; reason: TransitionFailureReason };

async function transitionStatus(
  businessId: string,
  blueprintId: string,
  allowedFrom: readonly BlueprintStatus[],
  patch: Record<string, unknown>,
): Promise<TransitionResult> {
  const existing = await getBlueprintById(businessId, blueprintId);
  if (!existing) return { ok: false, reason: "not_found" };
  if (!allowedFrom.includes(existing.status)) return { ok: false, reason: "invalid_transition" };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_blueprints")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", blueprintId)
    .eq("business_id", businessId)
    .select(BLUEPRINT_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };
  return { ok: true, blueprint: mapBlueprintRow(data) };
}

/** DRAFT -> INTERNAL_REVIEW (MD <internal_review>: a lighter staff confirmation step). */
export async function markBlueprintInternalReviewComplete(businessId: string, blueprintId: string, actor: Extract<ProjectDiscoveryActor, { type: "staff" | "owner" }>): Promise<TransitionResult> {
  return transitionStatus(businessId, blueprintId, ["draft"], {
    status: "internal_review",
    reviewed_by_roster_id: actorRosterId(actor),
    reviewed_by_auth_user_id: actorAuthUserId(actor),
    reviewed_by_email: actorEmail(actor),
    reviewed_by_role: actorRole(actor),
    reviewed_at: new Date().toISOString(),
  });
}

/** INTERNAL_REVIEW -> CLIENT_CONFIRMATION_NEEDED (MD <client_confirmation>: no fake e-signature, uses existing canonical status only). */
export async function markBlueprintClientConfirmationNeeded(businessId: string, blueprintId: string): Promise<TransitionResult> {
  return transitionStatus(businessId, blueprintId, ["internal_review"], { status: "client_confirmation_needed" });
}

/**
 * INTERNAL_REVIEW or CLIENT_CONFIRMATION_NEEDED -> APPROVED_FOR_BUILD. This is the ONE transition
 * MD <internal_review> requires a server-side guard for — callers MUST have already run
 * evaluateWebsiteBlueprintReadiness()===READY before calling this (the route layer enforces that;
 * this function only enforces the STATUS machine, never re-derives readiness itself, mirroring how
 * updateProjectDiscoveryStatus never re-derives discovery completeness either).
 * Also closes the discovery's own lifecycle to its terminal "blueprint_created" state (MD
 * <build_handoff>), reusing Gate 1's own status machine rather than inventing a second one.
 */
export async function approveBlueprintForBuild(businessId: string, blueprintId: string, actor: Extract<ProjectDiscoveryActor, { type: "staff" | "owner" }>): Promise<TransitionResult> {
  const result = await transitionStatus(businessId, blueprintId, ["internal_review", "client_confirmation_needed"], {
    status: "approved_for_build",
    approved_by_roster_id: actorRosterId(actor),
    approved_by_auth_user_id: actorAuthUserId(actor),
    approved_by_email: actorEmail(actor),
    approved_by_role: actorRole(actor),
    approved_at: new Date().toISOString(),
    handoff_status: "pending_assignment",
  });
  if (result.ok) {
    await updateProjectDiscoveryStatus(businessId, result.blueprint.discoveryId, "blueprint_created", actor).catch(() => undefined);
  }
  return result;
}

// =================================================================================================
// Build handoff (MD <build_handoff>, <handoff_contract>) — only ever meaningful once
// APPROVED_FOR_BUILD; never a whole project-management system, just the smallest state a builder
// needs to know execution has started.
// =================================================================================================
export type SetHandoffResult = { ok: true; blueprint: BusinessProjectBlueprint } | { ok: false; reason: "not_found" | "not_approved" | "update_failed" };

export async function setBlueprintHandoff(
  businessId: string,
  blueprintId: string,
  input: { handoffStatus: BlueprintHandoffStatus; handoffAssigneeRosterId?: string | null; handoffDueDate?: string | null; handoffNotes?: string | null },
): Promise<SetHandoffResult> {
  const existing = await getBlueprintById(businessId, blueprintId);
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.status !== "approved_for_build") return { ok: false, reason: "not_approved" };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_blueprints")
    .update({
      handoff_status: input.handoffStatus,
      handoff_assignee_roster_id: input.handoffAssigneeRosterId ?? null,
      handoff_due_date: input.handoffDueDate ?? null,
      handoff_notes: input.handoffNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", blueprintId)
    .eq("business_id", businessId)
    .select(BLUEPRINT_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };
  return { ok: true, blueprint: mapBlueprintRow(data) };
}

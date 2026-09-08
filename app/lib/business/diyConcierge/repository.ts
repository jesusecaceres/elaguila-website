/**
 * TODAY-2 — DIY Concierge repository. Server-only, always via getAdminSupabase() (service-role),
 * matching the Gate BCO-5A/6A pattern exactly (these tables have zero RLS policies by design).
 * Every write requires a DiyConciergeActor argument — no function accepts a bare actor email/id
 * string. Every read/write is scoped to an explicit businessId parameter that callers must have
 * already verified via an exact membership check — this module never re-derives or trusts a
 * caller-supplied business relationship.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { DIY_REGISTRY_VERSION } from "./constants";
import { computeNextStatus } from "./logic";
import type {
  ApprovalRequestType, ApprovalStatus, DiyAction, DiyActionEvidence, DiyActionOwnerDecision,
  DiyActionStatus, DiyConciergeActor, DiyEvidenceType, DiyEvidenceVisibility, OwnerApproval,
  ServiceRequest, ServiceRequestStatus, ServiceRequestType, ServiceRequestUrgency,
} from "./types";
import type { HealthDimensionKey } from "../healthMap/types";

function actorRosterId(actor: DiyConciergeActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: DiyConciergeActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}
/**
 * Builds the actor-attribution columns for a given column-name prefix. The `business_diy_*`
 * event/evidence tables use bare `actor_type`, but `business_owner_approvals` uses
 * `requested_by_actor_type` / `decided_by_actor_type` (never `requested_by_type` /
 * `decided_by_type`) — this must match the exact migration column names or PostgREST rejects the
 * write outright with an unknown-column error.
 */
function actorColumns(actor: DiyConciergeActor, prefix: "actor" | "requested_by" | "decided_by") {
  const typeKey = prefix === "actor" ? "actor_type" : `${prefix}_actor_type`;
  return {
    [typeKey]: actor.type,
    [`${prefix}_roster_id`]: actorRosterId(actor),
    [`${prefix}_auth_user_id`]: actor.authUserId,
    [`${prefix}_email`]: actor.email,
    [`${prefix}_role`]: actorRole(actor),
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function mapActionRow(row: Record<string, unknown>): DiyAction {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    actionKey: String(row.action_key),
    dimensionKey: row.dimension_key as HealthDimensionKey,
    sourceRunId: (row.source_run_id as string | null) ?? null,
    sourceFindingId: (row.source_finding_id as string | null) ?? null,
    registryVersion: String(row.registry_version),
    status: row.status as DiyActionStatus,
    ownerDecision: (row.owner_decision as DiyActionOwnerDecision | null) ?? null,
    reviewDate: (row.review_date as string | null) ?? null,
    reassessmentTrigger: (row.reassessment_trigger as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const ACTION_COLUMNS =
  "id, business_id, action_key, dimension_key, source_run_id, source_finding_id, registry_version, status, owner_decision, review_date, reassessment_trigger, completed_at, created_at, updated_at";

export async function listActionsForBusiness(businessId: string): Promise<DiyAction[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_diy_actions").select(ACTION_COLUMNS).eq("business_id", businessId);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapActionRow);
}

export async function getActionByKey(businessId: string, actionKey: string): Promise<DiyAction | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_diy_actions")
    .select(ACTION_COLUMNS)
    .eq("business_id", businessId)
    .eq("action_key", actionKey)
    .maybeSingle();
  if (error || !data) return null;
  return mapActionRow(data as Record<string, unknown>);
}

/**
 * Idempotently ensures one action row exists for (business, action_key), created deterministically
 * from a Health Map run/finding reference. Re-selection against a newer run updates the source
 * pointers via an event-recorded change — it never duplicates the row and never mutates the
 * source Health Map run itself.
 */
export async function ensureActionInstance(
  actor: DiyConciergeActor,
  businessId: string,
  params: { actionKey: string; dimensionKey: HealthDimensionKey; sourceRunId: string | null; sourceFindingId: string | null },
): Promise<DiyAction | null> {
  const supabase = getAdminSupabase();
  const existing = await getActionByKey(businessId, params.actionKey);

  if (!existing) {
    const { data, error } = await supabase
      .from("business_diy_actions")
      .insert({
        business_id: businessId,
        action_key: params.actionKey,
        dimension_key: params.dimensionKey,
        source_run_id: params.sourceRunId,
        source_finding_id: params.sourceFindingId,
        registry_version: DIY_REGISTRY_VERSION,
        status: "available",
      })
      .select(ACTION_COLUMNS)
      .maybeSingle();
    if (error || !data) return null;
    const created = mapActionRow(data as Record<string, unknown>);
    await writeActionEvent(actor, businessId, created.id, { eventType: "created", toStatus: "available" });
    return created;
  }

  // Update the source pointers to the latest run/finding without changing owner-decided status.
  if (existing.sourceRunId !== params.sourceRunId || existing.sourceFindingId !== params.sourceFindingId) {
    const { data, error } = await supabase
      .from("business_diy_actions")
      .update({ source_run_id: params.sourceRunId, source_finding_id: params.sourceFindingId, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select(ACTION_COLUMNS)
      .maybeSingle();
    if (!error && data) return mapActionRow(data as Record<string, unknown>);
  }
  return existing;
}

export type ActionDecisionResult =
  | { ok: true; action: DiyAction }
  | { ok: false; error: "not_found" | "invalid_transition" };

/** Applies a deterministic owner (or authorized staff) decision to one action, recording history. */
export async function recordActionDecision(
  actor: DiyConciergeActor,
  businessId: string,
  actionKey: string,
  decision: DiyActionOwnerDecision,
  note: string | null,
): Promise<ActionDecisionResult> {
  const action = await getActionByKey(businessId, actionKey);
  if (!action) return { ok: false, error: "not_found" };

  const nextStatus = computeNextStatus(action.status, decision);
  if (!nextStatus) return { ok: false, error: "invalid_transition" };

  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();
  const update: Record<string, unknown> = { status: nextStatus, owner_decision: decision, updated_at: nowIso };
  if (nextStatus === "completed") update.completed_at = nowIso;
  if (nextStatus !== "completed") update.completed_at = null;

  const { data, error } = await supabase.from("business_diy_actions").update(update).eq("id", action.id).select(ACTION_COLUMNS).maybeSingle();
  if (error || !data) return { ok: false, error: "not_found" };

  const updated = mapActionRow(data as Record<string, unknown>);
  await writeActionEvent(actor, businessId, action.id, {
    eventType: "status_changed",
    fromStatus: action.status,
    toStatus: nextStatus,
    decision,
    note,
  });
  return { ok: true, action: updated };
}

async function writeActionEvent(
  actor: DiyConciergeActor,
  businessId: string,
  actionId: string,
  params: { eventType: "created" | "status_changed" | "decision_recorded" | "evidence_linked" | "note_added"; fromStatus?: DiyActionStatus; toStatus?: DiyActionStatus; decision?: DiyActionOwnerDecision; note?: string | null },
): Promise<void> {
  const supabase = getAdminSupabase();
  await supabase.from("business_diy_action_events").insert({
    business_id: businessId,
    action_id: actionId,
    event_type: params.eventType,
    from_status: params.fromStatus ?? null,
    to_status: params.toStatus ?? null,
    decision: params.decision ?? null,
    note: params.note ?? null,
    ...actorColumns(actor, "actor"),
  });
}

export async function listActionEvents(businessId: string, actionId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_diy_action_events")
    .select("id, business_id, action_id, event_type, from_status, to_status, decision, note, actor_type, actor_email, actor_role, created_at")
    .eq("business_id", businessId)
    .eq("action_id", actionId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

function mapEvidenceRow(row: Record<string, unknown>): DiyActionEvidence {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    actionId: String(row.action_id),
    evidenceType: row.evidence_type as DiyEvidenceType,
    valueText: (row.value_text as string | null) ?? null,
    referenceId: (row.reference_id as string | null) ?? null,
    ownerNote: (row.owner_note as string | null) ?? null,
    visibility: row.visibility as DiyEvidenceVisibility,
    actorType: row.actor_type as "staff" | "owner",
    actorEmail: String(row.actor_email),
    createdAt: String(row.created_at),
  };
}

const EVIDENCE_COLUMNS =
  "id, business_id, action_id, evidence_type, value_text, reference_id, owner_note, visibility, actor_type, actor_email, created_at";

export async function addActionEvidence(
  actor: DiyConciergeActor,
  businessId: string,
  actionId: string,
  params: { evidenceType: DiyEvidenceType; valueText: string | null; referenceId: string | null; ownerNote: string | null; visibility: DiyEvidenceVisibility },
): Promise<DiyActionEvidence | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_diy_action_evidence")
    .insert({
      business_id: businessId,
      action_id: actionId,
      evidence_type: params.evidenceType,
      value_text: params.valueText,
      reference_id: params.referenceId,
      owner_note: params.ownerNote,
      visibility: params.visibility,
      ...actorColumns(actor, "actor"),
    })
    .select(EVIDENCE_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  await writeActionEvent(actor, businessId, actionId, { eventType: "evidence_linked", note: params.ownerNote ?? null });
  return mapEvidenceRow(data as Record<string, unknown>);
}

export async function listEvidenceForAction(businessId: string, actionId: string): Promise<DiyActionEvidence[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_diy_action_evidence")
    .select(EVIDENCE_COLUMNS)
    .eq("business_id", businessId)
    .eq("action_id", actionId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapEvidenceRow);
}

// ---------------------------------------------------------------------------
// Owner Approvals
// ---------------------------------------------------------------------------

function mapApprovalRow(row: Record<string, unknown>): OwnerApproval {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    requestType: row.request_type as ApprovalRequestType,
    sourceRecordType: String(row.source_record_type),
    sourceRecordId: String(row.source_record_id),
    requestedDecision: String(row.requested_decision),
    status: row.status as ApprovalStatus,
    requestedAt: String(row.requested_at),
    decidedAt: (row.decided_at as string | null) ?? null,
    requestedByActorType: row.requested_by_actor_type as "staff" | "owner",
    requestedByEmail: String(row.requested_by_email),
    decidedByActorType: (row.decided_by_actor_type as "staff" | "owner" | null) ?? null,
    decidedByEmail: (row.decided_by_email as string | null) ?? null,
    ownerNote: (row.owner_note as string | null) ?? null,
    staffNote: (row.staff_note as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const APPROVAL_COLUMNS =
  "id, business_id, request_type, source_record_type, source_record_id, requested_decision, status, requested_at, decided_at, requested_by_actor_type, requested_by_email, decided_by_actor_type, decided_by_email, owner_note, staff_note, created_at, updated_at";

export async function createOwnerApproval(
  actor: DiyConciergeActor,
  businessId: string,
  params: { requestType: ApprovalRequestType; sourceRecordType: string; sourceRecordId: string; requestedDecision: string; ownerNote: string | null },
): Promise<OwnerApproval | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_owner_approvals")
    .insert({
      business_id: businessId,
      request_type: params.requestType,
      source_record_type: params.sourceRecordType,
      source_record_id: params.sourceRecordId,
      requested_decision: params.requestedDecision,
      owner_note: params.ownerNote,
      ...actorColumns(actor, "requested_by"),
    })
    .select(APPROVAL_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  const approval = mapApprovalRow(data as Record<string, unknown>);
  await writeApprovalEvent(actor, businessId, approval.id, "requested", null);
  return approval;
}

export async function listApprovalsForBusiness(businessId: string): Promise<OwnerApproval[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_owner_approvals")
    .select(APPROVAL_COLUMNS)
    .eq("business_id", businessId)
    .order("requested_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapApprovalRow);
}

export async function getApprovalById(businessId: string, approvalId: string): Promise<OwnerApproval | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_owner_approvals")
    .select(APPROVAL_COLUMNS)
    .eq("business_id", businessId)
    .eq("id", approvalId)
    .maybeSingle();
  if (error || !data) return null;
  return mapApprovalRow(data as Record<string, unknown>);
}

export type ApprovalDecisionResult = { ok: true; approval: OwnerApproval } | { ok: false; error: "not_found" | "not_pending" };

/** Only a pending approval may be decided — never re-decided, never silently overwritten. */
export async function decideOwnerApproval(
  actor: DiyConciergeActor,
  businessId: string,
  approvalId: string,
  decision: "approved" | "declined" | "withdrawn",
  note: string | null,
): Promise<ApprovalDecisionResult> {
  const existing = await getApprovalById(businessId, approvalId);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.status !== "pending") return { ok: false, error: "not_pending" };

  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();
  const noteField = actor.type === "staff" ? { staff_note: note } : { owner_note: note };
  const { data, error } = await supabase
    .from("business_owner_approvals")
    .update({ status: decision, decided_at: nowIso, updated_at: nowIso, ...actorColumns(actor, "decided_by"), ...noteField })
    .eq("id", approvalId)
    .eq("status", "pending")
    .select(APPROVAL_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "not_pending" };

  const approval = mapApprovalRow(data as Record<string, unknown>);
  await writeApprovalEvent(actor, businessId, approvalId, decision, note);
  return { ok: true, approval };
}

async function writeApprovalEvent(
  actor: DiyConciergeActor,
  businessId: string,
  approvalId: string,
  eventType: "requested" | "approved" | "declined" | "withdrawn" | "expired" | "superseded" | "note_added",
  note: string | null,
): Promise<void> {
  const supabase = getAdminSupabase();
  await supabase.from("business_owner_approval_events").insert({
    approval_id: approvalId,
    business_id: businessId,
    event_type: eventType,
    note,
    ...actorColumns(actor, "actor"),
  });
}

export async function listApprovalEvents(businessId: string, approvalId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_owner_approval_events")
    .select("id, approval_id, business_id, event_type, note, actor_type, actor_email, actor_role, created_at")
    .eq("business_id", businessId)
    .eq("approval_id", approvalId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

// ---------------------------------------------------------------------------
// Paid Service Requests (Guide Me / Let Leonix Handle It) — structured, pending-only records.
// Never Stripe, never payment, never scheduling, never staff assignment.
// ---------------------------------------------------------------------------

function mapServiceRequestRow(row: Record<string, unknown>): ServiceRequest {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sourceActionId: (row.source_action_id as string | null) ?? null,
    requestType: row.request_type as ServiceRequestType,
    requestedDeliverable: String(row.requested_deliverable),
    requestedOutcome: (row.requested_outcome as string | null) ?? null,
    ownerNote: (row.owner_note as string | null) ?? null,
    urgencyPreference: row.urgency_preference as ServiceRequestUrgency,
    status: row.status as ServiceRequestStatus,
    entitlementSnapshot: (row.entitlement_snapshot as Record<string, unknown> | null) ?? {},
    requestedByEmail: String(row.requested_by_email),
    acknowledgedByEmail: (row.acknowledged_by_email as string | null) ?? null,
    acknowledgedAt: (row.acknowledged_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const SERVICE_REQUEST_COLUMNS =
  "id, business_id, source_action_id, request_type, requested_deliverable, requested_outcome, owner_note, urgency_preference, status, entitlement_snapshot, requested_by_email, acknowledged_by_email, acknowledged_at, created_at, updated_at";

export async function createServiceRequest(
  authUserId: string,
  email: string,
  businessId: string,
  params: {
    sourceActionId: string | null;
    requestType: ServiceRequestType;
    requestedDeliverable: string;
    requestedOutcome: string | null;
    ownerNote: string | null;
    urgencyPreference: ServiceRequestUrgency;
    entitlementSnapshot: Record<string, unknown>;
  },
): Promise<ServiceRequest | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_service_requests")
    .insert({
      business_id: businessId,
      source_action_id: params.sourceActionId,
      request_type: params.requestType,
      requested_deliverable: params.requestedDeliverable,
      requested_outcome: params.requestedOutcome,
      owner_note: params.ownerNote,
      urgency_preference: params.urgencyPreference,
      entitlement_snapshot: params.entitlementSnapshot,
      requested_by_auth_user_id: authUserId,
      requested_by_email: email,
    })
    .select(SERVICE_REQUEST_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  return mapServiceRequestRow(data as Record<string, unknown>);
}

export async function listServiceRequestsForBusiness(businessId: string): Promise<ServiceRequest[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_service_requests")
    .select(SERVICE_REQUEST_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapServiceRequestRow);
}

/** Staff-only: acknowledges a pending request exists — never a work order, payment, or assignment. */
export async function acknowledgeServiceRequest(
  rosterId: string,
  email: string,
  requestId: string,
): Promise<ServiceRequest | null> {
  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("business_service_requests")
    .update({ status: "acknowledged", acknowledged_by_roster_id: rosterId, acknowledged_by_email: email, acknowledged_at: nowIso, updated_at: nowIso })
    .eq("id", requestId)
    .eq("status", "pending")
    .select(SERVICE_REQUEST_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  return mapServiceRequestRow(data as Record<string, unknown>);
}

export async function listAllPendingServiceRequests(): Promise<ServiceRequest[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_service_requests")
    .select(SERVICE_REQUEST_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapServiceRequestRow);
}

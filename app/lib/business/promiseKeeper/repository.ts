/**
 * Program 5 — Promise Keeper repository. Server-only, always via getAdminSupabase().
 * Every write requires a CommitmentActor. Events preserve full history.
 * No shame language. Capacity/blocker/release supported.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { canTransitionCommitmentStatus } from "./logic";
import type {
  BusinessCommitment, CommitmentActor, CommitmentEvent, CommitmentEventType, CommitmentStatus,
  CapacityState, ResponsibleParty, ReviewOutcome,
} from "./types";

function actorRosterId(actor: CommitmentActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}

function actorRole(actor: CommitmentActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

const COMMITMENT_COLUMNS =
  "id, business_id, meeting_id, recommendation_id, proposal_id, title_es, title_en, responsible_party, assigned_roster_id, smallest_next_step, due_at, status, blocker, help_requested, evidence_required, capacity_state, review_outcome, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at, updated_at";

function mapCommitmentRow(row: Record<string, unknown>): BusinessCommitment {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    meetingId: (row.meeting_id as string | null) ?? null,
    recommendationId: (row.recommendation_id as string | null) ?? null,
    proposalId: (row.proposal_id as string | null) ?? null,
    titleEs: String(row.title_es),
    titleEn: String(row.title_en),
    responsibleParty: row.responsible_party as ResponsibleParty,
    assignedRosterId: (row.assigned_roster_id as string | null) ?? null,
    smallestNextStep: (row.smallest_next_step as string | null) ?? null,
    dueAt: (row.due_at as string | null) ?? null,
    status: row.status as CommitmentStatus,
    blocker: (row.blocker as string | null) ?? null,
    helpRequested: Boolean(row.help_requested),
    evidenceRequired: Boolean(row.evidence_required),
    capacityState: row.capacity_state as CapacityState,
    reviewOutcome: (row.review_outcome as ReviewOutcome | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const EVENT_COLUMNS =
  "id, commitment_id, business_id, event_type, event_actor_type, event_by_roster_id, event_by_auth_user_id, event_by_email, event_by_role, details, created_at";

function mapEventRow(row: Record<string, unknown>): CommitmentEvent {
  return {
    id: String(row.id),
    commitmentId: String(row.commitment_id),
    businessId: String(row.business_id),
    eventType: row.event_type as CommitmentEventType,
    eventActorType: row.event_actor_type as "staff" | "owner",
    eventByRosterId: (row.event_by_roster_id as string | null) ?? null,
    eventByAuthUserId: String(row.event_by_auth_user_id),
    eventByEmail: String(row.event_by_email),
    eventByRole: String(row.event_by_role),
    details: (row.details as Record<string, unknown> | null) ?? null,
    createdAt: String(row.created_at),
  };
}

async function writeEvent(
  commitmentId: string,
  businessId: string,
  eventType: CommitmentEventType,
  actor: CommitmentActor,
  details: Record<string, unknown> | null = null,
): Promise<void> {
  const supabase = getAdminSupabase();
  await supabase.from("business_commitment_events").insert({
    commitment_id: commitmentId,
    business_id: businessId,
    event_type: eventType,
    event_actor_type: actor.type,
    event_by_roster_id: actorRosterId(actor),
    event_by_auth_user_id: actor.authUserId,
    event_by_email: actor.email,
    event_by_role: actorRole(actor),
    details,
  });
}

export type CreateCommitmentInput = {
  businessId: string;
  meetingId?: string | null;
  recommendationId?: string | null;
  proposalId?: string | null;
  titleEs: string;
  titleEn: string;
  responsibleParty: ResponsibleParty;
  assignedRosterId?: string | null;
  smallestNextStep?: string | null;
  dueAt?: string | null;
  evidenceRequired?: boolean;
};

export async function createCommitment(
  input: CreateCommitmentInput,
  actor: CommitmentActor,
): Promise<{ ok: true; commitment: BusinessCommitment } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_commitments")
    .insert({
      business_id: input.businessId,
      meeting_id: input.meetingId ?? null,
      recommendation_id: input.recommendationId ?? null,
      proposal_id: input.proposalId ?? null,
      title_es: input.titleEs.trim(),
      title_en: input.titleEn.trim(),
      responsible_party: input.responsibleParty,
      assigned_roster_id: input.assignedRosterId ?? null,
      smallest_next_step: input.smallestNextStep ?? null,
      due_at: input.dueAt ?? null,
      status: "planned",
      help_requested: false,
      evidence_required: input.evidenceRequired ?? false,
      capacity_state: "normal",
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select(COMMITMENT_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const commitment = mapCommitmentRow(data as Record<string, unknown>);
  await writeEvent(commitment.id, input.businessId, "created", actor, { title: input.titleEn });
  return { ok: true, commitment };
}

export async function listCommitmentsForBusiness(businessId: string): Promise<BusinessCommitment[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_commitments")
    .select(COMMITMENT_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapCommitmentRow);
}

export async function getCommitmentById(commitmentId: string, businessId: string): Promise<BusinessCommitment | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_commitments")
    .select(COMMITMENT_COLUMNS)
    .eq("id", commitmentId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapCommitmentRow(data as Record<string, unknown>);
}

export type UpdateCommitmentInput = {
  status?: CommitmentStatus;
  blocker?: string | null;
  helpRequested?: boolean;
  capacityState?: CapacityState;
  reviewOutcome?: ReviewOutcome | null;
  assignedRosterId?: string | null;
  dueAt?: string | null;
  smallestNextStep?: string | null;
};

export async function updateCommitment(
  commitmentId: string,
  businessId: string,
  patch: UpdateCommitmentInput,
  actor: CommitmentActor,
): Promise<{ ok: true; commitment: BusinessCommitment } | { ok: false; error: string }> {
  const existing = await getCommitmentById(commitmentId, businessId);
  if (!existing) return { ok: false, error: "commitment_not_found" };

  if (patch.status && patch.status !== existing.status) {
    if (!canTransitionCommitmentStatus(existing.status, patch.status)) {
      return { ok: false, error: "invalid_status_transition" };
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) update.status = patch.status;
  if (patch.blocker !== undefined) update.blocker = patch.blocker;
  if (patch.helpRequested !== undefined) update.help_requested = patch.helpRequested;
  if (patch.capacityState) update.capacity_state = patch.capacityState;
  if (patch.reviewOutcome !== undefined) update.review_outcome = patch.reviewOutcome;
  if (patch.assignedRosterId !== undefined) update.assigned_roster_id = patch.assignedRosterId;
  if (patch.dueAt !== undefined) update.due_at = patch.dueAt;
  if (patch.smallestNextStep !== undefined) update.smallest_next_step = patch.smallestNextStep;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_commitments")
    .update(update)
    .eq("id", commitmentId)
    .eq("business_id", businessId)
    .select(COMMITMENT_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "update_failed" };

  const updated = mapCommitmentRow(data as Record<string, unknown>);

  if (patch.status && patch.status !== existing.status) {
    const eventTypeMap: Record<string, CommitmentEventType> = {
      active: "started",
      blocked: "blocked",
      completed: "completed",
      released: "released",
    };
    const eventType = eventTypeMap[patch.status];
    if (eventType) {
      await writeEvent(commitmentId, businessId, eventType, actor, { from: existing.status, to: patch.status });
    }
  }
  if (patch.helpRequested === true && !existing.helpRequested) {
    await writeEvent(commitmentId, businessId, "help_requested", actor);
  }
  if (patch.assignedRosterId !== undefined && patch.assignedRosterId !== existing.assignedRosterId) {
    await writeEvent(commitmentId, businessId, "reassigned", actor, { from: existing.assignedRosterId, to: patch.assignedRosterId });
  }
  if (patch.dueAt !== undefined && patch.dueAt !== existing.dueAt) {
    await writeEvent(commitmentId, businessId, "due_date_changed", actor, { from: existing.dueAt, to: patch.dueAt });
  }
  if (patch.reviewOutcome !== undefined && patch.reviewOutcome !== existing.reviewOutcome) {
    await writeEvent(commitmentId, businessId, "reviewed", actor, { reviewOutcome: patch.reviewOutcome });
  }

  return { ok: true, commitment: updated };
}

export async function listEventsForCommitment(commitmentId: string, businessId: string): Promise<CommitmentEvent[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_commitment_events")
    .select(EVENT_COLUMNS)
    .eq("commitment_id", commitmentId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapEventRow);
}

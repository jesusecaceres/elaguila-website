import "server-only";

/**
 * Recursos Intake OS — Gate 3 access to `public.verification_events`. Insert-only by design —
 * the migration itself grants service_role only SELECT/INSERT (no UPDATE/DELETE), so this module
 * intentionally exposes no update/delete function at all.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const TABLE = "verification_events";

export type VerificationEventType = "candidate_created" | "ai_proposal_generated" | "evidence_recorded" | "field_accepted" | "field_rejected" | "promoted" | "dropped" | "reverified";

export type InsertVerificationEventInput = {
  candidateId?: string | null;
  resourceId?: string | null;
  sourceIntakeJobId?: string | null;
  eventType: VerificationEventType;
  actorEmail?: string | null;
  sourceUrl?: string | null;
  sourceType?: string | null;
  notes?: string | null;
  /** Gate 5 — reconstructs an accepted/rejected change: what it was, and (for accept) what it became. */
  previousValue?: string | null;
  accepted?: string | null;
  fieldsConfirmed?: string[] | null;
};

/** Distinct candidate_ids created by a given intake job, derived from the append-only event log. */
export async function dbListCandidateIdsCreatedByJob(sourceIntakeJobId: string): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select("candidate_id")
      .eq("source_intake_job_id", sourceIntakeJobId)
      .eq("event_type", "candidate_created");
    if (error || !data) return [];
    return [...new Set((data as { candidate_id: string | null }[]).map((r) => r.candidate_id).filter((x): x is string => Boolean(x)))];
  } catch {
    return [];
  }
}

export type VerificationEventRow = {
  id: string;
  candidateId: string | null;
  resourceId: string | null;
  sourceIntakeJobId: string | null;
  eventType: VerificationEventType;
  actorEmail: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  notes: string | null;
  previousValue: string | null;
  acceptedValue: string | null;
  fieldsConfirmed: string[] | null;
  createdAt: string;
};

const EVENT_SELECT_COLUMNS = "id, candidate_id, resource_id, source_intake_job_id, event_type, actor_email, source_url, source_type, notes, previous_value, accepted_value, fields_confirmed, created_at";

function eventRowFromDb(row: Record<string, unknown>): VerificationEventRow {
  return {
    id: String(row.id),
    candidateId: (row.candidate_id as string | null) ?? null,
    resourceId: (row.resource_id as string | null) ?? null,
    sourceIntakeJobId: (row.source_intake_job_id as string | null) ?? null,
    eventType: row.event_type as VerificationEventType,
    actorEmail: (row.actor_email as string | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    sourceType: (row.source_type as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    previousValue: (row.previous_value as string | null) ?? null,
    acceptedValue: (row.accepted_value as string | null) ?? null,
    fieldsConfirmed: (row.fields_confirmed as string[] | null) ?? null,
    createdAt: String(row.created_at),
  };
}

/** Chronological (oldest first) timeline for one published resource — Gate 6K. Server-only, never exposed publicly. */
export async function dbListVerificationEventsForResource(resourceId: string): Promise<VerificationEventRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(EVENT_SELECT_COLUMNS).eq("resource_id", resourceId).order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => eventRowFromDb(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

/**
 * All events scoped to one intake job — Gate ES-7K. Used to surface LOCATION/REFERRAL_LINK
 * entities on the job result page: these entity types never create a candidate row (ES-7N), so
 * dbListCandidateIdsCreatedByJob() alone cannot show them — their only durable record is the
 * evidence_recorded event this query reads.
 */
export async function dbListVerificationEventsForJob(sourceIntakeJobId: string): Promise<VerificationEventRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(EVENT_SELECT_COLUMNS).eq("source_intake_job_id", sourceIntakeJobId).order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => eventRowFromDb(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Chronological (oldest first) timeline for one candidate — Gate 6L. Server-only, never exposed publicly. */
export async function dbListVerificationEventsForCandidate(candidateId: string): Promise<VerificationEventRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(EVENT_SELECT_COLUMNS).eq("candidate_id", candidateId).order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => eventRowFromDb(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Fire-and-forget insert — never throws, matches auditAdminWrite()'s shape. Failure here must never block the primary action. */
export async function insertVerificationEvent(input: InsertVerificationEventInput): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const supabase = getAdminSupabase();
    await supabase.from(TABLE).insert({
      candidate_id: input.candidateId ?? null,
      resource_id: input.resourceId ?? null,
      source_intake_job_id: input.sourceIntakeJobId ?? null,
      event_type: input.eventType,
      actor_email: input.actorEmail ?? null,
      source_url: input.sourceUrl ?? null,
      source_type: input.sourceType ?? null,
      notes: input.notes ?? null,
      previous_value: input.previousValue !== undefined ? input.previousValue : null,
      accepted_value: input.accepted !== undefined ? input.accepted : null,
      fields_confirmed: input.fieldsConfirmed ?? null,
    });
  } catch {
    // Never block the caller's primary action on audit-history failure.
  }
}

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
};

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
    });
  } catch {
    // Never block the caller's primary action on audit-history failure.
  }
}

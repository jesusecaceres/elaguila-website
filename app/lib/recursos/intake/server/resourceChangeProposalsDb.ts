import "server-only";

/**
 * Recursos Intake OS — access to `public.resource_change_proposals`. Gate 2 added read-only
 * listing; Gate 5 adds the write path: idempotent creation (never duplicate-pending the same
 * resource+field+source), and status transitions (accept/reject/needs-more-research) driven
 * exclusively by the server actions in recursosChangeProposalActions.ts. Service-role only.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ProposalSource } from "@/app/lib/recursos/intake/resourceChangeDetection";

const TABLE = "resource_change_proposals";

const SELECT_COLUMNS = "id, resource_id, source_intake_job_id, field_name, old_value, proposed_value, proposal_source, status, reviewed_by, reviewed_at, created_at";

export type ResourceChangeProposalRow = {
  id: string;
  resourceId: string;
  resourceOrganizationName: string | null;
  /** Spanish Bridge (Gate ES-2D): carried so the Cambios UI can compute isHighRiskResourceForTranslation without a second query. */
  resourcePrimaryCategory: string | null;
  resourceCrisisPhone: string | null;
  resourceIs24Hours: boolean | null;
  sourceIntakeJobId: string | null;
  fieldName: string;
  oldValue: unknown;
  proposedValue: unknown;
  proposalSource: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

const RESOURCE_JOIN = "community_resources(organization_name, primary_category, crisis_phone, is_24_hours)";

function rowFromDb(row: Record<string, unknown>): ResourceChangeProposalRow {
  const joined = row.community_resources as
    | { organization_name?: string; primary_category?: string; crisis_phone?: string | null; is_24_hours?: boolean }
    | null
    | undefined;
  return {
    id: String(row.id),
    resourceId: String(row.resource_id),
    resourceOrganizationName: joined?.organization_name ?? null,
    resourcePrimaryCategory: joined?.primary_category ?? null,
    resourceCrisisPhone: joined?.crisis_phone ?? null,
    resourceIs24Hours: joined?.is_24_hours ?? null,
    sourceIntakeJobId: (row.source_intake_job_id as string | null) ?? null,
    fieldName: String(row.field_name),
    oldValue: row.old_value ?? null,
    proposedValue: row.proposed_value ?? null,
    proposalSource: String(row.proposal_source),
    status: String(row.status),
    reviewedBy: (row.reviewed_by as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export async function dbCountPendingResourceChangeProposals(): Promise<{ count: number; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { count: 0, unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { count, error } = await supabase.from(TABLE).select("id", { count: "exact", head: true }).eq("status", "pending");
    if (error) return { count: 0, unavailable: true };
    return { count: count ?? 0, unavailable: false };
  } catch {
    return { count: 0, unavailable: true };
  }
}

export async function dbListResourceChangeProposals(limit = 100): Promise<{ rows: ResourceChangeProposalRow[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(`${SELECT_COLUMNS}, ${RESOURCE_JOIN}`)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowFromDb(r as unknown as Record<string, unknown>)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

export async function dbListPendingResourceChangeProposalsForResource(resourceId: string): Promise<ResourceChangeProposalRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(SELECT_COLUMNS).eq("resource_id", resourceId).eq("status", "pending").order("field_name");
    if (error || !data) return [];
    return data.map((r) => rowFromDb(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

/**
 * Spanish Bridge (Gate ES-6I) — bulk pending-only read across ALL resources, unlike
 * dbListResourceChangeProposals() (all statuses, capped at `limit`, used by the Cambios page's
 * own client-side pending/decided split) or dbListPendingResourceChangeProposalsForResource()
 * (single resource). The bulk reconciliation queue needs a complete, uncapped pending set to
 * correctly exclude every resource with an unresolved proposal — a truncated list would silently
 * let an excluded resource slip back into "eligible for bulk generation".
 */
export async function dbListAllPendingResourceChangeProposals(): Promise<{ rows: ResourceChangeProposalRow[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(SELECT_COLUMNS).eq("status", "pending").order("created_at", { ascending: false });
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowFromDb(r as unknown as Record<string, unknown>)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

export async function dbGetResourceChangeProposal(id: string): Promise<ResourceChangeProposalRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(SELECT_COLUMNS).eq("id", id).maybeSingle();
    if (error || !data) return null;
    return rowFromDb(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export type CreateResourceChangeProposalInput = {
  resourceId: string;
  sourceIntakeJobId: string | null;
  fieldName: string;
  oldValue: string | null;
  proposedValue: string | null;
  proposalSource: ProposalSource;
};

export type ResourceChangeProposalDbResult = { ok: true; id: string; skippedDuplicate: boolean } | { ok: false; error: string };

/**
 * Idempotent create: if a PENDING proposal already exists for this exact resource+field+source,
 * no new row is created (rerunning comparison for the same job/resource/field never piles up
 * uncontrolled duplicate pending proposals — Gate 5E's dedup requirement). A field that was
 * previously accepted/rejected can propose again later (e.g. a new intake pass finds a further
 * change) since only PENDING rows block a new insert.
 */
export async function dbCreateResourceChangeProposalIfNotPending(input: CreateResourceChangeProposalInput): Promise<ResourceChangeProposalDbResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const existing = await supabase
      .from(TABLE)
      .select("id")
      .eq("resource_id", input.resourceId)
      .eq("field_name", input.fieldName)
      .eq("status", "pending")
      .maybeSingle();
    if (existing.data) {
      return { ok: true, id: String((existing.data as { id: string }).id), skippedDuplicate: true };
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        resource_id: input.resourceId,
        source_intake_job_id: input.sourceIntakeJobId,
        field_name: input.fieldName,
        old_value: input.oldValue,
        proposed_value: input.proposedValue,
        proposal_source: input.proposalSource,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Proposal creation failed — no row returned." };
    return { ok: true, id: String((data as { id: string }).id), skippedDuplicate: false };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Proposal creation failed." };
  }
}

export type UpdateProposalStatusResult = { ok: true } | { ok: false; error: string };

/** Transitions a proposal's status. Never touches community_resources — that is the caller's job, and only for 'accepted'. */
export async function dbUpdateResourceChangeProposalStatus(
  id: string,
  status: "accepted" | "rejected" | "needs_more_research",
  reviewedBy: string | null,
): Promise<UpdateProposalStatusResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase
      .from(TABLE)
      .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending"); // re-check pending server-side — never transition an already-decided proposal
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Status update failed." };
  }
}

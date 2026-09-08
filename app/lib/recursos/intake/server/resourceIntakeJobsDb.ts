import "server-only";

/**
 * Recursos Intake OS — Gate 2 read-only access to `public.resource_intake_jobs`.
 * No write path yet (PDF/URL processing is not wired until later gates). Service-role only,
 * same pattern as `communityResourceCandidateReviewsDb.ts`.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const TABLE = "resource_intake_jobs";

const ACTIVE_STATUSES = ["pending", "processing", "needs_review"] as const;

export type ResourceIntakeJobRow = {
  id: string;
  sourceType: string;
  sourceDocumentId: string | null;
  status: string;
  provider: string | null;
  pagesProcessed: number;
  candidatesCreatedCount: number;
  matchesFoundCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

const SELECT_COLUMNS = "id, source_type, source_document_id, status, provider, pages_processed, candidates_created_count, matches_found_count, error_message, created_at, updated_at";

function rowFromDb(row: Record<string, unknown>): ResourceIntakeJobRow {
  return {
    id: String(row.id),
    sourceType: String(row.source_type),
    sourceDocumentId: (row.source_document_id as string | null) ?? null,
    status: String(row.status),
    provider: (row.provider as string | null) ?? null,
    pagesProcessed: Number(row.pages_processed ?? 0),
    candidatesCreatedCount: Number(row.candidates_created_count ?? 0),
    matchesFoundCount: Number(row.matches_found_count ?? 0),
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function dbCountActiveResourceIntakeJobs(): Promise<{ count: number; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { count: 0, unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .in("status", ACTIVE_STATUSES as unknown as string[]);
    if (error) return { count: 0, unavailable: true };
    return { count: count ?? 0, unavailable: false };
  } catch {
    return { count: 0, unavailable: true };
  }
}

export type CreateResourceIntakeJobInput = {
  sourceType: "pdf" | "url" | "manual" | "partner_referral";
  sourceDocumentId?: string | null;
  createdBy: string | null;
};

export type ResourceIntakeJobDbResult = { ok: true; id: string } | { ok: false; error: string };

/** Creates a job row with status='processing' and started_at=now(). Gate 3 writes only 'url' jobs. */
export async function dbCreateResourceIntakeJob(input: CreateResourceIntakeJobInput): Promise<ResourceIntakeJobDbResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        source_type: input.sourceType,
        source_document_id: input.sourceDocumentId ?? null,
        status: "processing",
        created_by: input.createdBy,
        started_at: now,
      })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Job creation failed — no row returned." };
    return { ok: true, id: String((data as { id: string }).id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Job creation failed." };
  }
}

export type UpdateResourceIntakeJobInput = {
  status?: "processing" | "needs_review" | "completed" | "failed" | "cancelled";
  provider?: string | null;
  pagesProcessed?: number;
  candidatesCreatedCount?: number;
  matchesFoundCount?: number;
  errorMessage?: string | null;
  completed?: boolean;
};

export async function dbUpdateResourceIntakeJob(id: string, input: UpdateResourceIntakeJobInput): Promise<ResourceIntakeJobDbResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.status !== undefined) row.status = input.status;
    if (input.provider !== undefined) row.provider = input.provider;
    if (input.pagesProcessed !== undefined) row.pages_processed = input.pagesProcessed;
    if (input.candidatesCreatedCount !== undefined) row.candidates_created_count = input.candidatesCreatedCount;
    if (input.matchesFoundCount !== undefined) row.matches_found_count = input.matchesFoundCount;
    if (input.errorMessage !== undefined) row.error_message = input.errorMessage;
    if (input.completed) row.completed_at = new Date().toISOString();

    const { data, error } = await supabase.from(TABLE).update(row).eq("id", id).select("id").maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Job not found." };
    return { ok: true, id: String((data as { id: string }).id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Job update failed." };
  }
}

export async function dbGetResourceIntakeJob(id: string): Promise<ResourceIntakeJobRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return rowFromDb(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** All jobs that processed a given source document — used for Gate 5 updated-guide comparison. */
export async function dbListResourceIntakeJobsForDocument(sourceDocumentId: string): Promise<ResourceIntakeJobRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(SELECT_COLUMNS).eq("source_document_id", sourceDocumentId);
    if (error || !data) return [];
    return data.map((r) => rowFromDb(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function dbListRecentResourceIntakeJobs(limit = 20): Promise<{ rows: ResourceIntakeJobRow[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowFromDb(r as Record<string, unknown>)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

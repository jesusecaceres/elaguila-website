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
  status: string;
  provider: string | null;
  pagesProcessed: number;
  candidatesCreatedCount: number;
  matchesFoundCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowFromDb(row: Record<string, unknown>): ResourceIntakeJobRow {
  return {
    id: String(row.id),
    sourceType: String(row.source_type),
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

export async function dbListRecentResourceIntakeJobs(limit = 20): Promise<{ rows: ResourceIntakeJobRow[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, source_type, status, provider, pages_processed, candidates_created_count, matches_found_count, error_message, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowFromDb(r as Record<string, unknown>)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

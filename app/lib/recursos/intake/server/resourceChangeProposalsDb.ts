import "server-only";

/**
 * Recursos Intake OS — Gate 2 read-only access to `public.resource_change_proposals`.
 * No accept/reject write path yet — that is Gate 5. Service-role only.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const TABLE = "resource_change_proposals";

export type ResourceChangeProposalRow = {
  id: string;
  resourceId: string;
  resourceOrganizationName: string | null;
  fieldName: string;
  oldValue: unknown;
  proposedValue: unknown;
  proposalSource: string;
  status: string;
  createdAt: string;
};

function rowFromDb(row: Record<string, unknown>): ResourceChangeProposalRow {
  const joined = row.community_resources as { organization_name?: string } | null | undefined;
  return {
    id: String(row.id),
    resourceId: String(row.resource_id),
    resourceOrganizationName: joined?.organization_name ?? null,
    fieldName: String(row.field_name),
    oldValue: row.old_value ?? null,
    proposedValue: row.proposed_value ?? null,
    proposalSource: String(row.proposal_source),
    status: String(row.status),
    createdAt: String(row.created_at),
  };
}

export async function dbCountPendingResourceChangeProposals(): Promise<{ count: number; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { count: 0, unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
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
      .select("id, resource_id, field_name, old_value, proposed_value, proposal_source, status, created_at, community_resources(organization_name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowFromDb(r as unknown as Record<string, unknown>)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

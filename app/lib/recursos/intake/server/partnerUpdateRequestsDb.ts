import "server-only";

/**
 * Recursos Intake OS — Gate 2 read-only access to `public.partner_update_requests`.
 * V1 is admin-entered only: no write path exists yet in Gate 2 (staff-entry action lands in
 * Gate 7), and there is no public submission form. Service-role only.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const TABLE = "partner_update_requests";

export type PartnerUpdateRequestRow = {
  id: string;
  resourceId: string | null;
  resourceOrganizationName: string | null;
  organizationName: string | null;
  requestType: string;
  status: string;
  submittedContactName: string | null;
  submittedContactEmail: string | null;
  createdAt: string;
};

function rowFromDb(row: Record<string, unknown>): PartnerUpdateRequestRow {
  const joined = row.community_resources as { organization_name?: string } | null | undefined;
  return {
    id: String(row.id),
    resourceId: (row.resource_id as string | null) ?? null,
    resourceOrganizationName: joined?.organization_name ?? null,
    organizationName: (row.organization_name as string | null) ?? null,
    requestType: String(row.request_type),
    status: String(row.status),
    submittedContactName: (row.submitted_contact_name as string | null) ?? null,
    submittedContactEmail: (row.submitted_contact_email as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export async function dbCountPendingPartnerUpdateRequests(): Promise<{ count: number; unavailable: boolean }> {
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

export async function dbListPartnerUpdateRequests(limit = 100): Promise<{ rows: PartnerUpdateRequestRow[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        "id, resource_id, organization_name, request_type, status, submitted_contact_name, submitted_contact_email, created_at, community_resources(organization_name)",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowFromDb(r as unknown as Record<string, unknown>)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

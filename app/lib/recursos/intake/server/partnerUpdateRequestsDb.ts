import "server-only";

/**
 * Recursos Intake OS — access to `public.partner_update_requests`. Gate 2 added read-only
 * listing; Gate 7 adds the write path: admin-entered creation, status-lifecycle transitions
 * (pending -> reviewing -> resolved/rejected). V1 is admin-entered only — no public submission
 * form exists or is planned in this table's write path. Service-role only.
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
  requestedChanges: Record<string, string>;
  sourceNotes: string | null;
  createdBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

const DETAIL_SELECT_COLUMNS =
  "id, resource_id, organization_name, request_type, status, submitted_contact_name, submitted_contact_email, requested_changes, source_notes, created_by, reviewed_by, reviewed_at, created_at, community_resources(organization_name)";

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
    requestedChanges: (row.requested_changes as Record<string, string> | null) ?? {},
    sourceNotes: (row.source_notes as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    reviewedBy: (row.reviewed_by as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
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

export async function dbGetPartnerUpdateRequest(id: string): Promise<PartnerUpdateRequestRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(DETAIL_SELECT_COLUMNS).eq("id", id).maybeSingle();
    if (error || !data) return null;
    return rowFromDb(data as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export type CreatePartnerUpdateRequestInput = {
  resourceId: string | null;
  organizationName: string | null;
  submittedContactName: string | null;
  submittedContactEmail: string | null;
  requestType: string;
  /** Only ever populated with keys from REQUEST_TYPE_FIELDS (partnerRequestFieldMap.ts) — never arbitrary client JSON. */
  requestedChanges: Record<string, string>;
  sourceNotes: string | null;
  createdBy: string | null;
};

export type CreatePartnerUpdateRequestResult = { ok: true; id: string } | { ok: false; error: string };

export async function dbCreatePartnerUpdateRequest(input: CreatePartnerUpdateRequestInput): Promise<CreatePartnerUpdateRequestResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        resource_id: input.resourceId,
        organization_name: input.organizationName,
        submitted_contact_name: input.submittedContactName,
        submitted_contact_email: input.submittedContactEmail,
        request_type: input.requestType,
        requested_changes: input.requestedChanges,
        source_notes: input.sourceNotes,
        status: "pending",
        created_by: input.createdBy,
      })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Request creation failed — no row returned." };
    return { ok: true, id: String((data as { id: string }).id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request creation failed." };
  }
}

export type UpdatePartnerUpdateRequestStatusResult = { ok: true } | { ok: false; error: string };

/**
 * Transitions a request's status. `fromStatuses`, when given, is checked server-side so a
 * request already resolved/rejected cannot be silently re-transitioned under a race — mirrors
 * the same re-check pattern used by dbUpdateResourceChangeProposalStatus (Gate 5).
 */
export async function dbUpdatePartnerUpdateRequestStatus(
  id: string,
  status: "reviewing" | "resolved" | "rejected",
  reviewedBy: string | null,
  fromStatuses?: string[],
): Promise<UpdatePartnerUpdateRequestStatusResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    let query = supabase
      .from(TABLE)
      .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (fromStatuses && fromStatuses.length > 0) query = query.in("status", fromStatuses);
    const { error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Status update failed." };
  }
}

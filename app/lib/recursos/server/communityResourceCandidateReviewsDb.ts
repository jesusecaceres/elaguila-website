import "server-only";

/**
 * Build 03A-V — persistence for `public.community_resource_candidate_reviews`
 * (see `supabase/migrations/20260819120000_community_resource_candidate_reviews.sql`).
 *
 * Admin/operations evidence only — service-role writes exactly like `communityResourcesDb.ts`,
 * never the anon client. Narrow, single-purpose: get/list/save review state, set disposition,
 * link a promoted resource id. This is not a generic CRUD framework.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { CandidateReview, CandidateReviewInput } from "@/app/lib/recursos/verificationEvidence";

const TABLE = "community_resource_candidate_reviews";

const SELECT_COLUMNS = [
  "id",
  "candidate_id",
  "disposition",
  "reviewed_by",
  "reviewed_at",
  "current_source_url",
  "current_source_type",
  "organization_confirmed_active",
  "fields_confirmed",
  "discrepancies_from_pdf",
  "is_24_hours_confirmed_explicit",
  "address_handling",
  "verification_notes",
  "promoted_resource_id",
  "created_at",
  "updated_at",
].join(", ");

type CandidateReviewRow = {
  id: string;
  candidate_id: string;
  disposition: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  current_source_url: string | null;
  current_source_type: string | null;
  organization_confirmed_active: boolean | null;
  fields_confirmed: unknown;
  discrepancies_from_pdf: unknown;
  is_24_hours_confirmed_explicit: boolean;
  address_handling: string | null;
  verification_notes: string | null;
  promoted_resource_id: string | null;
  created_at: string;
  updated_at: string;
};

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asDiscrepancies(v: unknown): CandidateReview["discrepanciesFromPdf"] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row) => ({
      field: String(row.field ?? ""),
      pdfValue: String(row.pdfValue ?? ""),
      currentValue: String(row.currentValue ?? ""),
    }));
}

function rowToCandidateReview(row: CandidateReviewRow): CandidateReview {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    disposition: row.disposition as CandidateReview["disposition"],
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    currentSourceUrl: row.current_source_url,
    currentSourceType: row.current_source_type as CandidateReview["currentSourceType"],
    organizationConfirmedActive: row.organization_confirmed_active,
    fieldsConfirmed: asStringArray(row.fields_confirmed),
    discrepanciesFromPdf: asDiscrepancies(row.discrepancies_from_pdf),
    is24HoursConfirmedExplicit: Boolean(row.is_24_hours_confirmed_explicit),
    addressHandling: row.address_handling as CandidateReview["addressHandling"],
    verificationNotes: row.verification_notes,
    promotedResourceId: row.promoted_resource_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CandidateReviewDbResult = { ok: true; id: string; candidateId: string } | { ok: false; error: string };

export async function dbListCandidateReviews(): Promise<{ rows: CandidateReview[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(SELECT_COLUMNS).order("updated_at", { ascending: false });
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowToCandidateReview(r as unknown as CandidateReviewRow)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

export async function dbGetCandidateReview(candidateId: string): Promise<CandidateReview | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(SELECT_COLUMNS).eq("candidate_id", candidateId).maybeSingle();
    if (error || !data) return null;
    return rowToCandidateReview(data as unknown as CandidateReviewRow);
  } catch {
    return null;
  }
}

/** Insert-or-update by candidateId. Never touches `promoted_resource_id` — use `dbSetPromotedResourceId`. */
export async function dbSaveCandidateReview(input: CandidateReviewInput): Promise<CandidateReviewDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  if (!input.candidateId?.trim()) return { ok: false, error: "candidateId is required." };

  try {
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();
    const row = {
      candidate_id: input.candidateId,
      disposition: input.disposition,
      reviewed_by: input.reviewedBy,
      reviewed_at: input.reviewedAt,
      current_source_url: input.currentSourceUrl,
      current_source_type: input.currentSourceType,
      organization_confirmed_active: input.organizationConfirmedActive,
      fields_confirmed: input.fieldsConfirmed ?? [],
      discrepancies_from_pdf: input.discrepanciesFromPdf ?? [],
      is_24_hours_confirmed_explicit: Boolean(input.is24HoursConfirmedExplicit),
      address_handling: input.addressHandling,
      verification_notes: input.verificationNotes,
      updated_at: now,
    };
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(row, { onConflict: "candidate_id" })
      .select("id, candidate_id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Save failed — no row returned." };
    return { ok: true, id: String((data as { id: string }).id), candidateId: String((data as { candidate_id: string }).candidate_id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed." };
  }
}

export async function dbSetCandidateReviewDisposition(
  candidateId: string,
  disposition: CandidateReview["disposition"],
): Promise<CandidateReviewDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ disposition, updated_at: new Date().toISOString() })
      .eq("candidate_id", candidateId)
      .select("id, candidate_id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Candidate review was not found." };
    return { ok: true, id: String((data as { id: string }).id), candidateId: String((data as { candidate_id: string }).candidate_id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

/**
 * Links a promoted `community_resources.id` back onto the review row, and flips disposition
 * to `promoted`. Refuses if a `promoted_resource_id` is already set — the double-promotion
 * guard lives here, not just in the caller, so it holds even if called from a second path later.
 */
export async function dbSetPromotedResourceId(candidateId: string, resourceId: string): Promise<CandidateReviewDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  try {
    const supabase = getAdminSupabase();
    const existing = await dbGetCandidateReview(candidateId);
    if (existing?.promotedResourceId) {
      return { ok: false, error: `Candidate "${candidateId}" was already promoted to resource ${existing.promotedResourceId}.` };
    }
    const { data, error } = await supabase
      .from(TABLE)
      .update({ promoted_resource_id: resourceId, disposition: "promoted", updated_at: new Date().toISOString() })
      .eq("candidate_id", candidateId)
      .select("id, candidate_id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Candidate review was not found." };
    return { ok: true, id: String((data as { id: string }).id), candidateId: String((data as { candidate_id: string }).candidate_id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

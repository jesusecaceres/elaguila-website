/**
 * Program 6 — Creative Studio repository.
 * Server-only, always via getAdminSupabase(). Every write requires a CreativeActor.
 * Creative approval does not charge, create payment, grant entitlement, or publish.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { isValidCreativeJobStatusTransition } from "./constants";
import type {
  CreativeJob, CreativeJobStatus, CreativeJobVersion,
  CreativeReview, CreativeExport,
} from "./types";

export interface CreativeActor {
  type: "staff" | "owner";
  rosterId: string | null;
  authUserId: string;
  email: string;
  role: string;
}

function actorRosterId(actor: CreativeActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}

const JOB_COLUMNS =
  "id, business_id, source_recommendation_id, source_proposal_id, asset_type, language, format, archetype, layout_variant, status, input_snapshot_id, doctrine_version, template_version, provider_key, model_key, creative_lane, risk_class, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, approved_actor_type, approved_by_roster_id, approved_by_auth_user_id, approved_by_email, approved_by_role, approved_at, created_at, updated_at";

function mapJobRow(row: Record<string, unknown>): CreativeJob {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sourceRecommendationId: (row.source_recommendation_id as string | null) ?? null,
    sourceProposalId: (row.source_proposal_id as string | null) ?? null,
    assetType: row.asset_type as CreativeJob["assetType"],
    language: row.language as CreativeJob["language"],
    format: row.format as CreativeJob["format"],
    archetype: row.archetype as CreativeJob["archetype"],
    layoutVariant: row.layout_variant as CreativeJob["layoutVariant"],
    status: row.status as CreativeJobStatus,
    inputSnapshotId: (row.input_snapshot_id as string | null) ?? null,
    doctrineVersion: String(row.doctrine_version),
    templateVersion: String(row.template_version),
    providerKey: String(row.provider_key),
    modelKey: String(row.model_key),
    creativeLane: row.creative_lane as CreativeJob["creativeLane"],
    riskClass: row.risk_class as CreativeJob["riskClass"],
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    approvedActorType: (row.approved_actor_type as "staff" | "owner" | null) ?? null,
    approvedByRosterId: (row.approved_by_roster_id as string | null) ?? null,
    approvedByAuthUserId: (row.approved_by_auth_user_id as string | null) ?? null,
    approvedByEmail: (row.approved_by_email as string | null) ?? null,
    approvedByRole: (row.approved_by_role as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listJobsForBusiness(businessId: string): Promise<CreativeJob[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_jobs")
    .select(JOB_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapJobRow);
}

export async function getJobById(businessId: string, jobId: string): Promise<CreativeJob | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapJobRow(data);
}

export async function createJob(
  businessId: string,
  input: Omit<CreativeJob, "id" | "businessId" | "status" | "approvedActorType" | "approvedByRosterId" | "approvedByAuthUserId" | "approvedByEmail" | "approvedByRole" | "approvedAt" | "createdAt" | "updatedAt">,
  actor: CreativeActor,
): Promise<CreativeJob | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_jobs")
    .insert({
      business_id: businessId,
      source_recommendation_id: input.sourceRecommendationId,
      source_proposal_id: input.sourceProposalId,
      asset_type: input.assetType,
      language: input.language,
      format: input.format,
      archetype: input.archetype,
      layout_variant: input.layoutVariant,
      status: "draft",
      input_snapshot_id: input.inputSnapshotId,
      doctrine_version: input.doctrineVersion,
      template_version: input.templateVersion,
      provider_key: input.providerKey,
      model_key: input.modelKey,
      creative_lane: input.creativeLane,
      risk_class: input.riskClass,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
    })
    .select(JOB_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapJobRow(data);
}

export async function transitionJobStatus(
  businessId: string,
  jobId: string,
  newStatus: CreativeJobStatus,
  actor: CreativeActor,
): Promise<CreativeJob | null> {
  const job = await getJobById(businessId, jobId);
  if (!job) return null;
  if (!isValidCreativeJobStatusTransition(job.status, newStatus)) return null;

  const supabase = getAdminSupabase();
  const updateData: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };

  if (newStatus === "approved") {
    updateData.approved_actor_type = actor.type;
    updateData.approved_by_roster_id = actorRosterId(actor);
    updateData.approved_by_auth_user_id = actor.authUserId;
    updateData.approved_by_email = actor.email;
    updateData.approved_by_role = actor.role;
    updateData.approved_at = new Date().toISOString();
  } else if (newStatus !== "archived") {
    // Blocker 9: Clear approval attribution when leaving approved/archived for active non-approved states.
    updateData.approved_actor_type = null;
    updateData.approved_by_roster_id = null;
    updateData.approved_by_auth_user_id = null;
    updateData.approved_by_email = null;
    updateData.approved_by_role = null;
    updateData.approved_at = null;
  }

  const { data, error } = await supabase
    .from("business_creative_jobs")
    .update(updateData)
    .eq("id", jobId)
    .eq("business_id", businessId)
    .select(JOB_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapJobRow(data);
}

export async function listVersionsForJob(businessId: string, jobId: string): Promise<CreativeJobVersion[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_job_versions")
    .select("*")
    .eq("business_id", businessId)
    .eq("job_id", jobId)
    .order("version_number", { ascending: false });
  if (error || !data) return [];
  return data as CreativeJobVersion[];
}

export async function listReviewsForJob(businessId: string, jobId: string): Promise<CreativeReview[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_reviews")
    .select("*")
    .eq("business_id", businessId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as CreativeReview[];
}

export async function listExportsForJob(businessId: string, jobId: string): Promise<CreativeExport[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_exports")
    .select("*")
    .eq("business_id", businessId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as CreativeExport[];
}

/**
 * Program 6 — Creative Studio repository.
 * Server-only, always via getAdminSupabase(). Every write requires a CreativeActor.
 * Creative approval does not charge, create payment, grant entitlement, or publish.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { isValidCreativeJobStatusTransition } from "./constants";
import type {
  CreativeBrief, CreativeInputSnapshot, CreativeJob, CreativeJobStatus, CreativeJobVersion,
  CreativeProviderRun, CreativeReview, CreativeExport, SnapshotCategory,
} from "./types";
import type { BusinessCreativeAsset } from "./assetTypes";

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
  "id, business_id, source_recommendation_id, source_proposal_id, source_opportunity_id, asset_type, language, format, archetype, layout_variant, status, input_snapshot_id, doctrine_version, template_version, provider_key, model_key, creative_lane, risk_class, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, approved_actor_type, approved_by_roster_id, approved_by_auth_user_id, approved_by_email, approved_by_role, approved_at, created_at, updated_at";

function mapJobRow(row: Record<string, unknown>): CreativeJob {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sourceRecommendationId: (row.source_recommendation_id as string | null) ?? null,
    sourceProposalId: (row.source_proposal_id as string | null) ?? null,
    sourceOpportunityId: (row.source_opportunity_id as string | null) ?? null,
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
      source_opportunity_id: input.sourceOpportunityId,
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
  return data.map((row) => mapVersionRow(row as Record<string, unknown>));
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
  return data.map((row) => mapReviewRow(row as Record<string, unknown>));
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
  return data.map((row) => mapExportRow(row as Record<string, unknown>));
}

// ─── Package A — Input snapshots (append-only) ─────────────────────────────

function mapSnapshotRow(row: Record<string, unknown>): CreativeInputSnapshot {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    jobId: String(row.job_id),
    version: Number(row.version),
    categories: (row.categories as SnapshotCategory[]) ?? [],
    snapshotTimestamp: String(row.snapshot_timestamp),
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export async function getLatestSnapshotForJob(businessId: string, jobId: string): Promise<CreativeInputSnapshot | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_input_snapshots")
    .select("*")
    .eq("business_id", businessId)
    .eq("job_id", jobId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapSnapshotRow(data);
}

/** Append-only — always inserts a new snapshot version; never overwrites a prior one. */
export async function createInputSnapshot(
  businessId: string,
  jobId: string,
  categories: readonly SnapshotCategory[],
  actor: CreativeActor,
): Promise<CreativeInputSnapshot | null> {
  const supabase = getAdminSupabase();
  const previous = await getLatestSnapshotForJob(businessId, jobId);
  const nextVersion = (previous?.version ?? 0) + 1;

  const { data, error } = await supabase
    .from("business_creative_input_snapshots")
    .insert({
      job_id: jobId,
      business_id: businessId,
      version: nextVersion,
      categories,
      created_actor_type: actor.type,
      created_by_auth_user_id: actor.authUserId,
      created_by_roster_id: actorRosterId(actor),
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return mapSnapshotRow(data);
}

// ─── Package A — Creative briefs ────────────────────────────────────────────

const BRIEF_COLUMNS =
  "id, business_id, job_id, status, business_goal, campaign_objective, reader_need, target_audience, primary_language, secondary_language, primary_message, supporting_message, offer, cta, contact_path, qr_target, key_services, trust_evidence, required_disclaimers, prohibited_claims, creative_lane, archetype, format, layout_options, image_strategy, must_use_asset_ids, optional_asset_ids, missing_asset_descriptions, source_recommendation_id, desired_action, risk_class, review_requirements, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, approved_by_auth_user_id, approved_at, created_at, updated_at";

function mapBriefRow(row: Record<string, unknown>): CreativeBrief {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    jobId: String(row.job_id),
    status: row.status as CreativeBrief["status"],
    businessGoal: String(row.business_goal),
    campaignObjective: String(row.campaign_objective),
    readerNeed: String(row.reader_need),
    targetAudience: String(row.target_audience),
    primaryLanguage: row.primary_language as CreativeBrief["primaryLanguage"],
    secondaryLanguage: (row.secondary_language as CreativeBrief["secondaryLanguage"]) ?? null,
    primaryMessage: String(row.primary_message),
    supportingMessage: (row.supporting_message as string | null) ?? null,
    offer: (row.offer as string | null) ?? null,
    cta: String(row.cta),
    contactPath: String(row.contact_path),
    qrTarget: (row.qr_target as string | null) ?? null,
    keyServices: (row.key_services as string[]) ?? [],
    trustEvidence: (row.trust_evidence as string[]) ?? [],
    requiredDisclaimers: (row.required_disclaimers as string[]) ?? [],
    prohibitedClaims: (row.prohibited_claims as string[]) ?? [],
    creativeLane: row.creative_lane as CreativeBrief["creativeLane"],
    archetype: row.archetype as CreativeBrief["archetype"],
    format: row.format as CreativeBrief["format"],
    layoutOptions: (row.layout_options as CreativeBrief["layoutOptions"]) ?? [],
    imageStrategy: String(row.image_strategy),
    mustUseAssetIds: (row.must_use_asset_ids as string[]) ?? [],
    optionalAssetIds: (row.optional_asset_ids as string[]) ?? [],
    missingAssetDescriptions: (row.missing_asset_descriptions as string[]) ?? [],
    sourceRecommendationId: (row.source_recommendation_id as string | null) ?? null,
    desiredAction: String(row.desired_action),
    riskClass: row.risk_class as CreativeBrief["riskClass"],
    reviewRequirements: (row.review_requirements as string[]) ?? [],
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    approvedByAuthUserId: (row.approved_by_auth_user_id as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export type CreateBriefInput = Omit<
  CreativeBrief,
  "id" | "businessId" | "jobId" | "status" | "createdActorType" | "createdByRosterId" | "createdByAuthUserId" | "createdByEmail" | "createdByRole" | "approvedByAuthUserId" | "approvedAt" | "createdAt" | "updatedAt"
>;

export async function createBrief(
  businessId: string,
  jobId: string,
  input: CreateBriefInput,
  actor: CreativeActor,
): Promise<CreativeBrief | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_briefs")
    .insert({
      job_id: jobId,
      business_id: businessId,
      status: "DRAFT",
      business_goal: input.businessGoal,
      campaign_objective: input.campaignObjective,
      reader_need: input.readerNeed,
      target_audience: input.targetAudience,
      primary_language: input.primaryLanguage,
      secondary_language: input.secondaryLanguage,
      primary_message: input.primaryMessage,
      supporting_message: input.supportingMessage,
      offer: input.offer,
      cta: input.cta,
      contact_path: input.contactPath,
      qr_target: input.qrTarget,
      key_services: input.keyServices,
      trust_evidence: input.trustEvidence,
      required_disclaimers: input.requiredDisclaimers,
      prohibited_claims: input.prohibitedClaims,
      creative_lane: input.creativeLane,
      archetype: input.archetype,
      format: input.format,
      layout_options: input.layoutOptions,
      image_strategy: input.imageStrategy,
      must_use_asset_ids: input.mustUseAssetIds,
      optional_asset_ids: input.optionalAssetIds,
      missing_asset_descriptions: input.missingAssetDescriptions,
      source_recommendation_id: input.sourceRecommendationId,
      desired_action: input.desiredAction,
      risk_class: input.riskClass,
      review_requirements: input.reviewRequirements,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
    })
    .select(BRIEF_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapBriefRow(data);
}

export async function getLatestBriefForJob(businessId: string, jobId: string): Promise<CreativeBrief | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_briefs")
    .select(BRIEF_COLUMNS)
    .eq("business_id", businessId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapBriefRow(data);
}

// ─── Package A — Job versions (append-only) ────────────────────────────────

function mapVersionRow(row: Record<string, unknown>): CreativeJobVersion {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    jobId: String(row.job_id),
    versionNumber: Number(row.version_number),
    snapshotId: String(row.snapshot_id),
    briefId: (row.brief_id as string | null) ?? null,
    generatedCopy: (row.generated_copy as Record<string, unknown>) ?? {},
    generatedHeadlines: (row.generated_headlines as string[]) ?? [],
    generatedBodyCopy: (row.generated_body_copy as string[]) ?? [],
    generatedCta: (row.generated_cta as string | null) ?? null,
    generatedDisclaimer: (row.generated_disclaimer as string | null) ?? null,
    isCurrent: Boolean(row.is_current),
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
  };
}

function mapReviewRow(row: Record<string, unknown>): CreativeReview {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    jobId: String(row.job_id),
    versionId: String(row.version_id),
    issueType: row.issue_type as CreativeReview["issueType"],
    issueDescription: String(row.issue_description),
    severity: row.severity as CreativeReview["severity"],
    resolutionOfId: (row.resolution_of_id as string | null) ?? null,
    reviewerActorType: row.reviewer_actor_type as CreativeReview["reviewerActorType"],
    reviewerRosterId: (row.reviewer_roster_id as string | null) ?? null,
    reviewerAuthUserId: String(row.reviewer_auth_user_id),
    reviewerEmail: String(row.reviewer_email),
    reviewerRole: String(row.reviewer_role),
    createdAt: String(row.created_at),
  };
}

function mapExportRow(row: Record<string, unknown>): CreativeExport {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    jobId: String(row.job_id),
    versionId: String(row.version_id),
    exportType: row.export_type as CreativeExport["exportType"],
    content: String(row.content ?? ""),
    status: row.status as CreativeExport["status"],
    generatedAt: (row.generated_at as string | null) ?? null,
    createdActorType: row.created_actor_type as CreativeExport["createdActorType"],
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export interface CreateJobVersionInput {
  snapshotId: string;
  briefId: string | null;
  generatedCopy: Record<string, unknown>;
  generatedHeadlines: readonly string[];
  generatedBodyCopy: readonly string[];
  generatedCta: string | null;
  generatedDisclaimer: string | null;
}

/**
 * Append-only (business_creative_job_versions has no UPDATE grant — see migration). Consumers must
 * treat the highest version_number for a job as "current", not rely on stale is_current flags on
 * older rows.
 */
export async function createJobVersion(
  businessId: string,
  jobId: string,
  input: CreateJobVersionInput,
  actor: CreativeActor,
): Promise<CreativeJobVersion | null> {
  const supabase = getAdminSupabase();
  const existing = await listVersionsForJob(businessId, jobId);
  const nextVersionNumber = (existing[0]?.versionNumber ?? 0) + 1;

  const { data, error } = await supabase
    .from("business_creative_job_versions")
    .insert({
      job_id: jobId,
      business_id: businessId,
      version_number: nextVersionNumber,
      snapshot_id: input.snapshotId,
      brief_id: input.briefId,
      generated_copy: input.generatedCopy,
      generated_headlines: input.generatedHeadlines,
      generated_body_copy: input.generatedBodyCopy,
      generated_cta: input.generatedCta,
      generated_disclaimer: input.generatedDisclaimer,
      is_current: true,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return mapVersionRow(data);
}

// ─── Package A — Provider runs (append-only, no secrets, privacy-safe metadata only) ───────────

function mapProviderRunRow(row: Record<string, unknown>): CreativeProviderRun {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    jobId: String(row.job_id),
    versionId: (row.version_id as string | null) ?? null,
    providerKey: String(row.provider_key),
    modelKey: String(row.model_key),
    templateVersion: String(row.template_version),
    schemaVersion: String(row.schema_version),
    inputSnapshotId: String(row.input_snapshot_id),
    status: row.status as CreativeProviderRun["status"],
    errorState: (row.error_state as string | null) ?? null,
    latencyMs: (row.latency_ms as number | null) ?? null,
    costMetadata: (row.cost_metadata as Record<string, unknown> | null) ?? null,
    initiatedActorType: row.initiated_actor_type as CreativeProviderRun["initiatedActorType"],
    initiatedByRosterId: (row.initiated_by_roster_id as string | null) ?? null,
    initiatedByAuthUserId: (row.initiated_by_auth_user_id as string | null) ?? null,
    initiatedByRole: String(row.initiated_by_role),
    createdAt: String(row.created_at),
  };
}

/** Rate/cost safety (Package A, Gate 12) — used to enforce a minimum cooldown between generation attempts for a job. */
export async function getLastProviderRunForJob(businessId: string, jobId: string): Promise<CreativeProviderRun | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_provider_runs")
    .select("*")
    .eq("business_id", businessId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapProviderRunRow(data);
}

export interface CreateProviderRunInput {
  versionId: string | null;
  providerKey: string;
  modelKey: string;
  templateVersion: string;
  schemaVersion: string;
  inputSnapshotId: string;
  status: "pending" | "success" | "failed" | "fallback";
  errorState: string | null;
  latencyMs: number | null;
  costMetadata: Record<string, unknown> | null;
}

/** Never stores secret key values — costMetadata/errorState must only ever contain bounded, non-secret text. */
export async function createProviderRun(
  businessId: string,
  jobId: string,
  input: CreateProviderRunInput,
  actor: CreativeActor,
): Promise<CreativeProviderRun | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_provider_runs")
    .insert({
      job_id: jobId,
      business_id: businessId,
      version_id: input.versionId,
      provider_key: input.providerKey,
      model_key: input.modelKey,
      template_version: input.templateVersion,
      schema_version: input.schemaVersion,
      input_snapshot_id: input.inputSnapshotId,
      status: input.status,
      error_state: input.errorState,
      latency_ms: input.latencyMs,
      cost_metadata: input.costMetadata,
      initiated_actor_type: actor.type,
      initiated_by_roster_id: actorRosterId(actor),
      initiated_by_auth_user_id: actor.authUserId,
      initiated_by_role: actor.role,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return mapProviderRunRow(data);
}

// ─── Package A, Gate 10 — AI-generated image assets ────────────────────────

/**
 * Persists an OpenAI-generated image as a business_creative_assets row. Always inserted as
 * asset_kind="ai_illustrative" / rights_source="ai_generated" / authenticity_classification=
 * "AI_ILLUSTRATIVE" / approval_state="pending" — the DB CHECK constraints enforce this
 * combination cannot drift, and pending approval means it can never reach final approval until a
 * human reviews it (see assetTypes.ts canAssetReachFinalApproval).
 */
export async function createGeneratedImageAsset(
  businessId: string,
  jobId: string,
  input: {
    storageRef: string;
    originalFilename: string;
    mimeType: string;
    pixelWidth: number | null;
    pixelHeight: number | null;
    fileSizeBytes: number | null;
  },
  actor: CreativeActor,
): Promise<BusinessCreativeAsset | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_assets")
    .insert({
      business_id: businessId,
      job_id: jobId,
      asset_kind: "ai_illustrative",
      storage_ref: input.storageRef,
      original_filename: input.originalFilename,
      mime_type: input.mimeType,
      pixel_width: input.pixelWidth,
      pixel_height: input.pixelHeight,
      file_size_bytes: input.fileSizeBytes,
      rights_source: "ai_generated",
      rights_status: "pending_review",
      authenticity_classification: "AI_ILLUSTRATIVE",
      approval_state: "pending",
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    jobId: (row.job_id as string | null) ?? null,
    assetKind: row.asset_kind as BusinessCreativeAsset["assetKind"],
    storageRef: String(row.storage_ref),
    originalFilename: String(row.original_filename),
    mimeType: String(row.mime_type),
    pixelWidth: (row.pixel_width as number | null) ?? null,
    pixelHeight: (row.pixel_height as number | null) ?? null,
    aspectRatio: (row.aspect_ratio as number | null) ?? null,
    fileSizeBytes: (row.file_size_bytes as number | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    rightsSource: row.rights_source as BusinessCreativeAsset["rightsSource"],
    rightsStatus: row.rights_status as BusinessCreativeAsset["rightsStatus"],
    permissionDate: (row.permission_date as string | null) ?? null,
    permissionActorAuthUserId: (row.permission_actor_auth_user_id as string | null) ?? null,
    modelReleaseState: row.model_release_state as BusinessCreativeAsset["modelReleaseState"],
    propertyReleaseState: row.property_release_state as BusinessCreativeAsset["propertyReleaseState"],
    allowedUses: (row.allowed_uses as string[]) ?? [],
    expirationRestriction: (row.expiration_restriction as string | null) ?? null,
    authenticityClassification: row.authenticity_classification as BusinessCreativeAsset["authenticityClassification"],
    approvalState: row.approval_state as BusinessCreativeAsset["approvalState"],
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

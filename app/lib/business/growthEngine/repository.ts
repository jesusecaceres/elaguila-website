/**
 * Business Development & Growth Engine — Gate A repository. Server-only, always via
 * getAdminSupabase(). Mirrors the exact business-scoping convention used throughout Program 6/7 /
 * Package B repositories: every read/write filters on BOTH id and business_id, never id alone —
 * the actual mechanism (not UI hiding) that prevents Business A staff from reading/mutating
 * Business B's growth data.
 *
 * No AI call happens anywhere in this file — Gate A is the data-model foundation only. Gate B (the
 * Business Development Analyst / OpenAI intelligence engine) will call createGrowthAssessment with
 * real provider output; nothing here invents findings.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { isValidGrowthAssessmentStatusTransition, isValidGrowthCampaignTransition, isValidGrowthSolutionTransition } from "./constants";
import { roadmapStepCatalog } from "./roadmapCatalog";
import type {
  CreateGrowthAssessmentInput,
  CreateGrowthCampaignInput,
  CreateGrowthOfficialRequirementInput,
  CreateGrowthSolutionInput,
  GrowthAssessment,
  GrowthCampaign,
  GrowthCampaignStatus,
  GrowthEntityType,
  GrowthEvent,
  GrowthMediaChannel,
  GrowthOfficialRequirement,
  GrowthOfficialRequirementState,
  GrowthRoadmapStep,
  GrowthRoadmapStepState,
  GrowthRoadmapType,
  GrowthSolution,
  GrowthSolutionExecutionTarget,
  GrowthSolutionState,
  GrowthEngineActor,
  GrowthAssessmentReviewDecision,
  GrowthAssessmentStatus,
} from "./types";

const REVIEW_DECISION_TO_STATUS: Record<GrowthAssessmentReviewDecision, GrowthAssessmentStatus> = {
  accepted: "reviewed",
  needs_correction: "needs_correction",
  rejected: "rejected",
};

function actorRosterId(actor: GrowthEngineActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorAuthUserId(actor: GrowthEngineActor): string | null {
  return actor.type === "system" ? null : actor.authUserId;
}

// =================================================================================================
// Events (Section I) — internal helper, called by every mutation below. Never throws: a failed
// event write must never roll back the underlying business mutation it is describing.
// =================================================================================================
async function appendGrowthEvent(entry: {
  businessId: string;
  entityType: GrowthEntityType;
  entityId: string;
  eventType: string;
  previousState?: string | null;
  newState?: string | null;
  source?: string | null;
  note?: string | null;
  actor: GrowthEngineActor;
}): Promise<void> {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("business_growth_events").insert({
      business_id: entry.businessId,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      event_type: entry.eventType,
      previous_state: entry.previousState ?? null,
      new_state: entry.newState ?? null,
      source: entry.source ?? null,
      note: entry.note ?? null,
      event_actor_type: entry.actor.type,
      event_by_roster_id: actorRosterId(entry.actor),
      event_by_auth_user_id: actorAuthUserId(entry.actor),
      event_by_role: entry.actor.role,
    });
  } catch {
    // Best-effort audit trail — never block the real mutation on a logging failure.
  }
}

export async function listGrowthEventsForBusiness(businessId: string, limit = 100): Promise<GrowthEvent[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_events")
    .select("id, business_id, entity_type, entity_id, event_type, previous_state, new_state, source, note, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    businessId: String(row.business_id),
    entityType: row.entity_type as GrowthEntityType,
    entityId: String(row.entity_id),
    eventType: String(row.event_type),
    previousState: (row.previous_state as string | null) ?? null,
    newState: (row.new_state as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    createdAt: String(row.created_at),
  }));
}

// =================================================================================================
// Assessments (Section A)
// =================================================================================================
const ASSESSMENT_COLUMNS =
  "id, business_id, status, provider_key, model_key, input_snapshot, input_hash, cost_metadata, summary_es, summary_en, what_found, what_known, what_unknown, needs_verification, weak_or_missing, client_questions, risks_constraints, growth_opportunities, suggested_solutions, recommended_media_mix, priority_order, measurement_plan, next_right_move_es, next_right_move_en, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_role, reviewed_at, reviewed_by_roster_id, reviewed_by_auth_user_id, reviewed_by_role, operator_review_notes, created_at, updated_at";

function mapAssessmentRow(row: Record<string, unknown>): GrowthAssessment {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    status: row.status as GrowthAssessment["status"],
    providerKey: (row.provider_key as string | null) ?? null,
    modelKey: (row.model_key as string | null) ?? null,
    inputSnapshot: (row.input_snapshot as Record<string, unknown>) ?? {},
    inputHash: (row.input_hash as string | null) ?? null,
    costMetadata: (row.cost_metadata as Record<string, unknown>) ?? {},
    summaryEs: (row.summary_es as string | null) ?? null,
    summaryEn: (row.summary_en as string | null) ?? null,
    whatFound: (row.what_found as GrowthAssessment["whatFound"]) ?? [],
    whatKnown: (row.what_known as GrowthAssessment["whatKnown"]) ?? [],
    whatUnknown: (row.what_unknown as GrowthAssessment["whatUnknown"]) ?? [],
    needsVerification: (row.needs_verification as GrowthAssessment["needsVerification"]) ?? [],
    weakOrMissing: (row.weak_or_missing as GrowthAssessment["weakOrMissing"]) ?? [],
    clientQuestions: (row.client_questions as GrowthAssessment["clientQuestions"]) ?? [],
    risksConstraints: (row.risks_constraints as GrowthAssessment["risksConstraints"]) ?? [],
    growthOpportunities: (row.growth_opportunities as GrowthAssessment["growthOpportunities"]) ?? [],
    suggestedSolutions: (row.suggested_solutions as GrowthAssessment["suggestedSolutions"]) ?? [],
    recommendedMediaMix: (row.recommended_media_mix as GrowthAssessment["recommendedMediaMix"]) ?? [],
    priorityOrder: (row.priority_order as GrowthAssessment["priorityOrder"]) ?? [],
    measurementPlan: (row.measurement_plan as GrowthAssessment["measurementPlan"]) ?? [],
    nextRightMoveEs: (row.next_right_move_es as string | null) ?? null,
    nextRightMoveEn: (row.next_right_move_en as string | null) ?? null,
    createdActorType: row.created_actor_type as GrowthAssessment["createdActorType"],
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: (row.created_by_auth_user_id as string | null) ?? null,
    createdByRole: String(row.created_by_role),
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    reviewedByRosterId: (row.reviewed_by_roster_id as string | null) ?? null,
    reviewedByAuthUserId: (row.reviewed_by_auth_user_id as string | null) ?? null,
    reviewedByRole: (row.reviewed_by_role as string | null) ?? null,
    operatorReviewNotes: (row.operator_review_notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listGrowthAssessmentsForBusiness(businessId: string): Promise<GrowthAssessment[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapAssessmentRow);
}

/** The single non-superseded assessment for this business, if one exists. */
export async function getCurrentGrowthAssessment(businessId: string): Promise<GrowthAssessment | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("business_id", businessId)
    .neq("status", "superseded")
    .maybeSingle();
  if (error || !data) return null;
  return mapAssessmentRow(data);
}

/**
 * Creates a new assessment version. Any existing non-superseded assessment for this business is
 * marked superseded first, so business_growth_assessments_one_current_per_business_idx (the
 * partial unique index) never rejects the insert — this is what makes "exactly one current
 * assessment per business" deterministic rather than a race.
 */
export async function createGrowthAssessment(
  input: CreateGrowthAssessmentInput,
  actor: GrowthEngineActor,
): Promise<GrowthAssessment | null> {
  const supabase = getAdminSupabase();

  const existing = await getCurrentGrowthAssessment(input.businessId);
  if (existing) {
    await supabase
      .from("business_growth_assessments")
      .update({ status: "superseded", updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("business_id", input.businessId);
    await appendGrowthEvent({
      businessId: input.businessId,
      entityType: "assessment",
      entityId: existing.id,
      eventType: "superseded",
      previousState: existing.status,
      newState: "superseded",
      source: "new_version_created",
      actor,
    });
  }

  const { data, error } = await supabase
    .from("business_growth_assessments")
    .insert({
      business_id: input.businessId,
      status: input.status ?? "draft",
      provider_key: input.providerKey ?? null,
      model_key: input.modelKey ?? null,
      input_snapshot: input.inputSnapshot ?? {},
      input_hash: input.inputHash ?? null,
      cost_metadata: input.costMetadata ?? {},
      summary_es: input.summaryEs ?? null,
      summary_en: input.summaryEn ?? null,
      what_found: input.whatFound ?? [],
      what_known: input.whatKnown ?? [],
      what_unknown: input.whatUnknown ?? [],
      needs_verification: input.needsVerification ?? [],
      weak_or_missing: input.weakOrMissing ?? [],
      client_questions: input.clientQuestions ?? [],
      risks_constraints: input.risksConstraints ?? [],
      growth_opportunities: input.growthOpportunities ?? [],
      suggested_solutions: input.suggestedSolutions ?? [],
      recommended_media_mix: input.recommendedMediaMix ?? [],
      priority_order: input.priorityOrder ?? [],
      measurement_plan: input.measurementPlan ?? [],
      next_right_move_es: input.nextRightMoveEs ?? null,
      next_right_move_en: input.nextRightMoveEn ?? null,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actorAuthUserId(actor),
      created_by_role: actor.role,
    })
    .select(ASSESSMENT_COLUMNS)
    .single();
  if (error || !data) return null;

  const created = mapAssessmentRow(data);
  await appendGrowthEvent({
    businessId: input.businessId,
    entityType: "assessment",
    entityId: created.id,
    eventType: "created",
    newState: created.status,
    source: actor.type === "system" ? "ai_assessment" : "staff_authored",
    actor,
  });
  return created;
}

export type ReviewGrowthAssessmentResult =
  | { ok: true; assessment: GrowthAssessment }
  | { ok: false; reason: "not_found" | "invalid_transition" | "update_failed" };

/**
 * Records a human review decision against a `needs_review` assessment (Gate D — MD Part 1).
 * Generalizes what was a single "accept" write in Gate C into the three real outcomes:
 *   - accepted           -> status 'reviewed' (working guidance; still never auto-promotes facts)
 *   - needs_correction   -> status 'needs_correction' (preserved as-is; NOT working guidance;
 *                           the note records what must be incorporated in the next re-analysis)
 *   - rejected           -> status 'rejected' (preserved as-is; NEVER shown as working guidance)
 * The reviewed_at / reviewed_by_* / operator_review_notes columns are reused for all three decisions —
 * they were already generic "who decided, when, why" fields, not literally "accepted_*" columns,
 * so no new column was needed (see the Gate D migration's own comment). Only a `needs_review`
 * assessment can receive a decision (isValidGrowthAssessmentStatusTransition) — an
 * already-decided assessment must be re-analyzed (a new version) rather than re-decided in place,
 * so no review decision ever silently overwrites a prior one.
 */
export async function recordGrowthAssessmentReviewDecision(
  businessId: string,
  assessmentId: string,
  decision: GrowthAssessmentReviewDecision,
  actor: Extract<GrowthEngineActor, { type: "staff" | "owner" }>,
  notes: string | null,
): Promise<ReviewGrowthAssessmentResult> {
  const supabase = getAdminSupabase();
  const { data: existingRow } = await supabase
    .from("business_growth_assessments")
    .select("status")
    .eq("id", assessmentId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!existingRow) return { ok: false, reason: "not_found" };

  const previousStatus = String((existingRow as { status: string }).status) as GrowthAssessmentStatus;
  const newStatus = REVIEW_DECISION_TO_STATUS[decision];
  if (!isValidGrowthAssessmentStatusTransition(previousStatus, newStatus)) {
    return { ok: false, reason: "invalid_transition" };
  }

  const { data, error } = await supabase
    .from("business_growth_assessments")
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by_roster_id: actor.type === "staff" ? actor.rosterId : null,
      reviewed_by_auth_user_id: actor.authUserId,
      reviewed_by_role: actor.role,
      operator_review_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentId)
    .eq("business_id", businessId)
    .select(ASSESSMENT_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const reviewed = mapAssessmentRow(data);
  await appendGrowthEvent({
    businessId,
    entityType: "assessment",
    entityId: assessmentId,
    eventType: `review_${decision}`,
    previousState: previousStatus,
    newState: newStatus,
    source: "staff_review",
    note: notes,
    actor,
  });
  return { ok: true, assessment: reviewed };
}

/**
 * Best-effort telemetry event only (Gate D — MD Part 6.6/6.8): records that opening the Growth Plan
 * returned a cached assessment rather than generating a new one, so a later owner-reporting surface
 * can compute a real cache-hit rate (cache_hit events / (cache_hit + created events)) without a
 * finance dashboard existing yet. Never affects the assessment row itself and never blocks the
 * cached-response path on a logging failure (appendGrowthEvent already swallows its own errors).
 */
export async function recordGrowthAssessmentCacheHit(businessId: string, assessmentId: string, actor: GrowthEngineActor): Promise<void> {
  await appendGrowthEvent({
    businessId,
    entityType: "assessment",
    entityId: assessmentId,
    eventType: "cache_hit",
    source: "cache",
    actor,
  });
}

// =================================================================================================
// Roadmap (Section B)
// =================================================================================================
const ROADMAP_STEP_COLUMNS =
  "id, business_id, roadmap_type, step_key, sequence, state, requirement, depends_on_step_key, source_assessment_id, notes, created_at, updated_at";

function mapRoadmapStepRow(row: Record<string, unknown>): GrowthRoadmapStep {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    roadmapType: row.roadmap_type as GrowthRoadmapType,
    stepKey: String(row.step_key),
    sequence: Number(row.sequence),
    state: row.state as GrowthRoadmapStepState,
    requirement: row.requirement as GrowthRoadmapStep["requirement"],
    dependsOnStepKey: (row.depends_on_step_key as string | null) ?? null,
    sourceAssessmentId: (row.source_assessment_id as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * Idempotent: inserts any catalog step not yet present for this (business, roadmapType) pair.
 * Never overwrites an existing row's state — safe to call on every Growth Plan page load.
 */
export async function ensureGrowthRoadmapForBusiness(
  businessId: string,
  roadmapType: GrowthRoadmapType,
  actor: GrowthEngineActor,
): Promise<GrowthRoadmapStep[]> {
  const supabase = getAdminSupabase();
  const catalog = roadmapStepCatalog(roadmapType);

  const { data: existingRows } = await supabase
    .from("business_growth_roadmap_steps")
    .select("step_key")
    .eq("business_id", businessId)
    .eq("roadmap_type", roadmapType);
  const existingKeys = new Set((existingRows ?? []).map((r) => String((r as { step_key: string }).step_key)));

  const missing = catalog.filter((step) => !existingKeys.has(step.stepKey));
  if (missing.length > 0) {
    await supabase.from("business_growth_roadmap_steps").insert(
      missing.map((step) => ({
        business_id: businessId,
        roadmap_type: roadmapType,
        step_key: step.stepKey,
        sequence: step.sequence,
        requirement: step.requirement,
        depends_on_step_key: step.dependsOnStepKey,
        updated_by_actor_type: actor.type,
        updated_by_roster_id: actorRosterId(actor),
        updated_by_auth_user_id: actorAuthUserId(actor),
        updated_by_role: actor.role,
      })),
    );
  }

  return listGrowthRoadmapForBusiness(businessId, roadmapType);
}

export async function listGrowthRoadmapForBusiness(businessId: string, roadmapType: GrowthRoadmapType): Promise<GrowthRoadmapStep[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_roadmap_steps")
    .select(ROADMAP_STEP_COLUMNS)
    .eq("business_id", businessId)
    .eq("roadmap_type", roadmapType)
    .order("sequence", { ascending: true });
  if (error || !data) return [];
  return data.map(mapRoadmapStepRow);
}

export type UpdateRoadmapStepResult = { ok: true; step: GrowthRoadmapStep } | { ok: false; reason: "not_found" | "update_failed" };

export async function updateGrowthRoadmapStepState(
  businessId: string,
  roadmapType: GrowthRoadmapType,
  stepKey: string,
  newState: GrowthRoadmapStepState,
  actor: GrowthEngineActor,
  note: string | null,
): Promise<UpdateRoadmapStepResult> {
  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("business_growth_roadmap_steps")
    .select(ROADMAP_STEP_COLUMNS)
    .eq("business_id", businessId)
    .eq("roadmap_type", roadmapType)
    .eq("step_key", stepKey)
    .maybeSingle();
  if (!existing) return { ok: false, reason: "not_found" };

  const { data, error } = await supabase
    .from("business_growth_roadmap_steps")
    .update({
      state: newState,
      notes: note,
      updated_by_actor_type: actor.type,
      updated_by_roster_id: actorRosterId(actor),
      updated_by_auth_user_id: actorAuthUserId(actor),
      updated_by_role: actor.role,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .eq("roadmap_type", roadmapType)
    .eq("step_key", stepKey)
    .select(ROADMAP_STEP_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const updated = mapRoadmapStepRow(data);
  await appendGrowthEvent({
    businessId,
    entityType: "roadmap_step",
    entityId: updated.id,
    eventType: "state_changed",
    previousState: String((existing as { state: string }).state),
    newState,
    source: "staff_update",
    note,
    actor,
  });
  return { ok: true, step: updated };
}

// =================================================================================================
// Solutions (Section C)
// =================================================================================================
const SOLUTION_COLUMNS =
  "id, business_id, source_assessment_id, provider_class, category, title_es, title_en, rationale_es, rationale_en, evidence_refs, readiness, priority, state, linked_campaign_id, linked_creative_job_id, linked_commitment_id, linked_official_requirement_id, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_role, reviewed_at, reviewed_by_roster_id, reviewed_by_auth_user_id, reviewed_by_role, review_note, created_at, updated_at";

function mapSolutionRow(row: Record<string, unknown>): GrowthSolution {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sourceAssessmentId: (row.source_assessment_id as string | null) ?? null,
    providerClass: row.provider_class as GrowthSolution["providerClass"],
    category: String(row.category),
    titleEs: String(row.title_es),
    titleEn: String(row.title_en),
    rationaleEs: (row.rationale_es as string | null) ?? null,
    rationaleEn: (row.rationale_en as string | null) ?? null,
    evidenceRefs: (row.evidence_refs as readonly string[]) ?? [],
    readiness: row.readiness as GrowthSolution["readiness"],
    priority: row.priority as GrowthSolution["priority"],
    state: row.state as GrowthSolutionState,
    linkedCampaignId: (row.linked_campaign_id as string | null) ?? null,
    linkedCreativeJobId: (row.linked_creative_job_id as string | null) ?? null,
    linkedCommitmentId: (row.linked_commitment_id as string | null) ?? null,
    linkedOfficialRequirementId: (row.linked_official_requirement_id as string | null) ?? null,
    createdActorType: row.created_actor_type as GrowthSolution["createdActorType"],
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: (row.created_by_auth_user_id as string | null) ?? null,
    createdByRole: String(row.created_by_role),
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    reviewedByRosterId: (row.reviewed_by_roster_id as string | null) ?? null,
    reviewedByAuthUserId: (row.reviewed_by_auth_user_id as string | null) ?? null,
    reviewedByRole: (row.reviewed_by_role as string | null) ?? null,
    reviewNote: (row.review_note as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listGrowthSolutionsForBusiness(businessId: string): Promise<GrowthSolution[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_solutions")
    .select(SOLUTION_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapSolutionRow);
}

export async function getGrowthSolutionById(businessId: string, solutionId: string): Promise<GrowthSolution | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_solutions")
    .select(SOLUTION_COLUMNS)
    .eq("id", solutionId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapSolutionRow(data);
}

export async function createGrowthSolution(input: CreateGrowthSolutionInput, actor: GrowthEngineActor): Promise<GrowthSolution | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_solutions")
    .insert({
      business_id: input.businessId,
      source_assessment_id: input.sourceAssessmentId ?? null,
      provider_class: input.providerClass,
      category: input.category,
      title_es: input.titleEs,
      title_en: input.titleEn,
      rationale_es: input.rationaleEs ?? null,
      rationale_en: input.rationaleEn ?? null,
      evidence_refs: input.evidenceRefs ?? [],
      readiness: input.readiness ?? "needs_more_information",
      priority: input.priority ?? "medium",
      state: "suggested",
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actorAuthUserId(actor),
      created_by_role: actor.role,
    })
    .select(SOLUTION_COLUMNS)
    .single();
  if (error || !data) return null;

  const created = mapSolutionRow(data);
  await appendGrowthEvent({
    businessId: input.businessId,
    entityType: "solution",
    entityId: created.id,
    eventType: "created",
    newState: created.state,
    source: input.sourceAssessmentId ? "assessment_promotion" : "staff_authored",
    actor,
  });
  return created;
}

export type UpdateSolutionStateResult =
  | { ok: true; solution: GrowthSolution }
  | { ok: false; reason: "not_found" | "invalid_transition" | "update_failed" };

export async function updateGrowthSolutionState(
  businessId: string,
  solutionId: string,
  newState: GrowthSolutionState,
  actor: Extract<GrowthEngineActor, { type: "staff" | "owner" }>,
  reviewNote: string | null,
): Promise<UpdateSolutionStateResult> {
  const existing = await getGrowthSolutionById(businessId, solutionId);
  if (!existing) return { ok: false, reason: "not_found" };
  if (!isValidGrowthSolutionTransition(existing.state, newState)) {
    return { ok: false, reason: "invalid_transition" };
  }

  const supabase = getAdminSupabase();
  const update: Record<string, unknown> = { state: newState, updated_at: new Date().toISOString() };
  if (newState === "reviewed" || newState === "approved" || newState === "dismissed") {
    update.reviewed_at = new Date().toISOString();
    update.reviewed_by_roster_id = actor.type === "staff" ? actor.rosterId : null;
    update.reviewed_by_auth_user_id = actor.authUserId;
    update.reviewed_by_role = actor.role;
    update.review_note = reviewNote;
  }

  const { data, error } = await supabase
    .from("business_growth_solutions")
    .update(update)
    .eq("id", solutionId)
    .eq("business_id", businessId)
    .select(SOLUTION_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const updated = mapSolutionRow(data);
  await appendGrowthEvent({
    businessId,
    entityType: "solution",
    entityId: solutionId,
    eventType: "state_changed",
    previousState: existing.state,
    newState,
    source: "staff_review",
    note: reviewNote,
    actor,
  });
  return { ok: true, solution: updated };
}

export type LinkSolutionExecutionResult = { ok: true; solution: GrowthSolution } | { ok: false; reason: "not_found" | "update_failed" };

/**
 * Points a solution at its real execution target — never a duplicate state. The target row itself
 * must already exist in its own canonical table (Creative Studio job, campaign, commitment, or
 * official requirement); this only records the link. The composite same-business foreign key on
 * business_growth_solutions guarantees the target belongs to the same business.
 */
export async function linkGrowthSolutionExecution(
  businessId: string,
  solutionId: string,
  target: GrowthSolutionExecutionTarget,
  actor: GrowthEngineActor,
): Promise<LinkSolutionExecutionResult> {
  const existing = await getGrowthSolutionById(businessId, solutionId);
  if (!existing) return { ok: false, reason: "not_found" };

  const columnByType: Record<GrowthSolutionExecutionTarget["type"], string> = {
    campaign: "linked_campaign_id",
    creative_job: "linked_creative_job_id",
    commitment: "linked_commitment_id",
    official_requirement: "linked_official_requirement_id",
  };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_solutions")
    .update({ [columnByType[target.type]]: target.id, updated_at: new Date().toISOString() })
    .eq("id", solutionId)
    .eq("business_id", businessId)
    .select(SOLUTION_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const updated = mapSolutionRow(data);
  await appendGrowthEvent({
    businessId,
    entityType: "solution",
    entityId: solutionId,
    eventType: "linked_execution",
    source: target.type,
    note: target.id,
    actor,
  });
  return { ok: true, solution: updated };
}

// =================================================================================================
// Media channel catalog (Section D) — global, read-only from this domain's perspective in Gate A.
// =================================================================================================
const MEDIA_CHANNEL_COLUMNS = "id, channel_key, channel_class, label_es, label_en, availability_state, config, notes_es, notes_en, is_active";

function mapMediaChannelRow(row: Record<string, unknown>): GrowthMediaChannel {
  return {
    id: String(row.id),
    channelKey: String(row.channel_key),
    channelClass: row.channel_class as GrowthMediaChannel["channelClass"],
    labelEs: String(row.label_es),
    labelEn: String(row.label_en),
    availabilityState: row.availability_state as GrowthMediaChannel["availabilityState"],
    config: (row.config as Record<string, unknown>) ?? {},
    notesEs: (row.notes_es as string | null) ?? null,
    notesEn: (row.notes_en as string | null) ?? null,
    isActive: Boolean(row.is_active),
  };
}

export async function listGrowthMediaChannels(): Promise<GrowthMediaChannel[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_media_channels")
    .select(MEDIA_CHANNEL_COLUMNS)
    .eq("is_active", true)
    .order("channel_class", { ascending: true });
  if (error || !data) return [];
  return data.map(mapMediaChannelRow);
}

// =================================================================================================
// Campaigns (Section E)
// =================================================================================================
const CAMPAIGN_COLUMNS =
  "id, business_id, source_solution_id, linked_opportunity_id, objective_es, objective_en, target_audience_es, target_audience_en, offer_es, offer_en, primary_cta_es, primary_cta_en, capacity_assumption, campaign_start, campaign_end, budget_amount, budget_currency, creative_requirements, tracking_plan, status, client_approved_at, client_approval_note, staff_approved_at, staff_approved_by_roster_id, staff_approved_by_role, created_actor_type, created_by_roster_id, created_by_role, created_at, updated_at";

function mapCampaignRow(row: Record<string, unknown>): GrowthCampaign {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sourceSolutionId: (row.source_solution_id as string | null) ?? null,
    linkedOpportunityId: (row.linked_opportunity_id as string | null) ?? null,
    objectiveEs: String(row.objective_es),
    objectiveEn: String(row.objective_en),
    targetAudienceEs: (row.target_audience_es as string | null) ?? null,
    targetAudienceEn: (row.target_audience_en as string | null) ?? null,
    offerEs: (row.offer_es as string | null) ?? null,
    offerEn: (row.offer_en as string | null) ?? null,
    primaryCtaEs: (row.primary_cta_es as string | null) ?? null,
    primaryCtaEn: (row.primary_cta_en as string | null) ?? null,
    capacityAssumption: (row.capacity_assumption as string | null) ?? null,
    campaignStart: (row.campaign_start as string | null) ?? null,
    campaignEnd: (row.campaign_end as string | null) ?? null,
    budgetAmount: row.budget_amount === null || row.budget_amount === undefined ? null : Number(row.budget_amount),
    budgetCurrency: String(row.budget_currency),
    creativeRequirements: (row.creative_requirements as Record<string, unknown>) ?? {},
    trackingPlan: (row.tracking_plan as Record<string, unknown>) ?? {},
    status: row.status as GrowthCampaignStatus,
    clientApprovedAt: (row.client_approved_at as string | null) ?? null,
    clientApprovalNote: (row.client_approval_note as string | null) ?? null,
    staffApprovedAt: (row.staff_approved_at as string | null) ?? null,
    staffApprovedByRosterId: (row.staff_approved_by_roster_id as string | null) ?? null,
    staffApprovedByRole: (row.staff_approved_by_role as string | null) ?? null,
    createdActorType: row.created_actor_type as GrowthCampaign["createdActorType"],
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listGrowthCampaignsForBusiness(businessId: string): Promise<GrowthCampaign[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapCampaignRow);
}

export async function getGrowthCampaignById(businessId: string, campaignId: string): Promise<GrowthCampaign | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("id", campaignId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapCampaignRow(data);
}

export async function createGrowthCampaign(input: CreateGrowthCampaignInput, actor: GrowthEngineActor): Promise<GrowthCampaign | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_campaigns")
    .insert({
      business_id: input.businessId,
      source_solution_id: input.sourceSolutionId ?? null,
      linked_opportunity_id: input.linkedOpportunityId ?? null,
      objective_es: input.objectiveEs,
      objective_en: input.objectiveEn,
      target_audience_es: input.targetAudienceEs ?? null,
      target_audience_en: input.targetAudienceEn ?? null,
      offer_es: input.offerEs ?? null,
      offer_en: input.offerEn ?? null,
      primary_cta_es: input.primaryCtaEs ?? null,
      primary_cta_en: input.primaryCtaEn ?? null,
      capacity_assumption: input.capacityAssumption ?? null,
      campaign_start: input.campaignStart ?? null,
      campaign_end: input.campaignEnd ?? null,
      budget_amount: input.budgetAmount ?? null,
      budget_currency: input.budgetCurrency ?? "USD",
      creative_requirements: input.creativeRequirements ?? {},
      tracking_plan: input.trackingPlan ?? {},
      status: "draft",
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actorAuthUserId(actor),
      created_by_role: actor.role,
    })
    .select(CAMPAIGN_COLUMNS)
    .single();
  if (error || !data) return null;

  const created = mapCampaignRow(data);

  if (input.sourceSolutionId) {
    await linkGrowthSolutionExecution(input.businessId, input.sourceSolutionId, { type: "campaign", id: created.id }, actor);
  }

  await appendGrowthEvent({
    businessId: input.businessId,
    entityType: "campaign",
    entityId: created.id,
    eventType: "created",
    newState: created.status,
    source: input.sourceSolutionId ? "solution_execution" : "staff_authored",
    actor,
  });
  return created;
}

export type UpdateCampaignStatusResult =
  | { ok: true; campaign: GrowthCampaign }
  | { ok: false; reason: "not_found" | "invalid_transition" | "update_failed" };

export async function updateGrowthCampaignStatus(
  businessId: string,
  campaignId: string,
  newStatus: GrowthCampaignStatus,
  actor: GrowthEngineActor,
): Promise<UpdateCampaignStatusResult> {
  const existing = await getGrowthCampaignById(businessId, campaignId);
  if (!existing) return { ok: false, reason: "not_found" };
  if (!isValidGrowthCampaignTransition(existing.status, newStatus)) {
    return { ok: false, reason: "invalid_transition" };
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_campaigns")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("business_id", businessId)
    .select(CAMPAIGN_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const updated = mapCampaignRow(data);
  await appendGrowthEvent({
    businessId,
    entityType: "campaign",
    entityId: campaignId,
    eventType: "status_changed",
    previousState: existing.status,
    newState: newStatus,
    source: "staff_update",
    actor,
  });
  return { ok: true, campaign: updated };
}

export async function addGrowthCampaignChannel(
  businessId: string,
  campaignId: string,
  mediaChannelId: string,
  channelNotes: string | null,
): Promise<{ ok: boolean }> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("business_growth_campaign_channels").insert({
    campaign_id: campaignId,
    business_id: businessId,
    media_channel_id: mediaChannelId,
    channel_notes: channelNotes,
  });
  return { ok: !error };
}

export async function listGrowthCampaignChannels(businessId: string, campaignId: string): Promise<{ mediaChannelId: string; channelNotes: string | null }[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_campaign_channels")
    .select("media_channel_id, channel_notes")
    .eq("business_id", businessId)
    .eq("campaign_id", campaignId);
  if (error || !data) return [];
  return data.map((row) => ({ mediaChannelId: String(row.media_channel_id), channelNotes: (row.channel_notes as string | null) ?? null }));
}

// =================================================================================================
// Official requirements research (Section G)
// =================================================================================================
const OFFICIAL_REQUIREMENT_COLUMNS =
  "id, business_id, jurisdiction, requirement_topic_es, requirement_topic_en, business_category_context, source_url, source_agency, last_verified_at, state, needs_human_verification, notes, created_at, updated_at";

function mapOfficialRequirementRow(row: Record<string, unknown>): GrowthOfficialRequirement {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    jurisdiction: String(row.jurisdiction),
    requirementTopicEs: String(row.requirement_topic_es),
    requirementTopicEn: String(row.requirement_topic_en),
    businessCategoryContext: (row.business_category_context as string | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    sourceAgency: (row.source_agency as string | null) ?? null,
    lastVerifiedAt: (row.last_verified_at as string | null) ?? null,
    state: row.state as GrowthOfficialRequirementState,
    needsHumanVerification: Boolean(row.needs_human_verification),
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listOfficialRequirementsForBusiness(businessId: string): Promise<GrowthOfficialRequirement[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_official_requirements")
    .select(OFFICIAL_REQUIREMENT_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapOfficialRequirementRow);
}

export async function createOfficialRequirement(
  input: CreateGrowthOfficialRequirementInput,
  actor: GrowthEngineActor,
): Promise<GrowthOfficialRequirement | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_official_requirements")
    .insert({
      business_id: input.businessId,
      jurisdiction: input.jurisdiction,
      requirement_topic_es: input.requirementTopicEs,
      requirement_topic_en: input.requirementTopicEn,
      business_category_context: input.businessCategoryContext ?? null,
      source_url: input.sourceUrl ?? null,
      source_agency: input.sourceAgency ?? null,
      notes: input.notes ?? null,
      state: "needs_research",
      needs_human_verification: true,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actorAuthUserId(actor),
      created_by_role: actor.role,
    })
    .select(OFFICIAL_REQUIREMENT_COLUMNS)
    .single();
  if (error || !data) return null;

  const created = mapOfficialRequirementRow(data);
  await appendGrowthEvent({
    businessId: input.businessId,
    entityType: "official_requirement",
    entityId: created.id,
    eventType: "created",
    newState: created.state,
    source: "staff_authored",
    actor,
  });
  return created;
}

export type MarkRequirementVerifiedResult =
  | { ok: true; requirement: GrowthOfficialRequirement }
  | { ok: false; reason: "not_found" | "update_failed" };

/**
 * The ONLY path that can set state = 'human_verified'. A human operator must supply the real
 * source; AI-generated text alone can never reach this state (the DB CHECK constraint enforces it
 * structurally as a second line of defense).
 */
export async function markOfficialRequirementVerified(
  businessId: string,
  requirementId: string,
  actor: Extract<GrowthEngineActor, { type: "staff" | "owner" }>,
  sourceUrl: string,
  sourceAgency: string,
): Promise<MarkRequirementVerifiedResult> {
  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("business_growth_official_requirements")
    .select("state")
    .eq("id", requirementId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!existing) return { ok: false, reason: "not_found" };

  const { data, error } = await supabase
    .from("business_growth_official_requirements")
    .update({
      state: "human_verified",
      needs_human_verification: false,
      last_verified_at: new Date().toISOString(),
      source_url: sourceUrl,
      source_agency: sourceAgency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requirementId)
    .eq("business_id", businessId)
    .select(OFFICIAL_REQUIREMENT_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const updated = mapOfficialRequirementRow(data);
  await appendGrowthEvent({
    businessId,
    entityType: "official_requirement",
    entityId: requirementId,
    eventType: "verified",
    previousState: String((existing as { state: string }).state),
    newState: "human_verified",
    source: "staff_verification",
    actor,
  });
  return { ok: true, requirement: updated };
}

// =================================================================================================
// Cross-business Command Center bridge (Gate C). Mirrors the exact pattern every other Command
// Center attention source already uses (e.g. creative-jobs-awaiting-review, proposals-awaiting-
// decision) — a bounded, capped, cross-business read feeding the SAME existing
// composeNeedsAttentionList() composer on the Staff Command Center, never a second/duplicate
// attention engine. Read-only; never touches Advisor's own signal table or detection logic.
// =================================================================================================
export type GrowthAssessmentAttentionRow = { businessId: string; displayName: string; createdAt: string };

/**
 * Generalized (Gate D) to accept any single assessment status — Gate C only ever queried
 * 'needs_review'; Gate D's Command Center bridge also needs a 'needs_correction' bucket. Kept as
 * one function (not two near-duplicates) since the query shape is identical, only the status
 * differs.
 */
export async function listBusinessesWithGrowthAssessmentByStatus(status: GrowthAssessmentStatus, limit = 20): Promise<GrowthAssessmentAttentionRow[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_assessments")
    .select("business_id, created_at, businesses(display_name)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as { business_id: string; created_at: string; businesses: { display_name: string } | null }[])
    .filter((row) => row.businesses)
    .map((row) => ({ businessId: String(row.business_id), displayName: String(row.businesses!.display_name), createdAt: String(row.created_at) }));
}

// =================================================================================================
// Gate D — two more bounded, capped, read-only Command Center attention sources (MD Part 12),
// mirroring the exact same pattern as listBusinessesWithGrowthAssessmentByStatus above. Overdue
// Growth-sourced Promise Keeper commitments deliberately have NO function here — a real commitment
// created through the Gate D bridge already resurfaces via the EXISTING
// listCommitmentsAttentionForStaffAttention() (Promise Keeper's own canonical overdue/blocked
// query); adding a second, Growth-scoped overdue-commitment query would itself be the prohibited
// "second attention engine".
// =================================================================================================
export type GrowthCampaignAttentionRow = { businessId: string; displayName: string; status: GrowthCampaignStatus; updatedAt: string };

const CAMPAIGN_ATTENTION_STATUSES: readonly GrowthCampaignStatus[] = ["needs_client_input", "ready_for_review"];

export async function listBusinessesWithGrowthCampaignsNeedingAttention(limit = 20): Promise<GrowthCampaignAttentionRow[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_campaigns")
    .select("business_id, status, updated_at, businesses(display_name)")
    .in("status", CAMPAIGN_ATTENTION_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as { business_id: string; status: GrowthCampaignStatus; updated_at: string; businesses: { display_name: string } | null }[])
    .filter((row) => row.businesses)
    .map((row) => ({ businessId: String(row.business_id), displayName: String(row.businesses!.display_name), status: row.status, updatedAt: String(row.updated_at) }));
}

export type GrowthOfficialRequirementAttentionRow = { businessId: string; displayName: string; requirementTopicEn: string; createdAt: string };

export async function listBusinessesWithPendingOfficialRequirements(limit = 20): Promise<GrowthOfficialRequirementAttentionRow[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_growth_official_requirements")
    .select("business_id, requirement_topic_en, created_at, businesses(display_name)")
    .not("state", "in", "(human_verified,not_applicable)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as { business_id: string; requirement_topic_en: string; created_at: string; businesses: { display_name: string } | null }[])
    .filter((row) => row.businesses)
    .map((row) => ({
      businessId: String(row.business_id),
      displayName: String(row.businesses!.display_name),
      requirementTopicEn: String(row.requirement_topic_en),
      createdAt: String(row.created_at),
    }));
}

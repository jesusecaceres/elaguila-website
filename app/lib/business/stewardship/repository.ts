/**
 * TODAY-3 — Stewardship Engine repository. Server-only, always via getAdminSupabase()
 * (service-role), matching the Gate BCO-5A/6A/DIY Concierge pattern exactly (these tables have
 * zero RLS policies by design). Every write requires a StewardshipActor argument — no function
 * accepts a bare actor email/id string. The hard readiness gate lives here: createNextRightMove()
 * always re-reads the latest business_recommendation_readiness row first and writes absolutely
 * nothing — no recommendation, no test, no override, no ledger row — unless it is exactly 'ready'.
 * There is no bypass/force parameter anywhere in this module.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getFullRun, getLatestCompletedRun } from "../healthMap/repository";
import { listFactsForBusiness } from "../livingBook/repository";
import { STEWARDSHIP_REGISTRY_VERSION } from "./constants";
import { selectNextRightMove, computeNextRecommendationStatus, overrideRequiresReapproval, type CandidateDimensionInput } from "./logic";
import { sixTestsAllowApproval } from "./sixTests";
import type {
  BusinessRecommendation, BusinessRecommendationOverride, BusinessRecommendationTest, CostBand,
  ExpectedEffort, LedgerEventType, OverrideSixTestEffect, OwnerDecision, PrimaryIntervention,
  RecommendationStatus, RecommendationVisibility, RejectedCandidate, StewardshipActor,
  StewardshipLedgerEntry, StewardshipStaffActor,
} from "./types";

function actorRosterId(actor: StewardshipActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: StewardshipActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}
/**
 * Builds the actor-attribution columns for one of the three attribution shapes actually present
 * in the schema: "actor_*" (business_recommendation_overrides/business_stewardship_ledger, which
 * carry an actor_type column), "created_*"/"created_by_*" (business_recommendations, which names
 * its type column `created_actor_type` — NOT `created_by_actor_type` — while every other column
 * in that same shape uses the `created_by_` prefix), and "approved_by_*" (business_recommendations,
 * which has no approved-side type column at all — only roster_id/auth_user_id/email/role/approved_at).
 */
function actorColumns(actor: StewardshipActor, prefix: "actor" | "created_by" | "approved_by") {
  const base: Record<string, unknown> = {
    [`${prefix}_roster_id`]: actorRosterId(actor),
    [`${prefix}_auth_user_id`]: actor.authUserId,
    [`${prefix}_email`]: actor.email,
    [`${prefix}_role`]: actorRole(actor),
  };
  if (prefix === "actor") return { actor_type: actor.type, ...base };
  if (prefix === "created_by") return { created_actor_type: actor.type, ...base };
  return base;
}

const RECOMMENDATION_COLUMNS =
  "id, business_id, source_run_id, source_finding_id, candidate_key, registry_version, dimension_key, status, visibility, version, is_current, confidence, verified_need_es, verified_need_en, readiness_explanation_es, readiness_explanation_en, business_consequence_es, business_consequence_en, owner_goal_alignment_es, owner_goal_alignment_en, capacity_impact_es, capacity_impact_en, primary_intervention, free_option_es, free_option_en, guided_option_es, guided_option_en, corrective_service_option_es, corrective_service_option_en, managed_option_es, managed_option_en, external_referral_option_es, external_referral_option_en, do_nothing_yet_option_es, do_nothing_yet_option_en, selection_reason_es, selection_reason_en, rejected_higher_cost_reason_es, rejected_higher_cost_reason_en, expected_effort, cost_band, success_metric_es, success_metric_en, review_date, supersedes_recommendation_id, created_actor_type, created_by_email, created_by_role, approved_by_email, approved_by_role, approved_at, shared_at, owner_decision, owner_decision_at, owner_decision_note, owner_decision_review_date, created_at, updated_at";

function mapRecommendationRow(row: Record<string, unknown>): BusinessRecommendation {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sourceRunId: String(row.source_run_id),
    sourceFindingId: (row.source_finding_id as string | null) ?? null,
    candidateKey: String(row.candidate_key),
    registryVersion: String(row.registry_version),
    dimensionKey: row.dimension_key as BusinessRecommendation["dimensionKey"],
    status: row.status as RecommendationStatus,
    visibility: row.visibility as RecommendationVisibility,
    version: Number(row.version),
    isCurrent: Boolean(row.is_current),
    confidence: row.confidence as BusinessRecommendation["confidence"],
    verifiedNeedEs: String(row.verified_need_es),
    verifiedNeedEn: String(row.verified_need_en),
    readinessExplanationEs: String(row.readiness_explanation_es),
    readinessExplanationEn: String(row.readiness_explanation_en),
    businessConsequenceEs: String(row.business_consequence_es),
    businessConsequenceEn: String(row.business_consequence_en),
    ownerGoalAlignmentEs: String(row.owner_goal_alignment_es),
    ownerGoalAlignmentEn: String(row.owner_goal_alignment_en),
    capacityImpactEs: String(row.capacity_impact_es),
    capacityImpactEn: String(row.capacity_impact_en),
    primaryIntervention: row.primary_intervention as PrimaryIntervention,
    freeOptionEs: (row.free_option_es as string | null) ?? null,
    freeOptionEn: (row.free_option_en as string | null) ?? null,
    guidedOptionEs: (row.guided_option_es as string | null) ?? null,
    guidedOptionEn: (row.guided_option_en as string | null) ?? null,
    correctiveServiceOptionEs: (row.corrective_service_option_es as string | null) ?? null,
    correctiveServiceOptionEn: (row.corrective_service_option_en as string | null) ?? null,
    managedOptionEs: (row.managed_option_es as string | null) ?? null,
    managedOptionEn: (row.managed_option_en as string | null) ?? null,
    externalReferralOptionEs: (row.external_referral_option_es as string | null) ?? null,
    externalReferralOptionEn: (row.external_referral_option_en as string | null) ?? null,
    doNothingYetOptionEs: (row.do_nothing_yet_option_es as string | null) ?? null,
    doNothingYetOptionEn: (row.do_nothing_yet_option_en as string | null) ?? null,
    selectionReasonEs: String(row.selection_reason_es),
    selectionReasonEn: String(row.selection_reason_en),
    rejectedHigherCostReasonEs: (row.rejected_higher_cost_reason_es as string | null) ?? null,
    rejectedHigherCostReasonEn: (row.rejected_higher_cost_reason_en as string | null) ?? null,
    expectedEffort: row.expected_effort as ExpectedEffort,
    costBand: row.cost_band as CostBand,
    successMetricEs: String(row.success_metric_es),
    successMetricEn: String(row.success_metric_en),
    reviewDate: (row.review_date as string | null) ?? null,
    supersedesRecommendationId: (row.supersedes_recommendation_id as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    approvedByEmail: (row.approved_by_email as string | null) ?? null,
    approvedByRole: (row.approved_by_role as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    sharedAt: (row.shared_at as string | null) ?? null,
    ownerDecision: (row.owner_decision as OwnerDecision | null) ?? null,
    ownerDecisionAt: (row.owner_decision_at as string | null) ?? null,
    ownerDecisionNote: (row.owner_decision_note as string | null) ?? null,
    ownerDecisionReviewDate: (row.owner_decision_review_date as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// ---------------------------------------------------------------------------
// Hard readiness gate
// ---------------------------------------------------------------------------

export type ReadinessGateResult =
  | { ok: true; runId: string; humanReviewRequired: boolean; dimensionResults: readonly CandidateDimensionInput[] }
  | { ok: false; reason: "no_completed_run" | "readiness_not_ready" | "readiness_missing" };

/**
 * Always re-reads the latest completed Health Map run and its readiness row. Returns a truthful
 * blocked result — never a bypass, never a force parameter — when readiness is absent or not
 * exactly 'ready'.
 */
export async function checkReadinessGate(businessId: string): Promise<ReadinessGateResult> {
  const latestRun = await getLatestCompletedRun(businessId);
  if (!latestRun) return { ok: false, reason: "no_completed_run" };
  const full = await getFullRun(latestRun.id);
  if (!full) return { ok: false, reason: "no_completed_run" };
  if (!full.readiness) return { ok: false, reason: "readiness_missing" };
  if (full.readiness.readinessStatus !== "ready") return { ok: false, reason: "readiness_not_ready" };
  return {
    ok: true,
    runId: full.run.id,
    humanReviewRequired: full.readiness.humanReviewRequired,
    dimensionResults: full.dimensionResults.map((d) => ({ dimensionKey: d.dimensionKey, status: d.status })),
  };
}

async function ownerGoalIsKnown(businessId: string): Promise<boolean> {
  const facts = await listFactsForBusiness(businessId, false);
  return facts.some(
    (f) => f.factCategory === "business_and_owner_goals" && (f.confirmationState === "owner_confirmed" || f.confirmationState === "staff_confirmed"),
  );
}

export type CreateNextRightMoveResult =
  | { ok: true; recommendation: BusinessRecommendation | null; rejected: readonly RejectedCandidate[] }
  | { ok: false; reason: "no_completed_run" | "readiness_not_ready" | "readiness_missing" };

/**
 * The hard readiness gate entry point. Writes zero recommendation/test/override/ledger rows
 * unless the latest readiness is exactly 'ready'. If ready but no candidate is approvable, returns
 * ok:true with recommendation:null (a legitimate, truthful "nothing to recommend right now") —
 * never a fabricated recommendation.
 */
export async function createNextRightMove(actor: StewardshipActor, businessId: string): Promise<CreateNextRightMoveResult> {
  const gate = await checkReadinessGate(businessId);
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const ownerGoalKnown = await ownerGoalIsKnown(businessId);
  const selection = selectNextRightMove({
    dimensionResults: gate.dimensionResults,
    readinessIsReady: true,
    humanReviewRequired: gate.humanReviewRequired,
    ownerGoalKnown,
  });

  // Record every intentionally-not-recommended candidate in the ledger, regardless of whether a
  // move was selected — this is what makes "what was intentionally not recommended" truthful.
  for (const r of selection.rejected) {
    await writeLedgerEntry(actor, businessId, {
      recommendationId: null,
      eventType: "intentionally_not_recommended",
      reasonEs: r.reasonEs,
      reasonEn: r.reasonEn,
      structuredReason: { candidateKey: r.candidateKey, dimensionKey: r.dimensionKey },
      evidenceRefs: [],
      productOrServiceKey: r.candidateKey,
      moneyInvolved: false,
      paymentReference: null,
    });
  }

  if (!selection.selected) {
    return { ok: true, recommendation: null, rejected: selection.rejected };
  }

  const supabase = getAdminSupabase();
  const { template, sixTests } = selection.selected;

  // Supersede any existing current recommendation for this business before inserting the new one.
  const { data: existingCurrent } = await supabase
    .from("business_recommendations")
    .select("id, version, status")
    .eq("business_id", businessId)
    .eq("is_current", true)
    .maybeSingle();

  let nextVersion = 1;
  let supersedesId: string | null = null;
  if (existingCurrent) {
    nextVersion = Number(existingCurrent.version) + 1;
    supersedesId = existingCurrent.id as string;
    const terminalStatuses = new Set(["accepted", "declined"]);
    await supabase
      .from("business_recommendations")
      .update({ is_current: false, status: terminalStatuses.has(existingCurrent.status as string) ? existingCurrent.status : "superseded", updated_at: new Date().toISOString() })
      .eq("id", existingCurrent.id);
  }

  const insertRow = {
    business_id: businessId,
    source_run_id: gate.runId,
    source_finding_id: null,
    candidate_key: template.candidateKey,
    registry_version: STEWARDSHIP_REGISTRY_VERSION,
    dimension_key: template.dimensionKey,
    status: "draft",
    visibility: "staff_only",
    version: nextVersion,
    is_current: true,
    confidence: "medium",
    verified_need_es: template.verifiedNeedEs,
    verified_need_en: template.verifiedNeedEn,
    readiness_explanation_es: "El Mapa de salud confirma que esta evaluación está en estado listo para generar una recomendación.",
    readiness_explanation_en: "The Health Map confirms this assessment is in a ready state to generate a recommendation.",
    business_consequence_es: template.businessConsequenceEs,
    business_consequence_en: template.businessConsequenceEn,
    owner_goal_alignment_es: ownerGoalKnown
      ? "Esta recomendación no contradice las metas confirmadas del dueño."
      : "Las metas del dueño no están confirmadas todavía — esta recomendación no afirma encajar con una meta específica.",
    owner_goal_alignment_en: ownerGoalKnown
      ? "This recommendation does not contradict the owner's confirmed goals."
      : "The owner's goals are not confirmed yet — this recommendation does not claim to fit a specific goal.",
    capacity_impact_es: template.isDemandGenerating
      ? "Esta acción podría generar más demanda; se evaluó frente a la capacidad conocida del negocio."
      : "Esta acción no genera demanda adicional por sí misma.",
    capacity_impact_en: template.isDemandGenerating
      ? "This action could generate more demand; it was evaluated against the business's known capacity."
      : "This action does not generate additional demand by itself.",
    primary_intervention: template.primaryIntervention,
    free_option_es: template.freeOptionEs, free_option_en: template.freeOptionEn,
    guided_option_es: template.guidedOptionEs, guided_option_en: template.guidedOptionEn,
    corrective_service_option_es: template.correctiveServiceOptionEs, corrective_service_option_en: template.correctiveServiceOptionEn,
    managed_option_es: template.managedOptionEs, managed_option_en: template.managedOptionEn,
    external_referral_option_es: template.externalReferralOptionEs, external_referral_option_en: template.externalReferralOptionEn,
    do_nothing_yet_option_es: template.doNothingYetOptionEs, do_nothing_yet_option_en: template.doNothingYetOptionEn,
    selection_reason_es: template.selectionReasonEs,
    selection_reason_en: template.selectionReasonEn,
    rejected_higher_cost_reason_es: template.rejectedHigherCostReasonEs,
    rejected_higher_cost_reason_en: template.rejectedHigherCostReasonEn,
    expected_effort: template.expectedEffort,
    cost_band: template.costBand,
    success_metric_es: template.successMetricEs,
    success_metric_en: template.successMetricEn,
    review_date: null,
    supersedes_recommendation_id: supersedesId,
    ...actorColumns(actor, "created_by"),
  };

  const { data: recRow, error: recErr } = await supabase.from("business_recommendations").insert(insertRow).select(RECOMMENDATION_COLUMNS).maybeSingle();
  if (recErr || !recRow) return { ok: true, recommendation: null, rejected: selection.rejected };
  const recommendation = mapRecommendationRow(recRow as Record<string, unknown>);

  for (const t of sixTests) {
    await supabase.from("business_recommendation_tests").insert({
      recommendation_id: recommendation.id,
      business_id: businessId,
      test_key: t.testKey,
      result: t.result,
      explanation_es: t.explanationEs,
      explanation_en: t.explanationEn,
      evidence_refs: t.evidenceRefs,
      confidence: t.confidence,
      rule_version: t.ruleVersion,
    });
  }

  await writeLedgerEntry(actor, businessId, {
    recommendationId: recommendation.id,
    eventType: "recommendation_created",
    reasonEs: template.selectionReasonEs,
    reasonEn: template.selectionReasonEn,
    structuredReason: { candidateKey: template.candidateKey },
    evidenceRefs: [],
    productOrServiceKey: template.candidateKey,
    moneyInvolved: false,
    paymentReference: null,
  });

  return { ok: true, recommendation, rejected: selection.rejected };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getCurrentRecommendation(businessId: string): Promise<BusinessRecommendation | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_recommendations").select(RECOMMENDATION_COLUMNS).eq("business_id", businessId).eq("is_current", true).maybeSingle();
  if (error || !data) return null;
  return mapRecommendationRow(data as Record<string, unknown>);
}

export async function getRecommendationById(businessId: string, recommendationId: string): Promise<BusinessRecommendation | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_recommendations").select(RECOMMENDATION_COLUMNS).eq("business_id", businessId).eq("id", recommendationId).maybeSingle();
  if (error || !data) return null;
  return mapRecommendationRow(data as Record<string, unknown>);
}

export async function listRecommendationsForBusiness(businessId: string): Promise<BusinessRecommendation[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_recommendations").select(RECOMMENDATION_COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapRecommendationRow);
}

const TEST_COLUMNS = "id, recommendation_id, business_id, test_key, result, explanation_es, explanation_en, evidence_refs, confidence, rule_version, created_at";

function mapTestRow(row: Record<string, unknown>): BusinessRecommendationTest {
  return {
    id: String(row.id),
    recommendationId: String(row.recommendation_id),
    businessId: String(row.business_id),
    testKey: row.test_key as BusinessRecommendationTest["testKey"],
    result: row.result as BusinessRecommendationTest["result"],
    explanationEs: String(row.explanation_es),
    explanationEn: String(row.explanation_en),
    evidenceRefs: (row.evidence_refs as string[] | null) ?? [],
    confidence: row.confidence as BusinessRecommendationTest["confidence"],
    ruleVersion: String(row.rule_version),
    createdAt: String(row.created_at),
  };
}

export async function listTestsForRecommendation(recommendationId: string): Promise<BusinessRecommendationTest[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_recommendation_tests").select(TEST_COLUMNS).eq("recommendation_id", recommendationId);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTestRow);
}

// ---------------------------------------------------------------------------
// Staff transitions: submit for review, approve, share, override
// ---------------------------------------------------------------------------

export type TransitionResult = { ok: true; recommendation: BusinessRecommendation } | { ok: false; error: string };

export async function submitForReview(businessId: string, recommendationId: string): Promise<TransitionResult> {
  const existing = await getRecommendationById(businessId, recommendationId);
  if (!existing) return { ok: false, error: "not_found" };
  const nextStatus = computeNextRecommendationStatus(existing.status, "submit_for_review");
  if (!nextStatus) return { ok: false, error: "invalid_transition" };
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_recommendations").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", recommendationId).select(RECOMMENDATION_COLUMNS).maybeSingle();
  if (error || !data) return { ok: false, error: "update_failed" };
  return { ok: true, recommendation: mapRecommendationRow(data as Record<string, unknown>) };
}

/** Only a manager+ staff actor with the correct capability may reach this (enforced by the API
 * layer) — this function additionally re-confirms none of the six tests fail/block. */
export async function approveRecommendation(actor: StewardshipStaffActor, businessId: string, recommendationId: string): Promise<TransitionResult> {
  const existing = await getRecommendationById(businessId, recommendationId);
  if (!existing) return { ok: false, error: "not_found" };
  const nextStatus = computeNextRecommendationStatus(existing.status, "approve");
  if (!nextStatus) return { ok: false, error: "invalid_transition" };

  const tests = await listTestsForRecommendation(recommendationId);
  if (!sixTestsAllowApproval(tests)) return { ok: false, error: "six_tests_block_approval" };

  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("business_recommendations")
    .update({ status: nextStatus, updated_at: nowIso, ...actorColumns(actor, "approved_by"), approved_at: nowIso })
    .eq("id", recommendationId)
    .select(RECOMMENDATION_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "update_failed" };
  const recommendation = mapRecommendationRow(data as Record<string, unknown>);

  // Repair 5: the ledger explanation CHECK requires a nonblank reason or a genuinely nonempty
  // structured_reason -- an internal, structured event still needs a truthful, nonempty payload.
  await writeLedgerEntry(actor, businessId, {
    recommendationId, eventType: "recommendation_approved", reasonEs: null, reasonEn: null,
    structuredReason: { event: "recommendation_approved", candidateKey: existing.candidateKey },
    evidenceRefs: [], productOrServiceKey: null, moneyInvolved: false, paymentReference: null,
  });
  return { ok: true, recommendation };
}

export async function shareRecommendation(actor: StewardshipStaffActor, businessId: string, recommendationId: string): Promise<TransitionResult> {
  const existing = await getRecommendationById(businessId, recommendationId);
  if (!existing) return { ok: false, error: "not_found" };
  const nextStatus = computeNextRecommendationStatus(existing.status, "share");
  if (!nextStatus) return { ok: false, error: "invalid_transition" };

  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("business_recommendations")
    .update({ status: nextStatus, visibility: "owner_and_staff", shared_at: nowIso, updated_at: nowIso })
    .eq("id", recommendationId)
    .select(RECOMMENDATION_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "update_failed" };
  const recommendation = mapRecommendationRow(data as Record<string, unknown>);

  await writeLedgerEntry(actor, businessId, {
    recommendationId, eventType: "recommendation_shared", reasonEs: null, reasonEn: null,
    structuredReason: { event: "recommendation_shared", candidateKey: existing.candidateKey },
    evidenceRefs: [], productOrServiceKey: null, moneyInvolved: false, paymentReference: null,
  });
  return { ok: true, recommendation };
}

// ---------------------------------------------------------------------------
// Overrides — manager+ staff only, never bypasses readiness, never erases a failed test.
// ---------------------------------------------------------------------------

export type OverridePatch = Partial<{
  verifiedNeedEs: string; verifiedNeedEn: string;
  businessConsequenceEs: string; businessConsequenceEn: string;
  ownerGoalAlignmentEs: string; ownerGoalAlignmentEn: string;
  capacityImpactEs: string; capacityImpactEn: string;
  primaryIntervention: PrimaryIntervention;
  freeOptionEs: string | null; freeOptionEn: string | null;
  guidedOptionEs: string | null; guidedOptionEn: string | null;
  correctiveServiceOptionEs: string | null; correctiveServiceOptionEn: string | null;
  managedOptionEs: string | null; managedOptionEn: string | null;
  externalReferralOptionEs: string | null; externalReferralOptionEn: string | null;
  doNothingYetOptionEs: string; doNothingYetOptionEn: string;
  expectedEffort: ExpectedEffort; costBand: CostBand;
  successMetricEs: string; successMetricEn: string;
  reviewDate: string | null;
}>;

const PATCH_TO_COLUMN: Record<string, string> = {
  verifiedNeedEs: "verified_need_es", verifiedNeedEn: "verified_need_en",
  businessConsequenceEs: "business_consequence_es", businessConsequenceEn: "business_consequence_en",
  ownerGoalAlignmentEs: "owner_goal_alignment_es", ownerGoalAlignmentEn: "owner_goal_alignment_en",
  capacityImpactEs: "capacity_impact_es", capacityImpactEn: "capacity_impact_en",
  primaryIntervention: "primary_intervention",
  freeOptionEs: "free_option_es", freeOptionEn: "free_option_en",
  guidedOptionEs: "guided_option_es", guidedOptionEn: "guided_option_en",
  correctiveServiceOptionEs: "corrective_service_option_es", correctiveServiceOptionEn: "corrective_service_option_en",
  managedOptionEs: "managed_option_es", managedOptionEn: "managed_option_en",
  externalReferralOptionEs: "external_referral_option_es", externalReferralOptionEn: "external_referral_option_en",
  doNothingYetOptionEs: "do_nothing_yet_option_es", doNothingYetOptionEn: "do_nothing_yet_option_en",
  expectedEffort: "expected_effort", costBand: "cost_band",
  successMetricEs: "success_metric_es", successMetricEn: "success_metric_en",
  reviewDate: "review_date",
};

export type OverrideResult = { ok: true; recommendation: BusinessRecommendation; override: BusinessRecommendationOverride } | { ok: false; error: string };

/** Overrides are only allowed after a valid recommendation exists (status not draft — a draft has
 * no approved content to override yet). Never bypasses readiness; never erases a test row. */
export async function recordOverride(
  actor: StewardshipStaffActor,
  businessId: string,
  recommendationId: string,
  reason: string,
  patch: OverridePatch,
): Promise<OverrideResult> {
  if (!reason || reason.trim().length === 0) return { ok: false, error: "empty_reason" };
  const existing = await getRecommendationById(businessId, recommendationId);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.status === "draft") return { ok: false, error: "no_valid_recommendation_yet" };

  const changedFields = Object.keys(patch);
  if (changedFields.length === 0) return { ok: false, error: "no_changes" };

  const beforeSnapshot: Record<string, unknown> = {};
  const afterSnapshot: Record<string, unknown> = {};
  const updateRow: Record<string, unknown> = {};
  for (const field of changedFields) {
    const column = PATCH_TO_COLUMN[field];
    if (!column) continue;
    beforeSnapshot[field] = (existing as unknown as Record<string, unknown>)[field];
    afterSnapshot[field] = (patch as Record<string, unknown>)[field];
    updateRow[column] = (patch as Record<string, unknown>)[field];
  }

  const reapprovalRequired = overrideRequiresReapproval(changedFields);
  const sixTestEffect: OverrideSixTestEffect = reapprovalRequired ? "requires_reapproval" : "unchanged";

  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();
  if (reapprovalRequired) {
    // Consequential content change -> back to review_required, clearing prior approval/share
    // attribution (a fresh approval is required; never silently re-approved).
    updateRow.status = "review_required";
    updateRow.approved_by_roster_id = null;
    updateRow.approved_by_auth_user_id = null;
    updateRow.approved_by_email = null;
    updateRow.approved_by_role = null;
    updateRow.approved_at = null;
    updateRow.shared_at = null;
  }
  updateRow.updated_at = nowIso;

  const { data: recRow, error: recErr } = await supabase.from("business_recommendations").update(updateRow).eq("id", recommendationId).select(RECOMMENDATION_COLUMNS).maybeSingle();
  if (recErr || !recRow) return { ok: false, error: "update_failed" };
  const recommendation = mapRecommendationRow(recRow as Record<string, unknown>);

  const { data: ovRow, error: ovErr } = await supabase
    .from("business_recommendation_overrides")
    .insert({
      recommendation_id: recommendationId,
      business_id: businessId,
      reason: reason.trim(),
      before_snapshot: beforeSnapshot,
      after_snapshot: afterSnapshot,
      changed_fields: changedFields,
      six_test_effect: sixTestEffect,
      reapproval_required: reapprovalRequired,
      ...actorColumns(actor, "actor"),
    })
    .select("id, recommendation_id, business_id, reason, before_snapshot, after_snapshot, changed_fields, six_test_effect, reapproval_required, actor_email, created_at")
    .maybeSingle();
  if (ovErr || !ovRow) return { ok: false, error: "override_write_failed" };

  await writeLedgerEntry(actor, businessId, {
    recommendationId, eventType: "override_recorded", reasonEs: reason.trim(), reasonEn: reason.trim(),
    structuredReason: { changedFields, reapprovalRequired }, evidenceRefs: [], productOrServiceKey: null, moneyInvolved: false, paymentReference: null,
  });

  return {
    ok: true,
    recommendation,
    override: {
      id: String(ovRow.id), recommendationId: String(ovRow.recommendation_id), businessId: String(ovRow.business_id),
      reason: String(ovRow.reason), beforeSnapshot: ovRow.before_snapshot as Record<string, unknown>, afterSnapshot: ovRow.after_snapshot as Record<string, unknown>,
      changedFields: (ovRow.changed_fields as string[]) ?? [], sixTestEffect: ovRow.six_test_effect as OverrideSixTestEffect,
      reapprovalRequired: Boolean(ovRow.reapproval_required), actorEmail: String(ovRow.actor_email), createdAt: String(ovRow.created_at),
    },
  };
}

export async function listOverridesForRecommendation(recommendationId: string): Promise<BusinessRecommendationOverride[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_recommendation_overrides")
    .select("id, recommendation_id, business_id, reason, before_snapshot, after_snapshot, changed_fields, six_test_effect, reapproval_required, actor_email, created_at")
    .eq("recommendation_id", recommendationId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id), recommendationId: String(row.recommendation_id), businessId: String(row.business_id),
    reason: String(row.reason), beforeSnapshot: row.before_snapshot as Record<string, unknown>, afterSnapshot: row.after_snapshot as Record<string, unknown>,
    changedFields: (row.changed_fields as string[]) ?? [], sixTestEffect: row.six_test_effect as OverrideSixTestEffect,
    reapprovalRequired: Boolean(row.reapproval_required), actorEmail: String(row.actor_email), createdAt: String(row.created_at),
  }));
}

// ---------------------------------------------------------------------------
// Owner decision
// ---------------------------------------------------------------------------

export type OwnerDecisionResult = { ok: true; recommendation: BusinessRecommendation } | { ok: false; error: string };

/**
 * The sole write path for an owner's decision. Delegates the recommendation UPDATE and the
 * matching Stewardship Ledger INSERT entirely to the `record_business_recommendation_owner_decision`
 * SECURITY DEFINER RPC, which runs both writes inside one PostgreSQL transaction -- there is no
 * compensating-rollback code here or anywhere else; Postgres itself guarantees that a failure of
 * either write rolls back both. This function never resolves membership itself -- the caller
 * (the owner API route) must have already resolved exact membership and derived a real,
 * server-authenticated owner actor before invoking this.
 */
export async function recordOwnerDecision(
  actor: StewardshipActor,
  businessId: string,
  recommendationId: string,
  decision: "accept" | "decline" | "postpone",
  note: string | null,
  reviewDate: string | null,
): Promise<OwnerDecisionResult> {
  if (actor.type !== "owner") return { ok: false, error: "owner_actor_required" };

  const ownerDecisionValue = decision === "accept" ? "accepted" : decision === "decline" ? "declined" : "postponed";
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc("record_business_recommendation_owner_decision", {
    p_recommendation_id: recommendationId,
    p_business_id: businessId,
    p_decision: ownerDecisionValue,
    p_note: note,
    p_review_date: reviewDate,
    p_actor_auth_user_id: actor.authUserId,
    p_actor_email: actor.email,
    p_actor_role: actorRole(actor),
  });

  if (error) {
    const knownErrors = new Set([
      "invalid_decision", "postpone_requires_review_date", "review_date_not_allowed",
      "missing_owner_actor_attribution", "not_eligible",
    ]);
    const message = error.message ?? "";
    const matched = [...knownErrors].find((code) => message.includes(code));
    return { ok: false, error: matched ?? "update_failed_or_already_decided" };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "not_eligible" };
  return { ok: true, recommendation: mapRecommendationRow(row as Record<string, unknown>) };
}

// ---------------------------------------------------------------------------
// Stewardship Ledger
// ---------------------------------------------------------------------------

const LEDGER_COLUMNS = "id, business_id, recommendation_id, event_type, reason_es, reason_en, structured_reason, evidence_refs, product_or_service_key, money_involved, payment_reference, actor_type, actor_email, actor_role, created_at";

function mapLedgerRow(row: Record<string, unknown>): StewardshipLedgerEntry {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    recommendationId: (row.recommendation_id as string | null) ?? null,
    eventType: row.event_type as LedgerEventType,
    reasonEs: (row.reason_es as string | null) ?? null,
    reasonEn: (row.reason_en as string | null) ?? null,
    structuredReason: (row.structured_reason as Record<string, unknown>) ?? {},
    evidenceRefs: (row.evidence_refs as string[] | null) ?? [],
    productOrServiceKey: (row.product_or_service_key as string | null) ?? null,
    moneyInvolved: Boolean(row.money_involved),
    paymentReference: (row.payment_reference as string | null) ?? null,
    actorType: row.actor_type as "staff" | "owner",
    actorEmail: String(row.actor_email),
    actorRole: String(row.actor_role),
    createdAt: String(row.created_at),
  };
}

export async function writeLedgerEntry(
  actor: StewardshipActor,
  businessId: string,
  params: {
    recommendationId: string | null; eventType: LedgerEventType; reasonEs: string | null; reasonEn: string | null;
    structuredReason: Record<string, unknown>; evidenceRefs: readonly string[]; productOrServiceKey: string | null;
    moneyInvolved: boolean; paymentReference: string | null;
  },
): Promise<StewardshipLedgerEntry | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_stewardship_ledger")
    .insert({
      business_id: businessId,
      recommendation_id: params.recommendationId,
      event_type: params.eventType,
      reason_es: params.reasonEs,
      reason_en: params.reasonEn,
      structured_reason: params.structuredReason,
      evidence_refs: params.evidenceRefs,
      product_or_service_key: params.productOrServiceKey,
      money_involved: params.moneyInvolved,
      payment_reference: params.paymentReference,
      ...actorColumns(actor, "actor"),
    })
    .select(LEDGER_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  return mapLedgerRow(data as Record<string, unknown>);
}

export async function listLedgerForBusiness(businessId: string, limit = 200): Promise<StewardshipLedgerEntry[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_stewardship_ledger").select(LEDGER_COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false }).limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapLedgerRow);
}

/**
 * Gate BCO-6A — Health Map repository. Server-only, always via getAdminSupabase() (service-role),
 * matching the Gate BCO-5A pattern exactly. Reads its input exclusively from the Living Business
 * Book repository (never a duplicated business-record system) and persists one immutable
 * assessment run plus its dimension results, findings, and readiness gate in FK-safe order.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  listContradictionsForBusiness, listEvidenceForBusiness, listFactsForBusiness, listUnknownsForBusiness,
} from "../livingBook/repository";
import { CALCULATION_VERSION } from "./constants";
import { calculateAllDimensions, calculateReadiness, findingsForDimension, summarizeCounts, type HealthCalculationInput } from "./logic";
import type {
  BusinessHealthAssessmentRun, BusinessHealthDimensionResult, BusinessHealthFinding, BusinessRecommendationReadiness,
  HealthAssessmentResult, HealthMapActor, HealthRunTriggerType,
} from "./types";

function actorType(actor: HealthMapActor): "staff" | "owner" {
  return actor.type;
}
function actorRosterId(actor: HealthMapActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: HealthMapActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

function mapRunRow(row: Record<string, unknown>): BusinessHealthAssessmentRun {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    calculationVersion: String(row.calculation_version),
    triggerType: row.trigger_type as HealthRunTriggerType,
    status: row.status as BusinessHealthAssessmentRun["status"],
    startedAt: String(row.started_at),
    completedAt: (row.completed_at as string | null) ?? null,
    sourceDataCutoffAt: (row.source_data_cutoff_at as string | null) ?? null,
    totalDimensionsAssessed: Number(row.total_dimensions_assessed),
    strongCount: Number(row.strong_count),
    stableCount: Number(row.stable_count),
    needsAttentionCount: Number(row.needs_attention_count),
    insufficientInformationCount: Number(row.insufficient_information_count),
    contradictionBlockedCount: Number(row.contradiction_blocked_count),
    summaryEs: (row.summary_es as string | null) ?? null,
    summaryEn: (row.summary_en as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const RUN_COLUMNS =
  "id, business_id, calculation_version, trigger_type, status, started_at, completed_at, source_data_cutoff_at, total_dimensions_assessed, strong_count, stable_count, needs_attention_count, insufficient_information_count, contradiction_blocked_count, summary_es, summary_en, created_actor_type, created_by_email, created_by_role, created_at, updated_at";

function mapDimensionResultRow(row: Record<string, unknown>): BusinessHealthDimensionResult {
  return {
    id: String(row.id),
    assessmentRunId: String(row.assessment_run_id),
    businessId: String(row.business_id),
    dimensionKey: row.dimension_key as BusinessHealthDimensionResult["dimensionKey"],
    status: row.status as BusinessHealthDimensionResult["status"],
    confidence: row.confidence as BusinessHealthDimensionResult["confidence"],
    evidenceStrength: row.evidence_strength as BusinessHealthDimensionResult["evidenceStrength"],
    freshness: row.freshness as BusinessHealthDimensionResult["freshness"],
    supportingFactIds: (row.supporting_fact_ids as string[] | null) ?? [],
    supportingEvidenceIds: (row.supporting_evidence_ids as string[] | null) ?? [],
    relatedUnknownIds: (row.related_unknown_ids as string[] | null) ?? [],
    relatedContradictionIds: (row.related_contradiction_ids as string[] | null) ?? [],
    explanationEs: String(row.explanation_es),
    explanationEn: String(row.explanation_en),
    limitationsEs: (row.limitations_es as string | null) ?? null,
    limitationsEn: (row.limitations_en as string | null) ?? null,
    calculatedAt: String(row.calculated_at),
    calculationVersion: String(row.calculation_version),
    createdAt: String(row.created_at),
  };
}

const DIMENSION_RESULT_COLUMNS =
  "id, assessment_run_id, business_id, dimension_key, status, confidence, evidence_strength, freshness, supporting_fact_ids, supporting_evidence_ids, related_unknown_ids, related_contradiction_ids, explanation_es, explanation_en, limitations_es, limitations_en, calculated_at, calculation_version, created_at";

function mapFindingRow(row: Record<string, unknown>): BusinessHealthFinding {
  return {
    id: String(row.id),
    assessmentRunId: String(row.assessment_run_id),
    dimensionResultId: String(row.dimension_result_id),
    businessId: String(row.business_id),
    findingType: row.finding_type as BusinessHealthFinding["findingType"],
    severity: row.severity as BusinessHealthFinding["severity"],
    titleEs: String(row.title_es),
    titleEn: String(row.title_en),
    explanationEs: String(row.explanation_es),
    explanationEn: String(row.explanation_en),
    supportingFactIds: (row.supporting_fact_ids as string[] | null) ?? [],
    supportingEvidenceIds: (row.supporting_evidence_ids as string[] | null) ?? [],
    relatedUnknownIds: (row.related_unknown_ids as string[] | null) ?? [],
    relatedContradictionIds: (row.related_contradiction_ids as string[] | null) ?? [],
    confidence: row.confidence as BusinessHealthFinding["confidence"],
    visibility: row.visibility as BusinessHealthFinding["visibility"],
    status: row.status as BusinessHealthFinding["status"],
    createdAt: String(row.created_at),
  };
}

const FINDING_COLUMNS =
  "id, assessment_run_id, dimension_result_id, business_id, finding_type, severity, title_es, title_en, explanation_es, explanation_en, supporting_fact_ids, supporting_evidence_ids, related_unknown_ids, related_contradiction_ids, confidence, visibility, status, created_at";

function mapReadinessRow(row: Record<string, unknown>): BusinessRecommendationReadiness {
  return {
    id: String(row.id),
    assessmentRunId: String(row.assessment_run_id),
    businessId: String(row.business_id),
    readinessStatus: row.readiness_status as BusinessRecommendationReadiness["readinessStatus"],
    reasonEs: String(row.reason_es),
    reasonEn: String(row.reason_en),
    blockingDimensionKeys: (row.blocking_dimension_keys as BusinessRecommendationReadiness["blockingDimensionKeys"] | null) ?? [],
    blockingUnknownIds: (row.blocking_unknown_ids as string[] | null) ?? [],
    blockingContradictionIds: (row.blocking_contradiction_ids as string[] | null) ?? [],
    humanReviewRequired: Boolean(row.human_review_required),
    humanReviewMarkedByEmail: (row.human_review_marked_by_email as string | null) ?? null,
    humanReviewMarkedAt: (row.human_review_marked_at as string | null) ?? null,
    humanReviewNote: (row.human_review_note as string | null) ?? null,
    calculationVersion: String(row.calculation_version),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const READINESS_COLUMNS =
  "id, assessment_run_id, business_id, readiness_status, reason_es, reason_en, blocking_dimension_keys, blocking_unknown_ids, blocking_contradiction_ids, human_review_required, human_review_marked_by_email, human_review_marked_at, human_review_note, calculation_version, created_at, updated_at";

export async function listRunsForBusiness(businessId: string, limit = 20): Promise<BusinessHealthAssessmentRun[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_health_assessment_runs")
    .select(RUN_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapRunRow);
}

export async function getLatestCompletedRun(businessId: string): Promise<BusinessHealthAssessmentRun | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_health_assessment_runs")
    .select(RUN_COLUMNS)
    .eq("business_id", businessId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRunRow(data as Record<string, unknown>);
}

export async function getDimensionResultsForRun(runId: string): Promise<BusinessHealthDimensionResult[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_health_dimension_results").select(DIMENSION_RESULT_COLUMNS).eq("assessment_run_id", runId);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapDimensionResultRow);
}

export async function getFindingsForRun(runId: string): Promise<BusinessHealthFinding[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_health_findings").select(FINDING_COLUMNS).eq("assessment_run_id", runId).eq("status", "active");
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapFindingRow);
}

export async function getReadinessForRun(runId: string): Promise<BusinessRecommendationReadiness | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_recommendation_readiness").select(READINESS_COLUMNS).eq("assessment_run_id", runId).maybeSingle();
  if (error || !data) return null;
  return mapReadinessRow(data as Record<string, unknown>);
}

export async function getFullRun(runId: string): Promise<HealthAssessmentResult | null> {
  const supabase = getAdminSupabase();
  const { data: runRow, error } = await supabase.from("business_health_assessment_runs").select(RUN_COLUMNS).eq("id", runId).maybeSingle();
  if (error || !runRow) return null;
  const [dimensionResults, findings, readiness] = await Promise.all([
    getDimensionResultsForRun(runId),
    getFindingsForRun(runId),
    getReadinessForRun(runId),
  ]);
  if (!readiness) return null;
  return { run: mapRunRow(runRow as Record<string, unknown>), dimensionResults, findings, readiness };
}

/**
 * Runs the deterministic calculation and persists exactly one new, immutable run + its dimension
 * results + findings + readiness gate, in FK-safe order. Never mutates a prior run.
 */
export async function runHealthAssessment(
  businessId: string,
  triggerType: HealthRunTriggerType,
  actor: HealthMapActor,
): Promise<{ ok: true; result: HealthAssessmentResult } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();

  const [facts, evidence, unknowns, contradictions] = await Promise.all([
    listFactsForBusiness(businessId),
    listEvidenceForBusiness(businessId),
    listUnknownsForBusiness(businessId),
    listContradictionsForBusiness(businessId),
  ]);

  const input: HealthCalculationInput = { businessId, facts, evidence, unknowns, contradictions, nowIso };
  const dimensionCalcs = calculateAllDimensions(input);
  const readinessCalc = calculateReadiness(dimensionCalcs, input, CALCULATION_VERSION);
  const counts = summarizeCounts(dimensionCalcs);

  const { data: runData, error: runError } = await supabase
    .from("business_health_assessment_runs")
    .insert({
      business_id: businessId,
      calculation_version: CALCULATION_VERSION,
      trigger_type: triggerType,
      status: "completed",
      started_at: nowIso,
      completed_at: new Date().toISOString(),
      source_data_cutoff_at: nowIso,
      total_dimensions_assessed: counts.totalDimensionsAssessed,
      strong_count: counts.strongCount,
      stable_count: counts.stableCount,
      needs_attention_count: counts.needsAttentionCount,
      insufficient_information_count: counts.insufficientInformationCount,
      contradiction_blocked_count: counts.contradictionBlockedCount,
      summary_es: null,
      summary_en: null,
      created_actor_type: actorType(actor),
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select(RUN_COLUMNS)
    .maybeSingle();
  if (runError || !runData) return { ok: false, error: runError?.message ?? "run_insert_failed" };
  const runId = String((runData as { id: string }).id);

  const { data: dimensionRows, error: dimError } = await supabase
    .from("business_health_dimension_results")
    .insert(
      dimensionCalcs.map((d) => ({
        assessment_run_id: runId,
        business_id: d.businessId,
        dimension_key: d.dimensionKey,
        status: d.status,
        confidence: d.confidence,
        evidence_strength: d.evidenceStrength,
        freshness: d.freshness,
        supporting_fact_ids: d.supportingFactIds,
        supporting_evidence_ids: d.supportingEvidenceIds,
        related_unknown_ids: d.relatedUnknownIds,
        related_contradiction_ids: d.relatedContradictionIds,
        explanation_es: d.explanationEs,
        explanation_en: d.explanationEn,
        limitations_es: d.limitationsEs,
        limitations_en: d.limitationsEn,
        calculated_at: d.calculatedAt,
        calculation_version: d.calculationVersion,
      })),
    )
    .select(DIMENSION_RESULT_COLUMNS);
  if (dimError || !dimensionRows) return { ok: false, error: dimError?.message ?? "dimension_insert_failed" };

  const dimensionIdByKey = new Map<string, string>();
  for (const row of dimensionRows as Record<string, unknown>[]) {
    dimensionIdByKey.set(String(row.dimension_key), String(row.id));
  }

  const findingInserts = dimensionCalcs.flatMap((d) => {
    const dimensionResultId = dimensionIdByKey.get(d.dimensionKey);
    if (!dimensionResultId) return [];
    return findingsForDimension(d).map((f) => ({
      assessment_run_id: runId,
      dimension_result_id: dimensionResultId,
      business_id: f.businessId,
      finding_type: f.findingType,
      severity: f.severity,
      title_es: f.titleEs,
      title_en: f.titleEn,
      explanation_es: f.explanationEs,
      explanation_en: f.explanationEn,
      supporting_fact_ids: f.supportingFactIds,
      supporting_evidence_ids: f.supportingEvidenceIds,
      related_unknown_ids: f.relatedUnknownIds,
      related_contradiction_ids: f.relatedContradictionIds,
      confidence: f.confidence,
      visibility: f.visibility,
      status: f.status,
    }));
  });

  const { data: findingRows, error: findingError } = await supabase
    .from("business_health_findings")
    .insert(findingInserts)
    .select(FINDING_COLUMNS);
  if (findingError || !findingRows) return { ok: false, error: findingError?.message ?? "finding_insert_failed" };

  const { data: readinessRow, error: readinessError } = await supabase
    .from("business_recommendation_readiness")
    .insert({
      assessment_run_id: runId,
      business_id: businessId,
      readiness_status: readinessCalc.readinessStatus,
      reason_es: readinessCalc.reasonEs,
      reason_en: readinessCalc.reasonEn,
      blocking_dimension_keys: readinessCalc.blockingDimensionKeys,
      blocking_unknown_ids: readinessCalc.blockingUnknownIds,
      blocking_contradiction_ids: readinessCalc.blockingContradictionIds,
      human_review_required: readinessCalc.readinessStatus === "human_review_required",
      calculation_version: readinessCalc.calculationVersion,
    })
    .select(READINESS_COLUMNS)
    .maybeSingle();
  if (readinessError || !readinessRow) return { ok: false, error: readinessError?.message ?? "readiness_insert_failed" };

  return {
    ok: true,
    result: {
      run: mapRunRow(runData as Record<string, unknown>),
      dimensionResults: (dimensionRows as Record<string, unknown>[]).map(mapDimensionResultRow),
      findings: (findingRows as Record<string, unknown>[]).map(mapFindingRow),
      readiness: mapReadinessRow(readinessRow as Record<string, unknown>),
    },
  };
}

/** Marks (or unmarks) human review on an EXISTING readiness row — never rewrites the computed conclusion itself. */
export async function markHumanReview(
  readinessId: string,
  required: boolean,
  note: string | null,
  actor: Extract<HealthMapActor, { type: "staff" }>,
): Promise<boolean> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("business_recommendation_readiness")
    .update({
      human_review_required: required,
      human_review_marked_by_roster_id: actor.rosterId,
      human_review_marked_by_auth_user_id: actor.authUserId,
      human_review_marked_by_email: actor.email,
      human_review_marked_at: new Date().toISOString(),
      human_review_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", readinessId);
  return !error;
}

/**
 * Program 7 — Business Outcomes repository.
 * Server-only, always via getAdminSupabase(). Every write requires an OutcomeActor.
 * Outcomes never publish, charge, create payment, or grant entitlement.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { computeResult, computeConfidence, computeCausation } from "./logic";
import type {
  BusinessOutcome, BusinessOutcomeEvidence, BusinessOutcomeReflection,
  OutcomeActor, OutcomeEvidenceType, OutcomeEvidenceSourceClass,
  OutcomeEvidenceVisibility, OutcomeEvidenceSensitivity,
  OutcomeReflectionType, MeasurementSource, OutcomeResult, OutcomeConfidence,
  OutcomeCausationClaim, OutcomeReviewStatus,
} from "./types";

function actorRosterId(actor: OutcomeActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: OutcomeActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

const OUTCOME_COLUMNS =
  "id, business_id, recommendation_id, commitment_id, creative_job_id, metric_key, metric_label_es, metric_label_en, baseline_value, baseline_unit, baseline_observed_at, measured_value, measured_unit, measurement_source, measured_at, result, confidence, causation_claim, review_status, next_review_at, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, reviewed_actor_type, reviewed_by_roster_id, reviewed_by_auth_user_id, reviewed_by_email, reviewed_by_role, reviewed_at, created_at, updated_at";

function mapOutcomeRow(row: Record<string, unknown>): BusinessOutcome {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    recommendationId: (row.recommendation_id as string | null) ?? null,
    commitmentId: (row.commitment_id as string | null) ?? null,
    creativeJobId: (row.creative_job_id as string | null) ?? null,
    metricKey: String(row.metric_key),
    metricLabelEs: String(row.metric_label_es),
    metricLabelEn: String(row.metric_label_en),
    baselineValue: (row.baseline_value as string | null) ?? null,
    baselineUnit: (row.baseline_unit as string | null) ?? null,
    baselineObservedAt: (row.baseline_observed_at as string | null) ?? null,
    measuredValue: (row.measured_value as string | null) ?? null,
    measuredUnit: (row.measured_unit as string | null) ?? null,
    measurementSource: row.measurement_source as MeasurementSource,
    measuredAt: (row.measured_at as string | null) ?? null,
    result: row.result as OutcomeResult,
    confidence: row.confidence as OutcomeConfidence,
    causationClaim: row.causation_claim as OutcomeCausationClaim,
    reviewStatus: row.review_status as OutcomeReviewStatus,
    nextReviewAt: (row.next_review_at as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    reviewedActorType: (row.reviewed_actor_type as "staff" | "owner" | null) ?? null,
    reviewedByRosterId: (row.reviewed_by_roster_id as string | null) ?? null,
    reviewedByAuthUserId: (row.reviewed_by_auth_user_id as string | null) ?? null,
    reviewedByEmail: (row.reviewed_by_email as string | null) ?? null,
    reviewedByRole: (row.reviewed_by_role as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listBusinessOutcomes(businessId: string): Promise<BusinessOutcome[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcomes")
    .select(OUTCOME_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapOutcomeRow);
}

export async function getOutcomeDetail(businessId: string, outcomeId: string): Promise<BusinessOutcome | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcomes")
    .select(OUTCOME_COLUMNS)
    .eq("id", outcomeId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapOutcomeRow(data);
}

export async function getOutcomeHistoryForBusiness(businessId: string): Promise<BusinessOutcome[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcomes")
    .select(OUTCOME_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapOutcomeRow);
}

export type CreateOutcomeInput = {
  recommendationId?: string | null;
  commitmentId?: string | null;
  creativeJobId?: string | null;
  metricKey: string;
  metricLabelEs: string;
  metricLabelEn: string;
  baselineValue?: string | null;
  baselineUnit?: string | null;
  baselineObservedAt?: string | null;
  measuredValue?: string | null;
  measuredUnit?: string | null;
  measurementSource: MeasurementSource;
  measuredAt?: string | null;
  nextReviewAt?: string | null;
};

export async function createOutcome(
  businessId: string,
  input: CreateOutcomeInput,
  actor: OutcomeActor,
): Promise<BusinessOutcome | null> {
  const result = computeResult(input.baselineValue ?? null, input.measuredValue ?? null, input.measurementSource);
  const confidence = computeConfidence(
    Boolean(input.baselineValue),
    Boolean(input.measuredValue),
    false,
    input.measurementSource,
  );
  const causation = computeCausation(false, 0, Boolean(input.recommendationId), Boolean(input.commitmentId));

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcomes")
    .insert({
      business_id: businessId,
      recommendation_id: input.recommendationId ?? null,
      commitment_id: input.commitmentId ?? null,
      creative_job_id: input.creativeJobId ?? null,
      metric_key: input.metricKey,
      metric_label_es: input.metricLabelEs,
      metric_label_en: input.metricLabelEn,
      baseline_value: input.baselineValue ?? null,
      baseline_unit: input.baselineUnit ?? null,
      baseline_observed_at: input.baselineObservedAt ?? null,
      measured_value: input.measuredValue ?? null,
      measured_unit: input.measuredUnit ?? null,
      measurement_source: input.measurementSource,
      measured_at: input.measuredAt ?? null,
      result,
      confidence,
      causation_claim: causation,
      review_status: "pending",
      next_review_at: input.nextReviewAt ?? null,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select(OUTCOME_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapOutcomeRow(data);
}

export type AttachEvidenceInput = {
  evidenceType: OutcomeEvidenceType;
  sourceClass: OutcomeEvidenceSourceClass;
  sourceReference: string;
  sourceUrl?: string | null;
  observedAt: string;
  structuredValue?: Record<string, unknown> | null;
  textExcerpt?: string | null;
  visibility: OutcomeEvidenceVisibility;
  sensitivity: OutcomeEvidenceSensitivity;
};

export async function attachOutcomeEvidence(
  businessId: string,
  outcomeId: string,
  input: AttachEvidenceInput,
  actor: OutcomeActor,
): Promise<BusinessOutcomeEvidence | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcome_evidence")
    .insert({
      business_id: businessId,
      outcome_id: outcomeId,
      evidence_type: input.evidenceType,
      source_class: input.sourceClass,
      source_reference: input.sourceReference,
      source_url: input.sourceUrl ?? null,
      observed_at: input.observedAt,
      structured_value: input.structuredValue ?? null,
      text_excerpt: input.textExcerpt ?? null,
      visibility: input.visibility,
      sensitivity: input.sensitivity,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return data as BusinessOutcomeEvidence;
}

export async function listEvidenceForOutcome(businessId: string, outcomeId: string): Promise<BusinessOutcomeEvidence[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcome_evidence")
    .select("*")
    .eq("business_id", businessId)
    .eq("outcome_id", outcomeId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as BusinessOutcomeEvidence[];
}

export type RecordMeasurementInput = {
  measuredValue: string;
  measuredUnit?: string | null;
  measurementSource: MeasurementSource;
  measuredAt: string;
};

export async function recordMeasurement(
  businessId: string,
  outcomeId: string,
  input: RecordMeasurementInput,
  _actor: OutcomeActor,
): Promise<BusinessOutcome | null> {
  const outcome = await getOutcomeDetail(businessId, outcomeId);
  if (!outcome) return null;

  const result = computeResult(outcome.baselineValue, input.measuredValue, input.measurementSource);
  const evidence = await listEvidenceForOutcome(businessId, outcomeId);
  const confidence = computeConfidence(
    Boolean(outcome.baselineValue),
    Boolean(input.measuredValue),
    evidence.length > 0,
    input.measurementSource,
  );
  const causation = computeCausation(
    evidence.length > 0,
    evidence.length,
    Boolean(outcome.recommendationId),
    Boolean(outcome.commitmentId),
  );

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcomes")
    .update({
      measured_value: input.measuredValue,
      measured_unit: input.measuredUnit ?? null,
      measurement_source: input.measurementSource,
      measured_at: input.measuredAt,
      result,
      confidence,
      causation_claim: causation,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outcomeId)
    .eq("business_id", businessId)
    .select(OUTCOME_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapOutcomeRow(data);
}

export type RecordReflectionInput = {
  reflectionType: OutcomeReflectionType;
  text: string;
  capabilityTransferred: boolean;
};

export async function recordOutcomeReflection(
  businessId: string,
  outcomeId: string,
  input: RecordReflectionInput,
  actor: OutcomeActor,
): Promise<BusinessOutcomeReflection | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcome_reflections")
    .insert({
      business_id: businessId,
      outcome_id: outcomeId,
      actor_type: actor.type,
      reflection_type: input.reflectionType,
      text: input.text,
      capability_transferred: input.capabilityTransferred,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return data as BusinessOutcomeReflection;
}

export async function listReflectionsForOutcome(businessId: string, outcomeId: string): Promise<BusinessOutcomeReflection[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcome_reflections")
    .select("*")
    .eq("business_id", businessId)
    .eq("outcome_id", outcomeId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as BusinessOutcomeReflection[];
}

export async function markOutcomeReviewed(
  businessId: string,
  outcomeId: string,
  actor: OutcomeActor,
  nextReviewAt?: string | null,
): Promise<BusinessOutcome | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_outcomes")
    .update({
      review_status: "reviewed",
      reviewed_actor_type: actor.type,
      reviewed_by_roster_id: actorRosterId(actor),
      reviewed_by_auth_user_id: actor.authUserId,
      reviewed_by_email: actor.email,
      reviewed_by_role: actorRole(actor),
      reviewed_at: new Date().toISOString(),
      next_review_at: nextReviewAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outcomeId)
    .eq("business_id", businessId)
    .select(OUTCOME_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapOutcomeRow(data);
}

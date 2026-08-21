/**
 * Package B, Gate 3 — Opportunity repository.
 * Server-only, always via getAdminSupabase(). Mirrors the exact business-scoping convention used
 * throughout Program 6/7 repositories: every read/write filters on BOTH id and business_id, never
 * id alone — this is the actual mechanism (not UI hiding) that prevents Business A staff from
 * reading/mutating Business B's opportunities.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  isValidOpportunityStateTransition,
  type CreateOpportunityInput, type CreativeOpportunity, type OpportunityActor,
  type OpportunityLifecycleState, type OpportunityMatchReason, type ReviewOpportunityInput,
} from "./types";

const OPPORTUNITY_COLUMNS =
  "id, business_id, opportunity_type, title_es, title_en, summary_es, summary_en, match_reasons, confidence, readiness_recommended, readiness_explanation_es, readiness_explanation_en, source_type, source_key, source_title, active_from, active_until, lifecycle_state, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_role, reviewed_at, reviewed_by_roster_id, reviewed_by_auth_user_id, reviewed_by_role, review_note, source_opportunity_creative_job_id, created_at, updated_at";

function actorRosterId(actor: OpportunityActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorAuthUserId(actor: OpportunityActor): string | null {
  return actor.type === "staff" ? actor.authUserId : null;
}

function mapRow(row: Record<string, unknown>): CreativeOpportunity {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    opportunityType: row.opportunity_type as CreativeOpportunity["opportunityType"],
    titleEs: String(row.title_es),
    titleEn: String(row.title_en),
    summaryEs: String(row.summary_es),
    summaryEn: String(row.summary_en),
    matchReasons: (row.match_reasons as OpportunityMatchReason[]) ?? [],
    confidence: row.confidence as CreativeOpportunity["confidence"],
    readinessRecommended: Boolean(row.readiness_recommended),
    readinessExplanationEs: String(row.readiness_explanation_es),
    readinessExplanationEn: String(row.readiness_explanation_en),
    sourceType: row.source_type as CreativeOpportunity["sourceType"],
    sourceKey: String(row.source_key),
    sourceTitle: String(row.source_title),
    activeFrom: (row.active_from as string | null) ?? null,
    activeUntil: (row.active_until as string | null) ?? null,
    lifecycleState: row.lifecycle_state as OpportunityLifecycleState,
    createdActorType: row.created_actor_type as "staff" | "owner" | "system",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: (row.created_by_auth_user_id as string | null) ?? null,
    createdByRole: String(row.created_by_role),
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    reviewedByRosterId: (row.reviewed_by_roster_id as string | null) ?? null,
    reviewedByAuthUserId: (row.reviewed_by_auth_user_id as string | null) ?? null,
    reviewedByRole: (row.reviewed_by_role as string | null) ?? null,
    reviewNote: (row.review_note as string | null) ?? null,
    sourceOpportunityCreativeJobId: (row.source_opportunity_creative_job_id as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listOpportunitiesForBusiness(businessId: string): Promise<CreativeOpportunity[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

/** Business boundary enforced here: id alone is never sufficient — business_id must also match. */
export async function getOpportunityById(businessId: string, opportunityId: string): Promise<CreativeOpportunity | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .eq("id", opportunityId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

/** Existing sourceKey+businessId combination is skipped (never duplicated) — caller should check first if it needs to know. */
export async function findExistingOpportunityBySourceKey(businessId: string, sourceKey: string): Promise<CreativeOpportunity | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .eq("business_id", businessId)
    .eq("source_key", sourceKey)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function createOpportunity(
  businessId: string,
  input: CreateOpportunityInput,
  actor: OpportunityActor,
): Promise<CreativeOpportunity | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_opportunities")
    .insert({
      business_id: businessId,
      opportunity_type: input.opportunityType,
      title_es: input.titleEs,
      title_en: input.titleEn,
      summary_es: input.summaryEs,
      summary_en: input.summaryEn,
      match_reasons: input.matchReasons,
      confidence: input.confidence,
      readiness_recommended: input.readinessRecommended,
      readiness_explanation_es: input.readinessExplanationEs,
      readiness_explanation_en: input.readinessExplanationEn,
      source_type: input.sourceType,
      source_key: input.sourceKey,
      source_title: input.sourceTitle,
      active_from: input.activeFrom,
      active_until: input.activeUntil,
      lifecycle_state: "suggested",
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actorAuthUserId(actor),
      created_by_role: actor.role,
    })
    .select(OPPORTUNITY_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapRow(data);
}

export type TransitionOpportunityResult =
  | { ok: true; opportunity: CreativeOpportunity }
  | { ok: false; reason: "not_found" | "invalid_transition" | "update_failed" };

/**
 * Never allows an invalid state jump (e.g. dismissed -> approved) — isValidOpportunityStateTransition
 * is the single source of truth for the allowed graph (types.ts), matching the
 * isValidCreativeJobStatusTransition() convention in creativeStudio/constants.ts exactly.
 */
async function transitionOpportunityState(
  businessId: string,
  opportunityId: string,
  toState: OpportunityLifecycleState,
  reviewFields: { reviewedByRosterId: string | null; reviewedByAuthUserId: string; reviewedByRole: string; reviewNote: string | null } | null,
): Promise<TransitionOpportunityResult> {
  const existing = await getOpportunityById(businessId, opportunityId);
  if (!existing) return { ok: false, reason: "not_found" };
  if (!isValidOpportunityStateTransition(existing.lifecycleState, toState)) {
    return { ok: false, reason: "invalid_transition" };
  }

  const supabase = getAdminSupabase();
  const update: Record<string, unknown> = { lifecycle_state: toState, updated_at: new Date().toISOString() };
  if (reviewFields) {
    update.reviewed_at = new Date().toISOString();
    update.reviewed_by_roster_id = reviewFields.reviewedByRosterId;
    update.reviewed_by_auth_user_id = reviewFields.reviewedByAuthUserId;
    update.reviewed_by_role = reviewFields.reviewedByRole;
    update.review_note = reviewFields.reviewNote;
  }

  const { data, error } = await supabase
    .from("business_creative_opportunities")
    .update(update)
    .eq("id", opportunityId)
    .eq("business_id", businessId)
    .select(OPPORTUNITY_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };
  return { ok: true, opportunity: mapRow(data) };
}

export async function reviewOpportunity(
  businessId: string,
  opportunityId: string,
  input: ReviewOpportunityInput,
  actor: Extract<OpportunityActor, { type: "staff" }>,
): Promise<TransitionOpportunityResult> {
  return transitionOpportunityState(businessId, opportunityId, "reviewed", {
    reviewedByRosterId: actor.rosterId,
    reviewedByAuthUserId: actor.authUserId,
    reviewedByRole: actor.role,
    reviewNote: input.reviewNote,
  });
}

export async function approveOpportunity(
  businessId: string,
  opportunityId: string,
  input: ReviewOpportunityInput,
  actor: Extract<OpportunityActor, { type: "staff" }>,
): Promise<TransitionOpportunityResult> {
  return transitionOpportunityState(businessId, opportunityId, "approved", {
    reviewedByRosterId: actor.rosterId,
    reviewedByAuthUserId: actor.authUserId,
    reviewedByRole: actor.role,
    reviewNote: input.reviewNote,
  });
}

export async function dismissOpportunity(
  businessId: string,
  opportunityId: string,
  input: ReviewOpportunityInput,
  actor: Extract<OpportunityActor, { type: "staff" }>,
): Promise<TransitionOpportunityResult> {
  return transitionOpportunityState(businessId, opportunityId, "dismissed", {
    reviewedByRosterId: actor.rosterId,
    reviewedByAuthUserId: actor.authUserId,
    reviewedByRole: actor.role,
    reviewNote: input.reviewNote,
  });
}

/**
 * Only valid from "approved". Sets source_opportunity_creative_job_id atomically with the state
 * change — the DB CHECK constraint (business_creative_opportunities_creative_requested_chk)
 * enforces that "creative_requested" state and a non-null job id always travel together.
 */
export async function markOpportunityCreativeRequested(
  businessId: string,
  opportunityId: string,
  creativeJobId: string,
): Promise<TransitionOpportunityResult> {
  const existing = await getOpportunityById(businessId, opportunityId);
  if (!existing) return { ok: false, reason: "not_found" };
  if (!isValidOpportunityStateTransition(existing.lifecycleState, "creative_requested")) {
    return { ok: false, reason: "invalid_transition" };
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_creative_opportunities")
    .update({
      lifecycle_state: "creative_requested",
      source_opportunity_creative_job_id: creativeJobId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId)
    .eq("business_id", businessId)
    .select(OPPORTUNITY_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };
  return { ok: true, opportunity: mapRow(data) };
}

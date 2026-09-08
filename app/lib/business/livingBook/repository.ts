/**
 * Gate BCO-5A — Living Business Book repository. Server-only, always via getAdminSupabase()
 * (service-role, same pattern as businessWorkspaceData.ts). Every write function requires a real
 * LivingBookActor — built exclusively by the caller from the verified Package 4A StrictSalesActor
 * or a verified owner session (resolveAuthenticatedUserId). No function here accepts a bare
 * string actor field, and no function trusts caller-supplied actor data.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type {
  BookAuditAction, BookAuditRecordType, BusinessContradiction, BusinessCorrection, BusinessDiscoveryAnswer,
  BusinessDiscoverySession, BusinessEvidence, BusinessFact, BusinessUnknown, ConfidenceLevel, ContradictionSeverity,
  ContradictionType, CorrectionType, DiscoveryConsentState, DiscoverySessionType, EvidenceType, FactCategory,
  FactSensitivity, FactVisibility, LivingBookActor, SourceClass, UnknownChannel, UnknownPriority,
} from "./types";

function actorType(actor: LivingBookActor): "staff" | "owner" {
  return actor.type;
}
function actorRosterId(actor: LivingBookActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: LivingBookActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

async function writeBookAuditLog(
  actor: LivingBookActor,
  businessId: string,
  action: BookAuditAction,
  recordType: BookAuditRecordType,
  recordId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("business_book_audit_log").insert({
    action,
    business_id: businessId,
    record_type: recordType,
    record_id: recordId,
    actor_type: actorType(actor),
    actor_roster_id: actorRosterId(actor),
    actor_auth_user_id: actor.authUserId,
    actor_email: actor.email,
    actor_role: actorRole(actor),
    metadata,
  });
  if (error) {
    console.error(`[living-book-audit] failed to write audit log for ${action} on business ${businessId}:`, error.message);
  }
}

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------

function mapFactRow(row: Record<string, unknown>): BusinessFact {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    factKey: String(row.fact_key),
    factCategory: row.fact_category as FactCategory,
    value: row.value,
    displayValue: (row.display_value as string | null) ?? null,
    status: row.status as BusinessFact["status"],
    sourceClass: row.source_class as SourceClass,
    confidence: row.confidence as ConfidenceLevel,
    effectiveDate: (row.effective_date as string | null) ?? null,
    lastVerifiedAt: (row.last_verified_at as string | null) ?? null,
    visibility: row.visibility as FactVisibility,
    sensitivity: row.sensitivity as FactSensitivity,
    confirmationState: row.confirmation_state as BusinessFact["confirmationState"],
    supersedesFactId: (row.supersedes_fact_id as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    updatedActorType: row.updated_actor_type as "staff" | "owner",
    updatedByEmail: String(row.updated_by_email),
    updatedByRole: String(row.updated_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const FACT_COLUMNS =
  "id, business_id, fact_key, fact_category, value, display_value, status, source_class, confidence, effective_date, last_verified_at, visibility, sensitivity, confirmation_state, supersedes_fact_id, created_actor_type, created_by_email, created_by_role, updated_actor_type, updated_by_email, updated_by_role, created_at, updated_at";

export async function listFactsForBusiness(businessId: string, includeSuperseded = false): Promise<BusinessFact[]> {
  const supabase = getAdminSupabase();
  let query = supabase.from("business_facts").select(FACT_COLUMNS).eq("business_id", businessId);
  if (!includeSuperseded) query = query.neq("status", "superseded");
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapFactRow);
}

export async function getFactHistory(businessId: string, factKey: string): Promise<BusinessFact[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_facts")
    .select(FACT_COLUMNS)
    .eq("business_id", businessId)
    .eq("fact_key", factKey)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapFactRow);
}

export type CreateFactInput = {
  businessId: string;
  factKey: string;
  factCategory: FactCategory;
  value: unknown;
  displayValue: string | null;
  sourceClass: SourceClass;
  confidence: ConfidenceLevel;
  visibility: FactVisibility;
  sensitivity: FactSensitivity;
  effectiveDate: string | null;
};

/**
 * Creates a fact, or — if an active fact already exists for this (business, factKey) — supersedes
 * it: the old row's status becomes 'superseded', a new row is inserted with supersedesFactId
 * pointing at it. Never overwrites the old row in place.
 */
export async function upsertFact(input: CreateFactInput, actor: LivingBookActor): Promise<{ ok: true; id: string; superseded: boolean } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();

  const { data: existing } = await supabase
    .from("business_facts")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("fact_key", input.factKey)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    await supabase.from("business_facts").update({ status: "superseded", updated_at: new Date().toISOString() }).eq("id", (existing as { id: string }).id);
    await writeBookAuditLog(actor, input.businessId, "fact_superseded", "business_fact", (existing as { id: string }).id, { fact_key: input.factKey });
  }

  const actorCols = {
    created_actor_type: actorType(actor),
    created_by_roster_id: actorRosterId(actor),
    created_by_auth_user_id: actor.authUserId,
    created_by_email: actor.email,
    created_by_role: actorRole(actor),
    updated_actor_type: actorType(actor),
    updated_by_roster_id: actorRosterId(actor),
    updated_by_auth_user_id: actor.authUserId,
    updated_by_email: actor.email,
    updated_by_role: actorRole(actor),
  };

  const { data, error } = await supabase
    .from("business_facts")
    .insert({
      business_id: input.businessId,
      fact_key: input.factKey,
      fact_category: input.factCategory,
      value: input.value,
      display_value: input.displayValue,
      source_class: input.sourceClass,
      confidence: input.confidence,
      visibility: input.visibility,
      sensitivity: input.sensitivity,
      effective_date: input.effectiveDate,
      last_verified_at: new Date().toISOString(),
      supersedes_fact_id: existing ? (existing as { id: string }).id : null,
      ...actorCols,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = String((data as { id: string }).id);
  await writeBookAuditLog(actor, input.businessId, existing ? "fact_updated" : "fact_created", "business_fact", id, { fact_key: input.factKey, source_class: input.sourceClass });
  return { ok: true, id, superseded: Boolean(existing) };
}

export async function confirmFact(businessId: string, factId: string, actor: LivingBookActor, accept: boolean): Promise<boolean> {
  const supabase = getAdminSupabase();
  const nextState = accept ? "owner_confirmed" : "owner_rejected";
  const { error } = await supabase
    .from("business_facts")
    .update({
      confirmation_state: nextState,
      status: accept ? "active" : "rejected",
      last_verified_at: new Date().toISOString(),
      updated_actor_type: actorType(actor),
      updated_by_roster_id: actorRosterId(actor),
      updated_by_auth_user_id: actor.authUserId,
      updated_by_email: actor.email,
      updated_by_role: actorRole(actor),
      updated_at: new Date().toISOString(),
    })
    .eq("id", factId)
    .eq("business_id", businessId);
  if (error) return false;
  await writeBookAuditLog(actor, businessId, accept ? "fact_confirmed" : "fact_rejected", "business_fact", factId, {});
  return true;
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

function mapEvidenceRow(row: Record<string, unknown>): BusinessEvidence {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    relatedFactId: (row.related_fact_id as string | null) ?? null,
    relatedUnknownId: (row.related_unknown_id as string | null) ?? null,
    evidenceType: row.evidence_type as EvidenceType,
    sourceTitle: String(row.source_title),
    sourceUrl: (row.source_url as string | null) ?? null,
    capturedText: (row.captured_text as string | null) ?? null,
    capturedAt: String(row.captured_at),
    sourceDate: (row.source_date as string | null) ?? null,
    consentState: row.consent_state as BusinessEvidence["consentState"],
    reliability: row.reliability as ConfidenceLevel,
    visibility: row.visibility as FactVisibility,
    retentionState: row.retention_state as BusinessEvidence["retentionState"],
    collectedByEmail: String(row.collected_by_email),
    collectedByRole: String(row.collected_by_role),
    createdAt: String(row.created_at),
  };
}

const EVIDENCE_COLUMNS =
  "id, business_id, related_fact_id, related_unknown_id, evidence_type, source_title, source_url, captured_text, captured_at, source_date, consent_state, reliability, visibility, retention_state, collected_by_email, collected_by_role, created_at";

export async function listEvidenceForBusiness(businessId: string): Promise<BusinessEvidence[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_evidence").select(EVIDENCE_COLUMNS).eq("business_id", businessId).neq("retention_state", "deleted").order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapEvidenceRow);
}

export type AddEvidenceInput = {
  businessId: string;
  relatedFactId: string | null;
  relatedUnknownId: string | null;
  evidenceType: EvidenceType;
  sourceTitle: string;
  sourceUrl: string | null;
  capturedText: string | null;
  sourceDate: string | null;
  consentState: BusinessEvidence["consentState"];
  reliability: ConfidenceLevel;
  visibility: FactVisibility;
};

export async function addEvidence(input: AddEvidenceInput, actor: LivingBookActor): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const trimmedTitle = input.sourceTitle.trim();
  if (!trimmedTitle) return { ok: false, error: "empty_source_title" };
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_evidence")
    .insert({
      business_id: input.businessId,
      related_fact_id: input.relatedFactId,
      related_unknown_id: input.relatedUnknownId,
      evidence_type: input.evidenceType,
      source_title: trimmedTitle,
      source_url: input.sourceUrl,
      captured_text: input.capturedText,
      source_date: input.sourceDate,
      consent_state: input.consentState,
      reliability: input.reliability,
      visibility: input.visibility,
      collected_actor_type: actorType(actor),
      collected_by_roster_id: actorRosterId(actor),
      collected_by_auth_user_id: actor.authUserId,
      collected_by_email: actor.email,
      collected_by_role: actorRole(actor),
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = String((data as { id: string }).id);
  await writeBookAuditLog(actor, input.businessId, "evidence_added", "business_evidence", id, { evidence_type: input.evidenceType });
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Unknowns
// ---------------------------------------------------------------------------

function mapUnknownRow(row: Record<string, unknown>): BusinessUnknown {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    questionLabel: String(row.question_label),
    whyItMatters: (row.why_it_matters as string | null) ?? null,
    whoCanAnswer: (row.who_can_answer as string | null) ?? null,
    priority: row.priority as UnknownPriority,
    status: row.status as BusinessUnknown["status"],
    assignedChannel: (row.assigned_channel as UnknownChannel | null) ?? null,
    askedAt: (row.asked_at as string | null) ?? null,
    answeredAt: (row.answered_at as string | null) ?? null,
    resolution: (row.resolution as string | null) ?? null,
    relatedFactId: (row.related_fact_id as string | null) ?? null,
    visibility: row.visibility as FactVisibility,
    createdByEmail: String(row.created_by_email),
    createdAt: String(row.created_at),
  };
}

const UNKNOWN_COLUMNS =
  "id, business_id, question_label, why_it_matters, who_can_answer, priority, status, assigned_channel, asked_at, answered_at, resolution, related_fact_id, visibility, created_by_email, created_at";

export async function listUnknownsForBusiness(businessId: string): Promise<BusinessUnknown[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_unknowns").select(UNKNOWN_COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapUnknownRow);
}

export type CreateUnknownInput = {
  businessId: string;
  questionLabel: string;
  whyItMatters: string | null;
  whoCanAnswer: string | null;
  priority: UnknownPriority;
  assignedChannel: UnknownChannel | null;
  visibility: FactVisibility;
};

export async function createUnknown(input: CreateUnknownInput, actor: LivingBookActor): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const trimmed = input.questionLabel.trim();
  if (!trimmed) return { ok: false, error: "empty_question_label" };
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_unknowns")
    .insert({
      business_id: input.businessId,
      question_label: trimmed,
      why_it_matters: input.whyItMatters,
      who_can_answer: input.whoCanAnswer,
      priority: input.priority,
      assigned_channel: input.assignedChannel,
      visibility: input.visibility,
      asked_at: new Date().toISOString(),
      created_actor_type: actorType(actor),
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = String((data as { id: string }).id);
  await writeBookAuditLog(actor, input.businessId, "unknown_created", "business_unknown", id, {});
  return { ok: true, id };
}

export async function resolveUnknown(businessId: string, unknownId: string, resolution: string, relatedFactId: string | null, actor: LivingBookActor): Promise<boolean> {
  const trimmed = resolution.trim();
  if (!trimmed) return false;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("business_unknowns")
    .update({ status: "answered", answered_at: new Date().toISOString(), resolution: trimmed, related_fact_id: relatedFactId, updated_at: new Date().toISOString() })
    .eq("id", unknownId)
    .eq("business_id", businessId);
  if (error) return false;
  await writeBookAuditLog(actor, businessId, "unknown_resolved", "business_unknown", unknownId, {});
  return true;
}

// ---------------------------------------------------------------------------
// Contradictions
// ---------------------------------------------------------------------------

function mapContradictionRow(row: Record<string, unknown>): BusinessContradiction {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    contradictionType: row.contradiction_type as ContradictionType,
    severity: row.severity as ContradictionSeverity,
    status: row.status as BusinessContradiction["status"],
    claimALabel: String(row.claim_a_label),
    claimAFactId: (row.claim_a_fact_id as string | null) ?? null,
    claimAEvidenceId: (row.claim_a_evidence_id as string | null) ?? null,
    claimBLabel: String(row.claim_b_label),
    claimBFactId: (row.claim_b_fact_id as string | null) ?? null,
    claimBEvidenceId: (row.claim_b_evidence_id as string | null) ?? null,
    resolution: (row.resolution as string | null) ?? null,
    resolvedCanonicalFactId: (row.resolved_canonical_fact_id as string | null) ?? null,
    resolvedByEmail: (row.resolved_by_email as string | null) ?? null,
    resolvedAt: (row.resolved_at as string | null) ?? null,
    createdByEmail: String(row.created_by_email),
    createdAt: String(row.created_at),
  };
}

const CONTRADICTION_COLUMNS =
  "id, business_id, contradiction_type, severity, status, claim_a_label, claim_a_fact_id, claim_a_evidence_id, claim_b_label, claim_b_fact_id, claim_b_evidence_id, resolution, resolved_canonical_fact_id, resolved_by_email, resolved_at, created_by_email, created_at";

export async function listContradictionsForBusiness(businessId: string): Promise<BusinessContradiction[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_contradictions").select(CONTRADICTION_COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapContradictionRow);
}

export type CreateContradictionInput = {
  businessId: string;
  contradictionType: ContradictionType;
  severity: ContradictionSeverity;
  claimALabel: string;
  claimAFactId: string | null;
  claimAEvidenceId: string | null;
  claimBLabel: string;
  claimBFactId: string | null;
  claimBEvidenceId: string | null;
};

/** Staff-only — creating a contradiction requires a resolvable roster actor (never an owner actor). */
export async function createContradiction(input: CreateContradictionInput, actor: Extract<LivingBookActor, { type: "staff" }>): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!input.claimALabel.trim() || !input.claimBLabel.trim()) return { ok: false, error: "empty_claim_label" };
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_contradictions")
    .insert({
      business_id: input.businessId,
      contradiction_type: input.contradictionType,
      severity: input.severity,
      claim_a_label: input.claimALabel.trim(),
      claim_a_fact_id: input.claimAFactId,
      claim_a_evidence_id: input.claimAEvidenceId,
      claim_b_label: input.claimBLabel.trim(),
      claim_b_fact_id: input.claimBFactId,
      claim_b_evidence_id: input.claimBEvidenceId,
      created_by_roster_id: actor.rosterId,
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = String((data as { id: string }).id);
  await writeBookAuditLog(actor, input.businessId, "contradiction_created", "business_contradiction", id, {});
  return { ok: true, id };
}

/** Resolution always requires an explanation and a real staff actor — enforced again here, on top of the DB CHECK. */
export async function resolveContradiction(
  businessId: string,
  contradictionId: string,
  resolution: string,
  resolvedCanonicalFactId: string | null,
  actor: Extract<LivingBookActor, { type: "staff" }>,
): Promise<boolean> {
  const trimmed = resolution.trim();
  if (!trimmed) return false;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("business_contradictions")
    .update({
      status: "resolved",
      resolution: trimmed,
      resolved_canonical_fact_id: resolvedCanonicalFactId,
      resolved_by_roster_id: actor.rosterId,
      resolved_by_auth_user_id: actor.authUserId,
      resolved_by_email: actor.email,
      resolved_by_role: actor.role,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", contradictionId)
    .eq("business_id", businessId);
  if (error) return false;
  await writeBookAuditLog(actor, businessId, "contradiction_resolved", "business_contradiction", contradictionId, {});
  return true;
}

// ---------------------------------------------------------------------------
// Corrections
// ---------------------------------------------------------------------------

function mapCorrectionRow(row: Record<string, unknown>): BusinessCorrection {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    relatedFactId: (row.related_fact_id as string | null) ?? null,
    correctionType: row.correction_type as CorrectionType,
    submittedValue: row.submitted_value,
    submittedDisplayValue: (row.submitted_display_value as string | null) ?? null,
    explanation: (row.explanation as string | null) ?? null,
    status: row.status as BusinessCorrection["status"],
    decisionNote: (row.decision_note as string | null) ?? null,
    decidedByEmail: (row.decided_by_email as string | null) ?? null,
    decidedAt: (row.decided_at as string | null) ?? null,
    submittedActorType: row.submitted_actor_type as "staff" | "owner",
    submittedByEmail: String(row.submitted_by_email),
    createdAt: String(row.created_at),
  };
}

const CORRECTION_COLUMNS =
  "id, business_id, related_fact_id, correction_type, submitted_value, submitted_display_value, explanation, status, decision_note, decided_by_email, decided_at, submitted_actor_type, submitted_by_email, created_at";

export async function listCorrectionsForBusiness(businessId: string): Promise<BusinessCorrection[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_corrections").select(CORRECTION_COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapCorrectionRow);
}

export type SubmitCorrectionInput = {
  businessId: string;
  relatedFactId: string | null;
  correctionType: CorrectionType;
  submittedValue: unknown;
  submittedDisplayValue: string | null;
  explanation: string | null;
};

export async function submitCorrection(input: SubmitCorrectionInput, actor: LivingBookActor): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_corrections")
    .insert({
      business_id: input.businessId,
      related_fact_id: input.relatedFactId,
      correction_type: input.correctionType,
      submitted_value: input.submittedValue,
      submitted_display_value: input.submittedDisplayValue,
      explanation: input.explanation,
      submitted_actor_type: actorType(actor),
      submitted_by_roster_id: actorRosterId(actor),
      submitted_by_auth_user_id: actor.authUserId,
      submitted_by_email: actor.email,
      submitted_by_role: actorRole(actor),
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = String((data as { id: string }).id);
  await writeBookAuditLog(actor, input.businessId, "correction_requested", "business_correction", id, { correction_type: input.correctionType });
  return { ok: true, id };
}

/** Deciding a correction always requires a real staff actor — never decided by the owner themselves. */
export async function decideCorrection(
  businessId: string,
  correctionId: string,
  accept: boolean,
  decisionNote: string | null,
  actor: Extract<LivingBookActor, { type: "staff" }>,
): Promise<boolean> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("business_corrections")
    .update({
      status: accept ? "accepted" : "declined",
      decision_note: decisionNote,
      decided_by_roster_id: actor.rosterId,
      decided_by_auth_user_id: actor.authUserId,
      decided_by_email: actor.email,
      decided_by_role: actor.role,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", correctionId)
    .eq("business_id", businessId);
  if (error) return false;
  await writeBookAuditLog(actor, businessId, accept ? "correction_accepted" : "correction_declined", "business_correction", correctionId, {});
  return true;
}

// ---------------------------------------------------------------------------
// Discovery sessions + answers
// ---------------------------------------------------------------------------

function mapSessionRow(row: Record<string, unknown>): BusinessDiscoverySession {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sessionType: row.session_type as DiscoverySessionType,
    status: row.status as BusinessDiscoverySession["status"],
    language: row.language as "es" | "en",
    consentState: row.consent_state as DiscoveryConsentState,
    facilitatorEmail: (row.facilitator_email as string | null) ?? null,
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    nextUnansweredQuestionKey: (row.next_unanswered_question_key as string | null) ?? null,
    createdByEmail: String(row.created_by_email),
    createdAt: String(row.created_at),
  };
}

const SESSION_COLUMNS =
  "id, business_id, session_type, status, language, consent_state, facilitator_email, started_at, completed_at, summary, next_unanswered_question_key, created_by_email, created_at";

export async function listDiscoverySessionsForBusiness(businessId: string): Promise<BusinessDiscoverySession[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_discovery_sessions").select(SESSION_COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapSessionRow);
}

export type StartDiscoverySessionInput = {
  businessId: string;
  sessionType: DiscoverySessionType;
  language: "es" | "en";
  consentState: DiscoveryConsentState;
};

export async function startDiscoverySession(input: StartDiscoverySessionInput, actor: LivingBookActor): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_discovery_sessions")
    .insert({
      business_id: input.businessId,
      session_type: input.sessionType,
      status: "in_progress",
      language: input.language,
      consent_state: input.consentState,
      started_at: new Date().toISOString(),
      facilitator_actor_type: actorType(actor),
      facilitator_roster_id: actorRosterId(actor),
      facilitator_auth_user_id: actor.authUserId,
      facilitator_email: actor.email,
      facilitator_role: actorRole(actor),
      created_actor_type: actorType(actor),
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = String((data as { id: string }).id);
  await writeBookAuditLog(actor, input.businessId, "discovery_started", "business_discovery_session", id, { session_type: input.sessionType });
  return { ok: true, id };
}

export async function listAnswersForSession(sessionId: string): Promise<BusinessDiscoveryAnswer[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_discovery_answers")
    .select("id, session_id, business_id, question_key, answer_value, answer_text, skipped, created_fact_id, created_unknown_id, actor_email, answered_at")
    .eq("session_id", sessionId)
    .order("answered_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    sessionId: String(row.session_id),
    businessId: String(row.business_id),
    questionKey: String(row.question_key),
    answerValue: row.answer_value,
    answerText: (row.answer_text as string | null) ?? null,
    skipped: Boolean(row.skipped),
    createdFactId: (row.created_fact_id as string | null) ?? null,
    createdUnknownId: (row.created_unknown_id as string | null) ?? null,
    actorEmail: String(row.actor_email),
    answeredAt: String(row.answered_at),
  }));
}

export type RecordAnswerInput = {
  sessionId: string;
  businessId: string;
  questionKey: string;
  answerValue: unknown;
  answerText: string | null;
  skipped: boolean;
  createdFactId: string | null;
  createdUnknownId: string | null;
};

/** Upserts on (session_id, question_key) — re-answering updates the existing row, never duplicates it. */
export async function recordDiscoveryAnswer(input: RecordAnswerInput, actor: LivingBookActor): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_discovery_answers")
    .upsert(
      {
        session_id: input.sessionId,
        business_id: input.businessId,
        question_key: input.questionKey,
        answer_value: input.answerValue,
        answer_text: input.answerText,
        skipped: input.skipped,
        created_fact_id: input.createdFactId,
        created_unknown_id: input.createdUnknownId,
        actor_type: actorType(actor),
        actor_roster_id: actorRosterId(actor),
        actor_auth_user_id: actor.authUserId,
        actor_email: actor.email,
        actor_role: actorRole(actor),
        answered_at: new Date().toISOString(),
      },
      { onConflict: "session_id,question_key" },
    )
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = String((data as { id: string }).id);
  await writeBookAuditLog(actor, input.businessId, "discovery_answer_recorded", "business_discovery_answer", id, { question_key: input.questionKey, skipped: input.skipped });
  return { ok: true, id };
}

export async function completeDiscoverySession(businessId: string, sessionId: string, summary: string | null, actor: LivingBookActor): Promise<boolean> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("business_discovery_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString(), summary, next_unanswered_question_key: null, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("business_id", businessId);
  if (error) return false;
  await writeBookAuditLog(actor, businessId, "discovery_completed", "business_discovery_session", sessionId, {});
  return true;
}

// ---------------------------------------------------------------------------
// Audit history retrieval
// ---------------------------------------------------------------------------

export type BookAuditEntry = {
  id: string;
  action: BookAuditAction;
  recordType: BookAuditRecordType;
  recordId: string | null;
  actorEmail: string;
  actorRole: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function listBookHistory(businessId: string, limit = 100): Promise<BookAuditEntry[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_book_audit_log")
    .select("id, action, record_type, record_id, actor_email, actor_role, metadata, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    action: row.action as BookAuditAction,
    recordType: row.record_type as BookAuditRecordType,
    recordId: (row.record_id as string | null) ?? null,
    actorEmail: String(row.actor_email),
    actorRole: String(row.actor_role),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  }));
}

/**
 * Program 4, Gate 4C/4D — AI Research repository. Server-only, always via getAdminSupabase()
 * (service-role). Terminal research runs (completed/failed/cancelled) are never mutated after
 * creation by any function here — a re-run always creates a new run row. AI output is always
 * draft/inference — this file never writes directly to business_facts; promotion into the Living
 * Business Book happens exclusively through Gate 4D's briefing-review API, which calls the
 * existing Living Book repository functions (upsertFact / addEvidence / createUnknown /
 * createContradiction), never a parallel write path here.
 */
import "server-only";

import { createHash } from "node:crypto";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getLatestConsentState, listSourceLinksForBusiness } from "../fieldDiscovery/repository";
import { isLiveV1Source } from "../fieldDiscovery/sourceRegistry";
import { getDefaultBusinessIntelligenceProvider } from "./providerRegistry";
import { buildAiResearchInputPacket } from "./briefingSynthesis";
import { runWebsiteResearchV1 } from "./websiteAdapter";
import type { AiResearchActor } from "./types";
import type {
  BriefingReviewStatus,
  BusinessAiBriefingDraft,
  BusinessAiResearchRun,
  AiResearchRunStatus,
} from "./types";

function actorType(actor: AiResearchActor): "staff" | "owner" {
  return actor.type;
}
function actorRosterId(actor: AiResearchActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: AiResearchActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

function hashInput(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

const RUN_COLUMNS =
  "id, business_id, provider_key, model_key, template_version, input_snapshot, input_hash, source_link_ids, source_file_ids, status, failure_code, failure_reason, cost_metadata, triggered_actor_type, triggered_by_roster_id, triggered_by_auth_user_id, triggered_by_email, triggered_by_role, created_at, started_at, completed_at";

function mapRunRow(row: Record<string, unknown>): BusinessAiResearchRun {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    providerKey: String(row.provider_key),
    modelKey: String(row.model_key),
    templateVersion: String(row.template_version),
    inputSnapshot: (row.input_snapshot as Record<string, unknown>) ?? {},
    inputHash: String(row.input_hash),
    sourceLinkIds: (row.source_link_ids as string[]) ?? [],
    sourceFileIds: (row.source_file_ids as string[]) ?? [],
    status: row.status as AiResearchRunStatus,
    failureCode: (row.failure_code as string | null) ?? null,
    failureReason: (row.failure_reason as string | null) ?? null,
    costMetadata: (row.cost_metadata as Record<string, unknown>) ?? {},
    triggeredActorType: row.triggered_actor_type as "staff" | "owner",
    triggeredByRosterId: (row.triggered_by_roster_id as string | null) ?? null,
    triggeredByAuthUserId: String(row.triggered_by_auth_user_id),
    triggeredByEmail: String(row.triggered_by_email),
    triggeredByRole: String(row.triggered_by_role),
    createdAt: String(row.created_at),
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

export async function listResearchRunsForBusiness(businessId: string): Promise<BusinessAiResearchRun[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from("business_ai_research_runs").select(RUN_COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapRunRow);
}

const DRAFT_COLUMNS =
  "id, business_id, research_run_id, schema_version, summary_es, summary_en, strengths, opportunities, contradictions, unknowns, limitations, review_status, reviewed_by_roster_id, reviewed_by_auth_user_id, reviewed_by_email, reviewed_by_role, reviewed_at, created_at, updated_at";

function mapDraftRow(row: Record<string, unknown>): BusinessAiBriefingDraft {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    researchRunId: String(row.research_run_id),
    schemaVersion: String(row.schema_version),
    summaryEs: String(row.summary_es),
    summaryEn: String(row.summary_en),
    strengths: (row.strengths as BusinessAiBriefingDraft["strengths"]) ?? [],
    opportunities: (row.opportunities as BusinessAiBriefingDraft["opportunities"]) ?? [],
    contradictions: (row.contradictions as BusinessAiBriefingDraft["contradictions"]) ?? [],
    unknowns: (row.unknowns as BusinessAiBriefingDraft["unknowns"]) ?? [],
    limitations: (row.limitations as string[]) ?? [],
    reviewStatus: row.review_status as BriefingReviewStatus,
    reviewedByRosterId: (row.reviewed_by_roster_id as string | null) ?? null,
    reviewedByAuthUserId: (row.reviewed_by_auth_user_id as string | null) ?? null,
    reviewedByEmail: (row.reviewed_by_email as string | null) ?? null,
    reviewedByRole: (row.reviewed_by_role as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listBriefingDraftsForBusiness(businessId: string): Promise<BusinessAiBriefingDraft[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from("business_ai_briefing_drafts").select(DRAFT_COLUMNS).eq("business_id", businessId).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapDraftRow);
}

export async function getBriefingDraftById(businessId: string, draftId: string): Promise<BusinessAiBriefingDraft | null> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from("business_ai_briefing_drafts").select(DRAFT_COLUMNS).eq("id", draftId).eq("business_id", businessId).maybeSingle();
  if (error || !data) return null;
  return mapDraftRow(data as Record<string, unknown>);
}

export type RunResearchResult =
  | { ok: true; runId: string; draftId: string }
  | { ok: false; error: string };

/**
 * The sole orchestration entry point for Gate 4C. Sequence, in order:
 * 1. exact-business source-link existence + consent checks (fail closed before any provider call);
 * 2. bounded website V1 scan for any `website`-typed live_v1 source link;
 * 3. deterministic input-packet build (no secrets, no unrelated business data);
 * 4. provider call (Gemini only — provider_unavailable is a truthful terminal state, not silently retried);
 * 5. persist the run row (queued -> running -> completed/failed) and, on success, the briefing draft.
 */
export async function runBusinessAiResearch(
  businessId: string,
  businessIdentity: { displayName: string; broadBusinessType: string; businessStage: string },
  actor: AiResearchActor,
): Promise<RunResearchResult> {
  const admin = getAdminSupabase();

  const sourceResearchConsent = await getLatestConsentState(businessId, "source_research");
  if (sourceResearchConsent !== "provided") {
    return { ok: false, error: "consent_not_provided" };
  }
  const aiResearchConsent = await getLatestConsentState(businessId, "ai_research");
  if (aiResearchConsent !== "provided") {
    return { ok: false, error: "consent_not_provided" };
  }

  const sourceLinks = await listSourceLinksForBusiness(businessId);
  if (sourceLinks.length === 0) {
    return { ok: false, error: "source_not_found" };
  }

  const provider = await getDefaultBusinessIntelligenceProvider();
  if (!(await provider.isConfigured())) {
    return { ok: false, error: "provider_unavailable" };
  }

  const websiteSource = sourceLinks.find((s) => isLiveV1Source(s.sourceType));
  const websiteResearch = websiteSource ? await runWebsiteResearchV1(websiteSource.normalizedUrl) : null;

  const packet = buildAiResearchInputPacket({
    businessIdentity,
    ownerStatedGoals: [],
    confirmedFacts: [],
    sourceLinks: sourceLinks.map((s) => ({ sourceType: s.sourceType, url: s.normalizedUrl })),
    fileEvidence: [],
    websiteResearch,
    unknowns: [],
    contradictions: [],
    latestHealthFindings: [],
    capacityReadiness: null,
    languageTarget: "both",
  });

  const inputHash = hashInput(packet);
  const nowIso = new Date().toISOString();

  const { data: runRow, error: runInsertError } = await admin
    .from("business_ai_research_runs")
    .insert({
      business_id: businessId,
      provider_key: provider.providerKey,
      model_key: provider.modelKey,
      template_version: packet.outputSchemaVersion,
      input_snapshot: packet,
      input_hash: inputHash,
      source_link_ids: sourceLinks.map((s) => s.id),
      source_file_ids: [],
      status: "running",
      triggered_actor_type: actorType(actor),
      triggered_by_roster_id: actorRosterId(actor),
      triggered_by_auth_user_id: actor.authUserId,
      triggered_by_email: actor.email,
      triggered_by_role: actorRole(actor),
      started_at: nowIso,
    })
    .select("id")
    .maybeSingle();

  if (runInsertError || !runRow) {
    return { ok: false, error: "run_insert_failed" };
  }
  const runId = String((runRow as { id: string }).id);

  const synthesis = await provider.synthesizeBrief(packet);

  if (!synthesis.ok) {
    await admin
      .from("business_ai_research_runs")
      .update({ status: "failed", failure_code: synthesis.failureCode, failure_reason: synthesis.failureReason, completed_at: new Date().toISOString() })
      .eq("id", runId);
    return { ok: false, error: synthesis.failureCode };
  }

  const { data: draftRow, error: draftInsertError } = await admin
    .from("business_ai_briefing_drafts")
    .insert({
      business_id: businessId,
      research_run_id: runId,
      schema_version: packet.outputSchemaVersion,
      summary_es: synthesis.summaryEs,
      summary_en: synthesis.summaryEn,
      strengths: synthesis.strengths,
      opportunities: synthesis.opportunities,
      contradictions: synthesis.contradictions,
      unknowns: synthesis.unknowns,
      limitations: synthesis.limitations,
      review_status: "draft",
    })
    .select("id")
    .maybeSingle();

  if (draftInsertError || !draftRow) {
    await admin
      .from("business_ai_research_runs")
      .update({ status: "failed", failure_code: "draft_insert_failed", failure_reason: draftInsertError?.message ?? "insert_failed", completed_at: new Date().toISOString() })
      .eq("id", runId);
    return { ok: false, error: "draft_insert_failed" };
  }

  await admin.from("business_ai_research_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", runId);

  return { ok: true, runId, draftId: String((draftRow as { id: string }).id) };
}

export type MarkReviewedResult = { ok: true } | { ok: false; error: string };

export async function markBriefingReviewed(businessId: string, draftId: string, actor: Extract<AiResearchActor, { type: "staff" }>): Promise<MarkReviewedResult> {
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("business_ai_briefing_drafts")
    .update({
      review_status: "staff_reviewed",
      reviewed_by_roster_id: actor.rosterId,
      reviewed_by_auth_user_id: actor.authUserId,
      reviewed_by_email: actor.email,
      reviewed_by_role: actor.role,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("business_id", businessId)
    .eq("review_status", "draft");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export type UpdateDraftItemsInput = {
  strengths?: BusinessAiBriefingDraft["strengths"];
  opportunities?: BusinessAiBriefingDraft["opportunities"];
  contradictions?: BusinessAiBriefingDraft["contradictions"];
  unknowns?: BusinessAiBriefingDraft["unknowns"];
  reviewStatus?: BriefingReviewStatus;
};

/** Persists item-level promotion/rejection status back onto the draft row (repeated-promotion guard lives at the API layer). */
export async function updateDraftItems(businessId: string, draftId: string, patch: UpdateDraftItemsInput): Promise<boolean> {
  const admin = getAdminSupabase();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.strengths) update.strengths = patch.strengths;
  if (patch.opportunities) update.opportunities = patch.opportunities;
  if (patch.contradictions) update.contradictions = patch.contradictions;
  if (patch.unknowns) update.unknowns = patch.unknowns;
  if (patch.reviewStatus) update.review_status = patch.reviewStatus;
  const { error } = await admin.from("business_ai_briefing_drafts").update(update).eq("id", draftId).eq("business_id", businessId);
  return !error;
}

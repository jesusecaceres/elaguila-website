/**
 * LEO-22C feedback repository — service-role only. No delete. No Living Book writes.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { classifyLeoFeedbackFailure } from "@/app/leo/_lib/leoFeedbackClassification";
import type {
  LeoFactCorrectionProposal,
  LeoFeedbackRecord,
  LeoFeedbackSourceRef,
  LeoFeedbackUpsertInput,
} from "@/app/leo/_lib/leoFeedbackTypes";

type FeedbackRow = {
  id: string;
  polarity: string;
  failure_category: string | null;
  failure_class: string | null;
  session_id: string | null;
  leo_turn_id: string | null;
  user_turn_id: string | null;
  local_response_id: string;
  owner_key: string | null;
  request_snapshot: string | null;
  response_snapshot: string | null;
  active_workspace: string | null;
  selected_card_id: string | null;
  selected_entity_ref: string | null;
  presentation_intent_kind: string | null;
  owner_note: string | null;
  expected_destination: string | null;
  source_refs: unknown;
  created_at: string;
  updated_at: string;
};

function mapRow(row: FeedbackRow): LeoFeedbackRecord {
  return {
    id: row.id,
    polarity: row.polarity as LeoFeedbackRecord["polarity"],
    failureCategory: row.failure_category as LeoFeedbackRecord["failureCategory"],
    failureClass: row.failure_class as LeoFeedbackRecord["failureClass"],
    sessionId: row.session_id,
    leoTurnId: row.leo_turn_id,
    userTurnId: row.user_turn_id,
    localResponseId: row.local_response_id,
    ownerKey: row.owner_key,
    requestSnapshot: row.request_snapshot,
    responseSnapshot: row.response_snapshot,
    activeWorkspace: row.active_workspace,
    selectedCardId: row.selected_card_id,
    selectedEntityRef: row.selected_entity_ref,
    presentationIntentKind: row.presentation_intent_kind,
    ownerNote: row.owner_note,
    expectedDestination: row.expected_destination as LeoFeedbackRecord["expectedDestination"],
    sourceRefs: Array.isArray(row.source_refs) ? (row.source_refs as LeoFeedbackSourceRef[]) : [],
    persistenceState: "PERSISTED",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertLeoResponseFeedback(input: {
  ownerKey: string;
  payload: LeoFeedbackUpsertInput;
}): Promise<{ ok: true; record: LeoFeedbackRecord } | { ok: false; error: string }> {
  const db = getAdminSupabase();
  const failureClass = classifyLeoFeedbackFailure(input.payload.failureCategory ?? null);
  const now = new Date().toISOString();
  const row = {
    polarity: input.payload.polarity,
    failure_category: input.payload.failureCategory ?? null,
    failure_class: failureClass,
    session_id: input.payload.sessionId ?? null,
    leo_turn_id: input.payload.leoTurnId ?? null,
    user_turn_id: input.payload.userTurnId ?? null,
    local_response_id: input.payload.localResponseId.slice(0, 120),
    owner_key: input.ownerKey.slice(0, 200),
    request_snapshot: (input.payload.requestSnapshot ?? "").slice(0, 2000) || null,
    response_snapshot: (input.payload.responseSnapshot ?? "").slice(0, 2000) || null,
    active_workspace: input.payload.activeWorkspace ?? null,
    selected_card_id: input.payload.selectedCardId ?? null,
    selected_entity_ref: input.payload.selectedEntityRef ?? null,
    presentation_intent_kind: input.payload.presentationIntentKind ?? null,
    owner_note: (input.payload.ownerNote ?? "").slice(0, 2000) || null,
    expected_destination: input.payload.expectedDestination ?? null,
    source_refs: input.payload.sourceRefs ?? [],
    updated_at: now,
  };

  const { data, error } = await db
    .from("leo_response_feedback")
    .upsert(row, { onConflict: "owner_key,local_response_id" })
    .select()
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "feedback_upsert_failed" };
  }
  return { ok: true, record: mapRow(data as FeedbackRow) };
}

export async function listLeoResponseFeedback(limit = 200): Promise<LeoFeedbackRecord[]> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("leo_response_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(400, Math.max(1, limit)));
  if (error || !data) return [];
  return (data as FeedbackRow[]).map(mapRow);
}

export async function insertLeoFactCorrectionProposal(input: {
  ownerKey: string;
  feedbackId: string | null;
  currentStatement: string | null;
  proposedStatement: string;
  sourceContext: string | null;
}): Promise<{ ok: true; proposal: LeoFactCorrectionProposal } | { ok: false; error: string }> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("leo_fact_correction_proposals")
    .insert({
      feedback_id: input.feedbackId,
      current_statement: (input.currentStatement ?? "").slice(0, 4000) || null,
      proposed_statement: input.proposedStatement.slice(0, 4000),
      source_context: (input.sourceContext ?? "").slice(0, 2000) || null,
      status: "PROPOSED",
      owner_key: input.ownerKey.slice(0, 200),
    })
    .select()
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "correction_insert_failed" };
  }
  return {
    ok: true,
    proposal: {
      id: data.id as string,
      feedbackId: (data.feedback_id as string | null) ?? null,
      currentStatement: (data.current_statement as string | null) ?? null,
      proposedStatement: data.proposed_statement as string,
      sourceContext: (data.source_context as string | null) ?? null,
      status: "PROPOSED",
      createdAt: data.created_at as string,
    },
  };
}

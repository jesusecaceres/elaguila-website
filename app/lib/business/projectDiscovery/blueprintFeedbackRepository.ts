/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — persistence for
 * business_project_blueprint_feedback. Server-only, always via getAdminSupabase(). Mirrors Gate 1's
 * repository.ts business-scoping convention exactly.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { ProjectDiscoveryActor } from "./types";

export type BlueprintFeedbackType = "approved" | "change_requested" | "needs_clarification" | "general";

export interface BlueprintFeedback {
  id: string;
  businessId: string;
  blueprintId: string;
  projectIntentId: string;
  sectionKey: string | null;
  fieldKey: string | null;
  feedbackType: BlueprintFeedbackType;
  feedbackText: string;
  clientApproved: boolean | null;
  sourceMeetingId: string | null;
  linkedCommitmentId: string | null;
  capturedActorType: "staff" | "owner";
  capturedByRosterId: string | null;
  capturedByAuthUserId: string;
  capturedByEmail: string;
  capturedByRole: string;
  createdAt: string;
}

const FEEDBACK_COLUMNS =
  "id, business_id, blueprint_id, project_intent_id, section_key, field_key, feedback_type, feedback_text, client_approved, source_meeting_id, linked_commitment_id, " +
  "captured_actor_type, captured_by_roster_id, captured_by_auth_user_id, captured_by_email, captured_by_role, created_at";

function actorRosterId(actor: ProjectDiscoveryActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}

function mapFeedbackRow(row: Record<string, unknown>): BlueprintFeedback {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    blueprintId: String(row.blueprint_id),
    projectIntentId: String(row.project_intent_id),
    sectionKey: (row.section_key as string | null) ?? null,
    fieldKey: (row.field_key as string | null) ?? null,
    feedbackType: row.feedback_type as BlueprintFeedbackType,
    feedbackText: String(row.feedback_text),
    clientApproved: (row.client_approved as boolean | null) ?? null,
    sourceMeetingId: (row.source_meeting_id as string | null) ?? null,
    linkedCommitmentId: (row.linked_commitment_id as string | null) ?? null,
    capturedActorType: row.captured_actor_type as "staff" | "owner",
    capturedByRosterId: (row.captured_by_roster_id as string | null) ?? null,
    capturedByAuthUserId: String(row.captured_by_auth_user_id),
    capturedByEmail: String(row.captured_by_email),
    capturedByRole: String(row.captured_by_role),
    createdAt: String(row.created_at),
  };
}

export async function listFeedbackForBlueprint(businessId: string, blueprintId: string): Promise<BlueprintFeedback[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_blueprint_feedback")
    .select(FEEDBACK_COLUMNS)
    .eq("business_id", businessId)
    .eq("blueprint_id", blueprintId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapFeedbackRow);
}

export type CaptureFeedbackResult = { ok: true; feedback: BlueprintFeedback } | { ok: false; reason: "insert_failed" };

export async function captureBlueprintFeedback(
  input: {
    businessId: string;
    blueprintId: string;
    projectIntentId: string;
    sectionKey?: string | null;
    fieldKey?: string | null;
    feedbackType: BlueprintFeedbackType;
    feedbackText: string;
    clientApproved?: boolean | null;
    sourceMeetingId?: string | null;
  },
  actor: Extract<ProjectDiscoveryActor, { type: "staff" | "owner" }>,
): Promise<CaptureFeedbackResult> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_blueprint_feedback")
    .insert({
      business_id: input.businessId,
      blueprint_id: input.blueprintId,
      project_intent_id: input.projectIntentId,
      section_key: input.sectionKey ?? null,
      field_key: input.fieldKey ?? null,
      feedback_type: input.feedbackType,
      feedback_text: input.feedbackText,
      client_approved: input.clientApproved ?? null,
      source_meeting_id: input.sourceMeetingId ?? null,
      captured_actor_type: actor.type,
      captured_by_roster_id: actorRosterId(actor),
      captured_by_auth_user_id: actor.authUserId,
      captured_by_email: actor.email,
      captured_by_role: actor.role,
    })
    .select(FEEDBACK_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "insert_failed" };
  return { ok: true, feedback: mapFeedbackRow(data) };
}

export type LinkFeedbackCommitmentResult = { ok: true; feedback: BlueprintFeedback } | { ok: false; reason: "not_found" | "update_failed" };

/** Records the real Promise Keeper commitment a piece of feedback turned into (MD <promise_keeper>) — never fabricated, only ever called after createCommitment() already succeeded. */
export async function linkFeedbackCommitment(businessId: string, feedbackId: string, commitmentId: string): Promise<LinkFeedbackCommitmentResult> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_blueprint_feedback")
    .update({ linked_commitment_id: commitmentId })
    .eq("id", feedbackId)
    .eq("business_id", businessId)
    .select(FEEDBACK_COLUMNS)
    .single();
  if (error) return { ok: false, reason: "update_failed" };
  if (!data) return { ok: false, reason: "not_found" };
  return { ok: true, feedback: mapFeedbackRow(data) };
}

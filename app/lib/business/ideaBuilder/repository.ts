/**
 * TODAY-1 — Idea Builder repository. Server-only, always via getAdminSupabase() (service-role) --
 * business_idea_drafts has zero RLS policies by design. Every function requires authUserId as an
 * explicit argument that callers must derive server-side from a verified bearer token; this
 * module never trusts a caller-supplied id implicitly and always filters by it.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { IdeaDraft, IdeaDraftPatch, ReadinessAnswers } from "./types";

function mapDraftRow(row: Record<string, unknown>): IdeaDraft {
  return {
    id: String(row.id),
    authUserId: String(row.auth_user_id),
    intentId: String(row.intent_id),
    path: row.path as IdeaDraft["path"],
    ideaDescription: (row.idea_description as string | null) ?? null,
    customerDefinition: (row.customer_definition as string | null) ?? null,
    problemDefinition: (row.problem_definition as string | null) ?? null,
    simpleOffer: (row.simple_offer as string | null) ?? null,
    readinessAnswers: (row.readiness_answers as ReadinessAnswers | null) ?? {},
    language: row.language as IdeaDraft["language"],
    status: row.status as IdeaDraft["status"],
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const DRAFT_COLUMNS =
  "id, auth_user_id, intent_id, path, idea_description, customer_definition, problem_definition, simple_offer, readiness_answers, language, status, completed_at, created_at, updated_at";

export async function listOwnIdeaDrafts(authUserId: string): Promise<IdeaDraft[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_idea_drafts")
    .select(DRAFT_COLUMNS)
    .eq("auth_user_id", authUserId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapDraftRow);
}

export async function getOwnIdeaDraft(authUserId: string, intentId: string): Promise<IdeaDraft | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_idea_drafts")
    .select(DRAFT_COLUMNS)
    .eq("auth_user_id", authUserId)
    .eq("intent_id", intentId)
    .maybeSingle();
  if (error || !data) return null;
  return mapDraftRow(data as Record<string, unknown>);
}

/** Upsert one draft step. Never accepts a status transition to "completed" here -- see completeOwnIdeaDraft. */
export async function saveOwnIdeaDraftStep(
  authUserId: string,
  intentId: string,
  patch: IdeaDraftPatch,
): Promise<IdeaDraft | null> {
  const supabase = getAdminSupabase();
  const row: Record<string, unknown> = { auth_user_id: authUserId, intent_id: intentId, updated_at: new Date().toISOString() };
  if (patch.path !== undefined) row.path = patch.path;
  if (patch.ideaDescription !== undefined) row.idea_description = patch.ideaDescription;
  if (patch.customerDefinition !== undefined) row.customer_definition = patch.customerDefinition;
  if (patch.problemDefinition !== undefined) row.problem_definition = patch.problemDefinition;
  if (patch.simpleOffer !== undefined) row.simple_offer = patch.simpleOffer;
  if (patch.readinessAnswers !== undefined) row.readiness_answers = patch.readinessAnswers;
  if (patch.language !== undefined) row.language = patch.language;

  const { data, error } = await supabase
    .from("business_idea_drafts")
    .upsert(row, { onConflict: "auth_user_id,intent_id" })
    .select(DRAFT_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  return mapDraftRow(data as Record<string, unknown>);
}

export async function completeOwnIdeaDraft(authUserId: string, intentId: string): Promise<IdeaDraft | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_idea_drafts")
    .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("auth_user_id", authUserId)
    .eq("intent_id", intentId)
    .select(DRAFT_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  return mapDraftRow(data as Record<string, unknown>);
}

export async function abandonOwnIdeaDraft(authUserId: string, intentId: string): Promise<boolean> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("business_idea_drafts")
    .update({ status: "abandoned", updated_at: new Date().toISOString() })
    .eq("auth_user_id", authUserId)
    .eq("intent_id", intentId);
  return !error;
}

export async function deleteOwnIdeaDraft(authUserId: string, intentId: string): Promise<boolean> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("business_idea_drafts").delete().eq("auth_user_id", authUserId).eq("intent_id", intentId);
  return !error;
}

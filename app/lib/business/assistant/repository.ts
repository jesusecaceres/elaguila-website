/**
 * Program 7 — Contextual Business Concierge Assistant repository.
 * Server-only, always via getAdminSupabase(). Every write requires an AssistantActor.
 * Messages are append-only. Threads are mutable (status only).
 * The assistant never mutates business facts, health map, or any Program 1–6 state.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { validateActionBoundary } from "./logic";
import type {
  BusinessAssistantThread, BusinessAssistantMessage, AssistantActor,
  AssistantContextType, AssistantActionBoundary, AssistantMessageRole,
  AssistantMessageVisibility, AssistantThreadStatus,
} from "./types";

function actorRosterId(actor: AssistantActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: AssistantActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

const THREAD_COLUMNS =
  "id, business_id, status, title_es, title_en, primary_context_type, last_message_at, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at, updated_at";

function mapThreadRow(row: Record<string, unknown>): BusinessAssistantThread {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    status: row.status as AssistantThreadStatus,
    titleEs: (row.title_es as string | null) ?? null,
    titleEn: (row.title_en as string | null) ?? null,
    primaryContextType: row.primary_context_type as AssistantContextType,
    lastMessageAt: (row.last_message_at as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listThreadsForBusiness(businessId: string): Promise<BusinessAssistantThread[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_assistant_threads")
    .select(THREAD_COLUMNS)
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapThreadRow);
}

export async function getThreadById(businessId: string, threadId: string): Promise<BusinessAssistantThread | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_assistant_threads")
    .select(THREAD_COLUMNS)
    .eq("id", threadId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapThreadRow(data);
}

export type CreateThreadInput = {
  titleEs?: string | null;
  titleEn?: string | null;
  primaryContextType: AssistantContextType;
};

export async function createThread(
  businessId: string,
  input: CreateThreadInput,
  actor: AssistantActor,
): Promise<BusinessAssistantThread | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_assistant_threads")
    .insert({
      business_id: businessId,
      status: "active",
      title_es: input.titleEs ?? null,
      title_en: input.titleEn ?? null,
      primary_context_type: input.primaryContextType,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select(THREAD_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapThreadRow(data);
}

export async function archiveThread(
  businessId: string,
  threadId: string,
  _actor: AssistantActor,
): Promise<BusinessAssistantThread | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_assistant_threads")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("business_id", businessId)
    .select(THREAD_COLUMNS)
    .single();
  if (error || !data) return null;
  return mapThreadRow(data);
}

export type AppendMessageInput = {
  role: AssistantMessageRole;
  content: string;
  contextType: AssistantContextType;
  actionBoundary?: AssistantActionBoundary | null;
  visibility: AssistantMessageVisibility;
  sourceReferenceId?: string | null;
};

export async function appendMessage(
  businessId: string,
  threadId: string,
  input: AppendMessageInput,
  actor: AssistantActor,
): Promise<BusinessAssistantMessage | null> {
  if (input.actionBoundary) {
    const validation = validateActionBoundary(input.actionBoundary);
    if (!validation.ok) return null;
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("business_assistant_messages")
    .insert({
      business_id: businessId,
      thread_id: threadId,
      role: input.role,
      content: input.content,
      context_type: input.contextType,
      action_boundary: input.actionBoundary ?? null,
      visibility: input.visibility,
      source_reference_id: input.sourceReferenceId ?? null,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select("*")
    .single();
  if (error || !data) return null;

  await supabase
    .from("business_assistant_threads")
    .update({ last_message_at: now, updated_at: now })
    .eq("id", threadId)
    .eq("business_id", businessId);

  return data as BusinessAssistantMessage;
}

export type AppendSystemMessageInput = {
  content: string;
  contextType: AssistantContextType;
  actionBoundary?: AssistantActionBoundary | null;
  visibility: AssistantMessageVisibility;
};

/**
 * Appends an assistant-authored (role="assistant") message with created_actor_type="system".
 * Used exclusively for provider-generated replies — never for human-authored content.
 */
export async function appendSystemMessage(
  businessId: string,
  threadId: string,
  input: AppendSystemMessageInput,
): Promise<BusinessAssistantMessage | null> {
  if (input.actionBoundary) {
    const validation = validateActionBoundary(input.actionBoundary);
    if (!validation.ok) return null;
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("business_assistant_messages")
    .insert({
      business_id: businessId,
      thread_id: threadId,
      role: "assistant",
      content: input.content,
      context_type: input.contextType,
      action_boundary: input.actionBoundary ?? null,
      visibility: input.visibility,
      source_reference_id: null,
      created_actor_type: "system",
      created_by_roster_id: null,
      created_by_auth_user_id: null,
      created_by_email: null,
      created_by_role: "assistant_provider",
    })
    .select("*")
    .single();
  if (error || !data) return null;

  await supabase
    .from("business_assistant_threads")
    .update({ last_message_at: now, updated_at: now })
    .eq("id", threadId)
    .eq("business_id", businessId);

  return data as BusinessAssistantMessage;
}

export async function listMessagesForThread(businessId: string, threadId: string): Promise<BusinessAssistantMessage[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_assistant_messages")
    .select("*")
    .eq("business_id", businessId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as BusinessAssistantMessage[];
}

export async function listOwnerSafeMessagesForThread(
  businessId: string,
  threadId: string,
): Promise<BusinessAssistantMessage[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_assistant_messages")
    .select("*")
    .eq("business_id", businessId)
    .eq("thread_id", threadId)
    .eq("visibility", "owner_and_staff")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as BusinessAssistantMessage[];
}

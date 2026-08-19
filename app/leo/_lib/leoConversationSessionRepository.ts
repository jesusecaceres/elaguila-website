/**
 * LEO-14.1 conversation session/turn repository — server-only, service-role.
 * Owner isolation enforced on every query. No secrets / Gmail bodies / audio.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type {
  LeoConversationEntityRef,
  LeoConversationLanguage,
  LeoConversationMode,
  LeoConversationRole,
  LeoConversationSession,
  LeoConversationTurn,
} from "@/app/leo/_lib/leoTypes";
import {
  LEO_TURN_RETENTION_DAYS,
  LEO_TURN_TEXT_MAX,
} from "@/app/leo/_lib/leoPersistenceSemantics";

export { LEO_TURN_RETENTION_DAYS, LEO_TURN_TEXT_MAX } from "@/app/leo/_lib/leoPersistenceSemantics";

export const LEO_SESSION_LIST_MAX = 50;
export const LEO_TURN_LIST_MAX = 100;

type SessionRow = {
  id: string;
  owner_auth_user_id: string;
  title: string | null;
  ui_language: string;
  speech_language: string;
  response_language: string;
  mode: string;
  last_active_at: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type TurnRow = {
  id: string;
  session_id: string;
  owner_auth_user_id: string;
  role: string;
  bounded_text: string;
  intent: string | null;
  result_card_refs: unknown;
  selected_entity_refs: unknown;
  receipt_ids: unknown;
  context_refs: unknown;
  created_at: string;
  expires_at: string;
  archived_at: string | null;
};

const SESSION_COLS =
  "id, owner_auth_user_id, title, ui_language, speech_language, response_language, mode, last_active_at, created_at, updated_at, archived_at";

const TURN_COLS =
  "id, session_id, owner_auth_user_id, role, bounded_text, intent, result_card_refs, selected_entity_refs, receipt_ids, context_refs, created_at, expires_at, archived_at";

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean).slice(0, 100);
}

function asEntityRefs(value: unknown): LeoConversationEntityRef[] {
  if (!Array.isArray(value)) return [];
  const out: LeoConversationEntityRef[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const system = nonEmpty(o.system != null ? String(o.system) : null);
    const kind = nonEmpty(o.kind != null ? String(o.kind) : null);
    const id = nonEmpty(o.id != null ? String(o.id) : null);
    if (!system || !kind || !id) continue;
    out.push({
      system,
      kind,
      id,
      label: o.label != null ? String(o.label).slice(0, 200) : undefined,
    });
  }
  return out.slice(0, 50);
}

function asContextRefs(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapSession(row: SessionRow): LeoConversationSession {
  return {
    id: row.id,
    ownerAuthUserId: row.owner_auth_user_id,
    title: row.title,
    uiLanguage: row.ui_language as LeoConversationLanguage,
    speechLanguage: row.speech_language as LeoConversationLanguage,
    responseLanguage: row.response_language as LeoConversationLanguage,
    mode: row.mode as LeoConversationMode,
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapTurn(row: TurnRow): LeoConversationTurn {
  return {
    id: row.id,
    sessionId: row.session_id,
    ownerAuthUserId: row.owner_auth_user_id,
    role: row.role as LeoConversationRole,
    boundedText: row.bounded_text,
    intent: row.intent,
    resultCardRefs: asStringArray(row.result_card_refs),
    selectedEntityRefs: asEntityRefs(row.selected_entity_refs),
    receiptIds: asStringArray(row.receipt_ids),
    contextRefs: asContextRefs(row.context_refs),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    archivedAt: row.archived_at,
  };
}

export type LeoCreateSessionInput = {
  ownerAuthUserId: string;
  title?: string | null;
  uiLanguage?: LeoConversationLanguage;
  speechLanguage?: LeoConversationLanguage;
  responseLanguage?: LeoConversationLanguage;
  mode?: LeoConversationMode;
};

export type LeoAppendTurnInput = {
  sessionId: string;
  ownerAuthUserId: string;
  role: LeoConversationRole;
  boundedText: string;
  intent?: string | null;
  resultCardRefs?: string[];
  selectedEntityRefs?: LeoConversationEntityRef[];
  receiptIds?: string[];
  contextRefs?: Record<string, unknown>;
  /** Override expiry; default now + 60 days. */
  expiresAt?: string | null;
};

export async function createLeoConversationSession(
  input: LeoCreateSessionInput,
): Promise<{ ok: true; session: LeoConversationSession } | { ok: false; error: string }> {
  const owner = nonEmpty(input.ownerAuthUserId);
  if (!owner) return { ok: false, error: "owner_auth_user_id_required" };

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_conversation_sessions")
    .insert({
      owner_auth_user_id: owner,
      title: nonEmpty(input.title ?? null),
      ui_language: input.uiLanguage ?? "en",
      speech_language: input.speechLanguage ?? "auto",
      response_language: input.responseLanguage ?? "auto",
      mode: input.mode ?? "TEXT",
      last_active_at: now,
      created_at: now,
      updated_at: now,
      archived_at: null,
    })
    .select(SESSION_COLS)
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, session: mapSession(data as SessionRow) };
}

export async function getLeoConversationSessionForOwner(
  sessionId: string,
  ownerAuthUserId: string,
): Promise<LeoConversationSession | null> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner || !nonEmpty(sessionId)) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_conversation_sessions")
    .select(SESSION_COLS)
    .eq("id", sessionId)
    .eq("owner_auth_user_id", owner)
    .maybeSingle();
  if (error || !data) return null;
  return mapSession(data as SessionRow);
}

export async function listRecentLeoConversationSessionsForOwner(
  ownerAuthUserId: string,
  limit = LEO_SESSION_LIST_MAX,
): Promise<LeoConversationSession[]> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner) return [];
  const capped = Math.min(Math.max(1, Math.floor(limit)), LEO_SESSION_LIST_MAX);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_conversation_sessions")
    .select(SESSION_COLS)
    .eq("owner_auth_user_id", owner)
    .is("archived_at", null)
    .order("last_active_at", { ascending: false })
    .limit(capped);
  if (error || !data) return [];
  return (data as SessionRow[]).map(mapSession);
}

export async function touchLeoConversationSession(
  sessionId: string,
  ownerAuthUserId: string,
): Promise<LeoConversationSession | null> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner || !nonEmpty(sessionId)) return null;
  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_conversation_sessions")
    .update({ last_active_at: now, updated_at: now })
    .eq("id", sessionId)
    .eq("owner_auth_user_id", owner)
    .is("archived_at", null)
    .select(SESSION_COLS)
    .maybeSingle();
  if (error || !data) return null;
  return mapSession(data as SessionRow);
}

export async function archiveLeoConversationSession(
  sessionId: string,
  ownerAuthUserId: string,
): Promise<LeoConversationSession | null> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner || !nonEmpty(sessionId)) return null;
  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_conversation_sessions")
    .update({ archived_at: now, updated_at: now })
    .eq("id", sessionId)
    .eq("owner_auth_user_id", owner)
    .is("archived_at", null)
    .select(SESSION_COLS)
    .maybeSingle();
  if (error || !data) return null;
  return mapSession(data as SessionRow);
}

export async function updateLeoConversationSessionMode(
  sessionId: string,
  ownerAuthUserId: string,
  mode: LeoConversationMode,
): Promise<LeoConversationSession | null> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner || !nonEmpty(sessionId)) return null;
  if (!["TEXT", "HANDS_FREE", "LOW_ATTENTION"].includes(mode)) return null;
  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_conversation_sessions")
    .update({ mode, last_active_at: now, updated_at: now })
    .eq("id", sessionId)
    .eq("owner_auth_user_id", owner)
    .is("archived_at", null)
    .select(SESSION_COLS)
    .maybeSingle();
  if (error || !data) return null;
  return mapSession(data as SessionRow);
}

export async function appendLeoConversationTurn(
  input: LeoAppendTurnInput,
): Promise<{ ok: true; turn: LeoConversationTurn } | { ok: false; error: string }> {
  const owner = nonEmpty(input.ownerAuthUserId);
  const sessionId = nonEmpty(input.sessionId);
  if (!owner) return { ok: false, error: "owner_auth_user_id_required" };
  if (!sessionId) return { ok: false, error: "session_id_required" };

  const text = input.boundedText?.trim() ?? "";
  if (!text) return { ok: false, error: "bounded_text_required" };
  if (text.length > LEO_TURN_TEXT_MAX) {
    return { ok: false, error: `bounded_text_exceeds_${LEO_TURN_TEXT_MAX}` };
  }

  const session = await getLeoConversationSessionForOwner(sessionId, owner);
  if (!session) return { ok: false, error: "session_not_found_or_not_owned" };
  if (session.archivedAt) return { ok: false, error: "session_archived" };

  const expiresAt =
    nonEmpty(input.expiresAt ?? null) ??
    new Date(Date.now() + LEO_TURN_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_conversation_turns")
    .insert({
      session_id: sessionId,
      owner_auth_user_id: owner,
      role: input.role,
      bounded_text: text,
      intent: nonEmpty(input.intent ?? null)?.slice(0, 80) ?? null,
      result_card_refs: (input.resultCardRefs ?? []).slice(0, 100),
      selected_entity_refs: (input.selectedEntityRefs ?? []).slice(0, 50),
      receipt_ids: (input.receiptIds ?? []).slice(0, 100),
      context_refs: input.contextRefs ?? {},
      expires_at: expiresAt,
      archived_at: null,
    })
    .select(TURN_COLS)
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };

  await touchLeoConversationSession(sessionId, owner);
  return { ok: true, turn: mapTurn(data as TurnRow) };
}

export async function listLeoConversationTurnsForSession(
  sessionId: string,
  ownerAuthUserId: string,
  limit = LEO_TURN_LIST_MAX,
): Promise<LeoConversationTurn[]> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner || !nonEmpty(sessionId)) return [];
  const capped = Math.min(Math.max(1, Math.floor(limit)), LEO_TURN_LIST_MAX);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_conversation_turns")
    .select(TURN_COLS)
    .eq("session_id", sessionId)
    .eq("owner_auth_user_id", owner)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .limit(capped);
  if (error || !data) return [];
  return (data as TurnRow[]).map(mapTurn);
}

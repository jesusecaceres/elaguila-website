/**
 * LEO-14.1 attention acknowledgement repository — server-only.
 * One row per owner + source_kind + source_key (upsert).
 * Never mutates source attention/email/calendar truth.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { LeoAttentionAck, LeoAttentionAckDisposition } from "@/app/leo/_lib/leoTypes";

export const LEO_ACK_LIST_MAX = 200;
export const LEO_ACK_NOTE_MAX = 500;

type Row = {
  id: string;
  owner_auth_user_id: string;
  source_kind: string;
  source_key: string;
  disposition: string;
  snooze_until: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

const COLS =
  "id, owner_auth_user_id, source_kind, source_key, disposition, snooze_until, note, created_at, updated_at, expires_at";

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function mapRow(row: Row): LeoAttentionAck {
  return {
    id: row.id,
    ownerAuthUserId: row.owner_auth_user_id,
    sourceKind: row.source_kind,
    sourceKey: row.source_key,
    disposition: row.disposition as LeoAttentionAckDisposition,
    snoozeUntil: row.snooze_until,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

export type LeoUpsertAckInput = {
  ownerAuthUserId: string;
  sourceKind: string;
  sourceKey: string;
  disposition: LeoAttentionAckDisposition;
  snoozeUntil?: string | null;
  note?: string | null;
  expiresAt?: string | null;
};

export async function upsertLeoAttentionAck(
  input: LeoUpsertAckInput,
): Promise<{ ok: true; ack: LeoAttentionAck } | { ok: false; error: string }> {
  const owner = nonEmpty(input.ownerAuthUserId);
  const sourceKind = nonEmpty(input.sourceKind);
  const sourceKey = nonEmpty(input.sourceKey);
  if (!owner) return { ok: false, error: "owner_required" };
  if (!sourceKind) return { ok: false, error: "source_kind_required" };
  if (!sourceKey) return { ok: false, error: "source_key_required" };
  if (input.disposition === "SNOOZED" && !nonEmpty(input.snoozeUntil ?? null)) {
    return { ok: false, error: "snooze_until_required" };
  }

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_attention_acks")
    .upsert(
      {
        owner_auth_user_id: owner,
        source_kind: sourceKind,
        source_key: sourceKey,
        disposition: input.disposition,
        snooze_until:
          input.disposition === "SNOOZED" ? nonEmpty(input.snoozeUntil ?? null) : null,
        note: nonEmpty(input.note ?? null)?.slice(0, LEO_ACK_NOTE_MAX) ?? null,
        expires_at: nonEmpty(input.expiresAt ?? null),
        updated_at: now,
        created_at: now,
      },
      { onConflict: "owner_auth_user_id,source_kind,source_key" },
    )
    .select(COLS)
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "upsert_failed" };
  return { ok: true, ack: mapRow(data as Row) };
}

export async function getLeoAttentionAckForSource(
  ownerAuthUserId: string,
  sourceKind: string,
  sourceKey: string,
): Promise<LeoAttentionAck | null> {
  const owner = nonEmpty(ownerAuthUserId);
  const kind = nonEmpty(sourceKind);
  const key = nonEmpty(sourceKey);
  if (!owner || !kind || !key) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_attention_acks")
    .select(COLS)
    .eq("owner_auth_user_id", owner)
    .eq("source_kind", kind)
    .eq("source_key", key)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Row);
}

export async function listLeoAttentionAcksForOwner(
  ownerAuthUserId: string,
  limit = LEO_ACK_LIST_MAX,
): Promise<LeoAttentionAck[]> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner) return [];
  const capped = Math.min(Math.max(1, Math.floor(limit)), LEO_ACK_LIST_MAX);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_attention_acks")
    .select(COLS)
    .eq("owner_auth_user_id", owner)
    .order("updated_at", { ascending: false })
    .limit(capped);
  if (error || !data) return [];
  return (data as Row[]).map(mapRow);
}

/**
 * Soft-clear: remove ack row so source may surface again.
 * Does not mutate the underlying attention/email source.
 */
export async function clearLeoAttentionAck(
  ownerAuthUserId: string,
  sourceKind: string,
  sourceKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = nonEmpty(ownerAuthUserId);
  const kind = nonEmpty(sourceKind);
  const key = nonEmpty(sourceKey);
  if (!owner || !kind || !key) return { ok: false, error: "invalid_args" };
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leo_attention_acks")
    .delete()
    .eq("owner_auth_user_id", owner)
    .eq("source_kind", kind)
    .eq("source_key", key);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * LEO FINAL-02 action proposal repository — server-only.
 * Stores the exact proposal content the owner is shown before confirming.
 * See supabase/migrations/20260819223000_leo_final02_connected_action_truth.sql.
 */
import "server-only";

import { randomUUID } from "node:crypto";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { computeLeoActionProposalFingerprint } from "@/app/leo/_lib/leoActionProposalFingerprint";
import type { LeoConnectedActionProposal, LeoToolId } from "@/app/leo/_lib/leoTypes";

export { computeLeoActionProposalFingerprint } from "@/app/leo/_lib/leoActionProposalFingerprint";

const MAX_PROPOSAL_BYTES = 32_768;
const PROPOSAL_TTL_MS = 30 * 60 * 1000;

export type LeoActionProposalRow = {
  id: string;
  actorAuthUserId: string;
  toolId: LeoToolId;
  proposal: LeoConnectedActionProposal;
  fingerprint: string;
  createdAt: string;
  expiresAt: string;
};

type Row = {
  id: string;
  actor_auth_user_id: string;
  tool_id: string;
  proposal: unknown;
  fingerprint: string;
  created_at: string;
  expires_at: string;
};

function mapRow(row: Row): LeoActionProposalRow {
  return {
    id: row.id,
    actorAuthUserId: row.actor_auth_user_id,
    toolId: row.tool_id as LeoToolId,
    proposal: row.proposal as LeoConnectedActionProposal,
    fingerprint: row.fingerprint,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

/**
 * Persist a prepared proposal and return its id + fingerprint. The id becomes
 * the only thing the client carries — never the executable content itself.
 */
export async function createLeoActionProposal(input: {
  actorAuthUserId: string;
  toolId: LeoToolId;
  proposal: LeoConnectedActionProposal;
}): Promise<{ ok: true; id: string; fingerprint: string; expiresAt: string } | { ok: false; error: string }> {
  const actor = input.actorAuthUserId?.trim();
  if (!actor) return { ok: false, error: "actor_required" };

  const serialized = JSON.stringify(input.proposal);
  if (Buffer.byteLength(serialized, "utf8") > MAX_PROPOSAL_BYTES) {
    return { ok: false, error: "proposal_too_large" };
  }

  const fingerprint = computeLeoActionProposalFingerprint(input.proposal);
  const id = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PROPOSAL_TTL_MS).toISOString();

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_action_proposals")
    .insert({
      id,
      actor_auth_user_id: actor,
      tool_id: input.toolId,
      proposal: input.proposal,
      fingerprint,
      created_at: now.toISOString(),
      expires_at: expiresAt,
    })
    .select("id, expires_at")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, id: data.id as string, fingerprint, expiresAt: (data as { expires_at: string }).expires_at };
}

/**
 * Fetch a proposal by id, scoped to the requesting actor. Returns null if not
 * found, owned by someone else, or expired — all three fail closed identically
 * so a caller can't distinguish "not yours" from "doesn't exist" from timing.
 */
export async function getLeoActionProposalForActor(
  id: string,
  actorAuthUserId: string,
): Promise<LeoActionProposalRow | null> {
  const actor = actorAuthUserId?.trim();
  if (!actor || !id?.trim()) return null;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_action_proposals")
    .select("id, actor_auth_user_id, tool_id, proposal, fingerprint, created_at, expires_at")
    .eq("id", id.trim())
    .eq("actor_auth_user_id", actor)
    .maybeSingle();

  if (error || !data) return null;
  const row = mapRow(data as Row);
  if (new Date(row.expiresAt).getTime() <= Date.now()) return null;
  return row;
}

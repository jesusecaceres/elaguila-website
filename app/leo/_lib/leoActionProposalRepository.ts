import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";

import type {
  LeoActionProposal,
  LeoActionProposalActionFamily,
  LeoActionProposalApprovalState,
  LeoActionProposalCreateInput,
  LeoActionProposalGovernanceLevel,
  LeoActionProposalState,
} from "@/app/leo/_lib/leoActionProposalTypes";

type Row = {
  id: string;
  owner_actor_id: string;
  source_session_id: string | null;
  source_turn_id: string | null;
  action_family: string;
  governance_level: string;
  proposal_state: string;
  approval_state: string;
  normalized_target: unknown;
  structured_payload: unknown;
  referent_snapshot: unknown;
  proposal_fingerprint: string;
  execution_claim_key: string;
  linked_receipt_id: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  execution_claimed_at: string | null;
  executed_at: string | null;
  verified_at: string | null;
  failed_at: string | null;
  expires_at: string;
};

const COLS =
  "id, owner_actor_id, source_session_id, source_turn_id, action_family, governance_level, proposal_state, approval_state, normalized_target, structured_payload, referent_snapshot, proposal_fingerprint, execution_claim_key, linked_receipt_id, created_at, updated_at, approved_at, execution_claimed_at, executed_at, verified_at, failed_at, expires_at";

function mapRow(row: Row): LeoActionProposal {
  return {
    proposalId: row.id,
    ownerActorId: row.owner_actor_id,
    sourceSessionId: row.source_session_id,
    sourceTurnId: row.source_turn_id,
    actionFamily: row.action_family as LeoActionProposalActionFamily,
    governanceLevel: row.governance_level as LeoActionProposalGovernanceLevel,
    proposalState: row.proposal_state as LeoActionProposalState,
    approvalState: row.approval_state as LeoActionProposalApprovalState,
    normalizedTarget: row.normalized_target as LeoActionProposal["normalizedTarget"],
    structuredPayload: row.structured_payload as LeoActionProposal["structuredPayload"],
    referentSnapshot: row.referent_snapshot as LeoActionProposal["referentSnapshot"],
    proposalFingerprint: row.proposal_fingerprint,
    executionClaimKey: row.execution_claim_key,
    linkedReceiptId: row.linked_receipt_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    executionClaimedAt: row.execution_claimed_at,
    executedAt: row.executed_at,
    verifiedAt: row.verified_at,
    failedAt: row.failed_at,
    expiresAt: row.expires_at,
  };
}

export async function createLeoActionProposal(
  input: LeoActionProposalCreateInput,
): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_action_proposals")
    .insert({
      owner_actor_id: input.ownerActorId,
      source_session_id: input.sourceSessionId ?? null,
      source_turn_id: input.sourceTurnId ?? null,
      action_family: input.actionFamily,
      governance_level: input.governanceLevel,
      proposal_state: "DRAFT",
      approval_state: "NONE",
      normalized_target: input.normalizedTarget,
      structured_payload: input.structuredPayload,
      referent_snapshot: input.referentSnapshot,
      proposal_fingerprint: input.proposalFingerprint,
      execution_claim_key: input.executionClaimKey,
      linked_receipt_id: null,
      created_at: now,
      updated_at: now,
      approved_at: null,
      execution_claimed_at: null,
      executed_at: null,
      verified_at: null,
      failed_at: null,
      expires_at: input.expiresAt,
    })
    .select(COLS)
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, proposal: mapRow(data as Row) };
}

export async function getLeoActionProposalForOwner(
  proposalId: string,
  ownerActorId: string,
): Promise<LeoActionProposal | null> {
  if (!proposalId || !ownerActorId) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_action_proposals")
    .select(COLS)
    .eq("id", proposalId)
    .eq("owner_actor_id", ownerActorId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Row);
}

/**
 * LEO-21B — Owner list from canonical leo_action_proposals (no second store).
 * Newest first; UI applies governance priority sort for display.
 */
export async function listLeoActionProposalsForOwner(
  ownerActorId: string,
  limit = 40,
): Promise<LeoActionProposal[]> {
  if (!ownerActorId) return [];
  const capped = Math.min(Math.max(1, limit), 80);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_action_proposals")
    .select(COLS)
    .eq("owner_actor_id", ownerActorId)
    .order("created_at", { ascending: false })
    .limit(capped);
  if (error || !data) return [];
  return (data as Row[]).map(mapRow);
}

export async function transitionLeoActionProposalState(
  proposalId: string,
  ownerActorId: string,
  patch: Partial<{
    proposal_state: LeoActionProposalState;
    approval_state: LeoActionProposalApprovalState;
    linked_receipt_id: string | null;
    approved_at: string | null;
    execution_claimed_at: string | null;
    executed_at: string | null;
    verified_at: string | null;
    failed_at: string | null;
    expires_at: string;
  }>,
): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    ...(patch.proposal_state ? { proposal_state: patch.proposal_state } : {}),
    ...(patch.approval_state ? { approval_state: patch.approval_state } : {}),
    ...(Object.prototype.hasOwnProperty.call(patch, "linked_receipt_id")
      ? { linked_receipt_id: patch.linked_receipt_id }
      : {}),
    updated_at: now,
    ...(Object.prototype.hasOwnProperty.call(patch, "approved_at")
      ? { approved_at: patch.approved_at }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(patch, "execution_claimed_at")
      ? { execution_claimed_at: patch.execution_claimed_at }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(patch, "executed_at")
      ? { executed_at: patch.executed_at }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(patch, "verified_at")
      ? { verified_at: patch.verified_at }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(patch, "failed_at")
      ? { failed_at: patch.failed_at }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(patch, "expires_at")
      ? { expires_at: patch.expires_at }
      : {}),
  };

  const { data, error } = await supabase
    .from("leo_action_proposals")
    .update(update)
    .eq("id", proposalId)
    .eq("owner_actor_id", ownerActorId)
    .select(COLS)
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "update_failed" };
  return { ok: true, proposal: mapRow(data as Row) };
}

/**
 * Atomic execution claim primitive:
 * APPROVED → EXECUTION_CLAIMED (only one caller can win).
 */
export async function claimLeoActionProposalExecutionAtomic(input: {
  proposalId: string;
  ownerActorId: string;
}): Promise<
  | { ok: true; proposal: LeoActionProposal }
  | { ok: false; error: "not_claimable" | "expired_or_terminal" | "already_claimed" | string }
> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leo_action_proposals")
    .update({
      proposal_state: "EXECUTION_CLAIMED",
      execution_claimed_at: now,
      updated_at: now,
    })
    .eq("id", input.proposalId)
    .eq("owner_actor_id", input.ownerActorId)
    .eq("proposal_state", "APPROVED")
    .gt("expires_at", now)
    .is("execution_claimed_at", null)
    .select(COLS)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) {
    // No row matched the atomic claim condition; treat as not claimable.
    return { ok: false, error: "already_claimed" };
  }
  return { ok: true, proposal: mapRow(data as Row) };
}

export async function approveLeoActionProposalAtomic(input: {
  proposalId: string;
  ownerActorId: string;
  expectedFingerprint: string;
}): Promise<
  | { ok: true; proposal: LeoActionProposal }
  | { ok: false; error: "not_approvable" | "expired_or_terminal" | "fingerprint_mismatch" | string }
> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leo_action_proposals")
    .update({
      proposal_state: "APPROVED",
      approval_state: "APPROVED",
      approved_at: now,
      updated_at: now,
    })
    .eq("id", input.proposalId)
    .eq("owner_actor_id", input.ownerActorId)
    .eq("proposal_state", "AWAITING_APPROVAL")
    .eq("approval_state", "PENDING")
    .eq("proposal_fingerprint", input.expectedFingerprint)
    .gt("expires_at", now)
    .select(COLS)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) {
    return { ok: false, error: "not_approvable" };
  }
  return { ok: true, proposal: mapRow(data as Row) };
}

export async function cancelLeoActionProposal(
  proposalId: string,
  ownerActorId: string,
): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leo_action_proposals")
    .update({
      proposal_state: "CANCELLED",
      approval_state: "REJECTED",
      updated_at: now,
      // approved/execution/verification timestamps remain monotonic and unchanged.
    })
    .eq("id", proposalId)
    .eq("owner_actor_id", ownerActorId)
    .in("proposal_state", ["DRAFT", "PREPARED", "AWAITING_APPROVAL", "APPROVED"])
    .gt("expires_at", now)
    .select(COLS)
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message ?? "cancel_failed" };
  return { ok: true, proposal: mapRow(data as Row) };
}

/**
 * Future provider path: persist EXECUTED claim truth after provider mutation succeeds.
 * Enforces the state order for proposals.
 */
export async function markLeoActionProposalExecuted(input: {
  proposalId: string;
  ownerActorId: string;
}): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leo_action_proposals")
    .update({
      proposal_state: "EXECUTED",
      executed_at: now,
      updated_at: now,
    })
    .eq("id", input.proposalId)
    .eq("owner_actor_id", input.ownerActorId)
    .eq("proposal_state", "EXECUTION_CLAIMED")
    .gt("expires_at", now)
    .select(COLS)
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message ?? "executed_failed" };
  return { ok: true, proposal: mapRow(data as Row) };
}

/**
 * Future provider path: persist VERIFIED truth only after EXECUTED.
 */
export async function markLeoActionProposalVerified(input: {
  proposalId: string;
  ownerActorId: string;
}): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leo_action_proposals")
    .update({
      proposal_state: "VERIFIED",
      verified_at: now,
      updated_at: now,
    })
    .eq("id", input.proposalId)
    .eq("owner_actor_id", input.ownerActorId)
    .eq("proposal_state", "EXECUTED")
    .gt("expires_at", now)
    .select(COLS)
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message ?? "verified_failed" };
  return { ok: true, proposal: mapRow(data as Row) };
}

/**
 * Future provider path: persist FAILED truth (provider accepted/mutated failed or verify failed).
 */
export async function markLeoActionProposalFailed(input: {
  proposalId: string;
  ownerActorId: string;
}): Promise<{ ok: true; proposal: LeoActionProposal } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leo_action_proposals")
    .update({
      proposal_state: "FAILED",
      failed_at: now,
      updated_at: now,
      approval_state: "REJECTED",
    })
    .eq("id", input.proposalId)
    .eq("owner_actor_id", input.ownerActorId)
    .in("proposal_state", ["EXECUTION_CLAIMED", "EXECUTED", "AWAITING_APPROVAL"])
    .select(COLS)
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message ?? "failed_failed" };
  return { ok: true, proposal: mapRow(data as Row) };
}

/**
 * Expiration helper for background jobs / future verifiers.
 * Expired proposals are no longer claimable/approvable/executable.
 */
export async function expireLeoActionProposals(input: { ownerActorId: string }): Promise<void> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  await supabase
    .from("leo_action_proposals")
    .update({
      proposal_state: "EXPIRED",
      approval_state: "REJECTED",
      updated_at: now,
    })
    .eq("owner_actor_id", input.ownerActorId)
    .lte("expires_at", now)
    .in("proposal_state", ["DRAFT", "PREPARED", "AWAITING_APPROVAL", "APPROVED"])
    .neq("proposal_state", "EXPIRED");
}


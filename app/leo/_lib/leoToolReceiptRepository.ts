/**
 * LEO-14.1 durable tool receipt repository — server-only audit truth.
 * Monotonic timestamps: executed_at / verified_at are never cleared once set.
 * Immutable after create: tool_id, actor, governance_level, requested_payload_summary.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type {
  LeoConversationEntityRef,
  LeoDurableToolReceipt,
  LeoGovernanceLevel,
  LeoToolReceiptApprovalState,
  LeoToolReceiptExecutionState,
  LeoToolReceiptLifecycleState,
  LeoToolReceiptVerificationState,
} from "@/app/leo/_lib/leoTypes";

export const LEO_RECEIPT_LIST_MAX = 100;
export const LEO_RECEIPT_SUMMARY_MAX = 2000;

type Row = {
  id: string;
  correlation_id: string;
  tool_id: string;
  action_type: string;
  actor_auth_user_id: string;
  governance_level: string;
  requested_payload_summary: string;
  preparation_ref: string | null;
  lifecycle_state: string;
  approval_state: string;
  execution_state: string;
  verification_state: string;
  safe_error_class: string | null;
  source_refs: unknown;
  session_id: string | null;
  turn_id: string | null;
  requested_at: string;
  authorized_at: string | null;
  prepared_at: string | null;
  executed_at: string | null;
  verified_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLS =
  "id, correlation_id, tool_id, action_type, actor_auth_user_id, governance_level, requested_payload_summary, preparation_ref, lifecycle_state, approval_state, execution_state, verification_state, safe_error_class, source_refs, session_id, turn_id, requested_at, authorized_at, prepared_at, executed_at, verified_at, failed_at, created_at, updated_at";

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
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
    out.push({ system, kind, id });
  }
  return out.slice(0, 50);
}

function mapRow(row: Row): LeoDurableToolReceipt {
  return {
    id: row.id,
    correlationId: row.correlation_id,
    toolId: row.tool_id,
    actionType: row.action_type,
    actorAuthUserId: row.actor_auth_user_id,
    governanceLevel: row.governance_level as LeoGovernanceLevel,
    requestedPayloadSummary: row.requested_payload_summary,
    preparationRef: row.preparation_ref,
    lifecycleState: row.lifecycle_state as LeoToolReceiptLifecycleState,
    approvalState: row.approval_state as LeoToolReceiptApprovalState,
    executionState: row.execution_state as LeoToolReceiptExecutionState,
    verificationState: row.verification_state as LeoToolReceiptVerificationState,
    safeErrorClass: row.safe_error_class,
    sourceRefs: asEntityRefs(row.source_refs),
    sessionId: row.session_id,
    turnId: row.turn_id,
    requestedAt: row.requested_at,
    authorizedAt: row.authorized_at,
    preparedAt: row.prepared_at,
    executedAt: row.executed_at,
    verifiedAt: row.verified_at,
    failedAt: row.failed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type LeoCreateDurableReceiptInput = {
  correlationId: string;
  toolId: string;
  actionType: string;
  actorAuthUserId: string;
  governanceLevel: LeoGovernanceLevel;
  requestedPayloadSummary: string;
  preparationRef?: string | null;
  sourceRefs?: LeoConversationEntityRef[];
  sessionId?: string | null;
  turnId?: string | null;
};

export async function createLeoDurableToolReceipt(
  input: LeoCreateDurableReceiptInput,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = nonEmpty(input.actorAuthUserId);
  const toolId = nonEmpty(input.toolId);
  const actionType = nonEmpty(input.actionType);
  const correlationId = nonEmpty(input.correlationId);
  const summary = input.requestedPayloadSummary?.trim() ?? "";
  if (!actor) return { ok: false, error: "actor_required" };
  if (!toolId) return { ok: false, error: "tool_id_required" };
  if (!actionType) return { ok: false, error: "action_type_required" };
  if (!correlationId) return { ok: false, error: "correlation_id_required" };
  if (!summary || summary.length > LEO_RECEIPT_SUMMARY_MAX) {
    return { ok: false, error: "payload_summary_invalid" };
  }

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_tool_receipts")
    .insert({
      correlation_id: correlationId,
      tool_id: toolId,
      action_type: actionType,
      actor_auth_user_id: actor,
      governance_level: input.governanceLevel,
      requested_payload_summary: summary,
      preparation_ref: nonEmpty(input.preparationRef ?? null),
      lifecycle_state: "REQUESTED",
      approval_state: "NONE",
      execution_state: "NONE",
      verification_state: "NONE",
      source_refs: input.sourceRefs ?? [],
      session_id: nonEmpty(input.sessionId ?? null),
      turn_id: nonEmpty(input.turnId ?? null),
      requested_at: now,
      created_at: now,
      updated_at: now,
    })
    .select(COLS)
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, receipt: mapRow(data as Row) };
}

export async function getLeoDurableToolReceiptForActor(
  id: string,
  actorAuthUserId: string,
): Promise<LeoDurableToolReceipt | null> {
  const actor = nonEmpty(actorAuthUserId);
  if (!actor || !nonEmpty(id)) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_tool_receipts")
    .select(COLS)
    .eq("id", id)
    .eq("actor_auth_user_id", actor)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Row);
}

export async function getLeoDurableToolReceiptByCorrelation(
  correlationId: string,
  actorAuthUserId: string,
): Promise<LeoDurableToolReceipt | null> {
  const actor = nonEmpty(actorAuthUserId);
  const corr = nonEmpty(correlationId);
  if (!actor || !corr) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_tool_receipts")
    .select(COLS)
    .eq("correlation_id", corr)
    .eq("actor_auth_user_id", actor)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Row);
}

export async function listLeoDurableToolReceiptsForActor(
  actorAuthUserId: string,
  limit = LEO_RECEIPT_LIST_MAX,
): Promise<LeoReceiptListReadResult> {
  const actor = nonEmpty(actorAuthUserId);
  if (!actor) {
    return { availability: "UNAVAILABLE", receipts: [], errorCode: "ACTOR_REQUIRED" };
  }
  const capped = Math.min(Math.max(1, Math.floor(limit)), LEO_RECEIPT_LIST_MAX);
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("leo_tool_receipts")
      .select(COLS)
      .eq("actor_auth_user_id", actor)
      .order("created_at", { ascending: false })
      .limit(capped);
    if (error) {
      const code = String(error.code ?? error.message ?? "query_failed").slice(0, 80);
      const lower = code.toLowerCase();
      const missing =
        lower.includes("does not exist") ||
        lower.includes("42p01") ||
        lower.includes("relation") ||
        lower.includes("undefined_table");
      return {
        availability: "UNAVAILABLE",
        receipts: [],
        errorCode: missing ? "RECEIPT_TABLE_UNAVAILABLE" : "RECEIPT_QUERY_FAILED",
      };
    }
    const receipts = ((data as Row[]) ?? []).map(mapRow);
    if (receipts.length === 0) {
      return { availability: "EMPTY", receipts: [], errorCode: null };
    }
    return { availability: "AVAILABLE", receipts, errorCode: null };
  } catch {
    return {
      availability: "UNAVAILABLE",
      receipts: [],
      errorCode: "RECEIPT_QUERY_FAILED",
    };
  }
}

export type LeoReceiptListAvailability = "AVAILABLE" | "EMPTY" | "UNAVAILABLE";

export type LeoReceiptListReadResult = {
  availability: LeoReceiptListAvailability;
  receipts: LeoDurableToolReceipt[];
  errorCode: string | null;
};

type TransitionPatch = {
  lifecycle_state: LeoToolReceiptLifecycleState;
  approval_state?: LeoToolReceiptApprovalState;
  execution_state?: LeoToolReceiptExecutionState;
  verification_state?: LeoToolReceiptVerificationState;
  preparation_ref?: string | null;
  safe_error_class?: string | null;
  authorized_at?: string | null;
  prepared_at?: string | null;
  executed_at?: string | null;
  verified_at?: string | null;
  failed_at?: string | null;
};

/**
 * Apply a lifecycle transition. Never clears executed_at / verified_at once set.
 * Never rewrites tool_id, actor, governance, or requested_payload_summary.
 */
export async function transitionLeoDurableToolReceipt(
  id: string,
  actorAuthUserId: string,
  patch: TransitionPatch,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const existing = await getLeoDurableToolReceiptForActor(id, actorAuthUserId);
  if (!existing) return { ok: false, error: "not_found" };

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    lifecycle_state: patch.lifecycle_state,
    updated_at: now,
  };
  if (patch.approval_state !== undefined) update.approval_state = patch.approval_state;
  if (patch.execution_state !== undefined) update.execution_state = patch.execution_state;
  if (patch.verification_state !== undefined) update.verification_state = patch.verification_state;
  if (patch.preparation_ref !== undefined) update.preparation_ref = patch.preparation_ref;
  if (patch.safe_error_class !== undefined) update.safe_error_class = patch.safe_error_class;

  // Monotonic timestamps — set only if currently null; never clear.
  if (patch.authorized_at && !existing.authorizedAt) update.authorized_at = patch.authorized_at;
  if (patch.prepared_at && !existing.preparedAt) update.prepared_at = patch.prepared_at;
  if (patch.executed_at) {
    if (existing.executedAt) {
      // keep existing; do not overwrite
    } else {
      update.executed_at = patch.executed_at;
    }
  }
  if (patch.verified_at) {
    if (existing.verifiedAt) {
      // keep existing
    } else {
      update.verified_at = patch.verified_at;
    }
  }
  if (patch.failed_at && !existing.failedAt) update.failed_at = patch.failed_at;

  // Hard reject attempts to clear execution/verification truth via this helper.
  if ("executed_at" in patch && patch.executed_at === null && existing.executedAt) {
    return { ok: false, error: "cannot_clear_executed_at" };
  }
  if ("verified_at" in patch && patch.verified_at === null && existing.verifiedAt) {
    return { ok: false, error: "cannot_clear_verified_at" };
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_tool_receipts")
    .update(update)
    .eq("id", id)
    .eq("actor_auth_user_id", actorAuthUserId.trim())
    .select(COLS)
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message ?? "transition_failed" };
  return { ok: true, receipt: mapRow(data as Row) };
}

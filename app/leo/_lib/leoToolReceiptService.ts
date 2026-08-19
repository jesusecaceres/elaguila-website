/**
 * LEO-14.1 durable tool receipt service — monotonic audit lifecycle.
 * PREPARED ≠ EXECUTED ≠ VERIFIED. FAILED ≠ NOT_EXECUTED.
 * Cannot VERIFIED before EXECUTED. Cannot clear executed/verified truth.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  createLeoDurableToolReceipt,
  getLeoDurableToolReceiptByCorrelation,
  getLeoDurableToolReceiptForActor,
  listLeoDurableToolReceiptsForActor,
  transitionLeoDurableToolReceipt,
  type LeoCreateDurableReceiptInput,
  type LeoReceiptListReadResult,
} from "@/app/leo/_lib/leoToolReceiptRepository";
import type { LeoDurableToolReceipt } from "@/app/leo/_lib/leoTypes";

export type { LeoReceiptListReadResult } from "@/app/leo/_lib/leoToolReceiptRepository";

async function requireActorId(): Promise<string> {
  const access = await requireLeoOwnerAccess();
  const id = access.admin.authUserId?.trim();
  if (!id) throw new Error("LEO access denied: missing_auth_user_id");
  return id;
}

export async function leoCreateToolReceiptRequest(
  input: Omit<LeoCreateDurableReceiptInput, "actorAuthUserId">,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actorAuthUserId = await requireActorId();
  return createLeoDurableToolReceipt({ ...input, actorAuthUserId });
}

export async function leoGetToolReceipt(id: string): Promise<LeoDurableToolReceipt | null> {
  const actorAuthUserId = await requireActorId();
  return getLeoDurableToolReceiptForActor(id, actorAuthUserId);
}

export async function leoGetToolReceiptByCorrelation(
  correlationId: string,
): Promise<LeoDurableToolReceipt | null> {
  const actorAuthUserId = await requireActorId();
  return getLeoDurableToolReceiptByCorrelation(correlationId, actorAuthUserId);
}

export async function leoListRecentToolReceipts(
  limit?: number,
): Promise<LeoReceiptListReadResult> {
  const actorAuthUserId = await requireActorId();
  return listLeoDurableToolReceiptsForActor(actorAuthUserId, limit);
}

export async function leoMarkReceiptAuthorized(
  id: string,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = await requireActorId();
  const existing = await getLeoDurableToolReceiptForActor(id, actor);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.lifecycleState === "CANCELLED") return { ok: false, error: "cancelled" };
  const now = new Date().toISOString();
  return transitionLeoDurableToolReceipt(id, actor, {
    lifecycle_state: "AUTHORIZED",
    approval_state: "APPROVED",
    authorized_at: now,
  });
}

export async function leoMarkReceiptPrepared(
  id: string,
  preparationRef?: string | null,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = await requireActorId();
  const existing = await getLeoDurableToolReceiptForActor(id, actor);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.lifecycleState === "EXECUTED" || existing.lifecycleState === "VERIFIED") {
    return { ok: false, error: "already_executed" };
  }
  if (existing.lifecycleState === "CANCELLED") return { ok: false, error: "cancelled" };
  const now = new Date().toISOString();
  return transitionLeoDurableToolReceipt(id, actor, {
    lifecycle_state: "PREPARED",
    preparation_ref: preparationRef ?? existing.preparationRef,
    prepared_at: now,
  });
}

export async function leoMarkReceiptAwaitingApproval(
  id: string,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = await requireActorId();
  const existing = await getLeoDurableToolReceiptForActor(id, actor);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.lifecycleState !== "PREPARED" && existing.lifecycleState !== "AUTHORIZED") {
    return { ok: false, error: "must_be_prepared_or_authorized" };
  }
  return transitionLeoDurableToolReceipt(id, actor, {
    lifecycle_state: "AWAITING_APPROVAL",
    approval_state: "PENDING",
  });
}

export async function leoMarkReceiptNotExecuted(
  id: string,
  safeErrorClass?: string | null,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = await requireActorId();
  const existing = await getLeoDurableToolReceiptForActor(id, actor);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.executedAt || existing.lifecycleState === "EXECUTED" || existing.lifecycleState === "VERIFIED") {
    return { ok: false, error: "already_executed" };
  }
  return transitionLeoDurableToolReceipt(id, actor, {
    lifecycle_state: "NOT_EXECUTED",
    execution_state: "NOT_EXECUTED",
    safe_error_class: safeErrorClass ?? null,
  });
}

export async function leoMarkReceiptExecuted(
  id: string,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = await requireActorId();
  const existing = await getLeoDurableToolReceiptForActor(id, actor);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.lifecycleState === "CANCELLED") return { ok: false, error: "cancelled" };
  if (existing.lifecycleState === "NOT_EXECUTED") {
    return { ok: false, error: "marked_not_executed" };
  }
  const now = new Date().toISOString();
  return transitionLeoDurableToolReceipt(id, actor, {
    lifecycle_state: "EXECUTED",
    execution_state: "EXECUTED",
    executed_at: now,
  });
}

export async function leoMarkReceiptVerified(
  id: string,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = await requireActorId();
  const existing = await getLeoDurableToolReceiptForActor(id, actor);
  if (!existing) return { ok: false, error: "not_found" };
  if (!existing.executedAt && existing.executionState !== "EXECUTED") {
    return { ok: false, error: "cannot_verify_before_executed" };
  }
  const now = new Date().toISOString();
  return transitionLeoDurableToolReceipt(id, actor, {
    lifecycle_state: "VERIFIED",
    verification_state: "VERIFIED",
    verified_at: now,
  });
}

export async function leoMarkReceiptFailed(
  id: string,
  safeErrorClass?: string | null,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = await requireActorId();
  const existing = await getLeoDurableToolReceiptForActor(id, actor);
  if (!existing) return { ok: false, error: "not_found" };
  // Failure after execution keeps executed_at; lifecycle becomes FAILED.
  const now = new Date().toISOString();
  return transitionLeoDurableToolReceipt(id, actor, {
    lifecycle_state: "FAILED",
    execution_state: existing.executedAt ? existing.executionState : "FAILED",
    safe_error_class: safeErrorClass ?? "FAILED",
    failed_at: now,
  });
}

export async function leoMarkReceiptCancelled(
  id: string,
): Promise<{ ok: true; receipt: LeoDurableToolReceipt } | { ok: false; error: string }> {
  const actor = await requireActorId();
  const existing = await getLeoDurableToolReceiptForActor(id, actor);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.executedAt || existing.lifecycleState === "EXECUTED" || existing.lifecycleState === "VERIFIED") {
    return { ok: false, error: "cannot_cancel_after_executed" };
  }
  return transitionLeoDurableToolReceipt(id, actor, {
    lifecycle_state: "CANCELLED",
    execution_state: "NOT_EXECUTED",
  });
}

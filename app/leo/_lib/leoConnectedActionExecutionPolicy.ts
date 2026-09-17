/**
 * LEO-21A — Pure execution policy helpers (no server-only; fixture-safe).
 */

import { createHash } from "node:crypto";

import type { LeoConnectedActionExecutionResult } from "@/app/leo/_lib/leoConnectedActionExecutionTypes";

/** Deterministic attempt id — observability only; not authorization. */
export function computeLeoConnectedActionAttemptId(input: {
  proposalId: string;
  executionClaimKey: string;
  correlationId: string;
}): string {
  return createHash("sha256")
    .update(
      `leo21a_attempt:${input.proposalId}:${input.executionClaimKey}:${input.correlationId}`,
    )
    .digest("hex")
    .slice(0, 32);
}

/**
 * Blind-resend protection: UNKNOWN_EXTERNAL_OUTCOME requires reconcile/verify first.
 */
export function leoConnectedActionMayBlindRetryExecute(input: {
  priorStatus: LeoConnectedActionExecutionResult["status"] | null;
  priorExternalSideEffectPossible: boolean;
  mode: "execute" | "verify_only";
}): { allowed: boolean; reason: string } {
  if (input.mode === "verify_only") {
    return { allowed: true, reason: "verify_only_path" };
  }
  if (input.priorStatus === "UNKNOWN_EXTERNAL_OUTCOME") {
    return { allowed: false, reason: "unknown_outcome_reconcile_first" };
  }
  if (
    input.priorStatus === "PROVIDER_ACCEPTED" ||
    input.priorStatus === "PROVIDER_ACCEPTED_UNVERIFIED"
  ) {
    return { allowed: false, reason: "provider_accepted_verify_only" };
  }
  if (input.priorStatus === "VERIFIED") {
    return { allowed: false, reason: "already_verified" };
  }
  if (input.priorExternalSideEffectPossible && input.priorStatus === "EXECUTION_STARTED") {
    return { allowed: false, reason: "execution_started_reconcile_first" };
  }
  return { allowed: true, reason: "safe_to_execute" };
}

/**
 * LEO-21A — Provider adapter contract for governed connected actions.
 *
 * Adapters MUST NOT:
 * - approve
 * - claim
 * - change proposal state
 * - change governance
 * - change fingerprint / payload
 * - write receipts directly
 * - declare VERIFIED without verification
 *
 * CAPABILITY ≠ AUTHORITY.
 */

import type { LeoActionProposalActionFamily } from "@/app/leo/_lib/leoActionProposalTypes";
import type {
  LeoConnectedActionExecutionRequest,
  LeoConnectedActionExecutionResult,
} from "@/app/leo/_lib/leoConnectedActionExecutionTypes";

export type LeoConnectedActionProviderAdapter = {
  readonly adapterId: string;

  canHandle(actionFamily: LeoActionProposalActionFamily): boolean;

  /** True when a live provider connection exists for this adapter. */
  isConnected(): Promise<boolean> | boolean;

  /** True when OAuth/scopes permit the write this adapter would perform. */
  hasRequiredScope(): Promise<boolean> | boolean;

  /**
   * Attempt provider mutation for an already-claimed request.
   * Must not approve, claim, or mutate governance/proposal persistence.
   */
  execute(
    request: LeoConnectedActionExecutionRequest,
  ): Promise<LeoConnectedActionExecutionResult>;

  /**
   * Read-back verification only. Must not mutate provider unless already done.
   * Must not declare VERIFIED without proof.
   */
  verify(
    request: LeoConnectedActionExecutionRequest,
    executionResult: LeoConnectedActionExecutionResult,
  ): Promise<LeoConnectedActionExecutionResult>;
};

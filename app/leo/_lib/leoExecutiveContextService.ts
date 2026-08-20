/**
 * LEO-18B — Executive context assembly service.
 *
 * Gathers bounded bags from existing LEO stores (turns, commitments, receipts,
 * optional attention inputs) and returns assembleLeoExecutiveContext output.
 *
 * No provider writes. No OAuth. No second memory/receipt/commitment system.
 * Fail-soft when a store is unavailable — absence does not invent confidence.
 */
import "server-only";

import { leoListCommitments } from "@/app/leo/_lib/leoCommitmentService";
import { leoListRecentToolReceipts } from "@/app/leo/_lib/leoToolReceiptService";
import {
  assembleLeoExecutiveContext,
  LEO_EXECUTIVE_CONTEXT_BOUNDS,
  leoExecutiveContextSnapshot,
  type LeoExecutiveContextAssemblyInput,
  type LeoExecutiveContextAttentionInput,
  type LeoExecutiveContextPackage,
} from "@/app/leo/_lib/leoExecutiveContext";
import type { LeoEntityResolutionResult } from "@/app/leo/_lib/leoEntityResolution";
import type {
  LeoActiveConversationContext,
  LeoCommitment,
  LeoConversationTurn,
  LeoDurableToolReceipt,
} from "@/app/leo/_lib/leoTypes";

export type LeoAssembleExecutiveContextInput = {
  question: string;
  sessionId?: string | null;
  activeContext?: LeoActiveConversationContext | null;
  entityResolution?: LeoEntityResolutionResult | null;
  /** Prefer caller-supplied turns (already bounded in conversation flow). */
  recentTurns?: readonly LeoConversationTurn[];
  /** Optional preloaded bags — skips corresponding live reads. */
  commitments?: readonly LeoCommitment[];
  receipts?: readonly LeoDurableToolReceipt[];
  attentionItems?: readonly LeoExecutiveContextAttentionInput[];
  knownUnknowns?: readonly string[];
  limitations?: readonly string[];
  /** When false, skip live commitment/receipt reads. Default true. */
  fetchStores?: boolean;
};

/**
 * Assemble executive context for a conversation turn.
 * Reuses existing commitment + receipt services only when bags are not preloaded.
 * Does not call Gmail/Calendar adapters or Attention provider fan-out by default
 * (attention must be supplied by caller from existing Attention/EXEC-REPORTS paths).
 */
export async function leoAssembleExecutiveContext(
  input: LeoAssembleExecutiveContextInput,
): Promise<LeoExecutiveContextPackage> {
  const limitations: string[] = [...(input.limitations ?? [])];
  let commitments = input.commitments;
  let receipts = input.receipts;

  if (input.fetchStores !== false) {
    if (commitments === undefined) {
      try {
        const listed = await leoListCommitments({
          status: "OPEN",
          limit: LEO_EXECUTIVE_CONTEXT_BOUNDS.maxCommitments,
        });
        if (listed.availability === "UNAVAILABLE") {
          limitations.push("Commitments store unavailable — not inventing commitments.");
          commitments = [];
        } else {
          commitments = listed.commitments.slice(
            0,
            LEO_EXECUTIVE_CONTEXT_BOUNDS.maxCommitments,
          );
        }
      } catch {
        limitations.push("Commitments read failed — not inventing commitments.");
        commitments = [];
      }
    }

    if (receipts === undefined) {
      try {
        const listed = await leoListRecentToolReceipts(
          LEO_EXECUTIVE_CONTEXT_BOUNDS.maxReceipts,
        );
        if (listed.availability === "UNAVAILABLE") {
          limitations.push("Receipts store unavailable — not inventing receipts.");
          receipts = [];
        } else {
          receipts = listed.receipts.slice(0, LEO_EXECUTIVE_CONTEXT_BOUNDS.maxReceipts);
        }
      } catch {
        limitations.push("Receipts read failed — not inventing receipts.");
        receipts = [];
      }
    }
  } else if (commitments === undefined || receipts === undefined) {
    limitations.push(
      "Store fetch skipped — context uses only supplied bags; absence does not create confidence.",
    );
  }

  const assemblyInput: LeoExecutiveContextAssemblyInput = {
    question: input.question,
    sessionId: input.sessionId,
    activeContext: input.activeContext,
    entityResolution: input.entityResolution,
    recentTurns: input.recentTurns,
    commitments,
    receipts,
    attentionItems: input.attentionItems,
    knownUnknowns: input.knownUnknowns,
    limitations,
    requireBagsForConfidence: true,
  };

  return assembleLeoExecutiveContext(assemblyInput);
}

export { assembleLeoExecutiveContext, leoExecutiveContextSnapshot, LEO_EXECUTIVE_CONTEXT_BOUNDS };

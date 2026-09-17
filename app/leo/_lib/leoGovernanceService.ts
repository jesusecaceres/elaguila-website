/**
 * LEO-6 Governance service — owner-only decision support orchestration.
 *
 * Assess governance, build decision briefs, optionally read Living Book.
 * Never executes. Never auto-writes memory. No external side effects.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { buildLeoDecisionBrief, prepareLeoDecisionMemoryInput } from "@/app/leo/_lib/leoDecisionEngine";
import { assessLeoGovernance, type LeoGovernanceAssessInput } from "@/app/leo/_lib/leoGovernanceEngine";
import { listActiveLeoMemoryForSubject } from "@/app/leo/_lib/leoLivingBookRepository";
import type {
  LeoCreateMemoryInput,
  LeoDecisionBrief,
  LeoDecisionContext,
  LeoGovernanceAssessment,
  LeoMemoryRecord,
} from "@/app/leo/_lib/leoTypes";

export async function getLeoGovernanceAssessment(
  input: LeoGovernanceAssessInput,
): Promise<LeoGovernanceAssessment> {
  await requireLeoOwnerAccess();
  return assessLeoGovernance(input);
}

export async function getLeoDecisionBrief(ctx: LeoDecisionContext): Promise<LeoDecisionBrief> {
  await requireLeoOwnerAccess();
  return buildLeoDecisionBrief(ctx);
}

/**
 * Bounded related memory read for decision context — read only.
 */
export async function getLeoRelatedDecisionMemories(
  subjectType: string,
  subjectKey: string,
): Promise<LeoMemoryRecord[]> {
  await requireLeoOwnerAccess();
  return listActiveLeoMemoryForSubject(subjectType, subjectKey);
}

/**
 * Prepare ACTIVE_DECISION memory input without writing.
 * Caller must use Living Book service explicitly to persist.
 */
export async function prepareLeoDecisionMemoryDraft(
  brief: LeoDecisionBrief,
  subjectKey: string,
): Promise<LeoCreateMemoryInput> {
  await requireLeoOwnerAccess();
  return prepareLeoDecisionMemoryInput(brief, subjectKey);
}

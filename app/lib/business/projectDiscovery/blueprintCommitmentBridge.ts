/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — bridges a CONCRETE promise identified
 * during client review/QA/handoff into a REAL Promise Keeper commitment (MD <promise_keeper>).
 * Mirrors the Growth Solution -> Promise Keeper commitment-request bridge exactly: create the real
 * row in Promise Keeper's own canonical table first, never roll it back, then record the link back
 * on the SOURCE row (feedback or check item) — never a change to Promise Keeper's own closed
 * meetingId/recommendationId/proposalId source fields.
 *
 * Never called merely because a checklist item exists — only when a caller has a real accountable
 * party, a concrete promise, and (when known) a due date (MD: "Commitment requires: accountable
 * party, concrete promise, due date/time if known, provenance").
 */
import "server-only";

import { createCommitment } from "@/app/lib/business/promiseKeeper/repository";
import type { CommitmentActor, ResponsibleParty } from "@/app/lib/business/promiseKeeper/types";
import { linkFeedbackCommitment } from "./blueprintFeedbackRepository";
import { linkCheckItemCommitment } from "./blueprintCheckItemRepository";

export interface CreateBlueprintCommitmentInput {
  businessId: string;
  titleEs: string;
  titleEn: string;
  responsibleParty: ResponsibleParty;
  assignedRosterId?: string | null;
  smallestNextStep?: string | null;
  dueAt?: string | null;
}

export type CreateBlueprintCommitmentResult = { ok: true; commitmentId: string } | { ok: false; reason: string };

async function createRealCommitment(input: CreateBlueprintCommitmentInput, actor: CommitmentActor): Promise<CreateBlueprintCommitmentResult> {
  const result = await createCommitment(
    {
      businessId: input.businessId,
      titleEs: input.titleEs,
      titleEn: input.titleEn,
      responsibleParty: input.responsibleParty,
      assignedRosterId: input.responsibleParty === "staff" ? (input.assignedRosterId ?? null) : null,
      smallestNextStep: input.smallestNextStep ?? null,
      dueAt: input.dueAt ?? null,
      evidenceRequired: false,
    },
    actor,
  );
  if (!result.ok) return { ok: false, reason: result.error };
  return { ok: true, commitmentId: result.commitment.id };
}

export type BridgeFeedbackCommitmentResult = { ok: true; commitmentId: string } | { ok: false; reason: string };

/** Creates the real commitment, then links it back to the feedback row. The commitment is never rolled back if the link write fails — matches every other bridge's own convention. */
export async function createCommitmentFromFeedback(
  businessId: string,
  feedbackId: string,
  input: CreateBlueprintCommitmentInput,
  actor: CommitmentActor,
): Promise<BridgeFeedbackCommitmentResult> {
  const created = await createRealCommitment(input, actor);
  if (!created.ok) return created;
  await linkFeedbackCommitment(businessId, feedbackId, created.commitmentId).catch(() => undefined);
  return { ok: true, commitmentId: created.commitmentId };
}

export type BridgeCheckItemCommitmentResult = { ok: true; commitmentId: string } | { ok: false; reason: string };

export async function createCommitmentFromCheckItem(
  businessId: string,
  checkItemId: string,
  input: CreateBlueprintCommitmentInput,
  actor: CommitmentActor,
): Promise<BridgeCheckItemCommitmentResult> {
  const created = await createRealCommitment(input, actor);
  if (!created.ok) return created;
  await linkCheckItemCommitment(businessId, checkItemId, created.commitmentId).catch(() => undefined);
  return { ok: true, commitmentId: created.commitmentId };
}

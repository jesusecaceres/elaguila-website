/**
 * LEO-14.1 commitment service — owner semantics beyond CRUD.
 * EXTRACTED_CANDIDATE → EXPLICIT_OWNER only via confirm.
 * DUE_SOON / OVERDUE are derived, never persisted.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  cancelLeoCommitment,
  completeLeoCommitment,
  confirmLeoCommitmentCandidate,
  createLeoCommitmentRecord,
  getLeoCommitmentForOwner,
  listLeoCommitmentsForOwner,
  supersedeLeoCommitment,
  type LeoCommitmentListReadResult,
  type LeoCreateCommitmentInput,
} from "@/app/leo/_lib/leoCommitmentRepository";
import type {
  LeoCommitment,
} from "@/app/leo/_lib/leoTypes";
import { deriveLeoCommitmentDueState } from "@/app/leo/_lib/leoPersistenceSemantics";

export { deriveLeoCommitmentDueState } from "@/app/leo/_lib/leoPersistenceSemantics";
export type { LeoCommitmentListReadResult } from "@/app/leo/_lib/leoCommitmentRepository";

async function requireOwnerId(): Promise<string> {
  const access = await requireLeoOwnerAccess();
  const id = access.admin.authUserId?.trim();
  if (!id) throw new Error("LEO access denied: missing_auth_user_id");
  return id;
}

export async function leoCreateExplicitCommitment(
  input: Omit<
    LeoCreateCommitmentInput,
    "ownerAuthUserId" | "kind" | "creationMethod" | "createdBy"
  > & { creationMethod?: "OWNER_UTTERANCE" | "SYSTEM" },
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return createLeoCommitmentRecord({
    ...input,
    ownerAuthUserId,
    kind: "EXPLICIT_OWNER",
    createdBy: "owner",
    creationMethod: input.creationMethod ?? "OWNER_UTTERANCE",
  });
}

export async function leoCreateExtractedCandidate(
  input: Omit<
    LeoCreateCommitmentInput,
    "ownerAuthUserId" | "kind" | "creationMethod" | "createdBy"
  >,
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return createLeoCommitmentRecord({
    ...input,
    ownerAuthUserId,
    kind: "EXTRACTED_CANDIDATE",
    createdBy: "leo",
    creationMethod: "EXTRACTED",
  });
}

export async function leoConfirmCommitmentCandidate(
  id: string,
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return confirmLeoCommitmentCandidate(id, ownerAuthUserId);
}

export async function leoGetCommitment(id: string): Promise<LeoCommitment | null> {
  const ownerAuthUserId = await requireOwnerId();
  return getLeoCommitmentForOwner(id, ownerAuthUserId);
}

export async function leoListCommitments(options?: {
  status?: LeoCommitment["status"];
  kind?: LeoCommitment["kind"];
  limit?: number;
}): Promise<LeoCommitmentListReadResult> {
  const ownerAuthUserId = await requireOwnerId();
  return listLeoCommitmentsForOwner(ownerAuthUserId, options);
}

export async function leoCompleteCommitment(
  id: string,
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return completeLeoCommitment(id, ownerAuthUserId);
}

export async function leoCancelCommitment(
  id: string,
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return cancelLeoCommitment(id, ownerAuthUserId);
}

export async function leoSupersedeCommitment(
  previousId: string,
  replacement: Omit<LeoCreateCommitmentInput, "ownerAuthUserId">,
): Promise<
  | { ok: true; previous: LeoCommitment; replacement: LeoCommitment }
  | { ok: false; error: string }
> {
  const ownerAuthUserId = await requireOwnerId();
  return supersedeLeoCommitment(previousId, { ...replacement, ownerAuthUserId });
}

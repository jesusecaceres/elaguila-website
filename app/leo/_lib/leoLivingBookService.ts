/**
 * LEO-3 Living Leonix Book service — owner_admin boundary above the repository.
 *
 * READING Admin/Reason adapters does NOT write memory.
 * Persistence is always explicit through these service methods.
 */
import "server-only";

import { requireLeoOwnerAccess, type LeoAccessContext } from "@/app/leo/_lib/leoAccess";
import {
  createLeoMemoryRecord,
  getLeoMemoryRecordById,
  listActiveLeoMemoryForSubject,
  listRecentLeoMemoryRecords,
  recordLeoMemoryContradiction,
  supersedeLeoMemoryRecord,
  type LeoCreateMemoryResult,
  type LeoSupersedeMemoryResult,
} from "@/app/leo/_lib/leoLivingBookRepository";
import type {
  LeoCreateMemoryInput,
  LeoMemoryRecord,
  LeoRecordContradictionInput,
  LeoSupersedeMemoryInput,
} from "@/app/leo/_lib/leoTypes";

function actorFromAccess(access: LeoAccessContext) {
  return {
    rosterId: access.admin.rosterMemberId,
    authUserId: access.admin.authUserId,
  };
}

export async function leoCreateMemory(input: LeoCreateMemoryInput): Promise<LeoCreateMemoryResult> {
  const access = await requireLeoOwnerAccess();
  return createLeoMemoryRecord(input, actorFromAccess(access));
}

export async function leoGetMemoryById(id: string): Promise<LeoMemoryRecord | null> {
  await requireLeoOwnerAccess();
  return getLeoMemoryRecordById(id);
}

export async function leoListActiveMemoryForSubject(
  subjectType: string,
  subjectKey: string,
  limit?: number,
): Promise<LeoMemoryRecord[]> {
  await requireLeoOwnerAccess();
  return listActiveLeoMemoryForSubject(subjectType, subjectKey, limit);
}

export async function leoListRecentMemory(limit?: number): Promise<LeoMemoryRecord[]> {
  await requireLeoOwnerAccess();
  return listRecentLeoMemoryRecords(limit);
}

export async function leoSupersedeMemory(input: LeoSupersedeMemoryInput): Promise<LeoSupersedeMemoryResult> {
  const access = await requireLeoOwnerAccess();
  return supersedeLeoMemoryRecord(input, actorFromAccess(access));
}

export async function leoRecordContradiction(
  input: LeoRecordContradictionInput,
): Promise<{ ok: true; left: LeoMemoryRecord; right: LeoMemoryRecord } | { ok: false; error: string }> {
  await requireLeoOwnerAccess();
  return recordLeoMemoryContradiction(input);
}

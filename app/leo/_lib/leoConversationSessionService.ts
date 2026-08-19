/**
 * LEO-14.1 conversation session service — owner_admin boundary.
 * Foundation only: create/resume session, append bounded turns. No UI.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  appendLeoConversationTurn,
  archiveLeoConversationSession,
  createLeoConversationSession,
  getLeoConversationSessionForOwner,
  listLeoConversationTurnsForSession,
  listRecentLeoConversationSessionsForOwner,
  LEO_TURN_RETENTION_DAYS,
  LEO_TURN_TEXT_MAX,
  touchLeoConversationSession,
  updateLeoConversationSessionMode,
  type LeoAppendTurnInput,
  type LeoCreateSessionInput,
} from "@/app/leo/_lib/leoConversationSessionRepository";
import type {
  LeoConversationMode,
  LeoConversationSession,
  LeoConversationTurn,
} from "@/app/leo/_lib/leoTypes";

function ownerIdFromAccess(authUserId: string | null | undefined): string | null {
  const s = authUserId?.trim();
  return s || null;
}

async function requireOwnerId(): Promise<string> {
  const access = await requireLeoOwnerAccess();
  const id = ownerIdFromAccess(access.admin.authUserId);
  if (!id) throw new Error("LEO access denied: missing_auth_user_id");
  return id;
}

/** Strip oversized context blobs — refs only, no Gmail bodies. */
function sanitizeContextRefs(refs: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!refs) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(refs)) {
    if (typeof v === "string") {
      out[k] = v.slice(0, 500);
    } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v.slice(0, 20).map((item) =>
        typeof item === "string" ? item.slice(0, 200) : item,
      );
    }
    // skip nested objects / giant payloads
  }
  return out;
}

export async function leoCreateConversationSession(
  input?: Omit<LeoCreateSessionInput, "ownerAuthUserId">,
): Promise<{ ok: true; session: LeoConversationSession } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  return createLeoConversationSession({ ...input, ownerAuthUserId });
}

export async function leoResumeConversationSession(
  sessionId: string,
): Promise<LeoConversationSession | null> {
  const ownerAuthUserId = await requireOwnerId();
  const session = await getLeoConversationSessionForOwner(sessionId, ownerAuthUserId);
  if (!session || session.archivedAt) return null;
  return touchLeoConversationSession(sessionId, ownerAuthUserId);
}

export async function leoListRecentConversationSessions(): Promise<LeoConversationSession[]> {
  const ownerAuthUserId = await requireOwnerId();
  return listRecentLeoConversationSessionsForOwner(ownerAuthUserId);
}

export async function leoArchiveConversationSession(
  sessionId: string,
): Promise<LeoConversationSession | null> {
  const ownerAuthUserId = await requireOwnerId();
  return archiveLeoConversationSession(sessionId, ownerAuthUserId);
}

export async function leoAppendConversationTurn(
  input: Omit<LeoAppendTurnInput, "ownerAuthUserId">,
): Promise<{ ok: true; turn: LeoConversationTurn } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  const text = input.boundedText?.trim() ?? "";
  if (text.length > LEO_TURN_TEXT_MAX) {
    return { ok: false, error: `bounded_text_exceeds_${LEO_TURN_TEXT_MAX}` };
  }
  return appendLeoConversationTurn({
    ...input,
    ownerAuthUserId,
    boundedText: text,
    contextRefs: sanitizeContextRefs(input.contextRefs),
  });
}

export async function leoListConversationTurns(
  sessionId: string,
  limit?: number,
): Promise<LeoConversationTurn[]> {
  const ownerAuthUserId = await requireOwnerId();
  return listLeoConversationTurnsForSession(sessionId, ownerAuthUserId, limit);
}

export async function leoSetConversationMode(
  sessionId: string,
  mode: LeoConversationMode,
): Promise<LeoConversationSession | null> {
  const ownerAuthUserId = await requireOwnerId();
  return updateLeoConversationSessionMode(sessionId, ownerAuthUserId, mode);
}

export const LEO_CONVERSATION_RETENTION = {
  turnTextDays: LEO_TURN_RETENTION_DAYS,
  turnTextMaxChars: LEO_TURN_TEXT_MAX,
} as const;

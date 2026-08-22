/**
 * LEO-14.1 / 14.6 conversation session service — owner_admin boundary.
 * Create/resume session, append bounded turns, availability-aware fail-open.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  appendLeoConversationTurn,
  archiveLeoConversationSession,
  createLeoConversationSession,
  getLeoConversationSessionForOwner,
  listLeoConversationTurnsForSession,
  listLeoConversationTurnsForSessionDetailed,
  listRecentLeoConversationSessionsForOwner,
  lookupLeoConversationSessionForOwner,
  LEO_ACTIVE_TURN_CONTEXT_MAX,
  LEO_TURN_RETENTION_DAYS,
  LEO_TURN_TEXT_MAX,
  touchLeoConversationSession,
  updateLeoConversationSessionMode,
  type LeoAppendTurnInput,
  type LeoCreateSessionInput,
  type LeoConversationPersistenceAvailability,
} from "@/app/leo/_lib/leoConversationSessionRepository";
import { deriveLeoSessionTitleFromQuestion } from "@/app/leo/_lib/leoConversationContext";
import type {
  LeoConversationMode,
  LeoConversationSession,
  LeoConversationTurn,
  LeoConversationPersistenceState,
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

export type LeoSessionEnsureResult =
  | {
      ok: true;
      session: LeoConversationSession;
      persistenceState: "PERSISTED";
      created: boolean;
    }
  | {
      ok: false;
      error:
        | "session_not_found"
        | "session_archived"
        | "session_unavailable"
        | "persistence_unavailable"
        | "create_failed";
      persistenceState: LeoConversationPersistenceState;
      newSessionRequired?: boolean;
    };

/**
 * Resume owned active session, or create TEXT session when sessionId absent.
 * Invalid/archived/foreign session → explicit failure (no silent new session).
 */
export async function leoEnsureConversationSession(input: {
  sessionId?: string | null;
  firstQuestion?: string | null;
}): Promise<LeoSessionEnsureResult> {
  let ownerAuthUserId: string;
  try {
    ownerAuthUserId = await requireOwnerId();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("missing_auth_user_id")) {
      return {
        ok: false,
        error: "persistence_unavailable",
        persistenceState: "NOT_PERSISTED_UNAVAILABLE",
      };
    }
    throw err;
  }
  const requested = input.sessionId?.trim() || null;

  if (requested) {
    const looked = await lookupLeoConversationSessionForOwner(requested, ownerAuthUserId);
    if (looked.status === "UNAVAILABLE") {
      return {
        ok: false,
        error: "persistence_unavailable",
        persistenceState: "NOT_PERSISTED_UNAVAILABLE",
      };
    }
    if (looked.status === "NOT_FOUND") {
      return {
        ok: false,
        error: "session_not_found",
        persistenceState: "SKIPPED",
        newSessionRequired: true,
      };
    }
    if (looked.status === "ARCHIVED") {
      return {
        ok: false,
        error: "session_archived",
        persistenceState: "SKIPPED",
        newSessionRequired: true,
      };
    }
    const touched = await touchLeoConversationSession(requested, ownerAuthUserId);
    return {
      ok: true,
      session: touched ?? looked.session,
      persistenceState: "PERSISTED",
      created: false,
    };
  }

  const title = input.firstQuestion
    ? deriveLeoSessionTitleFromQuestion(input.firstQuestion)
    : null;
  const created = await createLeoConversationSession({
    ownerAuthUserId,
    title,
    mode: "TEXT",
  });
  if (!created.ok) {
    const unavailable =
      created.availability === "UNAVAILABLE" ||
      created.error === "SESSION_TABLE_UNAVAILABLE";
    return {
      ok: false,
      error: unavailable ? "persistence_unavailable" : "create_failed",
      persistenceState: unavailable ? "NOT_PERSISTED_UNAVAILABLE" : "FAILED",
    };
  }
  return {
    ok: true,
    session: created.session,
    persistenceState: "PERSISTED",
    created: true,
  };
}

export async function leoCreateConversationSession(
  input?: Omit<LeoCreateSessionInput, "ownerAuthUserId">,
): Promise<{ ok: true; session: LeoConversationSession } | { ok: false; error: string }> {
  const ownerAuthUserId = await requireOwnerId();
  const result = await createLeoConversationSession({ ...input, ownerAuthUserId });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, session: result.session };
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
): Promise<
  | { ok: true; turn: LeoConversationTurn; availability: LeoConversationPersistenceAvailability }
  | { ok: false; error: string; availability: LeoConversationPersistenceAvailability }
> {
  const ownerAuthUserId = await requireOwnerId();
  const text = input.boundedText?.trim() ?? "";
  if (text.length > LEO_TURN_TEXT_MAX) {
    return {
      ok: false,
      error: `bounded_text_exceeds_${LEO_TURN_TEXT_MAX}`,
      availability: "AVAILABLE",
    };
  }
  return appendLeoConversationTurn({
    ...input,
    ownerAuthUserId,
    boundedText: text,
    contextRefs: sanitizeContextRefs(input.contextRefs),
  });
}

/**
 * Append USER turn with optional clientRequestId dedupe (contextRefs only — no schema change).
 */
export async function leoAppendUserTurnIdempotent(input: {
  sessionId: string;
  boundedText: string;
  intent?: string | null;
  selectedEntityRefs?: LeoAppendTurnInput["selectedEntityRefs"];
  contextRefs?: Record<string, unknown>;
  clientRequestId?: string | null;
  recentTurns?: LeoConversationTurn[];
}): Promise<
  | {
      ok: true;
      turn: LeoConversationTurn;
      duplicated: boolean;
      availability: LeoConversationPersistenceAvailability;
    }
  | { ok: false; error: string; availability: LeoConversationPersistenceAvailability }
> {
  const clientRequestId = input.clientRequestId?.trim().slice(0, 120) || null;
  if (clientRequestId && input.recentTurns?.length) {
    const existing = [...input.recentTurns].reverse().find((t) => {
      if (t.role !== "USER") return false;
      const id = t.contextRefs?.clientRequestId;
      return typeof id === "string" && id === clientRequestId;
    });
    if (existing) {
      return {
        ok: true,
        turn: existing,
        duplicated: true,
        availability: "AVAILABLE",
      };
    }
  }

  const contextRefs = sanitizeContextRefs({
    ...(input.contextRefs ?? {}),
    ...(clientRequestId ? { clientRequestId } : {}),
  });

  const appended = await leoAppendConversationTurn({
    sessionId: input.sessionId,
    role: "USER",
    boundedText: input.boundedText,
    intent: input.intent,
    selectedEntityRefs: input.selectedEntityRefs,
    contextRefs,
  });
  if (!appended.ok) {
    return { ok: false, error: appended.error, availability: appended.availability };
  }
  return {
    ok: true,
    turn: appended.turn,
    duplicated: false,
    availability: appended.availability,
  };
}

export async function leoListConversationTurns(
  sessionId: string,
  limit?: number,
): Promise<LeoConversationTurn[]> {
  const ownerAuthUserId = await requireOwnerId();
  return listLeoConversationTurnsForSession(sessionId, ownerAuthUserId, limit, {
    activeOnly: true,
  });
}

export async function leoListActiveConversationContextTurns(
  sessionId: string,
  limit = LEO_ACTIVE_TURN_CONTEXT_MAX,
): Promise<{
  availability: LeoConversationPersistenceAvailability;
  turns: LeoConversationTurn[];
}> {
  const ownerAuthUserId = await requireOwnerId();
  const listed = await listLeoConversationTurnsForSessionDetailed(
    sessionId,
    ownerAuthUserId,
    limit,
    { activeOnly: true },
  );
  return { availability: listed.availability, turns: listed.turns };
}

export async function leoGetOwnedConversationSessionHistory(sessionId: string): Promise<
  | {
      ok: true;
      session: LeoConversationSession;
      turns: LeoConversationTurn[];
      availability: LeoConversationPersistenceAvailability;
    }
  | {
      ok: false;
      error: "session_not_found" | "session_archived" | "persistence_unavailable";
    }
> {
  const ownerAuthUserId = await requireOwnerId();
  const looked = await lookupLeoConversationSessionForOwner(sessionId, ownerAuthUserId);
  if (looked.status === "UNAVAILABLE") {
    return { ok: false, error: "persistence_unavailable" };
  }
  if (looked.status === "NOT_FOUND") return { ok: false, error: "session_not_found" };
  if (looked.status === "ARCHIVED") return { ok: false, error: "session_archived" };

  const listed = await listLeoConversationTurnsForSessionDetailed(
    sessionId,
    ownerAuthUserId,
    LEO_ACTIVE_TURN_CONTEXT_MAX,
    { activeOnly: true },
  );
  return {
    ok: true,
    session: looked.session,
    turns: listed.turns,
    availability: listed.availability,
  };
}

export async function leoSetConversationMode(
  sessionId: string,
  mode: LeoConversationMode,
): Promise<
  | { ok: true; session: LeoConversationSession }
  | {
      ok: false;
      error: "session_not_found" | "session_archived" | "persistence_unavailable" | "invalid_mode";
    }
> {
  if (!["TEXT", "HANDS_FREE", "LOW_ATTENTION"].includes(mode)) {
    return { ok: false, error: "invalid_mode" };
  }
  const ownerAuthUserId = await requireOwnerId();
  const looked = await lookupLeoConversationSessionForOwner(sessionId, ownerAuthUserId);
  if (looked.status === "UNAVAILABLE") {
    return { ok: false, error: "persistence_unavailable" };
  }
  if (looked.status === "NOT_FOUND") return { ok: false, error: "session_not_found" };
  if (looked.status === "ARCHIVED") return { ok: false, error: "session_archived" };

  const updated = await updateLeoConversationSessionMode(sessionId, ownerAuthUserId, mode);
  if (!updated) return { ok: false, error: "persistence_unavailable" };
  return { ok: true, session: updated };
}

export const LEO_CONVERSATION_RETENTION = {
  turnTextDays: LEO_TURN_RETENTION_DAYS,
  turnTextMaxChars: LEO_TURN_TEXT_MAX,
  activeContextTurns: LEO_ACTIVE_TURN_CONTEXT_MAX,
} as const;

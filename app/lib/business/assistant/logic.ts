/**
 * Program 7 — Contextual Business Concierge Assistant logic.
 * Pure functions — no I/O, no "server-only" — matching the repo's testable-logic convention.
 *
 * Action boundary enforcement:
 * - AI may only READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, SUGGEST
 * - AI may NOT autonomously update facts, resolve contradictions, approve recommendations,
 *   charge, send messages, or mutate any business state
 */
import type {
  AssistantActionBoundary, AssistantContextType, AssistantMessageRole,
} from "./types";

export const PROHIBITED_ACTIONS: readonly string[] = [
  "UPDATE_FACT", "RESOLVE_CONTRADICTION", "APPROVE_RECOMMENDATION",
  "SEND_MESSAGE", "CHARGE", "CREATE_PAYMENT", "GRANT_ENTITLEMENT",
  "FULFILL", "AUTO_PUBLISH", "DELETE_FACT", "MUTATE_HEALTH_MAP",
];

export function isAllowedAction(action: string): boolean {
  const ALLOWED: readonly string[] = ["READ", "EXPLAIN", "SUMMARIZE", "GUIDE", "DRAFT", "SUGGEST"];
  return ALLOWED.includes(action);
}

export function isProhibitedAction(action: string): boolean {
  return PROHIBITED_ACTIONS.includes(action);
}

export function validateActionBoundary(action: string | null): {
  ok: boolean;
  reason: string | null;
} {
  if (!action) return { ok: true, reason: null };
  if (isProhibitedAction(action)) {
    return { ok: false, reason: `Action ${action} is prohibited — AI may not autonomously mutate business state.` };
  }
  if (!isAllowedAction(action)) {
    return { ok: false, reason: `Action ${action} is not within the allowed boundary.` };
  }
  return { ok: true, reason: null };
}

export function canArchiveThread(status: string): boolean {
  return status === "active";
}

export function canReactivateThread(status: string): boolean {
  return status === "archived";
}

export function isOwnerSafeMessage(visibility: string): boolean {
  return visibility === "owner_and_staff";
}

export function shapeThreadForOwner(thread: {
  id: string;
  status: string;
  titleEs: string | null;
  titleEn: string | null;
  primaryContextType: AssistantContextType;
  lastMessageAt: string | null;
  createdAt: string;
}): {
  id: string;
  status: string;
  titleEs: string | null;
  titleEn: string | null;
  primaryContextType: AssistantContextType;
  lastMessageAt: string | null;
  createdAt: string;
} {
  return {
    id: thread.id,
    status: thread.status,
    titleEs: thread.titleEs,
    titleEn: thread.titleEn,
    primaryContextType: thread.primaryContextType,
    lastMessageAt: thread.lastMessageAt,
    createdAt: thread.createdAt,
  };
}

export function shapeMessageForOwner(message: {
  id: string;
  threadId: string;
  role: AssistantMessageRole;
  content: string;
  contextType: AssistantContextType;
  actionBoundary: AssistantActionBoundary | null;
  createdAt: string;
}): {
  id: string;
  threadId: string;
  role: AssistantMessageRole;
  content: string;
  contextType: AssistantContextType;
  actionBoundary: AssistantActionBoundary | null;
  createdAt: string;
} {
  return {
    id: message.id,
    threadId: message.threadId,
    role: message.role,
    content: message.content,
    contextType: message.contextType,
    actionBoundary: message.actionBoundary,
    createdAt: message.createdAt,
  };
}

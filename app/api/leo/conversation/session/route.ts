/**
 * LEO-14.6 owner-only conversation session history read API.
 * GET ?sessionId=... — load one owned active session + bounded active turns.
 * GET (no sessionId) — recent sessions list (bounded).
 */
import { NextResponse } from "next/server";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import {
  leoGetOwnedConversationSessionHistory,
  leoListRecentConversationSessions,
} from "@/app/leo/_lib/leoConversationSessionService";
import type { LeoConversationSession, LeoConversationTurn } from "@/app/leo/_lib/leoTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function methodNotAllowed() {
  return NextResponse.json(
    { ok: false, error: "method_not_allowed", message: "GET only." },
    { status: 405, headers: { Allow: "GET" } },
  );
}

export async function POST() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

function publicSession(session: LeoConversationSession) {
  return {
    id: session.id,
    title: session.title,
    uiLanguage: session.uiLanguage,
    speechLanguage: session.speechLanguage,
    responseLanguage: session.responseLanguage,
    mode: session.mode,
    lastActiveAt: session.lastActiveAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    archivedAt: session.archivedAt,
  };
}

function publicTurn(turn: LeoConversationTurn) {
  return {
    id: turn.id,
    sessionId: turn.sessionId,
    role: turn.role,
    boundedText: turn.boundedText,
    intent: turn.intent,
    resultCardRefs: turn.resultCardRefs,
    selectedEntityRefs: turn.selectedEntityRefs,
    receiptIds: turn.receiptIds,
    contextRefs: turn.contextRefs,
    createdAt: turn.createdAt,
    expiresAt: turn.expiresAt,
  };
}

export async function GET(req: Request) {
  try {
    const access = await resolveLeoAccess();
    if (!access.allowed) {
      const status = access.reason === "unauthenticated" ? 401 : 403;
      return NextResponse.json(
        { ok: false, error: "forbidden", reason: access.reason },
        { status },
      );
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId")?.trim() || null;
    const recent = url.searchParams.get("recent") === "1";

    if (!sessionId) {
      if (!recent && url.searchParams.has("sessionId") === false) {
        // Empty list endpoint: recent sessions (bounded).
      }
      const sessions = await leoListRecentConversationSessions();
      return NextResponse.json(
        {
          ok: true,
          sessions: sessions.slice(0, 20).map(publicSession),
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (sessionId.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      return NextResponse.json(
        { ok: false, error: "invalid_request", message: "sessionId has invalid shape." },
        { status: 400 },
      );
    }

    const history = await leoGetOwnedConversationSessionHistory(sessionId);
    if (!history.ok) {
      const status = history.error === "persistence_unavailable" ? 503 : 404;
      return NextResponse.json(
        {
          ok: false,
          error: history.error,
          message:
            history.error === "session_archived"
              ? "That conversation was archived."
              : history.error === "persistence_unavailable"
                ? "Conversation history persistence is currently unavailable."
                : "Conversation session not found.",
          newSessionRequired: history.error !== "persistence_unavailable",
        },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        session: publicSession(history.session),
        turns: history.turns.map(publicTurn),
        availability: history.availability,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Session history request failed." },
      { status: 500 },
    );
  }
}

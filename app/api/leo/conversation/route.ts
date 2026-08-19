/**
 * LEO-7 / LEO-14.6 owner-only conversation retrieval API.
 *
 * POST: persistent conversation (session create/resume + turns when available).
 * Evidence-first. No consequential execution from this route alone.
 */
import { NextResponse } from "next/server";

import { LEO_CONVERSATION_BOUNDS, validateLeoConversationRequest } from "@/app/leo/_lib/leoConversationRouter";
import { runLeoPersistentConversation } from "@/app/leo/_lib/leoConversationService";
import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function methodNotAllowed() {
  return NextResponse.json(
    { ok: false, error: "method_not_allowed", message: "POST only." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function GET() {
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

export async function POST(req: Request) {
  try {
    const access = await resolveLeoAccess();
    if (!access.allowed) {
      const status = access.reason === "unauthenticated" ? 401 : 403;
      return NextResponse.json(
        { ok: false, error: "forbidden", reason: access.reason },
        { status },
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "invalid_content_type", message: "application/json required." },
        { status: 415 },
      );
    }

    const rawText = await req.text();
    if (rawText.length > LEO_CONVERSATION_BOUNDS.maxBodyBytes) {
      return NextResponse.json(
        {
          ok: false,
          error: "payload_too_large",
          message: `Body exceeds ${LEO_CONVERSATION_BOUNDS.maxBodyBytes} bytes.`,
        },
        { status: 413 },
      );
    }

    let parsed: unknown;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_json", message: "Malformed JSON." },
        { status: 400 },
      );
    }

    const validated = validateLeoConversationRequest(parsed);
    if (!validated.ok) {
      return NextResponse.json(
        { ok: false, error: validated.error, message: validated.message },
        { status: 400 },
      );
    }

    const result = await runLeoPersistentConversation(validated.request);
    if (!result.ok) {
      const status =
        result.error === "session_not_found" || result.error === "session_archived"
          ? 404
          : 409;
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          message: result.message,
          newSessionRequired: result.newSessionRequired ?? true,
        },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { answer } = result;
    return NextResponse.json(
      {
        ok: true,
        answer,
        sessionId: answer.sessionId ?? null,
        turnId: answer.turnId ?? null,
        userTurnId: answer.userTurnId ?? null,
        persistenceState: answer.persistenceState ?? null,
        conversationContext: answer.conversationContext ?? null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Conversation request failed." },
      { status: 500 },
    );
  }
}

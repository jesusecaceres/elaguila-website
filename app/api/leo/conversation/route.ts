/**
 * LEO-7 owner-only conversation retrieval API.
 *
 * POST only. Evidence-first. No LLM. No consequential execution.
 */
import { NextResponse } from "next/server";

import { LEO_CONVERSATION_BOUNDS, validateLeoConversationRequest } from "@/app/leo/_lib/leoConversationRouter";
import { runLeoConversation } from "@/app/leo/_lib/leoConversationService";
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

    const answer = await runLeoConversation(validated.request);
    return NextResponse.json(
      {
        ok: true,
        answer,
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

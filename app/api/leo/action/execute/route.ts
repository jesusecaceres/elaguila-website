/**
 * LEO FINAL-02 owner-only connected action execution API.
 *
 * POST only. Executes a previously prepared, owner-confirmed Gmail/Calendar
 * action via leoActionExecutionService.ts. No arbitrary tool execution — the
 * request body is a narrow {proposalId, fingerprint, toolId, confirm:true}
 * shape; the executable content (recipient/subject/body/event fields) is
 * never accepted from the client, only fetched server-side by proposalId.
 */
import { NextResponse } from "next/server";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { executeLeoConnectedAction } from "@/app/leo/_lib/leoActionExecutionService";
import { LEO_WRITE_ALLOWLIST } from "@/app/leo/_lib/leoToolRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4096;

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
      return NextResponse.json({ ok: false, error: "forbidden", reason: access.reason }, { status });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "invalid_content_type", message: "application/json required." },
        { status: 415 },
      );
    }

    const rawText = await req.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: "payload_too_large", message: `Body exceeds ${MAX_BODY_BYTES} bytes.` },
        { status: 413 },
      );
    }

    let parsed: unknown;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json", message: "Malformed JSON." }, { status: 400 });
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        { ok: false, error: "invalid_request", message: "JSON object required." },
        { status: 400 },
      );
    }

    const record = parsed as Record<string, unknown>;

    // Reject any client-supplied owner/auth identity outright — actor is
    // always server-derived from the admin session, never the request body.
    if ("ownerAuthUserId" in record || "owner_id" in record || "ownerId" in record || "actorAuthUserId" in record) {
      return NextResponse.json(
        { ok: false, error: "invalid_request", message: "Owner/actor identity is not accepted from the client." },
        { status: 400 },
      );
    }

    const proposalId = typeof record.proposalId === "string" ? record.proposalId.trim() : "";
    const fingerprint = typeof record.fingerprint === "string" ? record.fingerprint.trim() : "";
    const toolId = typeof record.toolId === "string" ? record.toolId.trim() : "";
    const confirm = record.confirm === true;

    if (!proposalId || !/^[0-9a-fA-F-]{8,64}$/.test(proposalId)) {
      return NextResponse.json(
        { ok: false, error: "invalid_request", message: "proposalId has invalid shape." },
        { status: 400 },
      );
    }
    if (!fingerprint || !/^[0-9a-f]{64}$/.test(fingerprint)) {
      return NextResponse.json(
        { ok: false, error: "invalid_request", message: "fingerprint has invalid shape." },
        { status: 400 },
      );
    }
    if (!LEO_WRITE_ALLOWLIST.has(toolId as never)) {
      return NextResponse.json(
        { ok: false, error: "unsupported_action", message: "This action is not available." },
        { status: 400 },
      );
    }
    if (!confirm) {
      return NextResponse.json(
        { ok: false, error: "confirmation_required", message: "Explicit confirm:true is required." },
        { status: 400 },
      );
    }

    const result = await executeLeoConnectedAction({ proposalId, fingerprint, toolId });

    const status =
      result.state === "SUCCEEDED"
        ? 200
        : result.state === "DENIED"
          ? 403
          : result.state === "UNAVAILABLE"
            ? 503
            : result.state === "DUPLICATE_REPLAY"
              ? 409
              : result.state === "AMBIGUOUS"
                ? 409
                : 422; // FAILED

    return NextResponse.json({ ok: result.state === "SUCCEEDED", result }, { status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Action execution request failed." },
      { status: 500 },
    );
  }
}

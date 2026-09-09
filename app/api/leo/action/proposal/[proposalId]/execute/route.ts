/**
 * LEO-21E.1 — Owner-only governed action EXECUTE route.
 *
 * POST { expectedFingerprint } only.
 * Calls leoExecuteGovernedConnectedAction — never the provider adapter directly.
 * CAPABILITY ≠ AUTHORITY — adapter still fail-closed when write flag / scope absent.
 * Current default configuration cannot send.
 */
import { NextResponse } from "next/server";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { leoExecuteGovernedConnectedAction } from "@/app/leo/_lib/leoConnectedActionExecutionService";

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
export async function DELETE() {
  return methodNotAllowed();
}
export async function PATCH() {
  return methodNotAllowed();
}

export async function POST(
  req: Request,
  { params }: { params: { proposalId: string } },
) {
  const access = await resolveLeoAccess();
  if (!access.allowed) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    return NextResponse.json({ ok: false, error: "forbidden", reason: access.reason }, { status });
  }

  const proposalId =
    typeof params.proposalId === "string" ? params.proposalId.trim() : "";
  if (!proposalId) {
    return NextResponse.json(
      { ok: false, error: "proposal_id_required" },
      { status: 400 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { ok: false, error: "invalid_content_type", message: "application/json required." },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  // Reject arbitrary execution payload keys (recipient/body/thread/provider/etc.).
  const allowedKeys = new Set(["expectedFingerprint"]);
  const extra = Object.keys(raw).filter((k) => !allowedKeys.has(k));
  if (extra.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "arbitrary_payload_rejected",
        message: "Only expectedFingerprint is accepted.",
      },
      { status: 400 },
    );
  }

  const expectedFingerprint =
    typeof raw.expectedFingerprint === "string" ? raw.expectedFingerprint.trim() : "";
  if (!expectedFingerprint) {
    return NextResponse.json(
      { ok: false, error: "expected_fingerprint_required" },
      { status: 400 },
    );
  }

  try {
    const result = await leoExecuteGovernedConnectedAction({
      proposalId,
      expectedFingerprint,
      mode: "execute",
    });

    return NextResponse.json(
      {
        ok: true,
        result: {
          status: result.status,
          providerType: result.providerType,
          providerObjectId: result.providerObjectId,
          safeFailureClass: result.safeFailureClass,
          retryClass: result.retryClass,
          verificationState: result.verificationState,
          externalSideEffectPossible: result.externalSideEffectPossible,
          externalSideEffectConfirmed: result.externalSideEffectConfirmed,
          warnings: result.warnings,
          proposalStateAfter: result.proposalStateAfter,
          attemptId: result.attemptId,
          proposalId: result.proposalId,
          // Safe metadata only — never tokens.
          safeMetadata: result.safeMetadata ?? null,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

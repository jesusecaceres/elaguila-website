/**
 * LEO-17A owner-only approval/cancel route for governed action proposals.
 *
 * This route is intentionally NOT the provider execution route.
 * It performs only durable governance transitions + receipt lifecycle updates.
 */
import { NextResponse } from "next/server";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import {
  leoApproveGovernedActionProposal,
  leoCancelGovernedActionProposal,
  leoGetGovernedActionProposalForOwner,
} from "@/app/leo/_lib/leoActionProposalService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function methodNotAllowed() {
  return NextResponse.json(
    { ok: false, error: "method_not_allowed", message: "POST/GET only." },
    { status: 405 },
  );
}

export async function GET(
  _req: Request,
  { params }: { params: { proposalId: string } },
) {
  const access = await resolveLeoAccess();
  if (!access.allowed) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    return NextResponse.json({ ok: false, error: "forbidden", reason: access.reason }, { status });
  }

  try {
    const res = await leoGetGovernedActionProposalForOwner({ proposalId: params.proposalId });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 404 });
    }
    return NextResponse.json({ ok: true, proposal: res.proposal }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function PUT() {
  return methodNotAllowed();
}
export async function DELETE() {
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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const b = body as { action?: string; expectedFingerprint?: unknown };
  if (b.action !== "approve" && b.action !== "cancel") {
    return NextResponse.json(
      { ok: false, error: "invalid_action", message: "action must be approve or cancel." },
      { status: 400 },
    );
  }

  if (b.action === "approve") {
    const expectedFingerprint = typeof b.expectedFingerprint === "string" ? b.expectedFingerprint : "";
    if (!expectedFingerprint) {
      return NextResponse.json(
        { ok: false, error: "expected_fingerprint_required" },
        { status: 400 },
      );
    }

    const res = await leoApproveGovernedActionProposal({
      proposalId: params.proposalId,
      expectedFingerprint,
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 409 });
    }
    return NextResponse.json({ ok: true, proposal: res.proposal }, { status: 200 });
  }

  const res = await leoCancelGovernedActionProposal({ proposalId: params.proposalId });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, proposal: res.proposal }, { status: 200 });
}


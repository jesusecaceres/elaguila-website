/**
 * LEO-21B — Owner-only list of governed action proposals (canonical store).
 * GET only. Approve/cancel remain on /api/leo/action/proposal/[proposalId].
 */
import { NextResponse } from "next/server";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { leoListGovernedActionProposalCardsForOwner } from "@/app/leo/_lib/leoActionProposalService";

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
export async function DELETE() {
  return methodNotAllowed();
}
export async function PATCH() {
  return methodNotAllowed();
}

export async function GET() {
  const access = await resolveLeoAccess();
  if (!access.allowed) {
    const status = access.reason === "unauthenticated" ? 401 : 403;
    return NextResponse.json({ ok: false, error: "forbidden", reason: access.reason }, { status });
  }

  try {
    const res = await leoListGovernedActionProposalCardsForOwner({ limit: 40 });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 500 });
    }
    return NextResponse.json(
      {
        ok: true,
        cards: res.cards,
        capability: res.capability,
        limitations: [
          "Approval does not execute. Execute requires two-key capability (write flag + proven gmail.send).",
          "CAPABILITY ≠ AUTHORITY.",
        ],
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

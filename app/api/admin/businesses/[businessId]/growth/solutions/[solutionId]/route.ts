/**
 * Business Development & Growth Engine, Gate C — transition a solution's state.
 * Every transition is validated against isValidGrowthSolutionTransition (Gate A) — an invalid
 * jump (e.g. complete -> suggested) is rejected, never silently applied.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { updateGrowthSolutionState } from "@/app/lib/business/growthEngine/repository";
import type { GrowthSolutionState } from "@/app/lib/business/growthEngine/types";

export const runtime = "nodejs";

const VALID_STATES: readonly GrowthSolutionState[] = ["suggested", "reviewed", "approved", "dismissed", "in_progress", "complete"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; solutionId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_solutions");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, solutionId } = await params;
  const body = (await req.json().catch(() => ({}))) as { state?: unknown; reviewNote?: unknown };
  if (typeof body.state !== "string" || !(VALID_STATES as readonly string[]).includes(body.state)) {
    return NextResponse.json({ ok: false, error: "bad_state" }, { status: 400 });
  }
  const reviewNote = typeof body.reviewNote === "string" && body.reviewNote.trim() ? body.reviewNote.trim() : null;

  const result = await updateGrowthSolutionState(businessId, solutionId, body.state as GrowthSolutionState, access.actor, reviewNote);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : result.reason === "invalid_transition" ? 409 : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true, solution: result.solution });
}

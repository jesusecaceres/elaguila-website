import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToHealthMapActor } from "@/app/admin/_lib/healthMapActor";
import { getFullRun, markHumanReview } from "@/app/lib/business/healthMap/repository";
import { MAX_HUMAN_REVIEW_NOTE_LENGTH } from "@/app/lib/business/healthMap/constants";

export const dynamic = "force-dynamic";

/** GET — one specific historical run's full, unchanged detail (never mutated after creation). */
export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string; runId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_health_map")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId, runId } = await ctx.params;
  const full = await getFullRun(runId);
  if (!full || full.run.businessId !== businessId) return NextResponse.json({ ok: false, error: "run_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, run: full.run, dimensionResults: full.dimensionResults, findings: full.findings, readiness: full.readiness });
}

/** PATCH — mark (or unmark) human review on this run's readiness gate. Never rewrites the computed conclusion itself. */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string; runId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "mark_health_human_review")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId, runId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  if (typeof b.required !== "boolean") return NextResponse.json({ ok: false, error: "missing_required_flag" }, { status: 400 });
  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, MAX_HUMAN_REVIEW_NOTE_LENGTH) : null;

  const full = await getFullRun(runId);
  if (!full || full.run.businessId !== businessId) return NextResponse.json({ ok: false, error: "run_not_found" }, { status: 404 });

  const success = await markHumanReview(full.readiness.id, b.required, note, staffActorToHealthMapActor(access.actor));
  if (!success) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

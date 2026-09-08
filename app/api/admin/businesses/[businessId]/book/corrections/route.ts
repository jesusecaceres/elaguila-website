import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { decideCorrection, submitCorrection } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

/** POST — staff clarification request. (Owner-submitted corrections go through the entrepreneur-facing route, not this staff-only one.) */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "create_business_fact")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const explanation = typeof b.explanation === "string" && b.explanation.trim() ? b.explanation.trim() : null;
  const relatedFactId = typeof b.relatedFactId === "string" && b.relatedFactId.trim() ? b.relatedFactId : null;

  const result = await submitCorrection(
    { businessId, relatedFactId, correctionType: "staff_clarification_request", submittedValue: null, submittedDisplayValue: null, explanation },
    staffActorToLivingBookActor(access.actor),
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}

/** PATCH — decide (accept/decline) a pending correction. Requires review_owner_corrections (manager+). */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "review_owner_corrections")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const correctionId = typeof b.correctionId === "string" ? b.correctionId : "";
  if (!correctionId) return NextResponse.json({ ok: false, error: "missing_correction_id" }, { status: 400 });
  if (b.action !== "accept" && b.action !== "decline") return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  const decisionNote = typeof b.decisionNote === "string" && b.decisionNote.trim() ? b.decisionNote.trim() : null;

  const success = await decideCorrection(businessId, correctionId, b.action === "accept", decisionNote, staffActorToLivingBookActor(access.actor));
  if (!success) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

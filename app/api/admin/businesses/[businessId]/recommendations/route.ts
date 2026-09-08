import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToStewardshipActor } from "@/app/admin/_lib/stewardshipActor";
import { createNextRightMove, listRecommendationsForBusiness, listTestsForRecommendation } from "@/app/lib/business/stewardship/repository";

export const dynamic = "force-dynamic";

/** GET — the full recommendation workspace: recommendation history + the current one's six tests. */
export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_recommendations")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  const recommendations = await listRecommendationsForBusiness(businessId);
  const current = recommendations.find((r) => r.isCurrent) ?? null;
  const currentTests = current ? await listTestsForRecommendation(current.id) : [];

  return NextResponse.json({ ok: true, businessId, recommendations, current, currentTests });
}

/** POST — evaluate/create the current Next Right Move. The hard readiness gate lives entirely in
 * the repository; this route never accepts a bypass/force parameter of any kind. */
export async function POST(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "create_recommendation")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  const actor = staffActorToStewardshipActor(access.actor);
  const result = await createNextRightMove(actor, businessId);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 409 });
  return NextResponse.json({ ok: true, recommendation: result.recommendation, rejected: result.rejected }, { status: result.recommendation ? 201 : 200 });
}

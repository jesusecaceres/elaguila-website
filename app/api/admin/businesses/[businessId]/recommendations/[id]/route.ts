import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import {
  approveRecommendation, getRecommendationById, listOverridesForRecommendation, listTestsForRecommendation,
  shareRecommendation, submitForReview,
} from "@/app/lib/business/stewardship/repository";
import { staffActorToStewardshipActor } from "@/app/admin/_lib/stewardshipActor";

export const dynamic = "force-dynamic";

/** GET — one recommendation's full staff detail: content, six tests, override history. */
export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string; id: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_recommendations")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId, id } = await ctx.params;

  const recommendation = await getRecommendationById(businessId, id);
  if (!recommendation) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const [tests, overrides] = await Promise.all([listTestsForRecommendation(id), listOverridesForRecommendation(id)]);
  return NextResponse.json({ ok: true, recommendation, tests, overrides });
}

type PatchBody = { action?: unknown };

/** PATCH — body: {action: "submit_for_review" | "approve" | "share"}. approve/share require
 * approve_recommendation; submit_for_review only requires create_recommendation (proposing for
 * review is not itself an approval). */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string; id: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  const { businessId, id } = await ctx.params;

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";

  if (action === "submit_for_review") {
    if (!actorHasCapability(access.actor, "create_recommendation")) return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
    const result = await submitForReview(businessId, id);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
    return NextResponse.json({ ok: true, recommendation: result.recommendation });
  }

  if (action === "approve") {
    if (!actorHasCapability(access.actor, "approve_recommendation")) return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
    const actor = staffActorToStewardshipActor(access.actor);
    const result = await approveRecommendation(actor, businessId, id);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
    return NextResponse.json({ ok: true, recommendation: result.recommendation });
  }

  if (action === "share") {
    if (!actorHasCapability(access.actor, "approve_recommendation")) return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
    const actor = staffActorToStewardshipActor(access.actor);
    const result = await shareRecommendation(actor, businessId, id);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
    return NextResponse.json({ ok: true, recommendation: result.recommendation });
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}

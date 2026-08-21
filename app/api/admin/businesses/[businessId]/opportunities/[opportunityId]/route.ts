/**
 * Package B, Gate 5 — review/approve/dismiss a single opportunity.
 * Business boundary is enforced by the repository layer (every query filters on id AND
 * business_id — see opportunity/repository.ts), not by this route alone.
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, salesActorToOpportunityActor } from "@/app/admin/_lib/businessWorkspaceAccess";
import { approveOpportunity, dismissOpportunity, reviewOpportunity } from "@/app/lib/business/opportunity/repository";
import type { ReviewOpportunityInput } from "@/app/lib/business/opportunity/types";

const VALID_ACTIONS = ["review", "approve", "dismiss"] as const;
type ValidAction = (typeof VALID_ACTIONS)[number];

function isValidAction(v: unknown): v is ValidAction {
  return typeof v === "string" && (VALID_ACTIONS as readonly string[]).includes(v);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; opportunityId: string }> },
) {
  const { businessId, opportunityId } = await params;
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "review_opportunity")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (!isValidAction(body.action)) {
    return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
  }

  const input: ReviewOpportunityInput = {
    reviewNote: typeof body.reviewNote === "string" && body.reviewNote.trim() ? body.reviewNote.trim() : null,
  };
  const actor = salesActorToOpportunityActor(access.actor);

  const result = body.action === "approve"
    ? await approveOpportunity(businessId, opportunityId, input, actor)
    : body.action === "dismiss"
      ? await dismissOpportunity(businessId, opportunityId, input, actor)
      : await reviewOpportunity(businessId, opportunityId, input, actor);

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : result.reason === "invalid_transition" ? 409 : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true, opportunity: result.opportunity });
}

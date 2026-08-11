/**
 * Program 5 — Proposal Studio staff API. Creates and transitions proposals.
 * Requires create_proposal / review_proposal / record_proposal_decision capabilities.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createProposal, listProposalsForBusiness } from "@/app/lib/business/proposals/repository";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_meeting_studio")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { businessId } = await params;
  const proposals = await listProposalsForBusiness(businessId);
  return NextResponse.json({ proposals });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "create_proposal")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { businessId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const actor = { type: "staff" as const, rosterId: access.actor.rosterId, authUserId: access.actor.authUserId, email: access.actor.email, role: access.actor.role };

  const result = await createProposal({
    businessId,
    sourceRecommendationId: body.sourceRecommendationId ?? null,
    ownerGoalEn: body.ownerGoalEn ?? null,
    ownerGoalEs: body.ownerGoalEs ?? null,
    verifiedNeedEn: body.verifiedNeedEn ?? "",
    verifiedNeedEs: body.verifiedNeedEs ?? "",
    recommendedIntervention: body.recommendedIntervention ?? "",
    freeOptionEn: body.freeOptionEn ?? null,
    freeOptionEs: body.freeOptionEs ?? null,
    scopeEn: body.scopeEn ?? "",
    scopeEs: body.scopeEs ?? "",
    deliverablesEn: body.deliverablesEn ?? "",
    deliverablesEs: body.deliverablesEs ?? "",
    exclusionsEn: body.exclusionsEn ?? null,
    exclusionsEs: body.exclusionsEs ?? null,
    responsibilitiesEn: body.responsibilitiesEn ?? "",
    responsibilitiesEs: body.responsibilitiesEs ?? "",
    timelineEn: body.timelineEn ?? "",
    timelineEs: body.timelineEs ?? "",
    reviewDate: body.reviewDate ?? null,
    packageKey: body.packageKey ?? null,
    entitlementReference: body.entitlementReference ?? null,
    successMetricEn: body.successMetricEn ?? "",
    successMetricEs: body.successMetricEs ?? "",
  }, actor);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ proposal: result.proposal }, { status: 201 });
}

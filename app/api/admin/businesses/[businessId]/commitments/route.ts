/**
 * Program 5 — Promise Keeper staff API. Creates and updates commitments.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createCommitment, listCommitmentsForBusiness } from "@/app/lib/business/promiseKeeper/repository";
import type { ResponsibleParty } from "@/app/lib/business/promiseKeeper/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_commitments")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { businessId } = await params;
  const commitments = await listCommitmentsForBusiness(businessId);
  return NextResponse.json({ commitments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "manage_own_commitments") && !actorHasCapability(access.actor, "manage_team_commitments")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { businessId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const actor = { type: "staff" as const, rosterId: access.actor.rosterId, authUserId: access.actor.authUserId, email: access.actor.email, role: access.actor.role };

  const result = await createCommitment({
    businessId,
    meetingId: body.meetingId ?? null,
    recommendationId: body.recommendationId ?? null,
    proposalId: body.proposalId ?? null,
    titleEs: body.titleEs ?? "",
    titleEn: body.titleEn ?? "",
    responsibleParty: body.responsibleParty as ResponsibleParty ?? "shared",
    assignedRosterId: body.assignedRosterId ?? null,
    smallestNextStep: body.smallestNextStep ?? null,
    dueAt: body.dueAt ?? null,
    evidenceRequired: body.evidenceRequired ?? false,
  }, actor);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ commitment: result.commitment }, { status: 201 });
}

/**
 * Program 5 — Promise Keeper staff API. Updates a commitment and lists events.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { updateCommitment, getCommitmentById, listEventsForCommitment } from "@/app/lib/business/promiseKeeper/repository";
import type { CommitmentStatus, CapacityState, ReviewOutcome } from "@/app/lib/business/promiseKeeper/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string; commitmentId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_commitments")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { businessId, commitmentId } = await params;
  const commitment = await getCommitmentById(commitmentId, businessId);
  if (!commitment) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const events = await listEventsForCommitment(commitmentId, businessId);
  return NextResponse.json({ commitment, events });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; commitmentId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "manage_own_commitments") && !actorHasCapability(access.actor, "manage_team_commitments")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { businessId, commitmentId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const actor = { type: "staff" as const, rosterId: access.actor.rosterId, authUserId: access.actor.authUserId, email: access.actor.email, role: access.actor.role };

  const result = await updateCommitment(commitmentId, businessId, {
    status: body.status as CommitmentStatus | undefined,
    blocker: body.blocker,
    helpRequested: body.helpRequested,
    capacityState: body.capacityState as CapacityState | undefined,
    reviewOutcome: body.reviewOutcome as ReviewOutcome | undefined,
    assignedRosterId: body.assignedRosterId,
    dueAt: body.dueAt,
    smallestNextStep: body.smallestNextStep,
  }, actor);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ commitment: result.commitment });
}

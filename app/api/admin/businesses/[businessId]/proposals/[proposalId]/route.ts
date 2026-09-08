/**
 * Program 5 — Proposal Studio staff API. Transitions proposal status.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode, isOwnerBootstrapActor } from "@/app/admin/_lib/businessWorkspaceAccess";
import { updateProposalStatus, getProposalById, listVersionsForProposal } from "@/app/lib/business/proposals/repository";
import { isValidAcceptanceActor, staffAcceptanceRequiresRoster } from "@/app/lib/business/proposals/logic";
import type { ProposalActor, ProposalStatus } from "@/app/lib/business/proposals/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string; proposalId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_meeting_studio")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { businessId, proposalId } = await params;
  const proposal = await getProposalById(proposalId, businessId);
  if (!proposal) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const versions = await listVersionsForProposal(proposalId);
  return NextResponse.json({ proposal, versions });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; proposalId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });

  const { businessId, proposalId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const newStatus = body.status as ProposalStatus | undefined;
  if (!newStatus) return NextResponse.json({ error: "missing_status" }, { status: 400 });

  if (newStatus === "staff_review" || newStatus === "owner_review") {
    if (!actorHasCapability(access.actor, "review_proposal")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  if (newStatus === "accepted" || newStatus === "declined") {
    if (!actorHasCapability(access.actor, "record_proposal_decision")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (isOwnerBootstrapActor(access.actor) || !access.actor.rosterId) {
      return NextResponse.json({ error: "staff_roster_required" }, { status: 400 });
    }
  }

  const actor: ProposalActor = {
    type: "staff",
    rosterId: access.actor.rosterId,
    authUserId: access.actor.authUserId,
    email: access.actor.email,
    role: access.actor.role,
  };

  if ((newStatus === "accepted" || newStatus === "declined") && (!isValidAcceptanceActor(actor) || !staffAcceptanceRequiresRoster(actor))) {
    return NextResponse.json({ error: "staff_roster_required" }, { status: 400 });
  }

  const result = await updateProposalStatus({
    proposalId, businessId, newStatus,
    changeReason: body.changeReason ?? null,
  }, actor);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ proposal: result.proposal });
}

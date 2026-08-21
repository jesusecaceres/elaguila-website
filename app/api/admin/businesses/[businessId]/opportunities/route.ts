/**
 * Package B, Gate 5 — staff opportunity list + suggestion-generation route.
 * Reuses the existing Sales Workspace authorization boundary — no new auth system.
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { generateOpportunitySuggestions } from "@/app/lib/business/opportunity/generateSuggestions";
import { listOpportunitiesForBusiness } from "@/app/lib/business/opportunity/repository";
import type { OpportunityActor } from "@/app/lib/business/opportunity/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_opportunities")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const opportunities = await listOpportunitiesForBusiness(businessId);
  return NextResponse.json({ ok: true, opportunities });
}

/** Generates/refreshes suggested opportunities for this business. Never creates a duplicate for an already-suggested source. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_opportunities")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  if (!access.actor.rosterId) {
    return NextResponse.json({ ok: false, error: "roster_required" }, { status: 403 });
  }
  const actor: OpportunityActor = {
    type: "staff",
    rosterId: access.actor.rosterId,
    authUserId: access.actor.authUserId,
    role: access.actor.role,
  };

  const result = await generateOpportunitySuggestions(businessId, actor);
  return NextResponse.json({ ok: true, created: result.created, skippedExisting: result.skippedExisting });
}

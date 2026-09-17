import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, requireSalesWorkspaceAccess, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { listBriefingDraftsForBusiness } from "@/app/lib/business/aiResearch/repository";

export const runtime = "nodejs";

/** GET — staff-safe briefing draft history for this exact business. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_field_discovery")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { businessId } = await params;
  const drafts = await listBriefingDraftsForBusiness(businessId);
  return NextResponse.json({ ok: true, businessId, drafts });
}

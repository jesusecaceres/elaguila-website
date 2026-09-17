/**
 * Business Development & Growth Engine, Gate C — campaign status transition. Validated against
 * isValidGrowthCampaignTransition (Gate A); an invalid jump is rejected, never silently applied.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { updateGrowthCampaignStatus } from "@/app/lib/business/growthEngine/repository";
import type { GrowthCampaignStatus } from "@/app/lib/business/growthEngine/types";

export const runtime = "nodejs";

const VALID_STATUSES: readonly GrowthCampaignStatus[] = [
  "draft", "needs_client_input", "ready_for_review", "approved", "in_production", "live", "measuring", "complete", "paused", "cancelled",
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; campaignId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_campaigns");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, campaignId } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: unknown };
  if (typeof body.status !== "string" || !(VALID_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ ok: false, error: "bad_status" }, { status: 400 });
  }

  const result = await updateGrowthCampaignStatus(businessId, campaignId, body.status as GrowthCampaignStatus, access.actor);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : result.reason === "invalid_transition" ? 409 : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true, campaign: result.campaign });
}

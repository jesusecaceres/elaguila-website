/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — "Create Campaign" bridge route for Media/
 * Exposure Campaign blueprints. Double-gated on manage_project_blueprint AND manage_growth_campaigns
 * (mirrors the Growth Solution -> Creative Studio bridge's own stricter precedent).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getBlueprintById } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { createGrowthCampaignFromBlueprint } from "@/app/lib/business/projectDiscovery/growthCampaignBridge";
import type { MediaCampaignBlueprintPacket } from "@/app/lib/business/projectDiscovery/specializedBlueprintEngine";

export const runtime = "nodejs";

interface Body {
  blueprintId?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_blueprint"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  if (!access.actor.capabilities.has("manage_growth_campaigns")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const blueprintId = typeof body.blueprintId === "string" ? body.blueprintId : "";
  if (!blueprintId) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const blueprint = await getBlueprintById<MediaCampaignBlueprintPacket>(businessId, blueprintId);
  if (!blueprint) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const result = await createGrowthCampaignFromBlueprint(businessId, blueprint, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_approved" ? 409 : 400 });
  return NextResponse.json({ ok: true, campaign: result.campaign, alreadyExisted: result.alreadyExisted, unmatchedChannelTokens: result.unmatchedChannelTokens });
}

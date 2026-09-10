/**
 * Business Development & Growth Engine, Gate C — campaigns list + create (Campaign Builder).
 * Persists exclusively through Gate A's createGrowthCampaign — channel selection is validated
 * against the real Gate A media channel catalog, never an invented channel key.
 */
import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { addGrowthCampaignChannel, createGrowthCampaign, listGrowthCampaignsForBusiness, listGrowthMediaChannels } from "@/app/lib/business/growthEngine/repository";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_growth_engine")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { businessId } = await params;
  const campaigns = await listGrowthCampaignsForBusiness(businessId);
  return NextResponse.json({ ok: true, campaigns });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_campaigns");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const objectiveEs = typeof body.objectiveEs === "string" ? body.objectiveEs.trim() : "";
  const objectiveEn = typeof body.objectiveEn === "string" ? body.objectiveEn.trim() : "";
  if (!objectiveEs || !objectiveEn) return NextResponse.json({ ok: false, error: "objective_required" }, { status: 400 });

  const budgetAmount = typeof body.budgetAmount === "number" && Number.isFinite(body.budgetAmount) && body.budgetAmount >= 0 ? body.budgetAmount : null;
  const channelIds = Array.isArray(body.mediaChannelIds) ? body.mediaChannelIds.filter((c): c is string => typeof c === "string") : [];

  // Validate every requested channel against the real catalog before creating anything — never
  // accept an invented channel id from the client.
  const realChannels = await listGrowthMediaChannels();
  const realChannelIds = new Set(realChannels.map((c) => c.id));
  for (const id of channelIds) {
    if (!realChannelIds.has(id)) return NextResponse.json({ ok: false, error: "bad_channel" }, { status: 400 });
  }

  const campaign = await createGrowthCampaign(
    {
      businessId,
      sourceSolutionId: typeof body.sourceSolutionId === "string" ? body.sourceSolutionId : null,
      linkedOpportunityId: typeof body.linkedOpportunityId === "string" ? body.linkedOpportunityId : null,
      objectiveEs,
      objectiveEn,
      targetAudienceEs: typeof body.targetAudienceEs === "string" ? body.targetAudienceEs.trim() || null : null,
      targetAudienceEn: typeof body.targetAudienceEn === "string" ? body.targetAudienceEn.trim() || null : null,
      offerEs: typeof body.offerEs === "string" ? body.offerEs.trim() || null : null,
      offerEn: typeof body.offerEn === "string" ? body.offerEn.trim() || null : null,
      primaryCtaEs: typeof body.primaryCtaEs === "string" ? body.primaryCtaEs.trim() || null : null,
      primaryCtaEn: typeof body.primaryCtaEn === "string" ? body.primaryCtaEn.trim() || null : null,
      capacityAssumption: typeof body.capacityAssumption === "string" ? body.capacityAssumption.trim() || null : null,
      campaignStart: typeof body.campaignStart === "string" && body.campaignStart ? body.campaignStart : null,
      campaignEnd: typeof body.campaignEnd === "string" && body.campaignEnd ? body.campaignEnd : null,
      budgetAmount,
    },
    access.actor,
  );

  if (!campaign) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });

  for (const channelId of channelIds) {
    await addGrowthCampaignChannel(businessId, campaign.id, channelId, null);
  }

  return NextResponse.json({ ok: true, campaign });
}

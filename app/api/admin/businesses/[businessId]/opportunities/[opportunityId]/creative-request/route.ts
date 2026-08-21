/**
 * Package B, Gate 7 — "Create Creative Request" bridge.
 * Uses the EXISTING Creative Studio job pipeline (createJob) — no second creative system. Only
 * valid from an "approved" opportunity; seeds the job with opportunity context and marks the
 * opportunity "creative_requested" with a traceable back-reference (source_opportunity_id).
 * Never auto-generates creative — creating the job is enough; generation remains a separate,
 * explicit staff action against the existing /creative-studio/jobs/[jobId]/generate route
 * (Package A).
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getOpportunityById, markOpportunityCreativeRequested } from "@/app/lib/business/opportunity/repository";
import type { OpportunityType } from "@/app/lib/business/opportunity/types";
import { createJob, type CreativeActor } from "@/app/lib/business/creativeStudio/repository";
import { CREATIVE_DOCTRINE_VERSION, CREATIVE_TEMPLATE_VERSION, type CreativeAssetType, type CreativeLanguage } from "@/app/lib/business/creativeStudio/types";
import { getAdminSupabase } from "@/app/lib/supabase/server";

const OPPORTUNITY_TYPE_TO_ASSET_TYPE: Record<OpportunityType, CreativeAssetType> = {
  editorial_match: "sponsored_insert",
  sponsored_feature: "sponsored_insert",
  category_feature: "sponsored_insert",
  seasonal_campaign: "campaign_plan_30_day",
  business_campaign: "campaign_plan_30_day",
};

async function getBusinessPrimaryLanguage(businessId: string): Promise<CreativeLanguage> {
  const supabase = getAdminSupabase();
  const { data } = await supabase.from("businesses").select("primary_language").eq("id", businessId).maybeSingle();
  return data?.primary_language === "en" ? "en_primary_es_support" : "es_primary_en_support";
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string; opportunityId: string }> },
) {
  const { businessId, opportunityId } = await params;
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "create_opportunity_creative_request")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (!access.actor.rosterId) {
    return NextResponse.json({ ok: false, error: "roster_required" }, { status: 403 });
  }

  const opportunity = await getOpportunityById(businessId, opportunityId);
  if (!opportunity) {
    return NextResponse.json({ ok: false, error: "opportunity_not_found" }, { status: 404 });
  }
  if (opportunity.lifecycleState !== "approved") {
    return NextResponse.json({ ok: false, error: "opportunity_not_approved" }, { status: 409 });
  }

  const language = await getBusinessPrimaryLanguage(businessId);

  const creativeActor: CreativeActor = {
    type: "staff",
    rosterId: access.actor.rosterId,
    authUserId: access.actor.authUserId,
    email: access.actor.email,
    role: access.actor.role,
  };

  const job = await createJob(
    businessId,
    {
      sourceRecommendationId: null,
      sourceProposalId: null,
      sourceOpportunityId: opportunity.id,
      assetType: OPPORTUNITY_TYPE_TO_ASSET_TYPE[opportunity.opportunityType],
      language,
      format: "FULL_PAGE",
      archetype: "SPONSORED_EDITORIAL",
      layoutVariant: "A",
      inputSnapshotId: null,
      doctrineVersion: CREATIVE_DOCTRINE_VERSION,
      templateVersion: CREATIVE_TEMPLATE_VERSION,
      providerKey: "gemini",
      modelKey: "gemini-2.5-flash",
      creativeLane: "LANE_C_SPONSORED_EDITORIAL",
      riskClass: "NORMAL",
      createdActorType: "staff",
      createdByRosterId: access.actor.rosterId,
      createdByAuthUserId: access.actor.authUserId,
      createdByEmail: access.actor.email,
      createdByRole: access.actor.role,
    },
    creativeActor,
  );

  if (!job) {
    return NextResponse.json({ ok: false, error: "job_create_failed" }, { status: 500 });
  }

  const marked = await markOpportunityCreativeRequested(businessId, opportunityId, job.id);
  if (!marked.ok) {
    // The job was created (durable, not rolled back — matches the "no invisible history rewrite"
    // convention elsewhere in Creative Studio); report the opportunity-side failure so staff can
    // retry marking it, without losing the already-created job.
    return NextResponse.json({ ok: false, error: "opportunity_mark_failed", job }, { status: 500 });
  }

  return NextResponse.json({ ok: true, job, opportunity: marked.opportunity });
}

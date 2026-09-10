/**
 * Business Development & Growth Engine, Gate C — "Create Logo/Website/Ad/Sponsored-Editorial
 * Project" bridge from a Growth solution into the EXISTING Creative Studio job pipeline
 * (createJob) — no second creative system, no auto-generation. Mirrors
 * app/api/admin/businesses/[businessId]/opportunities/[opportunityId]/creative-request/route.ts
 * exactly, with the traceable link recorded on the Growth Engine side
 * (linkGrowthSolutionExecution) instead of on business_creative_jobs (Growth solutions were never
 * given a source_growth_solution_id column on that table — Gate A's composite FK already runs the
 * other direction: business_growth_solutions.linked_creative_job_id -> business_creative_jobs).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getGrowthSolutionById, linkGrowthSolutionExecution } from "@/app/lib/business/growthEngine/repository";
import { createJob } from "@/app/lib/business/creativeStudio/repository";
import { CREATIVE_DOCTRINE_VERSION, CREATIVE_TEMPLATE_VERSION, type CreativeAssetType, type CreativeLanguage } from "@/app/lib/business/creativeStudio/types";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const LANE_TO_ASSET_TYPE = {
  logo: "logo_direction",
  website: "website_strategy",
  ad: "magazine_ad",
  sponsored_editorial: "sponsored_insert",
} as const satisfies Record<string, CreativeAssetType>;

type CreativeRequestLane = keyof typeof LANE_TO_ASSET_TYPE;

function isValidLane(v: unknown): v is CreativeRequestLane {
  return typeof v === "string" && v in LANE_TO_ASSET_TYPE;
}

async function getBusinessPrimaryLanguage(businessId: string): Promise<CreativeLanguage> {
  const supabase = getAdminSupabase();
  const { data } = await supabase.from("businesses").select("primary_language").eq("id", businessId).maybeSingle();
  return data?.primary_language === "en" ? "en_primary_es_support" : "es_primary_en_support";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; solutionId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_solutions");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  // Creative Studio job creation is itself capability-gated on create_creative_job — a solution
  // manager without that capability cannot use this bridge to bypass Creative Studio's own gate.
  if (!access.actor.capabilities.has("create_creative_job")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }

  const { businessId, solutionId } = await params;
  const body = (await req.json().catch(() => ({}))) as { lane?: unknown };
  if (!isValidLane(body.lane)) return NextResponse.json({ ok: false, error: "bad_lane" }, { status: 400 });

  const solution = await getGrowthSolutionById(businessId, solutionId);
  if (!solution) return NextResponse.json({ ok: false, error: "solution_not_found" }, { status: 404 });

  const language = await getBusinessPrimaryLanguage(businessId);
  // Matches the opportunity -> Creative Studio bridge's own idiom: the resolver's real actor is
  // passed straight through (structurally compatible with createJob's actor param), never
  // re-literal-constructed.
  const creativeActor = access.actor;

  const job = await createJob(
    businessId,
    {
      sourceRecommendationId: null,
      sourceProposalId: null,
      sourceOpportunityId: null,
      assetType: LANE_TO_ASSET_TYPE[body.lane],
      language,
      format: "FULL_PAGE",
      archetype: body.lane === "sponsored_editorial" ? "SPONSORED_EDITORIAL" : "AUTHORITY_TRADITIONAL_UPGRADED",
      layoutVariant: "A",
      inputSnapshotId: null,
      doctrineVersion: CREATIVE_DOCTRINE_VERSION,
      templateVersion: CREATIVE_TEMPLATE_VERSION,
      providerKey: "gemini",
      modelKey: "gemini-2.5-flash",
      creativeLane: body.lane === "sponsored_editorial" ? "LANE_C_SPONSORED_EDITORIAL" : "LANE_A_TRADITIONAL_UPGRADED",
      riskClass: "NORMAL",
      createdActorType: creativeActor.type,
      createdByRosterId: creativeActor.rosterId,
      createdByAuthUserId: creativeActor.authUserId,
      createdByEmail: creativeActor.email,
      createdByRole: creativeActor.role,
    },
    creativeActor,
  );

  if (!job) return NextResponse.json({ ok: false, error: "job_create_failed" }, { status: 500 });

  const linked = await linkGrowthSolutionExecution(businessId, solutionId, { type: "creative_job", id: job.id }, access.actor);
  if (!linked.ok) {
    // Job is durable (never rolled back, matching the opportunity bridge's own convention) —
    // report the link-side failure so staff can retry linking without losing the created job.
    return NextResponse.json({ ok: false, error: "link_failed", job }, { status: 500 });
  }

  return NextResponse.json({ ok: true, job, solution: linked.solution });
}

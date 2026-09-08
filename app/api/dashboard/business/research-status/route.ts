import { NextResponse, type NextRequest } from "next/server";

import { resolveFieldDiscoveryOwnerAccess } from "@/app/lib/business/aiResearch/access";
import { resolveAiResearchFlagTier } from "@/app/lib/business/aiResearch/featureFlag";
import { listBriefingDraftsForBusiness, listResearchRunsForBusiness } from "@/app/lib/business/aiResearch/repository";
import { getLatestConsentState, listSourceLinksForBusiness } from "@/app/lib/business/fieldDiscovery/repository";

export const runtime = "nodejs";

export type OwnerResearchStatus =
  | "no_sources"
  | "consent_needed"
  | "ready_to_research"
  | "research_in_progress"
  | "staff_review_needed"
  | "information_ready"
  | "research_failed";

/**
 * GET /api/dashboard/business/research-status?businessId= — the owner-safe, coarse-only status
 * of Program 4 field research for this exact business. Never returns raw AI output, internal
 * prompts, confidence reasoning, staff-only evidence, private notes, failed candidates, provider
 * cost, actor emails, or any unrelated business id.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const access = await resolveFieldDiscoveryOwnerAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  const flagTier = await resolveAiResearchFlagTier(access.userId);
  const flagAvailable = flagTier === "global" || flagTier === "pilot";
  if (!flagAvailable) {
    return NextResponse.json({ ok: true, businessId: access.business.id, status: "no_sources" as OwnerResearchStatus });
  }

  const sourceLinks = await listSourceLinksForBusiness(access.business.id);
  if (sourceLinks.length === 0) {
    return NextResponse.json({ ok: true, businessId: access.business.id, status: "no_sources" as OwnerResearchStatus });
  }

  const sourceResearchConsent = await getLatestConsentState(access.business.id, "source_research");
  const aiResearchConsent = await getLatestConsentState(access.business.id, "ai_research");
  if (sourceResearchConsent !== "provided" || aiResearchConsent !== "provided") {
    return NextResponse.json({ ok: true, businessId: access.business.id, status: "consent_needed" as OwnerResearchStatus });
  }

  const runs = await listResearchRunsForBusiness(access.business.id);
  if (runs.length === 0) {
    return NextResponse.json({ ok: true, businessId: access.business.id, status: "ready_to_research" as OwnerResearchStatus });
  }

  const latestRun = runs[0];
  if (latestRun.status === "queued" || latestRun.status === "running") {
    return NextResponse.json({ ok: true, businessId: access.business.id, status: "research_in_progress" as OwnerResearchStatus });
  }
  if (latestRun.status === "failed" || latestRun.status === "cancelled") {
    return NextResponse.json({ ok: true, businessId: access.business.id, status: "research_failed" as OwnerResearchStatus });
  }

  const drafts = await listBriefingDraftsForBusiness(access.business.id);
  const latestDraft = drafts.find((d) => d.researchRunId === latestRun.id);
  if (!latestDraft || latestDraft.reviewStatus === "draft") {
    return NextResponse.json({ ok: true, businessId: access.business.id, status: "staff_review_needed" as OwnerResearchStatus });
  }
  if (latestDraft.reviewStatus === "rejected" || latestDraft.reviewStatus === "superseded") {
    return NextResponse.json({ ok: true, businessId: access.business.id, status: "ready_to_research" as OwnerResearchStatus });
  }

  return NextResponse.json({ ok: true, businessId: access.business.id, status: "information_ready" as OwnerResearchStatus });
}

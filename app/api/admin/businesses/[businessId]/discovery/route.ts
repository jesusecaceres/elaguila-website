/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — Start Discovery (MD <start_discovery>,
 * <growth_bridge>). One route handles both entry points: a manual start (no provenance) and a
 * start from a reviewed Growth Solution/Opportunity/Assessment (real provenance carried straight
 * through — never fabricated when the caller is manual). The initial project intent is created in
 * the same request so a discovery is never left with zero intents.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createProjectDiscovery, createProjectDiscoveryIntent } from "@/app/lib/business/projectDiscovery/repository";
import { isKnownProjectType } from "@/app/lib/business/projectDiscovery/projectTypeRegistry";
import type { ProjectType } from "@/app/lib/business/projectDiscovery/types";

export const runtime = "nodejs";

interface StartDiscoveryBody {
  title?: unknown;
  primaryProjectType?: unknown;
  sourceGrowthAssessmentId?: unknown;
  sourceGrowthSolutionId?: unknown;
  sourceOpportunityId?: unknown;
  sourceMeetingId?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["create_project_discovery", "manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as StartDiscoveryBody;

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const primaryProjectType = typeof body.primaryProjectType === "string" ? body.primaryProjectType : "";
  if (!title || !isKnownProjectType(primaryProjectType)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const discoveryResult = await createProjectDiscovery(
    {
      businessId,
      title,
      primaryProjectType: primaryProjectType as ProjectType,
      sourceGrowthAssessmentId: typeof body.sourceGrowthAssessmentId === "string" ? body.sourceGrowthAssessmentId : null,
      sourceGrowthSolutionId: typeof body.sourceGrowthSolutionId === "string" ? body.sourceGrowthSolutionId : null,
      sourceOpportunityId: typeof body.sourceOpportunityId === "string" ? body.sourceOpportunityId : null,
      sourceMeetingId: typeof body.sourceMeetingId === "string" ? body.sourceMeetingId : null,
    },
    access.actor,
  );
  if (!discoveryResult.ok) return NextResponse.json({ ok: false, error: discoveryResult.reason }, { status: 400 });

  const intentResult = await createProjectDiscoveryIntent(
    { discoveryId: discoveryResult.discovery.id, businessId, projectType: primaryProjectType as ProjectType, title },
    access.actor,
  );
  if (!intentResult.ok) {
    return NextResponse.json({ ok: true, discovery: discoveryResult.discovery, intent: null, intentError: intentResult.reason });
  }

  return NextResponse.json({ ok: true, discovery: discoveryResult.discovery, intent: intentResult.intent });
}

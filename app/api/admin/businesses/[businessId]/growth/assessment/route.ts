/**
 * Business Development & Growth Engine, Gate B — the minimal server seam Gate C needs to call the
 * Business Development Analyst safely. No UI lives here (see MD <no_ui_yet>).
 *
 * GET  — read-only: current assessment + prior versions. No provider call, ever.
 * POST — triggers generateOrGetGrowthAssessment. Authorization is the canonical
 *        requireStaffWorkspaceWriteAccess("create_growth_assessment") — the server builds the
 *        actor and the input packet itself; nothing about identity or business truth is ever
 *        trusted from the request body.
 */
import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { generateOrGetGrowthAssessment } from "@/app/lib/business/growthEngine/analyst/engine";
import { getCurrentGrowthAssessment, listGrowthAssessmentsForBusiness } from "@/app/lib/business/growthEngine/repository";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_growth_engine")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { businessId } = await params;
  const [current, history] = await Promise.all([
    getCurrentGrowthAssessment(businessId),
    listGrowthAssessmentsForBusiness(businessId),
  ]);

  return NextResponse.json({
    ok: true,
    businessId,
    current,
    history: history.map((a) => ({ id: a.id, status: a.status, createdAt: a.createdAt, reviewedAt: a.reviewedAt })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("create_growth_assessment");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as { forceReanalysis?: unknown };
  const forceReanalysis = body.forceReanalysis === true;

  const result = await generateOrGetGrowthAssessment(businessId, access.actor, { forceReanalysis });
  if (!result.ok) {
    const status = result.reason === "business_not_found" ? 404 : result.reason === "provider_unavailable" ? 503 : 502;
    return NextResponse.json({ ok: false, error: result.reason, detail: result.detail }, { status });
  }

  return NextResponse.json({ ok: true, assessment: result.assessment, cached: result.cached, taskClass: result.taskClass });
}

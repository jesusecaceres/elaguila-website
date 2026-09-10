/**
 * Business Development & Growth Engine, Gate C — mark an official requirement human-verified. The
 * ONLY endpoint that can do this; it requires the operator to supply the real source they
 * personally checked (sourceUrl + sourceAgency) — never derived from AI output, and the DB CHECK
 * constraint (business_growth_official_requirements_verification_chk) structurally forbids this
 * state without both being real.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { markOfficialRequirementVerified } from "@/app/lib/business/growthEngine/repository";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; requirementId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_official_requirements_research");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, requirementId } = await params;
  const body = (await req.json().catch(() => ({}))) as { sourceUrl?: unknown; sourceAgency?: unknown };
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const sourceAgency = typeof body.sourceAgency === "string" ? body.sourceAgency.trim() : "";
  if (!sourceUrl || !sourceAgency) {
    return NextResponse.json({ ok: false, error: "source_required" }, { status: 400 });
  }

  const result = await markOfficialRequirementVerified(businessId, requirementId, access.actor, sourceUrl, sourceAgency);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true, requirement: result.requirement });
}

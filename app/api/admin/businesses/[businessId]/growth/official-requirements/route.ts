/**
 * Business Development & Growth Engine, Gate C — official/regulatory requirement research list +
 * create. Every created row starts state='needs_research', needs_human_verification=true — never
 * a conclusion. Only the dedicated /verify sub-route (a real human action) can ever change that.
 */
import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createOfficialRequirement, listOfficialRequirementsForBusiness } from "@/app/lib/business/growthEngine/repository";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_growth_engine")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { businessId } = await params;
  const requirements = await listOfficialRequirementsForBusiness(businessId);
  return NextResponse.json({ ok: true, requirements });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_official_requirements_research");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const jurisdiction = typeof body.jurisdiction === "string" ? body.jurisdiction.trim() : "";
  const requirementTopicEs = typeof body.requirementTopicEs === "string" ? body.requirementTopicEs.trim() : "";
  const requirementTopicEn = typeof body.requirementTopicEn === "string" ? body.requirementTopicEn.trim() : "";
  if (!jurisdiction || !requirementTopicEs || !requirementTopicEn) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const requirement = await createOfficialRequirement(
    {
      businessId,
      jurisdiction,
      requirementTopicEs,
      requirementTopicEn,
      businessCategoryContext: typeof body.businessCategoryContext === "string" ? body.businessCategoryContext.trim() || null : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    },
    access.actor,
  );

  if (!requirement) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, requirement });
}

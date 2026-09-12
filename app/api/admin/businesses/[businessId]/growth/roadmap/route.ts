/**
 * Business Development & Growth Engine, Gate C — roadmap read (ensures the catalog is seeded for
 * the business's real roadmap type, derived from businesses.business_stage) + step state updates.
 */
import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { ensureGrowthRoadmapForBusiness, updateGrowthRoadmapStepState } from "@/app/lib/business/growthEngine/repository";
import { growthRoadmapTypeForBusinessStage } from "@/app/lib/business/growthEngine/lifeStage";
import type { GrowthRoadmapStepState } from "@/app/lib/business/growthEngine/types";
import type { BusinessStage } from "@/app/lib/business/types";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const VALID_STATES: readonly GrowthRoadmapStepState[] = [
  "not_started", "in_progress", "needs_client_input", "needs_official_research", "blocked", "complete", "not_applicable",
];

async function loadBusinessStage(businessId: string): Promise<BusinessStage | null> {
  const admin = getAdminSupabase();
  const { data } = await admin.from("businesses").select("business_stage").eq("id", businessId).maybeSingle();
  return (data as { business_stage: BusinessStage } | null)?.business_stage ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_growth_engine")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { businessId } = await params;
  const stage = await loadBusinessStage(businessId);
  if (!stage) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  const roadmapType = growthRoadmapTypeForBusinessStage(stage);
  // Seeding the catalog is idempotent materialization of a fixed, pre-defined step list with
  // default state — not a business decision — so it always runs under a "system" attribution
  // regardless of the viewer's own capability, the same way a lazily-materialized read composer
  // elsewhere in this codebase does not require a write capability to populate itself.
  const steps = await ensureGrowthRoadmapForBusiness(businessId, roadmapType, { type: "system", role: "growth_roadmap_seed" });

  return NextResponse.json({ ok: true, roadmapType, steps });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_roadmap");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as { stepKey?: unknown; state?: unknown; note?: unknown };
  const stage = await loadBusinessStage(businessId);
  if (!stage) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });
  const roadmapType = growthRoadmapTypeForBusinessStage(stage);

  if (typeof body.stepKey !== "string" || !body.stepKey) return NextResponse.json({ ok: false, error: "step_key_required" }, { status: 400 });
  if (typeof body.state !== "string" || !(VALID_STATES as readonly string[]).includes(body.state)) {
    return NextResponse.json({ ok: false, error: "bad_state" }, { status: 400 });
  }
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

  const result = await updateGrowthRoadmapStepState(businessId, roadmapType, body.stepKey, body.state as GrowthRoadmapStepState, access.actor, note);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true, step: result.step });
}

/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — mark a blueprint RELEASED/LAUNCHED. Server-
 * authoritative (MD <launch_guard>): re-derives full release readiness and refuses unless
 * READY_FOR_RELEASE — client-side button hiding alone is never sufficient.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getBlueprintById, markBlueprintReleased } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { assembleReleaseReadiness } from "@/app/lib/business/projectDiscovery/releaseReadinessAssembler";

export const runtime = "nodejs";

interface Body {
  blueprintId?: unknown;
  finalDestinationUrl?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_blueprint"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const blueprintId = typeof body.blueprintId === "string" ? body.blueprintId : "";
  if (!blueprintId) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const blueprint = await getBlueprintById(businessId, blueprintId);
  if (!blueprint || blueprint.discoveryId !== discoveryId) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const readiness = await assembleReleaseReadiness(businessId, blueprint);
  if (readiness.state !== "READY_FOR_RELEASE") {
    return NextResponse.json({ ok: false, error: "not_ready", state: readiness.state, reasonEs: readiness.reasonEs, reasonEn: readiness.reasonEn, blockingReasons: readiness.blockingReasons }, { status: 409 });
  }

  const result = await markBlueprintReleased(
    businessId,
    blueprintId,
    { finalDestinationUrl: typeof body.finalDestinationUrl === "string" ? body.finalDestinationUrl : null },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — "Create Creative Studio Project" bridge
 * route for Logo/Brand and Print Collateral blueprints. Double-gated on manage_project_blueprint
 * AND create_creative_job (mirrors the Growth Solution -> Creative Studio bridge's own stricter
 * precedent: a blueprint manager without Creative Studio's own capability cannot use this bridge to
 * bypass Creative Studio's own gate).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getBlueprintById } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { createCreativeStudioProjectFromBlueprint } from "@/app/lib/business/projectDiscovery/creativeStudioBridge";
import type { LogoBrandBlueprintPacket, PrintCollateralBlueprintPacket } from "@/app/lib/business/projectDiscovery/specializedBlueprintEngine";

export const runtime = "nodejs";

interface Body {
  blueprintId?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_blueprint"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  if (!access.actor.capabilities.has("create_creative_job")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const blueprintId = typeof body.blueprintId === "string" ? body.blueprintId : "";
  if (!blueprintId) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const blueprint = await getBlueprintById<LogoBrandBlueprintPacket | PrintCollateralBlueprintPacket>(businessId, blueprintId);
  if (!blueprint) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const result = await createCreativeStudioProjectFromBlueprint(businessId, blueprint, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_approved" ? 409 : 400 });
  return NextResponse.json({ ok: true, job: result.job, alreadyExisted: result.alreadyExisted });
}

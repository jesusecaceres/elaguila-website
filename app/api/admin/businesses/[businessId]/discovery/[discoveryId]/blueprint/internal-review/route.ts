/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — mark a DRAFT blueprint version's internal
 * review complete (MD <internal_review>: a lighter staff confirmation step distinct from final
 * build approval). Gated on manage_project_blueprint.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { markBlueprintInternalReviewComplete } from "@/app/lib/business/projectDiscovery/blueprintRepository";

export const runtime = "nodejs";

interface Body {
  blueprintId?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_blueprint"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const blueprintId = typeof body.blueprintId === "string" ? body.blueprintId : "";
  if (!blueprintId) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const result = await markBlueprintInternalReviewComplete(businessId, blueprintId, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

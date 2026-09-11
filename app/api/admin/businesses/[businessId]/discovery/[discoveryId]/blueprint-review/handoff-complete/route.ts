/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — mark a blueprint's HANDOFF COMPLETE.
 * Server-authoritative (MD <handoff_completion>, <launch_guard>): every handoff checklist item
 * must be complete or explicitly not_applicable — client-side button hiding alone is insufficient.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { completeBlueprintHandoff, getBlueprintById } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { listCheckItemsForBlueprint } from "@/app/lib/business/projectDiscovery/blueprintCheckItemRepository";

export const runtime = "nodejs";

interface Body {
  blueprintId?: unknown;
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

  const handoffItems = await listCheckItemsForBlueprint(businessId, blueprintId, "handoff");
  const pending = handoffItems.filter((i) => i.status !== "complete" && i.status !== "not_applicable");
  if (handoffItems.length === 0 || pending.length > 0) {
    return NextResponse.json({ ok: false, error: "handoff_items_pending", pendingKeys: pending.map((i) => i.itemKey) }, { status: 409 });
  }

  const result = await completeBlueprintHandoff(businessId, blueprintId, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

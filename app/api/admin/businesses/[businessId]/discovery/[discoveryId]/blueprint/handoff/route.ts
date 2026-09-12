/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — "CREATE WEBSITE PROJECT / CREAR PROYECTO DE
 * SITIO WEB" (MD <build_handoff>). No canonical project/work-order domain exists anywhere in this
 * codebase (confirmed by direct inspection) and Creative Studio is not a valid destination for a
 * full website build — this route only ever sets the smallest handoff state living on the blueprint
 * row itself (Option C from this gate's own first_inspection), never a fake bridge to an unrelated
 * system. Only meaningful once a blueprint is APPROVED_FOR_BUILD (blueprintRepository.ts enforces
 * that).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { setBlueprintHandoff, type BlueprintHandoffStatus } from "@/app/lib/business/projectDiscovery/blueprintRepository";

export const runtime = "nodejs";

const VALID_HANDOFF_STATUSES: readonly BlueprintHandoffStatus[] = ["not_started", "pending_assignment", "assigned", "in_progress", "complete"];

interface Body {
  blueprintId?: unknown;
  handoffStatus?: unknown;
  handoffAssigneeRosterId?: unknown;
  handoffDueDate?: unknown;
  handoffNotes?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_blueprint"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const blueprintId = typeof body.blueprintId === "string" ? body.blueprintId : "";
  if (!blueprintId) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const assigneeRosterId = typeof body.handoffAssigneeRosterId === "string" ? body.handoffAssigneeRosterId : null;
  const requestedStatus = typeof body.handoffStatus === "string" ? body.handoffStatus : "";
  const handoffStatus: BlueprintHandoffStatus = VALID_HANDOFF_STATUSES.includes(requestedStatus as BlueprintHandoffStatus)
    ? (requestedStatus as BlueprintHandoffStatus)
    : assigneeRosterId
      ? "assigned"
      : "pending_assignment";

  const dueDate = typeof body.handoffDueDate === "string" && body.handoffDueDate.trim() ? body.handoffDueDate.trim() : null;
  const notes = typeof body.handoffNotes === "string" && body.handoffNotes.trim() ? body.handoffNotes.trim() : null;

  const result = await setBlueprintHandoff(businessId, blueprintId, {
    handoffStatus,
    handoffAssigneeRosterId: assigneeRosterId,
    handoffDueDate: dueDate,
    handoffNotes: notes,
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

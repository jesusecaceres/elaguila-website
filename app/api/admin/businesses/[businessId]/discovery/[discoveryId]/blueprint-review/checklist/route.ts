/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — ensure (idempotently generate) the QA /
 * Launch / Handoff checklist snapshot for one frozen blueprint version, straight from that
 * version's OWN packet.qaMatrix/launchChecklist/handoffChecklist (MD <core_law>: never a second,
 * disconnected checklist). Works identically for Website and every specialized family — those
 * three packet fields are structurally identical across both packet shapes.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getBlueprintById } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { buildHandoffSnapshotFromPacket, buildLaunchSnapshotFromPacket, buildQaSnapshotFromPacket, type CheckItemKind } from "@/app/lib/business/projectDiscovery/blueprintChecklistEngine";
import { ensureCheckItemsSnapshot, listCheckItemsForBlueprint } from "@/app/lib/business/projectDiscovery/blueprintCheckItemRepository";

export const runtime = "nodejs";

interface ChecklistSourcePacket {
  qaMatrix: readonly { key: string; labelEs: string; labelEn: string; conditional: boolean }[];
  launchChecklist: readonly { key: string; textEs: string; textEn: string }[];
  handoffChecklist: readonly { key: string; textEs: string; textEn: string }[];
}

const VALID_KINDS: readonly CheckItemKind[] = ["qa", "launch", "handoff"];

interface Body {
  blueprintId?: unknown;
  kind?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["review_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const blueprintId = typeof body.blueprintId === "string" ? body.blueprintId : "";
  const kind = VALID_KINDS.includes(body.kind as CheckItemKind) ? (body.kind as CheckItemKind) : "";
  if (!blueprintId || !kind) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const blueprint = await getBlueprintById<ChecklistSourcePacket>(businessId, blueprintId);
  if (!blueprint || blueprint.discoveryId !== discoveryId) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const snapshots =
    kind === "qa" ? buildQaSnapshotFromPacket(blueprint.packet.qaMatrix) :
    kind === "launch" ? buildLaunchSnapshotFromPacket(blueprint.packet.launchChecklist) :
    buildHandoffSnapshotFromPacket(blueprint.packet.handoffChecklist);

  const ensured = await ensureCheckItemsSnapshot(businessId, blueprintId, blueprint.projectIntentId, snapshots);
  if (!ensured.ok) return NextResponse.json({ ok: false, error: "snapshot_failed" }, { status: 400 });

  const items = await listCheckItemsForBlueprint(businessId, blueprintId, kind);
  return NextResponse.json({ ok: true, items });
}

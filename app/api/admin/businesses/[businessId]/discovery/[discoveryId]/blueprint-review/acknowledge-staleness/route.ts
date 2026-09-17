/**
 * Client Discovery & Project Blueprint Engine, Gate 8 — an authorized reviewer explicitly
 * acknowledges releasing against the currently APPROVED blueprint despite live discovery truth
 * having moved since it was generated (MD <staleness_decision>). Never mutates blueprint status or
 * content; only records who/when/against-which-fingerprint. If truth changes again afterward, the
 * live-recomputed fingerprint stops matching and this acknowledgement stops counting — a new one
 * (or a new blueprint version) is required.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { acknowledgeBlueprintStaleness, getBlueprintById } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { computeCurrentBlueprintFingerprint } from "@/app/lib/business/projectDiscovery/releaseReadinessAssembler";
import { listProjectDiscoveryItems } from "@/app/lib/business/projectDiscovery/repository";

export const runtime = "nodejs";

interface Body {
  blueprintId?: unknown;
  note?: unknown;
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

  const items = await listProjectDiscoveryItems(discoveryId, businessId);
  const currentFingerprint = await computeCurrentBlueprintFingerprint(businessId, blueprint, items);
  if (!currentFingerprint) return NextResponse.json({ ok: false, error: "fingerprint_unavailable" }, { status: 409 });

  const result = await acknowledgeBlueprintStaleness(
    businessId,
    blueprintId,
    { currentFingerprint, note: typeof body.note === "string" ? body.note : null },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

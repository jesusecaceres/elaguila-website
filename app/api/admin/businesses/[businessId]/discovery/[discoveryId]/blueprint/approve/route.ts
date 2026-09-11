/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — approve a blueprint FOR BUILD (MD
 * <internal_review>: "a simple status button must never bypass readiness"). This is the ONE
 * transition that re-checks live readiness before writing — every other lifecycle transition here
 * only enforces the status machine (blueprintRepository.ts), because only this one turns a document
 * into the frozen contract a builder will execute against.
 *
 * Deliberately does NOT require the blueprint's stored input_fingerprint to still match the live
 * discovery state (MD <architecture_drift>/<staleness>: "never auto-invalidate approval, require
 * reviewer action") — staleness is surfaced for the reviewer to judge, never used to silently block
 * or silently allow. What IS re-checked here is whether the underlying discovery truth is still
 * READY right now (required-before-build blockers still resolved, architecture still approved, and
 * — for Custom Platform — commercial review still not a bare "pending_review" placeholder).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { buildWebsiteDiscoveryContext } from "@/app/lib/business/projectDiscovery/websiteDiscoveryContext";
import { evaluateWebsiteReadiness } from "@/app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import type { WebsiteArchitectureDecisionPacket } from "@/app/lib/business/projectDiscovery/architectureDecisionEngine";
import { evaluateWebsiteBlueprintReadiness } from "@/app/lib/business/projectDiscovery/blueprintEngine";
import { approveBlueprintForBuild, getBlueprintById } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { listProjectDiscoveryItems } from "@/app/lib/business/projectDiscovery/repository";

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

  const blueprint = await getBlueprintById(businessId, blueprintId);
  if (!blueprint) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const ctx = await buildWebsiteDiscoveryContext(businessId, blueprint.discoveryId, blueprint.projectIntentId);
  if (!ctx) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const items = await listProjectDiscoveryItems(blueprint.discoveryId, businessId);
  const approvedItem = items.find((i) => i.fieldKey === "website_architecture_decision" && i.truthClass === "technical_decision" && i.projectIntentId === blueprint.projectIntentId);
  const approvedArchitecture = approvedItem ? (approvedItem.value as unknown as WebsiteArchitectureDecisionPacket) : null;

  const readiness = evaluateWebsiteReadiness(ctx);
  const blueprintReadiness = evaluateWebsiteBlueprintReadiness(readiness, approvedArchitecture);
  if (blueprintReadiness.state !== "READY") {
    return NextResponse.json({ ok: false, error: "not_ready", state: blueprintReadiness.state, reasonEs: blueprintReadiness.reasonEs, reasonEn: blueprintReadiness.reasonEn }, { status: 409 });
  }

  const result = await approveBlueprintForBuild(businessId, blueprintId, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

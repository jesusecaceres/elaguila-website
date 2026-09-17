/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — approve a SPECIALIZED blueprint FOR BUILD.
 * Mirrors the Website approve route's own discipline exactly: re-derives LIVE readiness (including
 * live dependency-blocking state) before writing, never trusts the stored draft's own snapshot.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { buildSpecializedDiscoveryContext } from "@/app/lib/business/projectDiscovery/specializedDiscoveryContext";
import { evaluateSpecializedReadiness } from "@/app/lib/business/projectDiscovery/specializedDiscoveryEngine";
import { evaluateProjectBlueprintReadiness } from "@/app/lib/business/projectDiscovery/specializedBlueprintEngine";
import { catalogForProjectType } from "@/app/lib/business/projectDiscovery/specializedBlueprintDispatch";
import { computeBlockingDependencies } from "@/app/lib/business/projectDiscovery/projectDependencyEngine";
import { listIntentDependenciesForDiscovery } from "@/app/lib/business/projectDiscovery/projectDependencyRepository";
import { approveBlueprintForBuild, getBlueprintById, getLatestBlueprintForIntent } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { listProjectDiscoveryIntents } from "@/app/lib/business/projectDiscovery/repository";

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

  const ctx = await buildSpecializedDiscoveryContext(businessId, blueprint.discoveryId, blueprint.projectIntentId);
  if (!ctx) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const catalogEntry = catalogForProjectType(ctx.projectType);
  if (!catalogEntry) return NextResponse.json({ ok: false, error: "unsupported_project_type" }, { status: 400 });

  const [intents, dependencies] = await Promise.all([
    listProjectDiscoveryIntents(blueprint.discoveryId, businessId),
    listIntentDependenciesForDiscovery(businessId, blueprint.discoveryId),
  ]);
  const latestBlueprintByIntentId = new Map<string, string | null>();
  for (const intent of intents) {
    const latest = await getLatestBlueprintForIntent(businessId, intent.id);
    latestBlueprintByIntentId.set(intent.id, latest?.status ?? null);
  }
  const blockingDependencies = computeBlockingDependencies(blueprint.projectIntentId, dependencies, intents, latestBlueprintByIntentId);

  const readiness = evaluateSpecializedReadiness(catalogEntry.catalog, ctx);
  const blueprintReadiness = evaluateProjectBlueprintReadiness(readiness, blockingDependencies);
  if (blueprintReadiness.state !== "READY") {
    return NextResponse.json({ ok: false, error: "not_ready", state: blueprintReadiness.state, reasonEs: blueprintReadiness.reasonEs, reasonEn: blueprintReadiness.reasonEn, blockingDependencies: blueprintReadiness.blockingDependencies }, { status: 409 });
  }

  const result = await approveBlueprintForBuild(businessId, blueprintId, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — generate a new DRAFT blueprint version for
 * a SPECIALIZED (non-Website) project intent: Logo/Brand, Print Collateral, or Media Campaign.
 * Mirrors the Website generate route's own shape exactly (same manage_project_blueprint capability,
 * same readiness-gate-before-insert discipline), dispatching on the intent's own ProjectType via
 * specializedBlueprintDispatch.ts rather than duplicating a family switch here.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { buildSpecializedDiscoveryContext } from "@/app/lib/business/projectDiscovery/specializedDiscoveryContext";
import { evaluateSpecializedReadiness } from "@/app/lib/business/projectDiscovery/specializedDiscoveryEngine";
import { computeSpecializedBlueprintInputFingerprint, evaluateProjectBlueprintReadiness } from "@/app/lib/business/projectDiscovery/specializedBlueprintEngine";
import { buildSpecializedMarkdownForPacket, buildSpecializedPacketForProjectType, catalogForProjectType } from "@/app/lib/business/projectDiscovery/specializedBlueprintDispatch";
import { computeBlockingDependencies } from "@/app/lib/business/projectDiscovery/projectDependencyEngine";
import { listIntentDependenciesForDiscovery } from "@/app/lib/business/projectDiscovery/projectDependencyRepository";
import { createDraftBlueprintVersion, getLatestBlueprintForIntent } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { getProjectDiscoveryById, listProjectDiscoveryIntents, listProjectDiscoverySources } from "@/app/lib/business/projectDiscovery/repository";

export const runtime = "nodejs";

interface Body {
  intentId?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_blueprint"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const intentId = typeof body.intentId === "string" ? body.intentId : "";
  if (!intentId) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const discovery = await getProjectDiscoveryById(businessId, discoveryId);
  if (!discovery) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const ctx = await buildSpecializedDiscoveryContext(businessId, discoveryId, intentId);
  if (!ctx) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const catalogEntry = catalogForProjectType(ctx.projectType);
  if (!catalogEntry) return NextResponse.json({ ok: false, error: "unsupported_project_type" }, { status: 400 });

  const [intents, sources, business, dependencies] = await Promise.all([
    listProjectDiscoveryIntents(discoveryId, businessId),
    listProjectDiscoverySources(discoveryId, businessId),
    getAdminSupabase().from("businesses").select("display_name, public_name").eq("id", businessId).maybeSingle(),
    listIntentDependenciesForDiscovery(businessId, discoveryId),
  ]);
  if (!business.data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const latestBlueprintByIntentId = new Map<string, string | null>();
  for (const intent of intents) {
    const latest = await getLatestBlueprintForIntent(businessId, intent.id);
    latestBlueprintByIntentId.set(intent.id, latest?.status ?? null);
  }
  const blockingDependencies = computeBlockingDependencies(intentId, dependencies, intents, latestBlueprintByIntentId);

  const readiness = evaluateSpecializedReadiness(catalogEntry.catalog, ctx);
  const blueprintReadiness = evaluateProjectBlueprintReadiness(readiness, blockingDependencies);
  if (blueprintReadiness.state !== "READY") {
    return NextResponse.json({ ok: false, error: "not_ready", state: blueprintReadiness.state, reasonEs: blueprintReadiness.reasonEs, reasonEn: blueprintReadiness.reasonEn, blockingDependencies: blueprintReadiness.blockingDependencies }, { status: 409 });
  }

  const packet = buildSpecializedPacketForProjectType(ctx.projectType, {
    ctx,
    discovery: { title: discovery.title, sourceGrowthAssessmentId: discovery.sourceGrowthAssessmentId, sourceGrowthSolutionId: discovery.sourceGrowthSolutionId, sourceOpportunityId: discovery.sourceOpportunityId, sourceMeetingId: discovery.sourceMeetingId },
    intents,
    sources,
    businessDisplayName: String(business.data.display_name ?? ""),
    businessPublicName: (business.data.public_name as string | null) ?? null,
  });
  if (!packet) return NextResponse.json({ ok: false, error: "unsupported_project_type" }, { status: 400 });

  const previous = await getLatestBlueprintForIntent(businessId, intentId);
  const markdown = buildSpecializedMarkdownForPacket(packet, { version: (previous?.version ?? 0) + 1, status: "draft" });

  const result = await createDraftBlueprintVersion(
    {
      businessId,
      discoveryId,
      projectIntentId: intentId,
      blueprintType: ctx.projectType,
      packet,
      markdown,
      inputFingerprint: computeSpecializedBlueprintInputFingerprint(ctx),
      discoveryCatalogVersion: catalogEntry.catalogVersion,
      platformRegistryVersion: catalogEntry.catalogVersion,
      supersedesBlueprintId: previous ? previous.id : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });

  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

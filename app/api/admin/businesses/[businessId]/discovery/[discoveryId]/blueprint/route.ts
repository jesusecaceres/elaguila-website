/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — generate a new DRAFT Website Project
 * Blueprint version (MD <blueprint_readiness>, <versioning>). Gated on manage_project_blueprint
 * (manager+ tier — see salesWorkspaceCapabilities.ts), the same capability every other blueprint
 * lifecycle action in this gate uses, so there is exactly one capability to reason about here
 * rather than a redundant capability per action.
 *
 * This route ONLY orchestrates already-built pure functions (buildWebsiteDiscoveryContext,
 * buildWebsiteProjectBlueprintPacket, buildWebsiteProjectBlueprintMarkdown,
 * computeBlueprintInputFingerprint) and persists the result — it never invents its own readiness or
 * packet logic.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { buildWebsiteDiscoveryContext } from "@/app/lib/business/projectDiscovery/websiteDiscoveryContext";
import { evaluateWebsiteReadiness } from "@/app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import type { WebsiteArchitectureDecisionPacket } from "@/app/lib/business/projectDiscovery/architectureDecisionEngine";
import { buildWebsiteProjectBlueprintPacket, computeBlueprintInputFingerprint, evaluateWebsiteBlueprintReadiness } from "@/app/lib/business/projectDiscovery/blueprintEngine";
import { buildWebsiteProjectBlueprintMarkdown } from "@/app/lib/business/projectDiscovery/blueprintMarkdown";
import { createDraftBlueprintVersion, getLatestBlueprintForIntent } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { getProjectDiscoveryById, listProjectDiscoveryIntents, listProjectDiscoveryItems, listProjectDiscoverySources } from "@/app/lib/business/projectDiscovery/repository";

export const runtime = "nodejs";

interface GenerateBlueprintBody {
  intentId?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_blueprint"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as GenerateBlueprintBody;
  const intentId = typeof body.intentId === "string" ? body.intentId : "";
  if (!intentId) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const discovery = await getProjectDiscoveryById(businessId, discoveryId);
  if (!discovery) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const ctx = await buildWebsiteDiscoveryContext(businessId, discoveryId, intentId);
  if (!ctx) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const items = await listProjectDiscoveryItems(discoveryId, businessId);
  const approvedItem = items.find((i) => i.fieldKey === "website_architecture_decision" && i.truthClass === "technical_decision" && i.projectIntentId === intentId);
  const approvedArchitecture = approvedItem ? (approvedItem.value as unknown as WebsiteArchitectureDecisionPacket) : null;

  const readiness = evaluateWebsiteReadiness(ctx);
  const blueprintReadiness = evaluateWebsiteBlueprintReadiness(readiness, approvedArchitecture);
  if (blueprintReadiness.state !== "READY") {
    return NextResponse.json({ ok: false, error: "not_ready", state: blueprintReadiness.state, reasonEs: blueprintReadiness.reasonEs, reasonEn: blueprintReadiness.reasonEn }, { status: 409 });
  }

  const [intents, sources, business] = await Promise.all([
    listProjectDiscoveryIntents(discoveryId, businessId),
    listProjectDiscoverySources(discoveryId, businessId),
    getAdminSupabase().from("businesses").select("display_name, public_name").eq("id", businessId).maybeSingle(),
  ]);
  if (!business.data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const packet = buildWebsiteProjectBlueprintPacket({
    ctx,
    discovery: { title: discovery.title, sourceGrowthAssessmentId: discovery.sourceGrowthAssessmentId, sourceGrowthSolutionId: discovery.sourceGrowthSolutionId, sourceOpportunityId: discovery.sourceOpportunityId, sourceMeetingId: discovery.sourceMeetingId },
    intents,
    selectedIntentId: intentId,
    sources,
    approvedArchitecture: approvedArchitecture as WebsiteArchitectureDecisionPacket,
    businessDisplayName: String(business.data.display_name ?? ""),
    businessPublicName: (business.data.public_name as string | null) ?? null,
  });

  const inputFingerprint = computeBlueprintInputFingerprint(ctx, approvedArchitecture as WebsiteArchitectureDecisionPacket);
  const previous = await getLatestBlueprintForIntent(businessId, intentId);
  const markdown = buildWebsiteProjectBlueprintMarkdown(packet, { version: (previous?.version ?? 0) + 1, status: "draft" });

  const result = await createDraftBlueprintVersion(
    {
      businessId,
      discoveryId,
      projectIntentId: intentId,
      packet,
      markdown,
      inputFingerprint,
      supersedesBlueprintId: previous ? previous.id : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });

  return NextResponse.json({ ok: true, blueprint: result.blueprint });
}

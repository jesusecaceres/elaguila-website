import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, requireSalesWorkspaceAccess, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToFieldDiscoveryActor } from "@/app/admin/_lib/fieldDiscoveryActor";
import { isAiResearchEnabled } from "@/app/lib/business/aiResearch/featureFlag";
import { getDefaultBusinessIntelligenceProvider } from "@/app/lib/business/aiResearch/providerRegistry";
import { listResearchRunsForBusiness, runBusinessAiResearch } from "@/app/lib/business/aiResearch/repository";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

async function loadBusinessIdentity(businessId: string): Promise<{ displayName: string; broadBusinessType: string; businessStage: string } | null> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from("businesses").select("id, display_name, broad_business_type, business_stage").eq("id", businessId).maybeSingle();
  if (error || !data) return null;
  const row = data as { display_name: string; broad_business_type: string; business_stage: string };
  return { displayName: row.display_name, broadBusinessType: row.broad_business_type, businessStage: row.business_stage };
}

/** GET — staff-safe research run history + current provider availability for this exact business. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_field_discovery")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { businessId } = await params;
  const provider = await getDefaultBusinessIntelligenceProvider();
  const providerAvailable = await provider.isConfigured();
  const runs = await listResearchRunsForBusiness(businessId);

  return NextResponse.json({
    ok: true,
    businessId,
    providerAvailable,
    providerKey: provider.providerKey,
    runs: runs.map((r) => ({
      id: r.id,
      providerKey: r.providerKey,
      modelKey: r.modelKey,
      status: r.status,
      failureCode: r.failureCode,
      failureReason: r.failureReason,
      createdAt: r.createdAt,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
    })),
  });
}

/** POST — start a new bounded AI research run for this exact business. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "run_ai_research")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (!(await isAiResearchEnabled())) return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 503 });

  const { businessId } = await params;
  const identity = await loadBusinessIdentity(businessId);
  if (!identity) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  const result = await runBusinessAiResearch(businessId, identity, staffActorToFieldDiscoveryActor(access.actor));
  if (!result.ok) {
    const status = result.error === "provider_unavailable" || result.error === "consent_not_provided" || result.error === "source_not_found" ? 409 : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, runId: result.runId, draftId: result.draftId });
}

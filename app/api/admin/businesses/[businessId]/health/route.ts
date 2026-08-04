import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToHealthMapActor } from "@/app/admin/_lib/healthMapActor";
import { HEALTH_RUN_TRIGGER_TYPES } from "@/app/lib/business/healthMap/constants";
import { getFullRun, getLatestCompletedRun, listRunsForBusiness, runHealthAssessment } from "@/app/lib/business/healthMap/repository";
import { listEvidenceForBusiness, listFactsForBusiness } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

const TRIGGER_VALUES = new Set<string>(HEALTH_RUN_TRIGGER_TYPES.map((o) => o.value));
const STAFF_ALLOWED_TRIGGERS = new Set(["staff_requested"]);

/** GET — the latest completed run's full detail, plus recent run history. Supporting fact/evidence
 * records are only included when the caller has view_private_health_support. */
export async function GET(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_health_map")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  const [latestRun, recentRuns] = await Promise.all([getLatestCompletedRun(businessId), listRunsForBusiness(businessId, 20)]);
  if (!latestRun) {
    return NextResponse.json({ ok: true, businessId, latestRun: null, dimensionResults: [], findings: [], readiness: null, recentRuns: [] });
  }
  const full = await getFullRun(latestRun.id);
  if (!full) return NextResponse.json({ ok: false, error: "run_not_found" }, { status: 404 });

  const includeSupport = new URL(req.url).searchParams.get("includeSupport") === "1";
  let supportingFacts: unknown[] = [];
  let supportingEvidence: unknown[] = [];
  if (includeSupport && actorHasCapability(access.actor, "view_private_health_support")) {
    const supportingFactIds = new Set(full.dimensionResults.flatMap((d) => d.supportingFactIds));
    const supportingEvidenceIds = new Set(full.dimensionResults.flatMap((d) => d.supportingEvidenceIds));
    const [allFacts, allEvidence] = await Promise.all([listFactsForBusiness(businessId, true), listEvidenceForBusiness(businessId)]);
    supportingFacts = allFacts.filter((f) => supportingFactIds.has(f.id));
    supportingEvidence = allEvidence.filter((e) => supportingEvidenceIds.has(e.id));
  }

  return NextResponse.json({
    ok: true,
    businessId,
    latestRun: full.run,
    dimensionResults: full.dimensionResults,
    findings: full.findings,
    readiness: full.readiness,
    recentRuns,
    supportingFacts,
    supportingEvidence,
  });
}

/** POST — run a new, immutable assessment. Staff-triggered runs are always trigger_type=staff_requested. */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "run_business_health_assessment")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const requestedTrigger = typeof (body as Record<string, unknown>).triggerType === "string" ? (body as Record<string, unknown>).triggerType : "staff_requested";
  const triggerType = typeof requestedTrigger === "string" && TRIGGER_VALUES.has(requestedTrigger) && STAFF_ALLOWED_TRIGGERS.has(requestedTrigger)
    ? (requestedTrigger as "staff_requested")
    : "staff_requested";

  const result = await runHealthAssessment(businessId, triggerType, staffActorToHealthMapActor(access.actor));
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, run: result.result.run, dimensionResults: result.result.dimensionResults, findings: result.result.findings, readiness: result.result.readiness }, { status: 201 });
}

import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { shapeEvidenceForStaffActor, shapeFactsForStaffActor } from "@/app/admin/_lib/livingBookVisibility";
import {
  listBookHistory, listContradictionsForBusiness, listCorrectionsForBusiness, listDiscoverySessionsForBusiness,
  listEvidenceForBusiness, listFactsForBusiness, listUnknownsForBusiness,
} from "@/app/lib/business/livingBook/repository";
import { computeBookCompleteness } from "@/app/lib/business/livingBook/logic";

export const dynamic = "force-dynamic";

/** GET — the full Living Business Book payload for one business, shaped by the caller's capabilities. */
export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_book")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  const [factsRaw, evidenceRaw, unknowns, contradictions, corrections, discoverySessions, history] = await Promise.all([
    listFactsForBusiness(businessId),
    listEvidenceForBusiness(businessId),
    listUnknownsForBusiness(businessId),
    listContradictionsForBusiness(businessId),
    listCorrectionsForBusiness(businessId),
    listDiscoverySessionsForBusiness(businessId),
    actorHasCapability(access.actor, "view_business_history") ? listBookHistory(businessId, 100) : Promise.resolve([]),
  ]);

  const facts = shapeFactsForStaffActor(factsRaw, access.actor.capabilities);
  const evidence = shapeEvidenceForStaffActor(evidenceRaw, access.actor.capabilities);

  const completeness = computeBookCompleteness({
    facts: facts.map((f) => ({ status: f.status, sourceClass: f.sourceClass, lastVerifiedAt: f.lastVerifiedAt })),
    unknowns,
    contradictions,
    discoveryAnswered: null,
    discoveryTotal: null,
    nowIso: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, facts, evidence, unknowns, contradictions, corrections, discoverySessions, history, completeness });
}

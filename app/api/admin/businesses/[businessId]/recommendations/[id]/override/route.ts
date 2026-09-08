import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToStewardshipActor } from "@/app/admin/_lib/stewardshipActor";
import { recordOverride, type OverridePatch } from "@/app/lib/business/stewardship/repository";
import { COST_BANDS, EXPECTED_EFFORTS, PRIMARY_INTERVENTIONS } from "@/app/lib/business/stewardship/constants";

export const dynamic = "force-dynamic";

type OverrideBody = { reason?: unknown; patch?: unknown };

const PATCHABLE_STRING_FIELDS = [
  "verifiedNeedEs", "verifiedNeedEn", "businessConsequenceEs", "businessConsequenceEn",
  "ownerGoalAlignmentEs", "ownerGoalAlignmentEn", "capacityImpactEs", "capacityImpactEn",
  "freeOptionEs", "freeOptionEn", "guidedOptionEs", "guidedOptionEn",
  "correctiveServiceOptionEs", "correctiveServiceOptionEn", "managedOptionEs", "managedOptionEn",
  "externalReferralOptionEs", "externalReferralOptionEn", "doNothingYetOptionEs", "doNothingYetOptionEn",
  "successMetricEs", "successMetricEn",
] as const;

/**
 * POST /api/admin/businesses/[businessId]/recommendations/[id]/override — body: {reason, patch}.
 * Only a manager+ staff actor with override_recommendation may reach this. The reason is
 * required and non-empty; the patch is validated field-by-field against the bounded schema —
 * never a free-form field update, never a bypass of readiness or a rewrite of a test row.
 */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string; id: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "override_recommendation")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId, id } = await ctx.params;

  let body: OverrideBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) return NextResponse.json({ ok: false, error: "empty_reason" }, { status: 400 });

  const rawPatch = (body.patch && typeof body.patch === "object" ? body.patch : {}) as Record<string, unknown>;
  const patch: OverridePatch = {};
  for (const field of PATCHABLE_STRING_FIELDS) {
    if (typeof rawPatch[field] === "string" || rawPatch[field] === null) {
      (patch as Record<string, unknown>)[field] = rawPatch[field];
    }
  }
  if (typeof rawPatch.primaryIntervention === "string" && (PRIMARY_INTERVENTIONS as readonly string[]).includes(rawPatch.primaryIntervention)) {
    patch.primaryIntervention = rawPatch.primaryIntervention as OverridePatch["primaryIntervention"];
  }
  if (typeof rawPatch.expectedEffort === "string" && (EXPECTED_EFFORTS as readonly string[]).includes(rawPatch.expectedEffort)) {
    patch.expectedEffort = rawPatch.expectedEffort as OverridePatch["expectedEffort"];
  }
  if (typeof rawPatch.costBand === "string" && (COST_BANDS as readonly string[]).includes(rawPatch.costBand)) {
    patch.costBand = rawPatch.costBand as OverridePatch["costBand"];
  }
  if (typeof rawPatch.reviewDate === "string" || rawPatch.reviewDate === null) {
    patch.reviewDate = rawPatch.reviewDate as string | null;
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false, error: "no_changes" }, { status: 400 });

  const actor = staffActorToStewardshipActor(access.actor);
  const result = await recordOverride(actor, businessId, id, reason, patch);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, recommendation: result.recommendation, override: result.override });
}

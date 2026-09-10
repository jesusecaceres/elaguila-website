import { NextResponse, type NextRequest } from "next/server";
import { findActiveMembershipForCurrentUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { resolveHealthMapFlagTier } from "@/app/lib/business/healthMap/featureFlag";
import { getFullRun, getLatestCompletedRun } from "@/app/lib/business/healthMap/repository";
import { shapeDimensionResultsForOwnerView, shapeFindingsForOwnerView } from "@/app/lib/business/healthMap/logic";

/**
 * GET /api/dashboard/business/health — the owner-safe "Business Health Map" view (Gate BCO-6A,
 * Gate 5). RLS (via userClient) proves the caller owns this business; the actual Health Map read
 * then goes through the service-role repository (these tables have zero RLS policies by design),
 * scoped to the RLS-verified businessId only. Never returns confidence machinery, supporting
 * record ids, evidence, internal audit history, or the internal recommendation-readiness gate —
 * those are staff/system-only constructs, not something an owner needs to interpret.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // Gate BCO-6A, Gate 5 — unlike Living Book's softer rollout, the Health Map is explicitly
  // required to stay hidden while the flag is disabled: only "global" (enabled for everyone) or
  // "pilot" (this user is in pilot_user_ids) may see it. "preview" is a real, distinct tier
  // (disabled + not a pilot user) and must be treated as unavailable here.
  const tier = await resolveHealthMapFlagTier(userId);
  if (tier === "unavailable" || tier === "preview") {
    return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });
  }

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForCurrentUser(userClient, userId);
  if (!membership) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });
  const business = await getBusinessByIdForCurrentUser(userClient, membership.businessId);
  if (!business) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });

  const latestRun = await getLatestCompletedRun(business.id);
  if (!latestRun) {
    return NextResponse.json({ ok: true, businessId: business.id, assessedAt: null, dimensions: [], findings: [] });
  }
  const full = await getFullRun(latestRun.id);
  if (!full) return NextResponse.json({ ok: true, businessId: business.id, assessedAt: null, dimensions: [], findings: [] });

  return NextResponse.json({
    ok: true,
    businessId: business.id,
    assessedAt: full.run.completedAt,
    dimensions: shapeDimensionResultsForOwnerView(full.dimensionResults),
    findings: shapeFindingsForOwnerView(full.findings).map((f) => ({
      findingType: f.findingType,
      titleEs: f.titleEs,
      titleEn: f.titleEn,
      explanationEs: f.explanationEs,
      explanationEn: f.explanationEn,
    })),
  });
}

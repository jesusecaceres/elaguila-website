import { NextResponse, type NextRequest } from "next/server";
import { findActiveMembershipForCurrentUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { resolveLivingBookFlagTier } from "@/app/lib/business/livingBook/featureFlag";
import { listFactsForBusiness, listUnknownsForBusiness, listCorrectionsForBusiness } from "@/app/lib/business/livingBook/repository";
import { shapeFactsForOwnerView, shapeUnknownsForOwnerView } from "@/app/lib/business/livingBook/logic";

/**
 * GET /api/dashboard/business/book — "What Leonix Understands About Your Business" (Gate BCO-5A,
 * Gate 5). RLS (via userClient) proves the caller owns this business; the actual Living Business
 * Book read then goes through the service-role repository (these tables have zero RLS policies by
 * design), scoped to the RLS-verified businessId only — never a caller-supplied business id.
 * Never returns internal staff notes, internal sales status, internal audit metadata, staff-only
 * observations, private evidence, AI reasoning, or another business's information.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tier = await resolveLivingBookFlagTier(userId);
  if (tier === "unavailable") {
    return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });
  }

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForCurrentUser(userClient, userId);
  if (!membership) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });
  const business = await getBusinessByIdForCurrentUser(userClient, membership.businessId);
  if (!business) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });

  const [factsRaw, unknownsRaw, corrections] = await Promise.all([
    listFactsForBusiness(business.id),
    listUnknownsForBusiness(business.id),
    listCorrectionsForBusiness(business.id),
  ]);

  const facts = shapeFactsForOwnerView(factsRaw);
  const unknowns = shapeUnknownsForOwnerView(unknownsRaw);
  // Owner sees only their own submitted corrections and their outcome — never staff clarification
  // requests, decision notes, or another actor's submissions.
  const ownCorrections = corrections
    .filter((c) => c.submittedActorType === "owner" && c.correctionType !== "staff_clarification_request")
    .map((c) => ({ id: c.id, relatedFactId: c.relatedFactId, correctionType: c.correctionType, status: c.status, createdAt: c.createdAt }));

  return NextResponse.json({ ok: true, businessId: business.id, facts, unknowns, corrections: ownCorrections });
}

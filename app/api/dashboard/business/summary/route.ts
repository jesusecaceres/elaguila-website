import { NextResponse, type NextRequest } from "next/server";
import { listContactsForBusiness } from "@/app/lib/business/repositories/contactsRepo";
import { listServiceAreasForBusiness } from "@/app/lib/business/repositories/serviceAreasRepo";
import { listListingLinksForBusiness } from "@/app/lib/business/repositories/listingLinksRepo";
import { findActiveMembershipForCurrentUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";

/**
 * GET /api/dashboard/business/summary — the completed Business Identity view's data source
 * (Phase 10 of Package BCO-3). RLS-scoped throughout: this route can only ever return the
 * caller's own business, its own membership, and its own child rows — never another owner's.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForCurrentUser(userClient, userId);
  if (!membership) return NextResponse.json({ error: "no_business" }, { status: 404 });

  const business = await getBusinessByIdForCurrentUser(userClient, membership.businessId);
  if (!business) return NextResponse.json({ error: "no_business" }, { status: 404 });

  const [contacts, serviceAreas, listingLinks] = await Promise.all([
    listContactsForBusiness(userClient, business.id),
    listServiceAreasForBusiness(userClient, business.id),
    listListingLinksForBusiness(userClient, business.id),
  ]);

  return NextResponse.json({ business, membership, contacts, serviceAreas, listingLinks });
}

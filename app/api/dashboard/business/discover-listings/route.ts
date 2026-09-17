import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { discoverOwnedListingCandidates, buildTestOverrideOwnedListingCandidate } from "@/app/lib/business/listingLinking";
import { shouldApplyTestOverride } from "@/app/lib/business/featureFlagLogic";
import { extractBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";

/**
 * GET /api/dashboard/business/discover-listings — Gate BCO-3R Phase 10. Replaces manual
 * listing-source/ID entry: scans every supported source for rows owned by the caller, using
 * the same canonical ownership contract as verify-listing/finalize. Read-only.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  if (shouldApplyTestOverride({ userId, vercelEnv: process.env.VERCEL_ENV, overrideUserId: process.env.BUSINESS_IDENTITY_TEST_OVERRIDE_USER_ID })) {
    return NextResponse.json({ candidates: [buildTestOverrideOwnedListingCandidate()], testOverride: true });
  }

  const candidates = await discoverOwnedListingCandidates(getAdminSupabase(), userId);
  return NextResponse.json({ candidates, testOverride: false });
}

import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { verifyListingOwnershipForLinking } from "@/app/lib/business/listingLinking";
import { extractBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";

/**
 * POST /api/dashboard/business/verify-listing — Phase 6 (wizard step 6) pre-check, so the
 * onboarding UI can show "verified"/"pending"/"unsupported" feedback before final submission.
 * Read-only; never mutates the listing row. The finalize RPC independently re-verifies
 * ownership itself regardless of this route's result (see finalize_business_identity's own
 * per-table branches) — this route exists purely for UX feedback, not as the security boundary.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { listingSource?: unknown; listingId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const listingSource = typeof body.listingSource === "string" ? body.listingSource : "";
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  if (!listingSource || !listingId) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const result = await verifyListingOwnershipForLinking(getAdminSupabase(), { userId, listingSource, listingId });
  return NextResponse.json({ result });
}

import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveDuplicateWarning } from "@/app/lib/business/duplicates";
import { normalizeComparisonName } from "@/app/lib/business/normalization";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";

/** POST /api/dashboard/business/duplicates — bounded, privacy-safe duplicate warning check. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { displayName?: unknown; listingSource?: unknown; listingId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const displayName = typeof body.displayName === "string" ? body.displayName : "";
  const normalizedName = normalizeComparisonName(displayName);
  if (!normalizedName) return NextResponse.json({ error: "invalid_display_name" }, { status: 400 });

  const listingCandidate =
    typeof body.listingSource === "string" && typeof body.listingId === "string"
      ? { listingSource: body.listingSource, listingId: body.listingId }
      : null;

  const userClient = getServerSupabaseForBearerToken(token);
  const result = await resolveDuplicateWarning(getAdminSupabase(), userClient, {
    currentUserId: userId,
    normalizedName,
    normalizedPhone: null,
    normalizedEmail: null,
    normalizedDomain: null,
    normalizedServiceAreaText: null,
    listingCandidate,
  });
  return NextResponse.json({ result });
}

import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessToolsAccess } from "@/app/lib/business/access";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";

/** GET /api/dashboard/business/access — resolves the Business Tools access state (Phase 8/13). */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ resolution: { state: "signed_out" } });
  }

  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) {
    return NextResponse.json({ resolution: { state: "signed_out" } });
  }

  const userClient = getServerSupabaseForBearerToken(token);
  const resolution = await resolveBusinessToolsAccess(userId, userClient);
  return NextResponse.json({ resolution });
}

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { listMembershipsForCurrentUser } from "@/app/lib/business/repositories/membershipsRepo";
import { listActiveBusinessesForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";

/**
 * GET /api/dashboard/business/diy-concierge/my-businesses — lists every business the signed-in
 * user has an ACTIVE membership in (RLS-scoped, never a service-role scan). An owner may control
 * multiple businesses; this exists purely so the DIY Concierge UI can let the owner pick which
 * exact business to view — no personalized data is returned here, only id + display name.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const userClient = getServerSupabaseForBearerToken(token);
  const [memberships, businesses] = await Promise.all([
    listMembershipsForCurrentUser(userClient),
    listActiveBusinessesForCurrentUser(userClient),
  ]);
  const memberBusinessIds = new Set(memberships.map((m) => m.businessId));
  const own = businesses.filter((b) => memberBusinessIds.has(b.id)).map((b) => ({ businessId: b.id, displayName: b.displayName }));

  return NextResponse.json({ ok: true, businesses: own });
}

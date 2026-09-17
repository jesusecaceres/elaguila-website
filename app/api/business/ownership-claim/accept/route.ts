/**
 * Systemic Repair Build — owner-side Owner Claim / Handoff acceptance.
 * The caller MUST already be authenticated (real Supabase Auth session, never bootstrap — this
 * route is not under /admin at all). Runs the RPC through a bearer-token-scoped client so
 * accept_business_ownership_claim() resolves auth.uid() as the real caller — never the admin
 * client — matching the exact convention finalize_business_identity_v3 already established.
 */
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { acceptOwnershipClaim } from "@/app/lib/business/ownership/repository";
import { isOwnershipClaimEnabled } from "@/app/lib/business/ownership/featureFlag";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!(await isOwnershipClaimEnabled())) return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const rawToken = typeof (body as { token?: unknown }).token === "string" ? (body as { token: string }).token.trim() : "";
  if (!rawToken) return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });

  const callerClient = getServerSupabaseForBearerToken(token);
  const result = await acceptOwnershipClaim(callerClient, rawToken);
  if (!result.ok) {
    const status = result.error === "not_authenticated" ? 401 : result.error === "claim_not_found" ? 404 : 409;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, businessId: result.businessId });
}

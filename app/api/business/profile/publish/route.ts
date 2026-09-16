/**
 * Staff-Created Business Profile pipeline -- the owner-only publish/unpublish action. POST with
 * {action:"publish"} calls publish_business_profile(), which enforces the existing commercial
 * entitlement truth (business_listing_links x listing_package_entitlements) and fails closed with
 * `no_active_entitlement` if this business has no active, verified entitlement -- no pricing rule
 * is fabricated here. POST with {action:"unpublish"} takes a published profile back to draft.
 */
import { NextResponse, type NextRequest } from "next/server";
import { findActiveMembershipForBusinessAndUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getOwnBusinessProfile, publishOwnBusinessProfile, unpublishOwnBusinessProfile } from "@/app/lib/business/profile/repository";
import { isBusinessProfileEnabled } from "@/app/lib/business/profile/featureFlag";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isBusinessProfileEnabled())) return NextResponse.json({ error: "feature_disabled" }, { status: 503 });

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const businessId = typeof (body as { businessId?: unknown }).businessId === "string" ? (body as { businessId: string }).businessId : "";
  const action = (body as { action?: unknown }).action === "unpublish" ? "unpublish" : "publish";
  if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForBusinessAndUser(userClient, businessId, userId);
  if (!membership) return NextResponse.json({ error: "no_business" }, { status: 404 });

  const result = action === "publish"
    ? await publishOwnBusinessProfile(userClient, businessId)
    : await unpublishOwnBusinessProfile(userClient, businessId);

  if (!result.ok) {
    const status = result.error === "no_active_entitlement" || result.error === "profile_not_found" ? 409 : result.error === "not_a_member" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const profile = await getOwnBusinessProfile(userClient, businessId);
  return NextResponse.json({ ok: true, profile });
}

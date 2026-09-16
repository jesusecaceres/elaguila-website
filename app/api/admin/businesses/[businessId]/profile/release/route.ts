/**
 * Staff-Created Business Profile pipeline -- Gate 07/09 "Release to Client." This is NOT a second
 * claim/handoff engine: it calls the exact same createOwnershipClaim() the generic
 * /api/admin/businesses/[businessId]/ownership-claim route uses, so every resulting row lands in
 * the same business_ownership_claims table and is visible/revocable from the existing
 * OwnershipClaimPanel exactly as if it had been generated there directly.
 *
 * The ONLY thing this route adds is a server-side commercial-eligibility gate in front of that
 * call, specific to the Business-Profile sales story: release is refused with
 * no_active_entitlement unless business_listing_links x listing_package_entitlements (path A) or
 * business_profile_entitlements (path B) already shows this business as commercially authorized
 * -- mirroring exactly what publish_business_profile() will itself enforce later, so staff can
 * never hand off a profile that could never legally be published anyway.
 *
 * The generic /ownership-claim route is untouched and still fully usable for any Business
 * Concierge claim need outside this Profile-sales flow.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { isOwnershipClaimEnabled } from "@/app/lib/business/ownership/featureFlag";
import { createOwnershipClaim } from "@/app/lib/business/ownership/repository";
import { resolveBusinessProfileCommercialState } from "@/app/lib/business/profile/entitlementRepository";
import { getAdminSupabase } from "@/app/lib/supabase/server";

async function businessExists(businessId: string): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from("businesses").select("id").eq("id", businessId).maybeSingle();
  return !error && !!data;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("generate_ownership_claim");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  if (!(await isOwnershipClaimEnabled())) return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 503 });

  const { businessId } = await params;
  if (!(await businessExists(businessId))) {
    return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });
  }

  const commercial = await resolveBusinessProfileCommercialState(businessId);
  if (!commercial.eligible) {
    return NextResponse.json({ ok: false, error: "no_active_entitlement", commercial }, { status: 409 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const intendedOwnerEmail = typeof (body as { intendedOwnerEmail?: unknown }).intendedOwnerEmail === "string"
    ? ((body as { intendedOwnerEmail: string }).intendedOwnerEmail.trim() || null)
    : null;

  const result = await createOwnershipClaim({ businessId, intendedOwnerEmail }, access.actor);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "claim_already_pending" ? 409 : 400 });
  }

  return NextResponse.json({
    ok: true,
    claim: result.claim,
    claimLink: `/dashboard/business-tools/claim/${result.rawToken}`,
  }, { status: 201 });
}

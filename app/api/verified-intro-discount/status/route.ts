import { NextResponse, type NextRequest } from "next/server";
import { getVerifiedBearerUser } from "@/app/api/_lib/verifiedBearerUser";
import { resolveVerifiedIntroDiscountEligibility } from "@/app/lib/listingPlans/verifiedIntroDiscount";
import { isTwilioVerifyConfigured } from "@/app/lib/sms/twilioVerifyProvider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Preview-only read for the "verify for 15% off" UI banner. Never the enforcement mechanism —
 * the checkout route independently re-derives eligibility and performs the atomic reservation.
 * Response is intentionally minimal: no business-identity internals, no redemption ids.
 */
export async function GET(request: NextRequest) {
  const verifiedUser = await getVerifiedBearerUser(request);
  if (!verifiedUser) {
    return NextResponse.json({ ok: false, code: "auth_required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "";
  const packageKey = searchParams.get("packageKey") ?? "";
  const listingId = searchParams.get("listingId");

  const result = await resolveVerifiedIntroDiscountEligibility({
    ownerUserId: verifiedUser.id,
    email: verifiedUser.email,
    emailConfirmedAt: verifiedUser.emailConfirmedAt,
    category,
    packageKey,
    listingId,
    activeDiscountSource: null,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.code }, { status: result.code === "owner_required" ? 401 : 503 });
  }

  return NextResponse.json({
    ok: true,
    eligible: result.eligible,
    reasonCode: result.eligible ? null : result.reasonCode,
    emailVerified: result.emailVerified,
    phoneVerified: result.phoneVerified,
    smsConfigured: isTwilioVerifyConfigured(),
  });
}

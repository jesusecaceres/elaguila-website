import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { twilioVerifyProvider } from "@/app/lib/sms/twilioVerifyProvider";
import { claimRateLimitSlot } from "@/app/lib/sms/phoneVerificationRateLimit";
import { CHECK_TEN_MIN } from "@/app/lib/sms/phoneVerificationRateLimitPolicy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CHALLENGES_TABLE = "leonix_phone_verification_challenges";
const PHONE_IDENTITIES_TABLE = "leonix_verified_phone_identities";
const E164_RE = /^\+[1-9]\d{7,14}$/;

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });
  }

  const ownerUserId = await getBearerUserId(request);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, code: "auth_required" }, { status: 401 });
  }

  let body: { phoneE164?: string; code?: string };
  try {
    body = (await request.json()) as { phoneE164?: string; code?: string };
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_body" }, { status: 400 });
  }
  const phoneE164 = String(body.phoneE164 ?? "").trim();
  const code = String(body.code ?? "").trim();
  if (!E164_RE.test(phoneE164) || !code) {
    return NextResponse.json({ ok: false, code: "invalid_request" }, { status: 400 });
  }

  const rateCheck = await claimRateLimitSlot({
    rateSubject: phoneE164,
    rateWindowKind: "check_ten_min",
    config: CHECK_TEN_MIN,
    attemptKind: "check",
    phoneE164,
    ownerUserId,
  });
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, code: "rate_limited_check" }, { status: 429 });
  }

  const supabase = getAdminSupabase();

  // A challenge must exist and still be open (this owner's own pending request) — a wrong-code
  // guess for a request that was never made, or already resolved, is rejected without ever
  // calling Twilio, so we never leak whether a phone has an active challenge for another owner.
  const { data: openChallenge } = await supabase
    .from(CHALLENGES_TABLE)
    .select("id")
    .eq("owner_user_id", ownerUserId)
    .eq("phone_e164", phoneE164)
    .eq("attempt_kind", "request")
    .eq("outcome", "pending")
    .not("provider_verification_sid", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!openChallenge) {
    return NextResponse.json({ ok: false, code: "challenge_expired" }, { status: 410 });
  }

  const result = await twilioVerifyProvider.checkVerification({ phoneE164, code });

  if (!result.ok) {
    if (result.code === "NOT_CONFIGURED") {
      return NextResponse.json({ ok: false, code: "sms_not_configured" }, { status: 503 });
    }
    if (result.code === "EXPIRED_OR_NOT_FOUND") {
      return NextResponse.json({ ok: false, code: "challenge_expired" }, { status: 410 });
    }
    return NextResponse.json({ ok: false, code: "provider_error" }, { status: 502 });
  }

  if (!result.approved) {
    return NextResponse.json({ ok: true, verified: false });
  }

  const now = new Date().toISOString();
  await supabase
    .from(CHALLENGES_TABLE)
    .update({ outcome: "approved", updated_at: now })
    .eq("id", openChallenge.id);

  const { error: upsertError } = await supabase
    .from(PHONE_IDENTITIES_TABLE)
    .upsert(
      {
        owner_user_id: ownerUserId,
        phone_e164: phoneE164,
        verified_at: now,
        verification_challenge_id: openChallenge.id,
        updated_at: now,
      },
      { onConflict: "owner_user_id,phone_e164" },
    );

  if (upsertError) {
    return NextResponse.json({ ok: false, code: "verification_record_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, verified: true });
}

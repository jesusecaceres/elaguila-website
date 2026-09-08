import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { twilioVerifyProvider } from "@/app/lib/sms/twilioVerifyProvider";
import {
  claimRateLimitSlot,
  hashIp,
} from "@/app/lib/sms/phoneVerificationRateLimit";
import {
  REQUEST_COOLDOWN,
  REQUEST_HOURLY_PHONE,
  REQUEST_HOURLY_IP,
} from "@/app/lib/sms/phoneVerificationRateLimitPolicy";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TABLE = "leonix_phone_verification_challenges";
const E164_RE = /^\+[1-9]\d{7,14}$/;

function requestIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });
  }

  const ownerUserId = await getBearerUserId(request);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, code: "auth_required" }, { status: 401 });
  }

  let body: { phoneE164?: string };
  try {
    body = (await request.json()) as { phoneE164?: string };
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_body" }, { status: 400 });
  }
  const phoneE164 = String(body.phoneE164 ?? "").trim();
  if (!E164_RE.test(phoneE164)) {
    return NextResponse.json({ ok: false, code: "invalid_phone" }, { status: 400 });
  }

  const ipHash = `ip:${hashIp(requestIp(request))}`;

  const cooldown = await claimRateLimitSlot({
    rateSubject: phoneE164,
    rateWindowKind: "request_cooldown",
    config: REQUEST_COOLDOWN,
    attemptKind: "request",
    phoneE164,
    ownerUserId,
  });
  if (!cooldown.allowed) {
    return NextResponse.json({ ok: false, code: "rate_limited_cooldown" }, { status: 429 });
  }

  const phoneHourly = await claimRateLimitSlot({
    rateSubject: phoneE164,
    rateWindowKind: "request_hourly",
    config: REQUEST_HOURLY_PHONE,
    attemptKind: "request",
    phoneE164,
    ownerUserId,
  });
  if (!phoneHourly.allowed) {
    return NextResponse.json({ ok: false, code: "rate_limited_phone" }, { status: 429 });
  }

  const ipHourly = await claimRateLimitSlot({
    rateSubject: ipHash,
    rateWindowKind: "request_hourly",
    config: REQUEST_HOURLY_IP,
    attemptKind: "request",
    phoneE164,
    ownerUserId,
  });
  if (!ipHourly.allowed) {
    return NextResponse.json({ ok: false, code: "rate_limited_ip" }, { status: 429 });
  }

  const supabase = getAdminSupabase();
  const reservationKey = createHash("sha256").update(`${ownerUserId}|${phoneE164}`, "utf8").digest("hex");

  const { data: reserved, error: reserveError } = await supabase
    .from(TABLE)
    .insert({
      owner_user_id: ownerUserId,
      phone_e164: phoneE164,
      attempt_kind: "request",
      outcome: "pending",
      reservation_key: reservationKey,
      provider: "twilio_verify",
    })
    .select("id")
    .single();

  if (reserveError) {
    if (reserveError.code === "23505") {
      return NextResponse.json({ ok: false, code: "verification_in_progress" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, code: "reservation_failed" }, { status: 500 });
  }

  const result = await twilioVerifyProvider.requestVerification({ phoneE164, channel: "sms" });

  if (!result.ok) {
    // Free the reservation slot immediately — a failed dispatch must not block a real retry.
    await supabase
      .from(TABLE)
      .update({ outcome: "error", updated_at: new Date().toISOString() })
      .eq("id", reserved.id);
    if (result.code === "NOT_CONFIGURED") {
      return NextResponse.json({ ok: false, code: "sms_not_configured" }, { status: 503 });
    }
    if (result.code === "INVALID_PHONE") {
      return NextResponse.json({ ok: false, code: "invalid_phone" }, { status: 400 });
    }
    if (result.code === "RATE_LIMITED_UPSTREAM") {
      return NextResponse.json({ ok: false, code: "rate_limited_upstream" }, { status: 429 });
    }
    return NextResponse.json({ ok: false, code: "provider_error" }, { status: 502 });
  }

  await supabase
    .from(TABLE)
    .update({ provider_verification_sid: result.providerVerificationSid, updated_at: new Date().toISOString() })
    .eq("id", reserved.id);

  return NextResponse.json({ ok: true, expiresInSeconds: 600 });
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requestHumanConnectionVideoSession } from "@/app/lib/digitalContact/humanConnection/videoSessionService";
import type { HumanConnectionSurface } from "@/app/lib/digitalContact/humanConnection/humanConnectionTypes";
import { insertDigitalContactAnalyticsEvent } from "@/app/lib/digitalContact/digitalContactOpsTablesServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKeyFrom(reqHeaders: Headers): string {
  const fwd = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = reqHeaders.get("x-real-ip")?.trim();
  const ip = fwd || real || "unknown";
  return ip.slice(0, 64);
}

/**
 * POST /api/digital-contact/video/request
 * Server re-checks eligibility + provider; returns visitor-safe ephemeral session only.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const profileSlug = String(b.profileSlug ?? "").trim().toLowerCase();
  const visitorFirstName = String(b.visitorFirstName ?? "");
  const reasonForVisit = String(b.reasonForVisit ?? "");
  const lang = b.lang === "en" ? "en" : "es";
  const surface: HumanConnectionSurface =
    b.surface === "digital_contact" ? "digital_contact" : "virtual_front_desk";
  const source = b.source != null ? String(b.source) : null;

  // Reject client-supplied availability claims / redirect URLs entirely.
  if (b.available === true || b.joinUrl || b.hostUrl || b.redirectUrl) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const h = await headers();
  const clientKey = clientKeyFrom(h);

  void insertDigitalContactAnalyticsEvent({
    profileSlug: profileSlug || "unknown",
    eventType: "video_request_started",
    meta: { surface, source, lang },
  }).catch(() => {});

  const result = await requestHumanConnectionVideoSession({
    profileSlug,
    visitorFirstName,
    reasonForVisit,
    lang,
    surface,
    source,
    clientKey,
  });

  if (!result.ok) {
    const status =
      result.error === "rate_limited"
        ? 429
        : result.error === "executive_not_found"
          ? 404
          : result.error === "provider_unconfigured" ||
              result.error === "not_eligible" ||
              result.error === "kill_switch_off"
            ? 403
            : result.error === "invalid_request"
              ? 400
              : result.error === "notification_failed"
                ? 503
                : 503;

    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        eligibilityReason: result.eligibilityReason ?? null,
      },
      { status },
    );
  }

  // Visitor-safe payload only — never host join URL / secrets.
  return NextResponse.json({
    ok: true,
    session: {
      sessionId: result.visitor.sessionId,
      visitorJoinUrl: result.visitor.visitorJoinUrl,
      expiresAt: result.visitor.expiresAt,
      providerId: result.visitor.providerId,
    },
  });
}

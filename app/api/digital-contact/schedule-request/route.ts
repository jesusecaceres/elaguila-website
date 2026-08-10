import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { submitHumanConnectionScheduleRequest } from "@/app/lib/digitalContact/humanConnection/scheduleRequestServer";
import type {
  HumanConnectionSurface,
  ScheduleContactMethod,
} from "@/app/lib/digitalContact/humanConnection/humanConnectionTypes";
import { insertDigitalContactAnalyticsEvent } from "@/app/lib/digitalContact/digitalContactOpsTablesServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKeyFrom(reqHeaders: Headers): string {
  const fwd = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = reqHeaders.get("x-real-ip")?.trim();
  return (fwd || real || "unknown").slice(0, 64);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const profileSlug = String(b.profileSlug ?? "").trim().toLowerCase();
  const visitorName = String(b.visitorName ?? "");
  const contactMethod = String(b.contactMethod ?? "") as ScheduleContactMethod;
  const email = String(b.email ?? "");
  const phone = String(b.phone ?? "");
  const preferredTime = String(b.preferredTime ?? "");
  const message = String(b.message ?? "");
  const lang = b.lang === "en" ? "en" : "es";
  const surface: HumanConnectionSurface =
    b.surface === "digital_contact" ? "digital_contact" : "virtual_front_desk";
  const source = b.source != null ? String(b.source) : null;
  const honeypot = String(b.website ?? "");

  // Reject fake confirmation claims from clients.
  if (b.appointmentConfirmed === true || b.booked === true) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const h = await headers();
  const clientKey = clientKeyFrom(h);

  void insertDigitalContactAnalyticsEvent({
    profileSlug: profileSlug || "unknown",
    eventType: "schedule_request_started",
    meta: { surface, source, lang },
  }).catch(() => {});

  const result = await submitHumanConnectionScheduleRequest({
    profileSlug,
    visitorName,
    contactMethod,
    email,
    phone,
    preferredTime,
    message,
    lang,
    surface,
    source,
    clientKey,
    honeypot,
  });

  if (!result.ok) {
    const status =
      result.error === "rate_limited"
        ? 429
        : result.error === "profile_not_found"
          ? 404
          : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json(
    {
      ok: true,
      id: result.id,
      stored: result.stored,
      emailNotified: result.emailNotified,
      /** Explicit: never a confirmed appointment. */
      appointmentConfirmed: false,
    },
    { status: result.stored ? 201 : 200 },
  );
}

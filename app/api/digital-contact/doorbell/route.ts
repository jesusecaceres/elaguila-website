import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { requireAdminCookie, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getDigitalContactProfile, listActiveDigitalContactProfiles } from "@/app/lib/digitalContact/digitalContactRegistry";
import {
  deactivatePushSubscription,
  listPushSubscriptionsForAdmin,
  upsertPushSubscription,
} from "@/app/lib/digitalContact/humanConnection/pushSubscriptionStore";
import { dispatchDigitalContactDoorbell } from "@/app/lib/digitalContact/humanConnection/doorbellDispatcher";
import { insertDigitalContactAnalyticsEvent } from "@/app/lib/digitalContact/digitalContactOpsTablesServer";
import { isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff-only doorbell subscription management. */
export async function GET(req: Request) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const slug = String(url.searchParams.get("slug") ?? "chuy")
    .trim()
    .toLowerCase();
  if (!getDigitalContactProfile(slug)) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }
  const devices = await listPushSubscriptionsForAdmin(slug);
  return NextResponse.json({
    ok: true,
    slug,
    webPushConfigured: isWebPushConfigured(),
    supabaseConfigured: isSupabaseAdminConfigured(),
    profiles: listActiveDigitalContactProfiles().map((p) => ({
      slug: p.slug,
      fullName: p.fullName,
    })),
    devices,
  });
}

export async function POST(req: Request) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const action = String(b.action ?? "")
    .trim()
    .toLowerCase();
  const profileSlug = String(b.profileSlug ?? "chuy")
    .trim()
    .toLowerCase();

  if (!getDigitalContactProfile(profileSlug)) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  if (action === "subscribe") {
    const sub = b.subscription as
      | { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
      | undefined;
    const endpoint = String(sub?.endpoint ?? "").trim();
    const p256dh = String(sub?.keys?.p256dh ?? "").trim();
    const auth = String(sub?.keys?.auth ?? "").trim();
    const h = await headers();
    const ua = h.get("user-agent");
    const saved = await upsertPushSubscription({
      executiveSlug: profileSlug,
      endpoint,
      p256dh,
      auth,
      userAgent: ua,
      deviceLabel: String(b.deviceLabel ?? "").trim() || null,
    });
    if (!saved.ok) {
      return NextResponse.json({ ok: false, error: saved.error }, { status: 503 });
    }
    void insertDigitalContactAnalyticsEvent({
      profileSlug,
      eventType: "doorbell_push_subscription_created",
      meta: { subscriptionId: saved.record.id },
    }).catch(() => {});
    return NextResponse.json({ ok: true, subscriptionId: saved.record.id });
  }

  if (action === "unsubscribe") {
    const id = b.subscriptionId != null ? String(b.subscriptionId) : undefined;
    const endpoint = b.endpoint != null ? String(b.endpoint) : undefined;
    const removed = await deactivatePushSubscription({
      id,
      endpoint,
      executiveSlug: profileSlug,
    });
    if (removed.ok) {
      void insertDigitalContactAnalyticsEvent({
        profileSlug,
        eventType: "doorbell_push_subscription_removed",
        meta: { subscriptionId: id ?? null },
      }).catch(() => {});
    }
    return NextResponse.json({ ok: removed.ok });
  }

  if (action === "test") {
    const result = await dispatchDigitalContactDoorbell({
      executiveSlug: profileSlug,
      sessionId: "test",
      visitorFirstName: "Test",
      lang: b.lang === "en" ? "en" : "es",
      surface: "virtual_front_desk",
      test: true,
    });
    return NextResponse.json({
      ok: true,
      pushSucceeded: result.pushSucceeded,
      pushFailed: result.pushFailed,
      pushAttempted: result.pushAttempted,
    });
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}

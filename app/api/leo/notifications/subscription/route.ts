/**
 * LEO-16 owner push subscription API.
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import {
  disableLeoNotificationSubscription,
  getLeoNotificationSubscriptionStatus,
  getLeoPushPublicKeyForClient,
  upsertLeoNotificationSubscription,
} from "@/app/leo/_lib/leoNotificationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ownerIdFromAccess() {
  const access = await resolveLeoAccess();
  if (!access.allowed) return { error: access.reason, status: access.reason === "unauthenticated" ? 401 : 403 };
  const id = access.admin.authUserId?.trim();
  if (!id) return { error: "missing_auth_user_id", status: 403 };
  return { ownerAuthUserId: id };
}

export async function GET() {
  const owner = await ownerIdFromAccess();
  if ("error" in owner) {
    return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
  }
  const status = await getLeoNotificationSubscriptionStatus(owner.ownerAuthUserId);
  return NextResponse.json({
    ok: true,
    status,
    vapidPublicKey: getLeoPushPublicKeyForClient(),
  });
}

export async function POST(req: Request) {
  const owner = await ownerIdFromAccess();
  if ("error" in owner) {
    return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const b = body as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };
  const endpoint = String(b.subscription?.endpoint ?? "").trim();
  const p256dh = String(b.subscription?.keys?.p256dh ?? "").trim();
  const auth = String(b.subscription?.keys?.auth ?? "").trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "invalid_subscription" }, { status: 400 });
  }

  const h = await headers();
  const saved = await upsertLeoNotificationSubscription({
    ownerAuthUserId: owner.ownerAuthUserId,
    endpoint,
    p256dh,
    auth,
    userAgent: h.get("user-agent"),
  });

  if (!saved.ok) {
    return NextResponse.json({ ok: false, error: saved.error }, { status: 503 });
  }

  const status = await getLeoNotificationSubscriptionStatus(owner.ownerAuthUserId);
  return NextResponse.json({ ok: true, status, subscriptionId: saved.id });
}

export async function DELETE(req: Request) {
  const owner = await ownerIdFromAccess();
  if ("error" in owner) {
    return NextResponse.json({ ok: false, error: owner.error }, { status: owner.status });
  }

  let endpoint: string | undefined;
  try {
    const body = (await req.json()) as { endpoint?: string };
    endpoint = body.endpoint?.trim();
  } catch {
    /* empty body ok */
  }

  await disableLeoNotificationSubscription({
    ownerAuthUserId: owner.ownerAuthUserId,
    endpoint,
  });

  const status = await getLeoNotificationSubscriptionStatus(owner.ownerAuthUserId);
  return NextResponse.json({ ok: true, status });
}

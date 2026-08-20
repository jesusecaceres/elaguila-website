/**
 * LEO-16 notification service — owner-isolated subscriptions + bounded push dispatch.
 */
import "server-only";

import webpush from "web-push";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  getWebPushVapidConfig,
  getWebPushPublicKey,
  isWebPushConfigured,
} from "@/app/lib/digitalContact/humanConnection/webPushConfig";
import { buildLeoAlertPushPayload } from "@/app/leo/_lib/leoNotificationPolicy";
import type {
  LeoNotificationDeliveryState,
  LeoNotificationSubscriptionStatus,
  LeoWatchResult,
  LeoWatchSeverity,
} from "@/app/leo/_lib/leoTypes";

export type LeoPushSubscriptionRecord = {
  id: string;
  ownerAuthUserId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
};

function mapSubRow(row: Record<string, unknown>): LeoPushSubscriptionRecord {
  return {
    id: String(row.id),
    ownerAuthUserId: String(row.owner_auth_user_id),
    endpoint: String(row.endpoint),
    p256dh: String(row.p256dh),
    auth: String(row.auth),
    userAgent: row.user_agent != null ? String(row.user_agent) : null,
    enabled: row.enabled === true,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastSuccessAt: row.last_success_at != null ? String(row.last_success_at) : null,
    lastFailureAt: row.last_failure_at != null ? String(row.last_failure_at) : null,
  };
}

export async function upsertLeoNotificationSubscription(input: {
  ownerAuthUserId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_unconfigured" };
  const owner = input.ownerAuthUserId.trim();
  const endpoint = input.endpoint.trim();
  const p256dh = input.p256dh.trim();
  const auth = input.auth.trim();
  if (!owner || !endpoint.startsWith("https://") || !p256dh || !auth) {
    return { ok: false, error: "invalid_subscription" };
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("leo_notification_subscriptions")
    .upsert(
      {
        owner_auth_user_id: owner,
        endpoint,
        p256dh,
        auth,
        user_agent: input.userAgent ? String(input.userAgent).slice(0, 400) : null,
        enabled: true,
        updated_at: now,
      },
      { onConflict: "endpoint" },
    )
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "persist_failed" };
  return { ok: true, id: String(data.id) };
}

export async function disableLeoNotificationSubscription(input: {
  ownerAuthUserId: string;
  endpoint?: string;
  id?: string;
}): Promise<{ ok: boolean }> {
  if (!isSupabaseAdminConfigured()) return { ok: false };
  const owner = input.ownerAuthUserId.trim();
  if (!owner) return { ok: false };
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  let q = supabase
    .from("leo_notification_subscriptions")
    .update({ enabled: false, updated_at: now })
    .eq("owner_auth_user_id", owner);
  if (input.id) q = q.eq("id", input.id);
  else if (input.endpoint) q = q.eq("endpoint", input.endpoint);
  else return { ok: false };
  const { error } = await q;
  return { ok: !error };
}

export async function listActiveLeoNotificationSubscriptions(
  ownerAuthUserId: string,
): Promise<LeoPushSubscriptionRecord[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const owner = ownerAuthUserId.trim();
  if (!owner) return [];
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_notification_subscriptions")
    .select("*")
    .eq("owner_auth_user_id", owner)
    .eq("enabled", true);
  if (error || !data) return [];
  return data.map((row) => mapSubRow(row as Record<string, unknown>));
}

export async function getLeoNotificationSubscriptionStatus(
  ownerAuthUserId: string,
): Promise<LeoNotificationSubscriptionStatus> {
  const subs = await listActiveLeoNotificationSubscriptions(ownerAuthUserId);
  const lastDelivery = await getLastLeoNotificationDelivery(ownerAuthUserId);
  return {
    enabled: subs.length > 0,
    pushConfigured: isWebPushConfigured(),
    subscriptionCount: subs.length,
    permissionHint: "unknown",
    lastDeliveryState: lastDelivery?.deliveryState ?? null,
    lastDeliveryAt: lastDelivery?.createdAt ?? null,
    lastFailureAt: lastDelivery?.deliveryState === "FAILED" ? lastDelivery.createdAt : null,
  };
}

export async function getLastLeoNotificationDelivery(ownerAuthUserId: string): Promise<{
  deliveryState: LeoNotificationDeliveryState;
  createdAt: string;
} | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leo_notification_deliveries")
    .select("delivery_state, created_at")
    .eq("owner_auth_user_id", ownerAuthUserId.trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    deliveryState: String(data.delivery_state) as LeoNotificationDeliveryState,
    createdAt: String(data.created_at),
  };
}

export async function getLastNotifiedAtByFingerprint(
  ownerAuthUserId: string,
): Promise<Record<string, number>> {
  if (!isSupabaseAdminConfigured()) return {};
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leo_notification_deliveries")
    .select("fingerprint, created_at, delivery_state")
    .eq("owner_auth_user_id", ownerAuthUserId.trim())
    .in("delivery_state", ["DELIVERED_TO_PUSH_PROVIDER", "ATTEMPTED"])
    .order("created_at", { ascending: false })
    .limit(500);
  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    const fp = String(row.fingerprint);
    if (out[fp]) continue;
    const t = Date.parse(String(row.created_at));
    if (!Number.isNaN(t)) out[fp] = t;
  }
  return out;
}

export async function recordLeoNotificationDelivery(input: {
  ownerAuthUserId: string;
  watchKind: string | null;
  fingerprint: string;
  deliveryState: LeoNotificationDeliveryState;
  title: string;
  body: string;
  severity: LeoWatchSeverity;
  test: boolean;
  subscriptionId?: string | null;
  errorClass?: string | null;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const supabase = getAdminSupabase();
  await supabase.from("leo_notification_deliveries").insert({
    owner_auth_user_id: input.ownerAuthUserId.trim(),
    watch_kind: input.watchKind,
    fingerprint: input.fingerprint.slice(0, 512),
    delivery_state: input.deliveryState,
    title: input.title.slice(0, 200),
    body: input.body.slice(0, 500),
    severity: input.severity,
    test: input.test,
    subscription_id: input.subscriptionId ?? null,
    error_class: input.errorClass?.slice(0, 120) ?? null,
  });
}

export async function dispatchLeoAlertPush(input: {
  ownerAuthUserId: string;
  result: LeoWatchResult;
  test?: boolean;
}): Promise<{ attempted: number; delivered: number; failed: number }> {
  const stats = { attempted: 0, delivered: 0, failed: 0 };
  const vapid = getWebPushVapidConfig();
  if (!vapid || !isWebPushConfigured()) {
    await recordLeoNotificationDelivery({
      ownerAuthUserId: input.ownerAuthUserId,
      watchKind: input.result.kind,
      fingerprint: input.result.fingerprint,
      deliveryState: "FAILED",
      title: input.result.headline,
      body: input.result.summary,
      severity: input.result.severity,
      test: Boolean(input.test),
      errorClass: "push_not_configured",
    });
    stats.failed = 1;
    return stats;
  }

  const subs = await listActiveLeoNotificationSubscriptions(input.ownerAuthUserId);
  if (subs.length === 0) {
    await recordLeoNotificationDelivery({
      ownerAuthUserId: input.ownerAuthUserId,
      watchKind: input.result.kind,
      fingerprint: input.result.fingerprint,
      deliveryState: "FAILED",
      title: input.result.headline,
      body: input.result.summary,
      severity: input.result.severity,
      test: Boolean(input.test),
      errorClass: "no_subscription",
    });
    stats.failed = 1;
    return stats;
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  const alertId = crypto.randomUUID();
  const payload = buildLeoAlertPushPayload({ result: input.result, alertId, test: input.test });

  await recordLeoNotificationDelivery({
    ownerAuthUserId: input.ownerAuthUserId,
    watchKind: input.result.kind,
    fingerprint: input.result.fingerprint,
    deliveryState: "PREPARED",
    title: String(payload.title),
    body: String(payload.body),
    severity: input.result.severity,
    test: Boolean(input.test),
  });

  for (const sub of subs) {
    stats.attempted += 1;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60, urgency: input.result.severity === "CRITICAL" ? "high" : "normal" },
      );
      stats.delivered += 1;
      const supabase = getAdminSupabase();
      await supabase
        .from("leo_notification_subscriptions")
        .update({ last_success_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    } catch (e) {
      stats.failed += 1;
      const statusCode =
        e && typeof e === "object" && "statusCode" in e ? Number((e as { statusCode?: number }).statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        await disableLeoNotificationSubscription({
          ownerAuthUserId: input.ownerAuthUserId,
          id: sub.id,
        });
      }
      await supabaseMarkSubFailure(sub.id);
    }
  }

  await recordLeoNotificationDelivery({
    ownerAuthUserId: input.ownerAuthUserId,
    watchKind: input.result.kind,
    fingerprint: input.result.fingerprint,
    deliveryState: stats.delivered > 0 ? "DELIVERED_TO_PUSH_PROVIDER" : "FAILED",
    title: String(payload.title),
    body: String(payload.body),
    severity: input.result.severity,
    test: Boolean(input.test),
    errorClass: stats.delivered > 0 ? null : "push_provider_failed",
  });

  return stats;
}

async function supabaseMarkSubFailure(id: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const supabase = getAdminSupabase();
  await supabase
    .from("leo_notification_subscriptions")
    .update({ last_failure_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
}

export function getLeoPushPublicKeyForClient(): string | null {
  return getWebPushPublicKey();
}

export { isLeoCronAuthorized } from "@/app/leo/_lib/leoNotificationPolicy";

export async function sendLeoTestAlert(ownerAuthUserId: string): Promise<{
  ok: boolean;
  delivered: number;
  error?: string;
}> {
  const testResult: LeoWatchResult = {
    kind: "SYSTEM_HEALTH",
    generatedAt: new Date().toISOString(),
    status: "OK",
    severity: "NORMAL",
    fingerprint: `TEST:${Date.now()}`,
    changed: true,
    shouldNotify: true,
    headline: "LEO test alert — notifications are working.",
    summary: "This is a test notification from Leonix LEO.",
    deepLink: "/admin/leo",
    evidenceRefs: [],
    limitations: [],
    notificationCategory: "watch",
  };
  const stats = await dispatchLeoAlertPush({ ownerAuthUserId, result: testResult, test: true });
  return {
    ok: stats.delivered > 0,
    delivered: stats.delivered,
    error: stats.delivered > 0 ? undefined : "push_delivery_failed",
  };
}

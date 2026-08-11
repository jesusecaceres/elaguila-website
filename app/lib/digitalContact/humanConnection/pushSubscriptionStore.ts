import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type PushSubscriptionRecord = {
  id: string;
  executiveSlug: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  deviceLabel: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
};

export type UpsertPushSubscriptionInput = {
  executiveSlug: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  deviceLabel?: string | null;
};

function mapRow(row: Record<string, unknown>): PushSubscriptionRecord {
  return {
    id: String(row.id),
    executiveSlug: String(row.executive_slug),
    endpoint: String(row.endpoint),
    p256dh: String(row.p256dh),
    auth: String(row.auth),
    userAgent: row.user_agent != null ? String(row.user_agent) : null,
    deviceLabel: row.device_label != null ? String(row.device_label) : null,
    active: row.active === true,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastSuccessAt: row.last_success_at != null ? String(row.last_success_at) : null,
    lastFailureAt: row.last_failure_at != null ? String(row.last_failure_at) : null,
  };
}

export async function upsertPushSubscription(
  input: UpsertPushSubscriptionInput,
): Promise<{ ok: true; record: PushSubscriptionRecord } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "supabase_unconfigured" };
  }
  const slug = String(input.executiveSlug ?? "")
    .trim()
    .toLowerCase();
  const endpoint = String(input.endpoint ?? "").trim();
  const p256dh = String(input.p256dh ?? "").trim();
  const auth = String(input.auth ?? "").trim();
  if (!slug || !endpoint.startsWith("https://") || !p256dh || !auth) {
    return { ok: false, error: "invalid_subscription" };
  }
  if (endpoint.length > 2048 || p256dh.length > 512 || auth.length > 512) {
    return { ok: false, error: "invalid_subscription" };
  }

  try {
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("digital_contact_push_subscriptions")
      .upsert(
        {
          executive_slug: slug,
          endpoint,
          p256dh,
          auth,
          user_agent: input.userAgent ? String(input.userAgent).slice(0, 400) : null,
          device_label: input.deviceLabel ? String(input.deviceLabel).slice(0, 120) : null,
          active: true,
          updated_at: now,
          revoked_at: null,
        },
        { onConflict: "endpoint" },
      )
      .select("*")
      .maybeSingle();
    if (error || !data) {
      console.error(`[doorbell] push upsert failed: ${error?.message ?? "no_data"}`);
      return { ok: false, error: "persist_failed" };
    }
    return { ok: true, record: mapRow(data as Record<string, unknown>) };
  } catch (e) {
    console.error(`[doorbell] push upsert error: ${e instanceof Error ? e.message : "unknown"}`);
    return { ok: false, error: "persist_failed" };
  }
}

export async function listActivePushSubscriptions(
  executiveSlug: string,
): Promise<PushSubscriptionRecord[]> {
  const slug = String(executiveSlug ?? "")
    .trim()
    .toLowerCase();
  if (!slug || !isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("digital_contact_push_subscriptions")
      .select("*")
      .eq("executive_slug", slug)
      .eq("active", true);
    if (error || !data) return [];
    return data.map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function listPushSubscriptionsForAdmin(
  executiveSlug: string,
): Promise<Array<{ id: string; deviceLabel: string | null; userAgent: string | null; createdAt: string; active: boolean; endpointHost: string }>> {
  const slug = String(executiveSlug ?? "")
    .trim()
    .toLowerCase();
  if (!slug || !isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("digital_contact_push_subscriptions")
      .select("id, device_label, user_agent, created_at, active, endpoint")
      .eq("executive_slug", slug)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => {
      let endpointHost = "push";
      try {
        endpointHost = new URL(String(row.endpoint)).host;
      } catch {
        /* ignore */
      }
      return {
        id: String(row.id),
        deviceLabel: row.device_label != null ? String(row.device_label) : null,
        userAgent: row.user_agent != null ? String(row.user_agent) : null,
        createdAt: String(row.created_at),
        active: row.active === true,
        endpointHost,
      };
    });
  } catch {
    return [];
  }
}

export async function deactivatePushSubscription(args: {
  id?: string;
  endpoint?: string;
  executiveSlug: string;
}): Promise<{ ok: boolean }> {
  if (!isSupabaseAdminConfigured()) return { ok: false };
  const slug = String(args.executiveSlug ?? "")
    .trim()
    .toLowerCase();
  if (!slug) return { ok: false };
  try {
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();
    let q = supabase
      .from("digital_contact_push_subscriptions")
      .update({ active: false, revoked_at: now, updated_at: now })
      .eq("executive_slug", slug);
    if (args.id) q = q.eq("id", args.id);
    else if (args.endpoint) q = q.eq("endpoint", args.endpoint);
    else return { ok: false };
    const { error } = await q;
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function markPushDeliveryResult(args: {
  id: string;
  ok: boolean;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();
    await supabase
      .from("digital_contact_push_subscriptions")
      .update(args.ok ? { last_success_at: now, updated_at: now } : { last_failure_at: now, updated_at: now })
      .eq("id", args.id);
  } catch {
    /* ignore */
  }
}

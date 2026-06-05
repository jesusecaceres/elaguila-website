/**
 * Gate G2B — Typed client helper for POST /api/analytics/events (not wired to UI yet).
 */
import type { ListingAnalyticsSourceTable } from "@/app/lib/analytics/listingAnalyticsIdentity";
import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";

export type RecordAnalyticsEventInput = {
  event_type: ListingAnalyticsEventType;
  source_table: ListingAnalyticsSourceTable | string;
  source_id: string;
  category?: string;
  event_source?: string;
  metadata?: Record<string, unknown>;
  anonymous_session_id?: string;
  canonical_ad_id?: string;
  /** Supabase access token when recording auth-required events. */
  accessToken?: string | null;
};

export type RecordAnalyticsEventSuccess = {
  ok: true;
  event_id?: string | null;
  deduped?: boolean;
  canonical_ad_id: string;
  category: string;
  source_table: string;
  source_id: string;
};

export type RecordAnalyticsEventFailure = {
  ok: false;
  error: string;
};

export type RecordAnalyticsEventResult = RecordAnalyticsEventSuccess | RecordAnalyticsEventFailure;

/**
 * Fire-and-forget friendly: returns structured result; does not throw on network errors.
 */
export async function recordAnalyticsEvent(
  input: RecordAnalyticsEventInput,
): Promise<RecordAnalyticsEventResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = input.accessToken?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch("/api/analytics/events", {
      method: "POST",
      headers,
      body: JSON.stringify({
        event_type: input.event_type,
        source_table: input.source_table,
        source_id: input.source_id,
        category: input.category,
        event_source: input.event_source,
        metadata: input.metadata,
        anonymous_session_id: input.anonymous_session_id,
        canonical_ad_id: input.canonical_ad_id,
      }),
      credentials: "same-origin",
    });

    const data = (await res.json()) as RecordAnalyticsEventResult & { error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.ok === false ? data.error : `http_${res.status}` };
    }
    return data as RecordAnalyticsEventSuccess;
  } catch {
    return { ok: false, error: "network_error" };
  }
}

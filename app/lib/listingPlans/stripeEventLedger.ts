/**
 * Package C Build 1 (C2) — Stripe webhook event ledger: effectively-once fulfillment.
 *
 * Layer 1 of webhook idempotency (row-state guards in fulfillment code remain layer 2).
 * The INSERT doubles as the processing claim: `.upsert({ignoreDuplicates:true}).select("id")`
 * returns a row only for the first delivery of an event id. Duplicate deliveries fall through
 * to conditional UPDATE claims that succeed only for retryable/stale states.
 *
 * HTTP semantics are the retry scheduler (no cron exists in this build by design):
 *   completed / ignored / failed_terminal / actively-processing  -> respond 200 (Stripe stops)
 *   failed_retryable / claim errors                              -> respond 500 (Stripe redelivers)
 * A `processing` row older than STALE_PROCESSING_MINUTES is re-claimable, so a crashed
 * invocation self-heals on the next Stripe redelivery.
 *
 * This module never claims exactly-once delivery — only effectively-once FULFILLMENT.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { STALE_PROCESSING_MINUTES } from "./stripeEventLedgerPolicy";

export { decideDuplicateClaim, STALE_PROCESSING_MINUTES } from "./stripeEventLedgerPolicy";

export type LedgerClaimDecision =
  | { action: "process"; reason: "first_delivery" | "reclaimed_retryable" | "reclaimed_stale" }
  | { action: "skip"; httpStatus: 200; reason: "already_completed" | "already_ignored" | "terminal_failure" | "actively_processing" }
  | { action: "error"; httpStatus: 500; reason: "ledger_unavailable" | "claim_failed" };

export type LedgerEventInput = {
  stripeEventId: string;
  eventType: string;
  apiVersion?: string | null;
  livemode?: boolean | null;
  stripeCreatedAt?: string | null;
  objectId?: string | null;
  stripeSubscriptionId?: string | null;
  /** event.data.object snapshot only — never the full envelope, never secrets. */
  payload?: Record<string, unknown> | null;
};

async function incrementAttemptCount(
  supabase: ReturnType<typeof getAdminSupabase>,
  stripeEventId: string,
  currentAttemptCount: unknown,
): Promise<void> {
  const attempt = Number(currentAttemptCount ?? 1) + 1;
  await supabase
    .from("leonix_stripe_webhook_events")
    .update({ attempt_count: attempt })
    .eq("stripe_event_id", stripeEventId);
}

/**
 * Claim an event for processing. Returns "process" exactly once per live attempt.
 */
export async function claimStripeEvent(input: LedgerEventInput): Promise<LedgerClaimDecision> {
  if (!isSupabaseAdminConfigured()) return { action: "error", httpStatus: 500, reason: "ledger_unavailable" };
  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from("leonix_stripe_webhook_events")
    .upsert(
      {
        stripe_event_id: input.stripeEventId,
        event_type: input.eventType,
        api_version: input.apiVersion ?? null,
        livemode: input.livemode ?? null,
        stripe_created_at: input.stripeCreatedAt ?? null,
        status: "processing",
        attempt_count: 1,
        processing_started_at: nowIso,
        object_id: input.objectId ?? null,
        stripe_subscription_id: input.stripeSubscriptionId ?? null,
        payload: input.payload ?? {},
      },
      { onConflict: "stripe_event_id", ignoreDuplicates: true },
    )
    .select("id");

  if (insertError) return { action: "error", httpStatus: 500, reason: "claim_failed" };
  if (inserted && inserted.length > 0) return { action: "process", reason: "first_delivery" };

  // Duplicate delivery — first reclaim explicit retryable states. Keeping this as a simple
  // conditional UPDATE avoids the nested PostgREST `or=(...,and(...))` filter that can be
  // rejected by the REST parser before PostgreSQL evaluates the row condition.
  const { data: retryable, error: retryableError } = await supabase
    .from("leonix_stripe_webhook_events")
    .update({ status: "processing", processing_started_at: nowIso })
    .eq("stripe_event_id", input.stripeEventId)
    .in("status", ["received", "failed_retryable"])
    .select("id, attempt_count");

  if (retryableError) return { action: "error", httpStatus: 500, reason: "claim_failed" };
  if (retryable && retryable.length > 0) {
    await incrementAttemptCount(supabase, input.stripeEventId, retryable[0]?.attempt_count);
    return { action: "process", reason: "reclaimed_retryable" };
  }

  // If the row is not retryable, independently reclaim a stale processing claim. This preserves
  // the original crash self-heal semantics without relying on a nested OR expression.
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MINUTES * 60_000).toISOString();
  const { data: stale, error: staleError } = await supabase
    .from("leonix_stripe_webhook_events")
    .update({ status: "processing", processing_started_at: nowIso })
    .eq("stripe_event_id", input.stripeEventId)
    .eq("status", "processing")
    .lt("processing_started_at", staleBefore)
    .select("id, attempt_count");

  if (staleError) return { action: "error", httpStatus: 500, reason: "claim_failed" };
  if (stale && stale.length > 0) {
    await incrementAttemptCount(supabase, input.stripeEventId, stale[0]?.attempt_count);
    return { action: "process", reason: "reclaimed_stale" };
  }

  const { data: existing } = await supabase
    .from("leonix_stripe_webhook_events")
    .select("status")
    .eq("stripe_event_id", input.stripeEventId)
    .maybeSingle();

  const status = String(existing?.status ?? "");
  if (status === "completed") return { action: "skip", httpStatus: 200, reason: "already_completed" };
  if (status === "ignored") return { action: "skip", httpStatus: 200, reason: "already_ignored" };
  if (status === "failed_terminal") return { action: "skip", httpStatus: 200, reason: "terminal_failure" };
  return { action: "skip", httpStatus: 200, reason: "actively_processing" };
}

export type LedgerOutcome = "completed" | "failed_retryable" | "failed_terminal" | "ignored";

export async function settleStripeEvent(
  stripeEventId: string,
  outcome: LedgerOutcome,
  detail?: { resultCode?: string | null; error?: string | null; paymentRecordId?: string | null },
): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const supabase = getAdminSupabase();
  await supabase
    .from("leonix_stripe_webhook_events")
    .update({
      status: outcome,
      completed_at: outcome === "completed" || outcome === "ignored" ? new Date().toISOString() : null,
      result_code: detail?.resultCode ?? null,
      last_error: detail?.error ? String(detail.error).slice(0, 500) : null,
      ...(detail?.paymentRecordId ? { payment_record_id: detail.paymentRecordId } : {}),
    })
    .eq("stripe_event_id", stripeEventId);
}

/** Reap processing rows older than the stale window back to failed_retryable (sweep helper). */
export async function reapStaleProcessingEvents(): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  const supabase = getAdminSupabase();
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MINUTES * 60_000).toISOString();
  const { data } = await supabase
    .from("leonix_stripe_webhook_events")
    .update({ status: "failed_retryable", last_error: "reaped_stale_processing" })
    .eq("status", "processing")
    .lt("processing_started_at", staleBefore)
    .select("id");
  return data?.length ?? 0;
}

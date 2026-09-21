/**
 * LEONIX IX REWARDS — the unattributable refund queue.
 *
 * WHY THIS EXISTS
 * ---------------
 * A refund is identified by its own refund object, and that is the only accounting scheme in this
 * system. It replaced a `<chargeId>:cum<N>` fallback that claimed the rail's cumulative position
 * whenever `charge.refunds.data` was missing — the two schemes were additive, so the same refunded
 * dollars were counted once under each and a customer was over-charged 270 cents on a $60 refund.
 *
 * Refusing to reverse an unattributable payload is therefore right. Refusing SILENTLY is not:
 * money went back to the customer and the credits that payment earned are still spendable. Every
 * such event lands here instead — durable, retryable, staff-visible, resolvable exactly once.
 *
 * This module owns the queue's writes. It never moves credits itself; settling a row calls the
 * ordinary reversal path under the ordinary `reverse:refund:<id>` key, so a webhook that later
 * delivers the same refund properly is a no-op rather than a second clawback.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type RefundResolutionKind = "refund" | "chargeback";
/**
 * `restored` is a first-class outcome, not a flavour of `reversed`.
 *
 * A row filed by a WON dispute records credits the customer is OWED. Closing it as `reversed`
 * stated the opposite of the movement in the one record a person would later audit.
 */
export type RefundResolutionOutcome = "reversed" | "restored" | "no_action_required";

export type RefundResolutionRow = {
  id: string;
  paymentRecordId: string;
  stripeChargeId: string | null;
  stripeEventId: string | null;
  kind: RefundResolutionKind;
  cumulativeRefundedCents: number;
  /** The dispute or refund id this row is about, when the rail named one. Part of the dedupe key. */
  externalRef: string | null;
  status: "open" | "resolved" | "dismissed";
  attempts: number;
  lastAttemptAtIso: string;
  reason: string;
  createdAtIso: string;
  resolvedAtIso: string | null;
  resolutionOutcome: RefundResolutionOutcome | null;
  resolutionNote: string | null;
  resolvedRefundExternalId: string | null;
};

const COLUMNS =
  "id, payment_record_id, stripe_charge_id, stripe_event_id, kind, cumulative_refunded_cents, external_ref, status, attempts, last_attempt_at, reason, created_at, resolved_at, resolution_outcome, resolution_note, resolved_refund_external_id";

/** Postgres unique violation — a redelivery racing the same open row is the desired state. */
const PG_UNIQUE_VIOLATION = "23505";

function toRow(r: Record<string, unknown>): RefundResolutionRow {
  return {
    id: String(r.id),
    paymentRecordId: String(r.payment_record_id),
    stripeChargeId: r.stripe_charge_id == null ? null : String(r.stripe_charge_id),
    stripeEventId: r.stripe_event_id == null ? null : String(r.stripe_event_id),
    kind: String(r.kind) === "chargeback" ? "chargeback" : "refund",
    cumulativeRefundedCents: Number(r.cumulative_refunded_cents ?? 0),
    externalRef: r.external_ref == null ? null : String(r.external_ref),
    status: (String(r.status) as RefundResolutionRow["status"]) ?? "open",
    attempts: Number(r.attempts ?? 1),
    lastAttemptAtIso: String(r.last_attempt_at ?? ""),
    reason: String(r.reason ?? ""),
    createdAtIso: String(r.created_at ?? ""),
    resolvedAtIso: r.resolved_at == null ? null : String(r.resolved_at),
    resolutionOutcome: (r.resolution_outcome as RefundResolutionRow["resolutionOutcome"]) ?? null,
    resolutionNote: r.resolution_note == null ? null : String(r.resolution_note),
    resolvedRefundExternalId:
      r.resolved_refund_external_id == null ? null : String(r.resolved_refund_external_id),
  };
}

/**
 * Record — or re-record — an unattributable refund event.
 *
 * IDEMPOTENT BY THE PROBLEM, NOT BY THE DELIVERY. The partial unique index is on
 * `(payment, kind, cumulative position) WHERE status = 'open'`, so a webhook redelivered five
 * times produces ONE row with `attempts = 5` rather than five copies of one problem. A genuinely
 * NEW position — a second refund arriving while the first is still unresolved — is a different
 * row, because it is a different amount of money owed.
 *
 * Never throws: a queue write must not turn a settled payment into a failed webhook.
 */
export async function enqueueUnattributableRefund(input: {
  paymentRecordId: string;
  kind: RefundResolutionKind;
  cumulativeRefundedCents: number;
  reason: string;
  stripeChargeId?: string | null;
  stripeEventId?: string | null;
  /**
   * The dispute or refund id this row is about, when one exists.
   *
   * IT IS PART OF THE DEDUPE KEY, and that is the point. A won dispute whose restoration failed is
   * filed at a cumulative position of ZERO — a constant — so a payment with two disputes collapsed
   * both into one row and the second dispute's obligation was silently discarded. Naming the
   * dispute makes two problems two rows while a redelivery of one of them is still one row.
   */
  externalRef?: string | null;
}): Promise<{ ok: true; id: string; deduplicated: boolean } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const db = getAdminSupabase();
  const cumulative = Math.max(0, Math.floor(Number(input.cumulativeRefundedCents) || 0));
  // The index keys on COALESCE(external_ref, ''), so the lookup has to normalise the same way or
  // `bump()` would miss the very row the unique violation just proved exists.
  const externalRef = input.externalRef?.trim() ? input.externalRef.trim() : null;
  const nowIso = new Date().toISOString();

  const bump = async (): Promise<{ ok: true; id: string; deduplicated: boolean } | { ok: false; error: string }> => {
    const { data: existing, error } = await db
      .from("leonix_rewards_refund_resolutions")
      .select("id, attempts")
      .eq("payment_record_id", input.paymentRecordId)
      .eq("kind", input.kind)
      .eq("cumulative_refunded_cents", cumulative)
      .eq("status", "open")
      .filter("external_ref", externalRef === null ? "is" : "eq", externalRef === null ? null : externalRef)
      .maybeSingle();
    if (error || !existing) return { ok: false, error: error?.message.slice(0, 300) ?? "not_found" };
    const row = existing as { id: string; attempts?: number };
    await db
      .from("leonix_rewards_refund_resolutions")
      .update({ attempts: Number(row.attempts ?? 1) + 1, last_attempt_at: nowIso, updated_at: nowIso })
      .eq("id", row.id);
    return { ok: true, id: String(row.id), deduplicated: true };
  };

  try {
    const { data, error } = await db
      .from("leonix_rewards_refund_resolutions")
      .insert({
        payment_record_id: input.paymentRecordId,
        kind: input.kind,
        cumulative_refunded_cents: cumulative,
        external_ref: externalRef,
        reason: input.reason.slice(0, 300),
        stripe_charge_id: input.stripeChargeId ?? null,
        stripe_event_id: input.stripeEventId ?? null,
        last_attempt_at: nowIso,
      })
      .select("id")
      .single();
    if (error) {
      // The open row already exists: this is the SAME problem arriving again, so count the
      // attempt rather than filling the queue with duplicates or reporting a failure.
      if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) {
        const bumped = await bump();
        if (bumped.ok) return bumped;
        // THE ROW WAS RESOLVED BETWEEN THE FAILED INSERT AND THE LOOKUP, so the partial index no
        // longer covers it and there is nothing to bump. Left here, the event would vanish — the
        // exact silent loss this queue exists to prevent. Insert again: the index is clear now.
        const { data: retried, error: retryError } = await db
          .from("leonix_rewards_refund_resolutions")
          .insert({
            payment_record_id: input.paymentRecordId,
            kind: input.kind,
            cumulative_refunded_cents: cumulative,
            external_ref: externalRef,
            reason: input.reason.slice(0, 300),
            stripe_charge_id: input.stripeChargeId ?? null,
            stripe_event_id: input.stripeEventId ?? null,
            last_attempt_at: nowIso,
          })
          .select("id")
          .single();
        if (retryError || !retried) {
          // A second unique violation means a concurrent writer filed the same problem; that is
          // the desired state, so report it as a deduplicated success rather than a loss.
          if ((retryError as { code?: string } | null)?.code === PG_UNIQUE_VIOLATION) {
            return bump();
          }
          return { ok: false, error: retryError?.message.slice(0, 300) ?? "enqueue_retry_failed" };
        }
        return { ok: true, id: String((retried as { id: string }).id), deduplicated: false };
      }
      return { ok: false, error: error.message.slice(0, 300) };
    }
    return { ok: true, id: String((data as { id: string }).id), deduplicated: false };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "enqueue_failed" };
  }
}

/** The staff queue. Open rows first, newest first, bounded. */
export async function listRefundResolutions(input: {
  status?: "open" | "resolved" | "dismissed" | "all";
  limit?: number;
}): Promise<{ ok: true; rows: RefundResolutionRow[] } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const db = getAdminSupabase();
  const limit = Math.min(200, Math.max(1, Math.floor(Number(input.limit ?? 50)) || 50));
  let q = db
    .from("leonix_rewards_refund_resolutions")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (input.status && input.status !== "all") q = q.eq("status", input.status);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message.slice(0, 300) };
  return { ok: true, rows: ((data ?? []) as Record<string, unknown>[]).map(toRow) };
}

export async function findOpenRefundResolution(
  id: string,
): Promise<RefundResolutionRow | null> {
  if (!isSupabaseAdminConfigured() || !id.trim()) return null;
  const { data } = await getAdminSupabase()
    .from("leonix_rewards_refund_resolutions")
    .select(COLUMNS)
    .eq("id", id.trim())
    .maybeSingle();
  return data ? toRow(data as Record<string, unknown>) : null;
}

/**
 * Close a queue row, attributed.
 *
 * COMPARE-AND-SET FROM `open`. Two staff resolving the same row at once must not both succeed:
 * the second gets `already_resolved` and no second movement is attempted.
 *
 * THE ROW IS CLAIMED BEFORE THE MOVEMENT, NOT AFTER — this comment used to say the opposite, and
 * the code has always done it this way. Moving first meant two staff supplying different refund
 * ids produced two idempotency keys, both read the same prior position, and both posted the same
 * delta. Claiming first makes exactly one caller eligible to move anything; a movement that then
 * fails is re-filed by the caller as a fresh open row rather than lost.
 *
 * The consequence the caller owes: EVERY refusal must happen before this call. A validation that
 * runs afterwards closes the row while moving nothing, which destroys the obligation outright.
 */
export async function closeRefundResolution(input: {
  id: string;
  outcome: RefundResolutionOutcome;
  note: string;
  actorAuthUserId: string;
  actorRosterId?: string | null;
  refundExternalId?: string | null;
  ledgerId?: string | null;
  dismissed?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const note = input.note.trim();
  if (note.length < 3) return { ok: false, error: "note_required" };
  if (!input.actorAuthUserId) return { ok: false, error: "actor_required" };

  const { data, error } = await getAdminSupabase()
    .from("leonix_rewards_refund_resolutions")
    .update({
      status: input.dismissed ? "dismissed" : "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by_auth_user_id: input.actorAuthUserId,
      resolved_by_roster_id: input.actorRosterId ?? null,
      resolution_outcome: input.outcome,
      resolution_note: note.slice(0, 500),
      resolved_refund_external_id: input.refundExternalId ?? null,
      resolved_ledger_id: input.ledgerId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("status", "open")
    .select("id");
  if (error) return { ok: false, error: error.message.slice(0, 300) };
  if (!data?.length) return { ok: false, error: "already_resolved" };
  return { ok: true };
}

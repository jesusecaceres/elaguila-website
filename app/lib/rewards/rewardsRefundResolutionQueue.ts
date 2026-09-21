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

export type RefundResolutionRow = {
  id: string;
  paymentRecordId: string;
  stripeChargeId: string | null;
  stripeEventId: string | null;
  kind: RefundResolutionKind;
  cumulativeRefundedCents: number;
  status: "open" | "resolved" | "dismissed";
  attempts: number;
  lastAttemptAtIso: string;
  reason: string;
  createdAtIso: string;
  resolvedAtIso: string | null;
  resolutionOutcome: "reversed" | "no_action_required" | null;
  resolutionNote: string | null;
  resolvedRefundExternalId: string | null;
};

const COLUMNS =
  "id, payment_record_id, stripe_charge_id, stripe_event_id, kind, cumulative_refunded_cents, status, attempts, last_attempt_at, reason, created_at, resolved_at, resolution_outcome, resolution_note, resolved_refund_external_id";

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
}): Promise<{ ok: true; id: string; deduplicated: boolean } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const db = getAdminSupabase();
  const cumulative = Math.max(0, Math.floor(Number(input.cumulativeRefundedCents) || 0));
  const nowIso = new Date().toISOString();

  const bump = async (): Promise<{ ok: true; id: string; deduplicated: boolean } | { ok: false; error: string }> => {
    const { data: existing, error } = await db
      .from("leonix_rewards_refund_resolutions")
      .select("id, attempts")
      .eq("payment_record_id", input.paymentRecordId)
      .eq("kind", input.kind)
      .eq("cumulative_refunded_cents", cumulative)
      .eq("status", "open")
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
      if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) return bump();
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
 * the second gets `already_resolved` and no second movement is attempted. The caller performs the
 * credit movement BEFORE calling this and passes the resulting ledger id, so a row can only ever
 * read as resolved once the money it describes has actually moved.
 */
export async function closeRefundResolution(input: {
  id: string;
  outcome: "reversed" | "no_action_required";
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

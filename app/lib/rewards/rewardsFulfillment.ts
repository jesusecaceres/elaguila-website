/**
 * LEONIX IX REWARDS — the integration surface the payment pipeline calls.
 *
 * These are the ONLY functions the Stripe webhook, the manual-payment tracker and the CSV importer
 * need. Each is best-effort by contract: a rewards problem must never fail a settled payment, so
 * every function returns a structured result and never throws. A failure is recorded in the audit
 * log as retryable rather than swallowed.
 *
 * SETTLEMENT POLICY
 *  - Card money (Stripe) is awarded as PENDING, because it can still be refunded or disputed.
 *    It is promoted to spendable by `promoteSettledCredits` once the business's settlement window
 *    has passed.
 *  - Cleared manual money (cash, check, money order verified by staff) is final on clearance and
 *    is awarded as spendable immediately.
 */
import "server-only";

import { writeRevenueAuditLog } from "@/app/lib/listingPlans/revenueAuditLog";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  earnFromSettledPayment,
  promotePendingForPayment,
  reverseForRefundOrChargeback,
  runPendingPromotionSweep,
  runReservationExpirySweep,
  type WalletOwnerRef,
} from "./rewardsLedgerCore";
import { buildRewardsStorePort, isRewardsConfigured, resolveWalletOwnerForPayment } from "./rewardsLedger";
import {
  CARD_SETTLEMENT_PENDING_DAYS,
  REDEMPTION_RESERVATION_MINUTES,
  earnBaseFromPaymentMetadata,
  type SettledPaymentFacts,
} from "./rewardsPolicy";

// Re-exported so the payment-pipeline call sites keep importing their rewards helpers from one
// place; the rule itself is pure and lives in rewardsPolicy so it can be tested directly.
export { earnBaseFromPaymentMetadata };

export type RewardsHookResult =
  | { ok: true; outcome: "earned"; earnCents: number; deduplicated: boolean }
  | { ok: true; outcome: "reversed"; reversedCents: number; deduplicated: boolean }
  | { ok: true; outcome: "promoted"; deduplicated: boolean }
  | { ok: true; outcome: "skipped"; reason: string }
  | { ok: false; outcome: "failed"; reason: string; retryable: true };

/**
 * `meta.retryable` is what an operator queries to find credit movements that still owe the
 * customer something. A failure here is never silent.
 */
async function auditRewards(entry: {
  action: "rewards_earn" | "rewards_reversal" | "rewards_promote" | "rewards_redemption";
  outcome: string;
  paymentRecordId: string | null;
  reason?: string | null;
  amountCents?: number | null;
  retryable?: boolean;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await writeRevenueAuditLog({
    // Reuses the existing revenue audit sink so rewards activity lands beside the payment that
    // caused it, rather than in a parallel log nobody reads.
    action: "revenue_payment_completed",
    targetType: "leonix_rewards_ledger",
    targetId: entry.paymentRecordId,
    meta: {
      rewards_action: entry.action,
      rewards_outcome: entry.outcome,
      rewards_reason: entry.reason ?? null,
      rewards_amount_cents: entry.amountCents ?? null,
      retryable: entry.retryable === true,
      ...(entry.meta ?? {}),
    },
  }).catch(() => undefined);
}

/**
 * Award credits for a payment that has just been authoritatively settled.
 * Call this AFTER the payment record is marked paid — never before.
 */
export async function awardCreditsForSettledPayment(input: {
  paymentRecordId: string;
  ownerUserId: string | null;
  amountPaidCents: number;
  creditsAppliedCents: number;
  promoDiscountCents: number;
  /** `stripe` | `admin_manual` | `office` | `csv_import` */
  source: string;
  sourceKind: "stripe_payment" | "manual_payment" | "csv_import";
  sourceId?: string | null;
  categoryExcluded?: boolean;
  /** Card money stays pending; cleared cash is final. */
  pendingUntilSettlementFinal: boolean;
}): Promise<RewardsHookResult> {
  if (!isRewardsConfigured()) {
    return { ok: true, outcome: "skipped", reason: "rewards_not_configured" };
  }
  try {
    const owner = await resolveWalletOwnerForPayment({
      paymentRecordId: input.paymentRecordId,
      ownerUserId: input.ownerUserId,
    });
    if (!owner) {
      await auditRewards({ action: "rewards_earn", outcome: "skipped", paymentRecordId: input.paymentRecordId, reason: "no_wallet_owner" });
      return { ok: true, outcome: "skipped", reason: "no_wallet_owner" };
    }

    const facts: SettledPaymentFacts = {
      amountPaidCents: input.amountPaidCents,
      creditsAppliedCents: input.creditsAppliedCents,
      promoDiscountCents: input.promoDiscountCents,
      source: input.source,
      settled: true,
      categoryExcluded: input.categoryExcluded,
    };

    const res = await earnFromSettledPayment({
      owner,
      paymentRecordId: input.paymentRecordId,
      facts,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId ?? null,
      pendingUntilSettlementFinal: input.pendingUntilSettlementFinal,
      ports: buildRewardsStorePort(),
    });

    if (!res.ok) {
      await auditRewards({ action: "rewards_earn", outcome: "failed", paymentRecordId: input.paymentRecordId, reason: res.error, retryable: true });
      return { ok: false, outcome: "failed", reason: res.error, retryable: true };
    }
    if (res.outcome === "not_eligible") {
      await auditRewards({ action: "rewards_earn", outcome: "skipped", paymentRecordId: input.paymentRecordId, reason: res.reason });
      return { ok: true, outcome: "skipped", reason: res.reason };
    }

    await auditRewards({
      action: "rewards_earn",
      outcome: "earned",
      paymentRecordId: input.paymentRecordId,
      amountCents: res.earnCents,
      meta: { deduplicated: res.deduplicated },
    });
    return { ok: true, outcome: "earned", earnCents: res.earnCents, deduplicated: res.deduplicated };
  } catch (e) {
    const reason = e instanceof Error ? e.message.slice(0, 300) : "unknown";
    await auditRewards({ action: "rewards_earn", outcome: "failed", paymentRecordId: input.paymentRecordId, reason, retryable: true });
    return { ok: false, outcome: "failed", reason, retryable: true };
  }
}

/**
 * Claw credits back when money goes back to the customer.
 *
 * `externalId` MUST be the REFUND object's id or the DISPUTE's id, never the charge's. Stripe
 * delivers `charge.refunded` once per refund against the same charge, so keying on the charge
 * collapses every refund after the first onto one idempotency key and silently under-reverses.
 *
 * The wallet is neither passed in nor re-resolved here: `reverseForRefundOrChargeback` reads it
 * off the earn entry, so the debit always lands on the wallet the payment actually credited.
 */
export async function reverseCreditsForRefundOrDispute(input: {
  paymentRecordId: string;
  /** THIS event's own refunded amount — one refund object, or the dispute's amount. */
  refundedCents: number;
  /**
   * The rail's CUMULATIVE refunded total for this kind, when the event carries one. Stripe's
   * `charge.amount_refunded` is cumulative across every refund on the charge, and passing it is
   * what makes a sequence of partial refunds land on the exact proportional total instead of
   * losing a cent to rounding at each step.
   */
  cumulativeRefundedCents?: number | null;
  kind: "refund" | "chargeback";
  /** The Stripe REFUND id or DISPUTE id — the idempotency anchor. Never the charge id. */
  externalId: string;
}): Promise<RewardsHookResult> {
  if (!isRewardsConfigured()) return { ok: true, outcome: "skipped", reason: "rewards_not_configured" };
  try {
    const res = await reverseForRefundOrChargeback({
      paymentRecordId: input.paymentRecordId,
      eventRefundedCents: input.refundedCents,
      cumulativeRefundedCentsForKind: input.cumulativeRefundedCents ?? null,
      kind: input.kind,
      externalId: input.externalId,
      ports: buildRewardsStorePort(),
    });

    if (!res.ok) {
      await auditRewards({ action: "rewards_reversal", outcome: "failed", paymentRecordId: input.paymentRecordId, reason: res.error, retryable: true });
      return { ok: false, outcome: "failed", reason: res.error, retryable: true };
    }
    if (res.outcome === "nothing_to_reverse") {
      await auditRewards({ action: "rewards_reversal", outcome: "skipped", paymentRecordId: input.paymentRecordId, reason: res.reason });
      return { ok: true, outcome: "skipped", reason: res.reason };
    }

    // The audit records what ACTUALLY MOVED, which on a duplicate delivery is zero. Logging the
    // amount the call would have moved had it been the first delivery is precisely the reporting
    // failure this avoids: an operator reconciling the log would count two reversals where the
    // wallet shows one.
    await auditRewards({
      action: "rewards_reversal",
      outcome: res.outcome,
      paymentRecordId: input.paymentRecordId,
      amountCents: res.reversedCents,
      reason: res.reason ?? null,
      meta: {
        kind: input.kind,
        external_id: input.externalId,
        deduplicated: res.deduplicated,
        moved_cents: res.reversedCents,
        total_reversed_cents: res.totalReversedCents,
      },
    });
    return { ok: true, outcome: "reversed", reversedCents: res.reversedCents, deduplicated: res.deduplicated };
  } catch (e) {
    const reason = e instanceof Error ? e.message.slice(0, 300) : "unknown";
    await auditRewards({ action: "rewards_reversal", outcome: "failed", paymentRecordId: input.paymentRecordId, reason, retryable: true });
    return { ok: false, outcome: "failed", reason, retryable: true };
  }
}

/**
 * Promote a payment's pending credits to spendable once its settlement window has passed.
 * Intended to be driven by a scheduled job; it is idempotent, so re-running is harmless.
 */
export async function promoteSettledCredits(input: {
  walletId: string;
  paymentRecordId: string;
  amountCents: number;
}): Promise<RewardsHookResult> {
  if (!isRewardsConfigured()) return { ok: true, outcome: "skipped", reason: "rewards_not_configured" };
  try {
    const res = await promotePendingForPayment({
      walletId: input.walletId,
      paymentRecordId: input.paymentRecordId,
      amountCents: input.amountCents,
      ports: buildRewardsStorePort(),
    });
    if (!res.ok) {
      await auditRewards({ action: "rewards_promote", outcome: "failed", paymentRecordId: input.paymentRecordId, reason: res.error, retryable: true });
      return { ok: false, outcome: "failed", reason: res.error, retryable: true };
    }
    return { ok: true, outcome: "promoted", deduplicated: res.deduplicated };
  } catch (e) {
    const reason = e instanceof Error ? e.message.slice(0, 300) : "unknown";
    return { ok: false, outcome: "failed", reason, retryable: true };
  }
}

// ---------------------------------------------------------------------------
// SETTLEMENT PROMOTION — the 30-day card window
// ---------------------------------------------------------------------------

/**
 * Payment statuses that mean the money did NOT stay with Leonix. A payment in any of these states
 * must never promote: its credits stay pending until the reversal takes them, because promoting
 * first moves the clawback's target into `available` — money the customer may already have spent.
 */
// `refunded` is deliberately NOT here. `recordRefundOnPaymentRecord` sets that status for a
// PARTIAL refund as well as a full one, so treating it as invalidation froze the un-refunded
// remainder of the earn in `pending` permanently. A refund is handled by proportional reversal
// plus residual promotion; only a payment that is contested, failed or canceled is invalid.
const NON_PROMOTABLE_PAYMENT_STATUSES = new Set(["disputed", "failed", "canceled"]);

/**
 * Is this payment still good, 30 days on?
 *
 * Asked of the PAYMENT RECORD, which is where refund and dispute state lives, and cross-checked
 * against the ledger for any reversal already posted. Both, because a dispute can be recorded on
 * the ledger before the payment row is updated, and a refund can be recorded on the payment row
 * before its reversal reaches the ledger. Either signal is enough to withhold promotion.
 */
async function isPaymentStillPromotable(paymentRecordId: string): Promise<boolean> {
  const db = getAdminSupabase();

  const { data: payment, error } = await db
    .from("leonix_payment_records")
    .select("id, payment_status, refunded_at, manual_state")
    .eq("id", paymentRecordId)
    .maybeSingle();
  // Fail CLOSED: a payment we cannot read is a payment we cannot vouch for.
  if (error || !payment) return false;

  const row = payment as unknown as {
    payment_status: string | null;
    refunded_at: string | null;
    manual_state: string | null;
  };
  if (row.payment_status && NON_PROMOTABLE_PAYMENT_STATUSES.has(row.payment_status)) return false;
  if (row.manual_state === "reversed" || row.manual_state === "rejected") return false;

  // A DISPUTE invalidates the payment outright: the money is contested, so nothing it earned
  // becomes spendable. A REFUND does not, because refunds are proportional — the refunded share
  // has already been clawed back and the remainder is credits for money the customer really paid.
  //
  // `refunded_at` used to disqualify on its own, and so did the existence of ANY reversal row.
  // Both are set by a PARTIAL refund too, which is how the residual came to be stranded in
  // `pending` forever while the customer was told their credits never expire. The sweep now
  // promotes `earned - reversed` and this predicate answers only "is this payment still valid".
  const { data: disputes } = await db
    .from("leonix_rewards_ledger")
    .select("id")
    .eq("payment_record_id", paymentRecordId)
    .eq("entry_type", "chargeback_reversal")
    .limit(1);
  if ((disputes ?? []).length > 0) return false;

  return true;
}

export type PromotionSweepReport = {
  ok: boolean;
  reason?: string;
  examined: number;
  promoted: number;
  promotedCents: number;
  skippedIneligible: number;
  skippedAlreadyPromoted: number;
  failed: number;
};

/**
 * Promote every card earn whose 30-calendar-day window has closed.
 *
 * Driven by the protected scheduler seam (`/api/revenue-os/admin/rewards-settlement-sweep`), and
 * idempotent per payment, so a double-fired cron, an overlapping run or a manual re-run promotes
 * nothing twice. `dryRun` reports what WOULD move without moving it.
 */
export async function runRewardsSettlementPromotionSweep(input?: {
  nowMs?: number;
  limit?: number;
  dryRun?: boolean;
}): Promise<PromotionSweepReport> {
  const empty = {
    examined: 0,
    promoted: 0,
    promotedCents: 0,
    skippedIneligible: 0,
    skippedAlreadyPromoted: 0,
    failed: 0,
  };
  if (!isRewardsConfigured()) return { ok: true, reason: "rewards_not_configured", ...empty };

  const nowMs = input?.nowMs ?? Date.now();
  const limit = Math.min(500, Math.max(1, Math.floor(input?.limit ?? 200)));
  const ports = buildRewardsStorePort();

  try {
    if (input?.dryRun) {
      // A dry run reads the same candidate set and asks the same eligibility question, so the
      // number it reports is the number a real run would move — not an estimate.
      const olderThanIso = new Date(nowMs - CARD_SETTLEMENT_PENDING_DAYS * 86_400_000).toISOString();
      const candidates = await ports.listPromotablePendingEarns({ olderThanIso, limit });
      let wouldPromote = 0;
      let wouldPromoteCents = 0;
      let ineligible = 0;
      for (const c of candidates) {
        if (await isPaymentStillPromotable(c.paymentRecordId)) {
          wouldPromote += 1;
          wouldPromoteCents += c.amountCents;
        } else {
          ineligible += 1;
        }
      }
      return {
        ok: true,
        reason: "dry_run",
        examined: candidates.length,
        promoted: wouldPromote,
        promotedCents: wouldPromoteCents,
        skippedIneligible: ineligible,
        skippedAlreadyPromoted: 0,
        failed: 0,
      };
    }

    const result = await runPendingPromotionSweep({
      nowMs,
      settlementDays: CARD_SETTLEMENT_PENDING_DAYS,
      limit,
      ports,
      isPaymentStillEligible: isPaymentStillPromotable,
    });

    if (result.promoted > 0 || result.failed > 0) {
      await auditRewards({
        action: "rewards_promote",
        outcome: result.failed > 0 ? "partial" : "promoted",
        paymentRecordId: null,
        amountCents: result.promotedCents,
        retryable: result.failed > 0,
        meta: {
          examined: result.examined,
          promoted: result.promoted,
          skipped_ineligible: result.skippedIneligible,
          skipped_already_promoted: result.skippedAlreadyPromoted,
          failed: result.failed,
          failures: result.failures.slice(0, 20),
          settlement_days: CARD_SETTLEMENT_PENDING_DAYS,
        },
      });
    }

    return {
      ok: result.failed === 0,
      examined: result.examined,
      promoted: result.promoted,
      promotedCents: result.promotedCents,
      skippedIneligible: result.skippedIneligible,
      skippedAlreadyPromoted: result.skippedAlreadyPromoted,
      failed: result.failed,
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message.slice(0, 300) : "unknown";
    await auditRewards({ action: "rewards_promote", outcome: "failed", paymentRecordId: null, reason, retryable: true });
    return { ok: false, reason, ...empty };
  }
}

// ---------------------------------------------------------------------------
// RESERVATION EXPIRY — the 30-minute checkout hold
// ---------------------------------------------------------------------------

export type ExpirySweepReport = {
  ok: boolean;
  reason?: string;
  examined: number;
  released: number;
  releasedCents: number;
  alreadyFinal: number;
  failed: number;
};

/**
 * Release every checkout hold whose 30-minute window has passed.
 *
 * Runs on the same protected scheduler seam as the promotion sweep. Idempotent through
 * `release:<ref>`: a hold already committed or released is counted, not re-moved.
 */
export async function runRewardsReservationExpirySweep(input?: {
  nowMs?: number;
  limit?: number;
  dryRun?: boolean;
}): Promise<ExpirySweepReport> {
  const empty = { examined: 0, released: 0, releasedCents: 0, alreadyFinal: 0, failed: 0 };
  if (!isRewardsConfigured()) return { ok: true, reason: "rewards_not_configured", ...empty };

  const nowMs = input?.nowMs ?? Date.now();
  const limit = Math.min(500, Math.max(1, Math.floor(input?.limit ?? 200)));
  const ports = buildRewardsStorePort();

  try {
    if (input?.dryRun) {
      const expired = await ports.listExpiredReservations({ nowIso: new Date(nowMs).toISOString(), limit });
      return {
        ok: true,
        reason: "dry_run",
        examined: expired.length,
        released: expired.length,
        releasedCents: expired.reduce((a, r) => a + r.amountCents, 0),
        alreadyFinal: 0,
        failed: 0,
      };
    }

    const result = await runReservationExpirySweep({ nowMs, limit, ports });

    if (result.released > 0 || result.failed > 0) {
      await auditRewards({
        action: "rewards_redemption",
        outcome: result.failed > 0 ? "partial_release" : "released",
        paymentRecordId: null,
        amountCents: result.releasedCents,
        retryable: result.failed > 0,
        meta: {
          examined: result.examined,
          released: result.released,
          already_final: result.alreadyFinal,
          failed: result.failed,
          failures: result.failures.slice(0, 20),
          hold_minutes: REDEMPTION_RESERVATION_MINUTES,
        },
      });
    }

    return {
      ok: result.failed === 0,
      examined: result.examined,
      released: result.released,
      releasedCents: result.releasedCents,
      alreadyFinal: result.alreadyFinal,
      failed: result.failed,
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message.slice(0, 300) : "unknown";
    await auditRewards({ action: "rewards_redemption", outcome: "failed", paymentRecordId: null, reason, retryable: true });
    return { ok: false, reason, ...empty };
  }
}

export type { WalletOwnerRef };

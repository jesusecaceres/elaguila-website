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
import {
  earnFromSettledPayment,
  promotePendingForPayment,
  reverseForRefundOrChargeback,
  type WalletOwnerRef,
} from "./rewardsLedgerCore";
import { buildRewardsStorePort, isRewardsConfigured, resolveWalletOwnerForPayment } from "./rewardsLedger";
import type { SettledPaymentFacts } from "./rewardsPolicy";

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

/** Claw credits back when money goes back to the customer. Proportional and idempotent. */
export async function reverseCreditsForRefundOrDispute(input: {
  paymentRecordId: string;
  ownerUserId: string | null;
  refundedCents: number;
  kind: "refund" | "chargeback";
  /** The Stripe refund or dispute id — the idempotency anchor. */
  externalId: string;
}): Promise<RewardsHookResult> {
  if (!isRewardsConfigured()) return { ok: true, outcome: "skipped", reason: "rewards_not_configured" };
  try {
    const owner = await resolveWalletOwnerForPayment({
      paymentRecordId: input.paymentRecordId,
      ownerUserId: input.ownerUserId,
    });
    if (!owner) return { ok: true, outcome: "skipped", reason: "no_wallet_owner" };

    const res = await reverseForRefundOrChargeback({
      owner,
      paymentRecordId: input.paymentRecordId,
      refundedCents: input.refundedCents,
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

    await auditRewards({
      action: "rewards_reversal",
      outcome: "reversed",
      paymentRecordId: input.paymentRecordId,
      amountCents: res.reversedCents,
      meta: { kind: input.kind, external_id: input.externalId, deduplicated: res.deduplicated },
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

export type { WalletOwnerRef };

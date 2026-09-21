/**
 * LEONIX IX REWARDS — ledger operations, expressed against injected ports.
 *
 * Deliberately NOT `server-only`: the real Supabase client arrives through `RewardsStorePort`, so
 * `scripts/verify-ix-rewards-behavior-01.ts` drives these exact code paths against an in-memory
 * store and asserts on observable outcomes — balances, ledger entries, idempotency, refusals.
 * The `server-only` adapter that supplies the production port is `rewardsLedger.ts`.
 *
 * INVARIANTS THIS LAYER IS RESPONSIBLE FOR
 *  - Every externally-triggered movement carries a derived idempotency key, so a replayed Stripe
 *    event, a retried webhook or a re-imported CSV row cannot move credits twice.
 *  - Credits are RESERVED before a payment is created and only COMMITTED after it succeeds, so an
 *    abandoned checkout never silently consumes a balance.
 *  - A reversal never exceeds what the original payment actually earned.
 *  - Nothing here computes the 9% rate or the redemption cap; that is `rewardsPolicy.ts`, and this
 *    layer calls it rather than re-deriving it.
 */
import {
  assessEarn,
  computeReversalCents,
  planRedemption,
  type RedemptionPlan,
  type SettledPaymentFacts,
} from "./rewardsPolicy";

// ---------------------------------------------------------------------------
// Idempotency keys — pure, derived from the external fact, never random.
// ---------------------------------------------------------------------------

/** Namespaced so two different subsystems can never collide on the same external id. */
export function earnIdempotencyKey(paymentRecordId: string): string {
  return `earn:payment:${paymentRecordId}`;
}
export function promoteIdempotencyKey(paymentRecordId: string): string {
  return `promote:payment:${paymentRecordId}`;
}
/** Keyed on the specific refund/dispute, so partial refunds each reverse exactly once. */
export function reversalIdempotencyKey(kind: "refund" | "chargeback", externalId: string): string {
  return `reverse:${kind}:${externalId}`;
}
export function reserveIdempotencyKey(redemptionRef: string): string {
  return `reserve:${redemptionRef}`;
}
export function commitIdempotencyKey(redemptionRef: string): string {
  return `commit:${redemptionRef}`;
}
export function releaseIdempotencyKey(redemptionRef: string): string {
  return `release:${redemptionRef}`;
}
export function manualAdjustmentIdempotencyKey(ref: string): string {
  return `adjust:${ref}`;
}

// ---------------------------------------------------------------------------
// Port
// ---------------------------------------------------------------------------

export type WalletOwnerRef =
  | { kind: "business"; businessId: string }
  | { kind: "user"; ownerUserId: string };

export type WalletSnapshot = {
  id: string;
  pendingCents: number;
  availableCents: number;
  reservedCents: number;
  lifetimeEarnedCents: number;
  lifetimeRedeemedCents: number;
  lifetimeReversedCents: number;
};

export type LedgerEntryInput = {
  walletId: string;
  entryType:
    | "earn_pending"
    | "earn_promote"
    | "earn_available"
    | "redeem_reserve"
    | "redeem_commit"
    | "redeem_release"
    | "refund_reversal"
    | "chargeback_reversal"
    | "manual_adjustment"
    | "expire";
  amountCents: number;
  sourceKind:
    | "stripe_payment"
    | "stripe_refund"
    | "stripe_dispute"
    | "manual_payment"
    | "staff_adjustment"
    | "csv_import"
    | "checkout_redemption";
  idempotencyKey: string;
  sourceId?: string | null;
  paymentRecordId?: string | null;
  redemptionId?: string | null;
  reason?: string | null;
  actorAuthUserId?: string | null;
  actorRosterId?: string | null;
  meta?: Record<string, unknown>;
};

export type LedgerEntryRecord = {
  id: string;
  walletId: string;
  entryType: string;
  amountCents: number;
  idempotencyKey: string;
  /** True when this call matched an existing entry rather than creating one. */
  deduplicated: boolean;
};

export type RedemptionRecord = {
  id: string;
  walletId: string;
  amountCents: number;
  status: "reserved" | "committed" | "released" | "expired";
  idempotencyKey: string;
};

export type RewardsStorePort = {
  /** Find or create the canonical wallet for this entity. */
  resolveWallet(owner: WalletOwnerRef): Promise<{ ok: true; wallet: WalletSnapshot } | { ok: false; error: string }>;
  getWalletById(walletId: string): Promise<WalletSnapshot | null>;
  /**
   * Append a ledger entry and update the cached balances ATOMICALLY. Must be idempotent on
   * `idempotencyKey` and must refuse (not clamp) a movement that would drive a bucket negative.
   */
  postEntry(input: LedgerEntryInput): Promise<{ ok: true; entry: LedgerEntryRecord } | { ok: false; error: string }>;
  createRedemption(input: {
    walletId: string;
    amountCents: number;
    idempotencyKey: string;
    contextKind: "stripe_checkout" | "manual_payment" | "subscription_invoice";
    stripeCheckoutSessionId?: string | null;
    paymentRecordId?: string | null;
    actorAuthUserId?: string | null;
  }): Promise<{ ok: true; redemption: RedemptionRecord; deduplicated: boolean } | { ok: false; error: string }>;
  findRedemption(idempotencyKey: string): Promise<RedemptionRecord | null>;
  setRedemptionStatus(input: {
    redemptionId: string;
    status: "committed" | "released" | "expired";
    settleLedgerId?: string | null;
  }): Promise<{ ok: boolean; error?: string }>;
  /** Total already reversed against a payment, so partial refunds cannot over-reverse. */
  sumReversedForPayment(paymentRecordId: string): Promise<number>;
  /** The earn entry originally produced by this payment, if any. */
  findEarnForPayment(paymentRecordId: string): Promise<{ amountCents: number; eligibleNetCents: number } | null>;
};

// ---------------------------------------------------------------------------
// EARN
// ---------------------------------------------------------------------------

export type EarnResult =
  | { ok: true; outcome: "earned"; earnCents: number; entryId: string; deduplicated: boolean }
  | { ok: true; outcome: "not_eligible"; reason: string }
  | { ok: false; error: string };

/**
 * Award credits for an authoritatively settled payment.
 *
 * `pendingUntilSettlementFinal` reflects the canonical settlement policy: card payments are
 * awarded as PENDING until the refund/dispute window the business chooses has passed, while a
 * cleared manual payment (cash, check) is final on the day it clears and is awarded as available.
 */
export async function earnFromSettledPayment(input: {
  owner: WalletOwnerRef;
  paymentRecordId: string;
  facts: SettledPaymentFacts;
  sourceKind: "stripe_payment" | "manual_payment" | "csv_import";
  sourceId?: string | null;
  pendingUntilSettlementFinal: boolean;
  ports: RewardsStorePort;
}): Promise<EarnResult> {
  const assessment = assessEarn(input.facts);
  if (!assessment.earns) return { ok: true, outcome: "not_eligible", reason: assessment.reason };

  const walletRes = await input.ports.resolveWallet(input.owner);
  if (!walletRes.ok) return { ok: false, error: walletRes.error };

  const posted = await input.ports.postEntry({
    walletId: walletRes.wallet.id,
    entryType: input.pendingUntilSettlementFinal ? "earn_pending" : "earn_available",
    amountCents: assessment.earnCents,
    sourceKind: input.sourceKind,
    sourceId: input.sourceId ?? null,
    paymentRecordId: input.paymentRecordId,
    idempotencyKey: earnIdempotencyKey(input.paymentRecordId),
    meta: {
      eligible_net_cents: assessment.eligibleNetCents,
      amount_paid_cents: input.facts.amountPaidCents,
      credits_applied_cents: input.facts.creditsAppliedCents,
    },
  });
  if (!posted.ok) return { ok: false, error: posted.error };

  return {
    ok: true,
    outcome: "earned",
    earnCents: assessment.earnCents,
    entryId: posted.entry.id,
    deduplicated: posted.entry.deduplicated,
  };
}

/** Move a payment's pending credits into the spendable bucket once settlement is final. */
export async function promotePendingForPayment(input: {
  walletId: string;
  paymentRecordId: string;
  amountCents: number;
  ports: RewardsStorePort;
}): Promise<{ ok: true; deduplicated: boolean } | { ok: false; error: string }> {
  const posted = await input.ports.postEntry({
    walletId: input.walletId,
    entryType: "earn_promote",
    amountCents: input.amountCents,
    sourceKind: "stripe_payment",
    paymentRecordId: input.paymentRecordId,
    idempotencyKey: promoteIdempotencyKey(input.paymentRecordId),
  });
  if (!posted.ok) return { ok: false, error: posted.error };
  return { ok: true, deduplicated: posted.entry.deduplicated };
}

// ---------------------------------------------------------------------------
// REVERSAL
// ---------------------------------------------------------------------------

export type ReversalResult =
  | { ok: true; outcome: "reversed"; reversedCents: number; deduplicated: boolean }
  | { ok: true; outcome: "nothing_to_reverse"; reason: string }
  | { ok: false; error: string };

/**
 * Claw back credits proportionally when money goes back to the customer.
 *
 * Proportional to the refunded fraction of the eligible net, never more than was earned, and
 * never more than remains unreversed — so a duplicate dispute webhook or a sequence of partial
 * refunds summing past the original cannot drive the wallet negative.
 */
export async function reverseForRefundOrChargeback(input: {
  owner: WalletOwnerRef;
  paymentRecordId: string;
  refundedCents: number;
  kind: "refund" | "chargeback";
  externalId: string;
  ports: RewardsStorePort;
}): Promise<ReversalResult> {
  const original = await input.ports.findEarnForPayment(input.paymentRecordId);
  if (!original || original.amountCents <= 0) {
    return { ok: true, outcome: "nothing_to_reverse", reason: "payment_earned_nothing" };
  }

  const alreadyReversedCents = await input.ports.sumReversedForPayment(input.paymentRecordId);
  const reverseCents = computeReversalCents({
    originallyEarnedCents: original.amountCents,
    originalEligibleNetCents: original.eligibleNetCents,
    refundedCents: input.refundedCents,
    alreadyReversedCents,
  });
  if (reverseCents <= 0) {
    return { ok: true, outcome: "nothing_to_reverse", reason: "fully_reversed_already" };
  }

  const walletRes = await input.ports.resolveWallet(input.owner);
  if (!walletRes.ok) return { ok: false, error: walletRes.error };

  const posted = await input.ports.postEntry({
    walletId: walletRes.wallet.id,
    entryType: input.kind === "refund" ? "refund_reversal" : "chargeback_reversal",
    amountCents: reverseCents,
    sourceKind: input.kind === "refund" ? "stripe_refund" : "stripe_dispute",
    sourceId: input.externalId,
    paymentRecordId: input.paymentRecordId,
    idempotencyKey: reversalIdempotencyKey(input.kind, input.externalId),
    meta: { refunded_cents: input.refundedCents, originally_earned_cents: original.amountCents },
  });
  if (!posted.ok) return { ok: false, error: posted.error };

  return { ok: true, outcome: "reversed", reversedCents: reverseCents, deduplicated: posted.entry.deduplicated };
}

// ---------------------------------------------------------------------------
// REDEMPTION: reserve → commit / release
// ---------------------------------------------------------------------------

export type ReserveResult =
  | { ok: true; redemptionId: string; redeemCents: number; remainingDueCents: number; deduplicated: boolean }
  | { ok: false; reason: string };

/**
 * Hold credits for an in-flight purchase. The SERVER decides the amount: `requestedCents` is the
 * customer's wish, and `planRedemption` caps it against the live balance and the amount actually
 * owed. A browser-supplied figure is never applied as-is.
 */
export async function reserveCreditsForPurchase(input: {
  owner: WalletOwnerRef;
  requestedCents: number;
  amountDueCents: number;
  minimumChargeCents?: number;
  redemptionRef: string;
  contextKind: "stripe_checkout" | "manual_payment" | "subscription_invoice";
  stripeCheckoutSessionId?: string | null;
  paymentRecordId?: string | null;
  actorAuthUserId?: string | null;
  ports: RewardsStorePort;
}): Promise<ReserveResult> {
  const idempotencyKey = reserveIdempotencyKey(input.redemptionRef);

  const existing = await input.ports.findRedemption(idempotencyKey);
  if (existing) {
    return {
      ok: true,
      redemptionId: existing.id,
      redeemCents: existing.amountCents,
      remainingDueCents: Math.max(0, Math.floor(input.amountDueCents) - existing.amountCents),
      deduplicated: true,
    };
  }

  const walletRes = await input.ports.resolveWallet(input.owner);
  if (!walletRes.ok) return { ok: false, reason: walletRes.error };

  const plan: RedemptionPlan = planRedemption({
    requestedCents: input.requestedCents,
    availableCents: walletRes.wallet.availableCents,
    amountDueCents: input.amountDueCents,
    minimumChargeCents: input.minimumChargeCents,
  });
  if (!plan.ok) return { ok: false, reason: plan.reason };

  const created = await input.ports.createRedemption({
    walletId: walletRes.wallet.id,
    amountCents: plan.redeemCents,
    idempotencyKey,
    contextKind: input.contextKind,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
    paymentRecordId: input.paymentRecordId ?? null,
    actorAuthUserId: input.actorAuthUserId ?? null,
  });
  if (!created.ok) return { ok: false, reason: created.error };

  const posted = await input.ports.postEntry({
    walletId: walletRes.wallet.id,
    entryType: "redeem_reserve",
    amountCents: plan.redeemCents,
    sourceKind: "checkout_redemption",
    sourceId: input.stripeCheckoutSessionId ?? input.redemptionRef,
    paymentRecordId: input.paymentRecordId ?? null,
    redemptionId: created.redemption.id,
    idempotencyKey,
    actorAuthUserId: input.actorAuthUserId ?? null,
  });
  if (!posted.ok) return { ok: false, reason: posted.error };

  return {
    ok: true,
    redemptionId: created.redemption.id,
    redeemCents: plan.redeemCents,
    remainingDueCents: plan.remainingDueCents,
    deduplicated: false,
  };
}

/** Spend the held credits. Called only after the payment has actually succeeded. */
export async function commitReservedCredits(input: {
  redemptionRef: string;
  paymentRecordId?: string | null;
  ports: RewardsStorePort;
}): Promise<{ ok: true; outcome: "committed" | "already_final"; amountCents: number } | { ok: false; error: string }> {
  const reservation = await input.ports.findRedemption(reserveIdempotencyKey(input.redemptionRef));
  if (!reservation) return { ok: false, error: "reservation_not_found" };
  if (reservation.status !== "reserved") {
    // Committing twice, or committing something already released, is a no-op rather than an error:
    // duplicate webhook deliveries must not corrupt entitlement state.
    return { ok: true, outcome: "already_final", amountCents: reservation.amountCents };
  }

  const posted = await input.ports.postEntry({
    walletId: reservation.walletId,
    entryType: "redeem_commit",
    amountCents: reservation.amountCents,
    sourceKind: "checkout_redemption",
    paymentRecordId: input.paymentRecordId ?? null,
    redemptionId: reservation.id,
    idempotencyKey: commitIdempotencyKey(input.redemptionRef),
  });
  if (!posted.ok) return { ok: false, error: posted.error };

  const updated = await input.ports.setRedemptionStatus({
    redemptionId: reservation.id,
    status: "committed",
    settleLedgerId: posted.entry.id,
  });
  if (!updated.ok) return { ok: false, error: updated.error ?? "status_update_failed" };

  return { ok: true, outcome: "committed", amountCents: reservation.amountCents };
}

/** Return held credits after a failed or expired checkout. */
export async function releaseReservedCredits(input: {
  redemptionRef: string;
  expired?: boolean;
  ports: RewardsStorePort;
}): Promise<{ ok: true; outcome: "released" | "already_final"; amountCents: number } | { ok: false; error: string }> {
  const reservation = await input.ports.findRedemption(reserveIdempotencyKey(input.redemptionRef));
  if (!reservation) return { ok: false, error: "reservation_not_found" };
  if (reservation.status !== "reserved") {
    return { ok: true, outcome: "already_final", amountCents: reservation.amountCents };
  }

  const posted = await input.ports.postEntry({
    walletId: reservation.walletId,
    entryType: "redeem_release",
    amountCents: reservation.amountCents,
    sourceKind: "checkout_redemption",
    redemptionId: reservation.id,
    idempotencyKey: releaseIdempotencyKey(input.redemptionRef),
  });
  if (!posted.ok) return { ok: false, error: posted.error };

  const updated = await input.ports.setRedemptionStatus({
    redemptionId: reservation.id,
    status: input.expired ? "expired" : "released",
    settleLedgerId: posted.entry.id,
  });
  if (!updated.ok) return { ok: false, error: updated.error ?? "status_update_failed" };

  return { ok: true, outcome: "released", amountCents: reservation.amountCents };
}

// ---------------------------------------------------------------------------
// MANUAL ADJUSTMENT
// ---------------------------------------------------------------------------

/**
 * Authorized staff correction. Signed, always attributed, always explained — the database
 * additionally refuses a manual adjustment without a reason and an actor.
 */
export async function postManualAdjustment(input: {
  owner: WalletOwnerRef;
  amountCents: number;
  reason: string;
  actorAuthUserId: string;
  actorRosterId?: string | null;
  adjustmentRef: string;
  ports: RewardsStorePort;
}): Promise<{ ok: true; amountCents: number; deduplicated: boolean } | { ok: false; error: string }> {
  if (!Number.isFinite(input.amountCents) || Math.floor(input.amountCents) === 0) {
    return { ok: false, error: "amount_must_be_nonzero" };
  }
  if (!input.reason || input.reason.trim().length < 3) return { ok: false, error: "reason_required" };
  if (!input.actorAuthUserId) return { ok: false, error: "actor_required" };

  const walletRes = await input.ports.resolveWallet(input.owner);
  if (!walletRes.ok) return { ok: false, error: walletRes.error };

  const posted = await input.ports.postEntry({
    walletId: walletRes.wallet.id,
    entryType: "manual_adjustment",
    amountCents: Math.floor(input.amountCents),
    sourceKind: "staff_adjustment",
    idempotencyKey: manualAdjustmentIdempotencyKey(input.adjustmentRef),
    reason: input.reason.trim(),
    actorAuthUserId: input.actorAuthUserId,
    actorRosterId: input.actorRosterId ?? null,
  });
  if (!posted.ok) return { ok: false, error: posted.error };
  return { ok: true, amountCents: Math.floor(input.amountCents), deduplicated: posted.entry.deduplicated };
}

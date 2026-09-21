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
 *  - A reversal never exceeds what the original payment actually earned, and a SEQUENCE of partial
 *    refunds converges on exactly the proportional total rather than drifting under it.
 *  - A reversal always debits the wallet the payment ORIGINALLY credited. Ownership is read from
 *    the earn entry, never re-resolved at reversal time: a customer who joined a business between
 *    the payment and the refund must not have the clawback taken from a different wallet.
 *  - Nothing here computes the 9% rate or the redemption cap; that is `rewardsPolicy.ts`, and this
 *    layer calls it rather than re-deriving it.
 */
import {
  REDEMPTION_RESERVATION_MINUTES,
  assessEarn,
  computeReversalDeltaCents,
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
  expiresAtIso?: string | null;
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
    /** The hold's deadline. Written on RESERVE so the release job never has to guess one. */
    expiresAtIso: string;
  }): Promise<{ ok: true; redemption: RedemptionRecord; deduplicated: boolean } | { ok: false; error: string }>;
  findRedemption(idempotencyKey: string): Promise<RedemptionRecord | null>;
  setRedemptionStatus(input: {
    redemptionId: string;
    status: "committed" | "released" | "expired";
    settleLedgerId?: string | null;
    /**
     * Normally the update is a compare-and-set from `reserved`, so a late release cannot undo a
     * commit. The re-debit path is the one case that must finalise a row which is ALREADY
     * released or expired — it has just taken the credits again — and it says so explicitly
     * rather than the adapter quietly dropping the guard for everyone.
     */
    fromAnyStatus?: boolean;
  }): Promise<{ ok: boolean; error?: string }>;
  /**
   * An existing ledger entry under this exact key, if any.
   *
   * Lets a caller ANSWER "has this already been applied?" without attempting the movement — which
   * is what a dry run needs: a preview that had to post in order to find out would not be a
   * preview.
   */
  findLedgerEntryByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<{ id: string; walletId: string; entryType: string; amountCents: number } | null>;
  /** Total already reversed against a payment, so partial refunds cannot over-reverse. */
  sumReversedForPayment(paymentRecordId: string): Promise<number>;
  /**
   * The earn entry originally produced by this payment, if any — INCLUDING the wallet it credited.
   *
   * `walletId` is the whole reason this returns a record rather than two numbers. A reversal must
   * debit the wallet that was originally credited; re-resolving ownership at reversal time would
   * silently move the clawback to whatever wallet the payer maps to TODAY.
   */
  findEarnForPayment(
    paymentRecordId: string,
  ): Promise<{ walletId: string; amountCents: number; eligibleNetCents: number } | null>;
  /**
   * The refunded money already accounted for on this payment by reversals of ONE kind, as the sum
   * of each recorded reversal's `basis_contribution_cents`. This is what turns a stream of
   * per-event amounts into a cumulative position.
   */
  sumReversalBasisForPayment(paymentRecordId: string, kind: "refund" | "chargeback"): Promise<number>;
  /** Pending earns whose settlement window has passed and that have not yet been promoted. */
  listPromotablePendingEarns(input: {
    olderThanIso: string;
    limit: number;
  }): Promise<
    Array<{ walletId: string; paymentRecordId: string; amountCents: number; earnedAtIso: string }>
  >;
  /** Reservations whose hold has expired and that are still in `reserved`. */
  listExpiredReservations(input: {
    nowIso: string;
    limit: number;
  }): Promise<Array<{ redemptionRef: string; redemptionId: string; amountCents: number }>>;
};

/** The reservation's wall-clock deadline, derived from the one policy constant. */
export function reservationExpiresAtIso(nowMs: number): string {
  return new Date(nowMs + REDEMPTION_RESERVATION_MINUTES * 60_000).toISOString();
}

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

/**
 * Move a payment's pending credits into the spendable bucket once settlement is final.
 *
 * `walletId` is the wallet the earn entry credited — passed in by the caller that read it, never
 * re-resolved here, for the same reason a reversal never re-resolves it.
 */
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

export type PromotionSweepOutcome = {
  examined: number;
  promoted: number;
  promotedCents: number;
  skippedIneligible: number;
  skippedAlreadyPromoted: number;
  failed: number;
  failures: Array<{ paymentRecordId: string; error: string }>;
};

/**
 * Promote every card earn whose 30-calendar-day settlement window has closed.
 *
 * ELIGIBILITY IS ASKED, NOT ASSUMED. `isPaymentStillEligible` is injected because the answer lives
 * in the payment record (refunded? disputed? reversed?), not in the ledger. A payment that went
 * back to the customer must never promote: its credits stay pending until the reversal takes them,
 * because promoting first would move the clawback out of `available` — money the customer may
 * already have spent.
 *
 * Idempotent per payment through `promote:payment:<id>`, so running the sweep twice, or running it
 * while a previous run is still finishing, promotes nothing twice.
 */
export async function runPendingPromotionSweep(input: {
  nowMs: number;
  settlementDays: number;
  limit: number;
  ports: RewardsStorePort;
  isPaymentStillEligible: (paymentRecordId: string) => Promise<boolean>;
}): Promise<PromotionSweepOutcome> {
  const olderThanIso = new Date(input.nowMs - input.settlementDays * 86_400_000).toISOString();
  const candidates = await input.ports.listPromotablePendingEarns({
    olderThanIso,
    limit: Math.max(1, Math.floor(input.limit)),
  });

  const out: PromotionSweepOutcome = {
    examined: candidates.length,
    promoted: 0,
    promotedCents: 0,
    skippedIneligible: 0,
    skippedAlreadyPromoted: 0,
    failed: 0,
    failures: [],
  };

  for (const candidate of candidates) {
    const eligible = await input.isPaymentStillEligible(candidate.paymentRecordId).catch(() => false);
    if (!eligible) {
      out.skippedIneligible += 1;
      continue;
    }
    const res = await promotePendingForPayment({
      walletId: candidate.walletId,
      paymentRecordId: candidate.paymentRecordId,
      amountCents: candidate.amountCents,
      ports: input.ports,
    });
    if (!res.ok) {
      out.failed += 1;
      out.failures.push({ paymentRecordId: candidate.paymentRecordId, error: res.error });
      continue;
    }
    if (res.deduplicated) {
      out.skippedAlreadyPromoted += 1;
      continue;
    }
    out.promoted += 1;
    out.promotedCents += candidate.amountCents;
  }

  return out;
}

export type ExpirySweepOutcome = {
  examined: number;
  released: number;
  releasedCents: number;
  alreadyFinal: number;
  failed: number;
  failures: Array<{ redemptionRef: string; error: string }>;
};

/**
 * Return every hold whose 30-minute window has passed. An abandoned checkout must not keep a
 * customer's credits out of reach forever, and a customer who never came back must not discover
 * their balance is permanently short.
 *
 * Idempotent through `release:<ref>`, and a hold that was committed or released in the meantime is
 * counted as already final rather than treated as an error.
 */
export async function runReservationExpirySweep(input: {
  nowMs: number;
  limit: number;
  ports: RewardsStorePort;
}): Promise<ExpirySweepOutcome> {
  const expired = await input.ports.listExpiredReservations({
    nowIso: new Date(input.nowMs).toISOString(),
    limit: Math.max(1, Math.floor(input.limit)),
  });

  const out: ExpirySweepOutcome = {
    examined: expired.length,
    released: 0,
    releasedCents: 0,
    alreadyFinal: 0,
    failed: 0,
    failures: [],
  };

  for (const row of expired) {
    const res = await releaseReservedCredits({ redemptionRef: row.redemptionRef, expired: true, ports: input.ports });
    if (!res.ok) {
      out.failed += 1;
      out.failures.push({ redemptionRef: row.redemptionRef, error: res.error });
      continue;
    }
    if (res.outcome === "already_final") {
      out.alreadyFinal += 1;
      continue;
    }
    out.released += 1;
    out.releasedCents += res.amountCents;
  }

  return out;
}

// ---------------------------------------------------------------------------
// REVERSAL
// ---------------------------------------------------------------------------

export type ReversalResult =
  | {
      ok: true;
      /** `reversed` moved money. `no_movement` recorded the event but moved nothing. */
      outcome: "reversed" | "no_movement";
      /** What THIS call actually moved. Zero on a duplicate delivery, always. */
      reversedCents: number;
      /** The running total reversed against this payment after this call. */
      totalReversedCents: number;
      /** True when the event had already been applied and nothing moved. */
      deduplicated: boolean;
      reason?: string;
    }
  | { ok: true; outcome: "nothing_to_reverse"; reason: string; reversedCents: 0; totalReversedCents: number }
  | { ok: false; error: string };

/**
 * Claw back credits when money goes back to the customer.
 *
 * TWO CORRECTNESS PROPERTIES THIS FUNCTION EXISTS FOR
 *
 * 1. EXACTLY ONCE PER REFUND OBJECT, CUMULATIVELY EXACT IN TOTAL.
 *    The idempotency anchor is the refund's own id (or the dispute's), NOT the charge's: Stripe
 *    delivers `charge.refunded` once per refund against the same charge, so keying on the charge
 *    makes every refund after the first a no-op and silently under-reverses. The amount moved is
 *    a DELTA against a cumulative target rather than a per-event proportion, so a sequence of
 *    partial refunds converges on the exact proportional total instead of losing a cent to
 *    rounding at each step, and out-of-order delivery lands in the same place.
 *
 * 2. THE ORIGINAL WALLET, ALWAYS.
 *    The wallet is read off the earn entry. It is never re-resolved from the payer's identity,
 *    because that identity may have changed — the money must come back out of the wallet it went
 *    into, or one customer's refund debits another customer's credits.
 *
 * An event that moves nothing is still RECORDED, at amount zero, so its refunded basis is never
 * lost and the audit trail shows the event was seen rather than leaving a silent gap.
 */
export async function reverseForRefundOrChargeback(input: {
  paymentRecordId: string;
  kind: "refund" | "chargeback";
  /**
   * The REFUND object's id, or the DISPUTE's id. Never the charge id: one charge produces many
   * refunds, and they must not collapse onto a single idempotency key.
   */
  externalId: string;
  /** This one event's own refunded amount. Used when the rail reports per-event amounts. */
  eventRefundedCents: number;
  /**
   * The rail's CUMULATIVE refunded total for this kind, when it reports one (Stripe's
   * `charge.amount_refunded` is cumulative across every refund on the charge). When supplied it
   * wins, because it is the rail's own authoritative position.
   */
  cumulativeRefundedCentsForKind?: number | null;
  ports: RewardsStorePort;
}): Promise<ReversalResult> {
  const original = await input.ports.findEarnForPayment(input.paymentRecordId);
  if (!original || original.amountCents <= 0) {
    return { ok: true, outcome: "nothing_to_reverse", reason: "payment_earned_nothing", reversedCents: 0, totalReversedCents: 0 };
  }

  const idempotencyKey = reversalIdempotencyKey(input.kind, input.externalId);
  const otherKind = input.kind === "refund" ? "chargeback" : "refund";

  const [priorBasisSameKind, priorBasisOtherKind, alreadyReversedCents] = await Promise.all([
    input.ports.sumReversalBasisForPayment(input.paymentRecordId, input.kind),
    input.ports.sumReversalBasisForPayment(input.paymentRecordId, otherKind),
    input.ports.sumReversedForPayment(input.paymentRecordId),
  ]);

  // What THIS event adds to the money-returned position. A cumulative rail figure is converted to
  // a contribution by subtracting what is already accounted for; a per-event figure is taken as-is.
  const cumulativeForKind = input.cumulativeRefundedCentsForKind;
  const basisContributionCents =
    typeof cumulativeForKind === "number" && Number.isFinite(cumulativeForKind)
      ? Math.max(0, Math.floor(cumulativeForKind) - priorBasisSameKind)
      : Math.max(0, Math.floor(input.eventRefundedCents));

  const cumulativeRefundedCents = priorBasisSameKind + basisContributionCents + priorBasisOtherKind;

  const deltaCents = computeReversalDeltaCents({
    originallyEarnedCents: original.amountCents,
    originalEligibleNetCents: original.eligibleNetCents,
    cumulativeRefundedCents,
    alreadyReversedCents,
  });

  // The wallet that was CREDITED, read from the earn entry — not re-resolved from the payer.
  const posted = await input.ports.postEntry({
    walletId: original.walletId,
    entryType: input.kind === "refund" ? "refund_reversal" : "chargeback_reversal",
    amountCents: deltaCents,
    sourceKind: input.kind === "refund" ? "stripe_refund" : "stripe_dispute",
    sourceId: input.externalId,
    paymentRecordId: input.paymentRecordId,
    idempotencyKey,
    meta: {
      basis_contribution_cents: basisContributionCents,
      cumulative_refunded_cents: cumulativeRefundedCents,
      event_refunded_cents: Math.max(0, Math.floor(input.eventRefundedCents)),
      originally_earned_cents: original.amountCents,
      already_reversed_before_cents: alreadyReversedCents,
    },
  });
  if (!posted.ok) return { ok: false, error: posted.error };

  // A replay matched the existing entry: NOTHING moved, and the audit log must say so rather
  // than reporting the amount this call would have moved had it been the first delivery.
  if (posted.entry.deduplicated) {
    return {
      ok: true,
      outcome: "no_movement",
      reversedCents: 0,
      totalReversedCents: alreadyReversedCents,
      deduplicated: true,
      reason: "duplicate_delivery",
    };
  }

  return {
    ok: true,
    outcome: deltaCents > 0 ? "reversed" : "no_movement",
    reversedCents: deltaCents,
    totalReversedCents: alreadyReversedCents + deltaCents,
    deduplicated: false,
    ...(deltaCents === 0 ? { reason: "already_at_proportional_target" } : {}),
  };
}

// ---------------------------------------------------------------------------
// REDEMPTION: reserve → commit / release
// ---------------------------------------------------------------------------

export type ReserveResult =
  | {
      ok: true;
      redemptionId: string;
      redeemCents: number;
      remainingDueCents: number;
      /** True when this call matched an existing hold instead of creating one. No new money moved. */
      deduplicated: boolean;
      expiresAtIso: string | null;
    }
  | { ok: false; reason: string; maxRedeemableCents?: number };

/**
 * Hold credits for an in-flight purchase. The SERVER decides the amount: `requestedCents` is the
 * customer's wish, and `planRedemption` caps it against the live balance and the amount actually
 * owed. A browser-supplied figure is never applied as-is.
 */
export async function reserveCreditsForPurchase(input: {
  owner: WalletOwnerRef;
  requestedCents: number;
  amountDueCents: number;
  /** The whole eligible purchase the 50% ceiling is measured against. Defaults to what is due. */
  eligiblePurchaseCents?: number;
  minimumChargeCents?: number;
  allowZeroCharge?: boolean;
  redemptionRef: string;
  contextKind: "stripe_checkout" | "manual_payment" | "subscription_invoice";
  stripeCheckoutSessionId?: string | null;
  paymentRecordId?: string | null;
  actorAuthUserId?: string | null;
  nowMs?: number;
  ports: RewardsStorePort;
}): Promise<ReserveResult> {
  const idempotencyKey = reserveIdempotencyKey(input.redemptionRef);

  // A REUSED reference returns the hold that already exists and says so. It never creates a
  // second hold, and it never reports a fresh redemption the caller could present as a new
  // discount: `deduplicated` is what stops a replayed reference becoming a phantom price cut.
  //
  // ONLY A `reserved` HOLD FUNDS ANYTHING. A `committed` one was already spent on a purchase that
  // completed; reporting its amount again would hand the customer that discount a second time
  // without debiting anything. A `released` or `expired` one funds nothing by definition. All
  // three report zero, and the caller refuses rather than pricing a discount off them.
  const existing = await input.ports.findRedemption(idempotencyKey);
  if (existing) {
    const stillHeld = existing.status === "reserved" ? existing.amountCents : 0;
    return {
      ok: true,
      redemptionId: existing.id,
      redeemCents: stillHeld,
      remainingDueCents: Math.max(0, Math.floor(input.amountDueCents) - stillHeld),
      deduplicated: true,
      expiresAtIso: existing.expiresAtIso ?? null,
    };
  }

  const walletRes = await input.ports.resolveWallet(input.owner);
  if (!walletRes.ok) return { ok: false, reason: walletRes.error };

  const plan: RedemptionPlan = planRedemption({
    requestedCents: input.requestedCents,
    availableCents: walletRes.wallet.availableCents,
    amountDueCents: input.amountDueCents,
    eligiblePurchaseCents: input.eligiblePurchaseCents,
    minimumChargeCents: input.minimumChargeCents,
    allowZeroCharge: input.allowZeroCharge,
  });
  if (!plan.ok) return { ok: false, reason: plan.reason, maxRedeemableCents: plan.maxRedeemableCents };

  // The deadline is written WITH the hold, so the release job reads a fact rather than inferring
  // one from created_at and a constant it might not share.
  const expiresAtIso = reservationExpiresAtIso(input.nowMs ?? Date.now());

  const created = await input.ports.createRedemption({
    walletId: walletRes.wallet.id,
    amountCents: plan.redeemCents,
    idempotencyKey,
    contextKind: input.contextKind,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
    paymentRecordId: input.paymentRecordId ?? null,
    actorAuthUserId: input.actorAuthUserId ?? null,
    expiresAtIso,
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
    meta: { expires_at: expiresAtIso, capped_by: plan.cappedBy },
  });
  if (!posted.ok) {
    // THE ROW EXISTS BUT NO CREDITS MOVED. `createRedemption` has to run first — the ledger entry
    // needs its id — so a refused post leaves a row sitting in `reserved` that holds nothing.
    // Left alone, the 30-minute sweep would later "release" it and post a `redeem_release` with
    // no matching reserve: credits appearing from nowhere, and another checkout's real hold
    // destroyed in the same movement. Retiring it here is what keeps the ledger honest.
    //
    // Only retire a row THIS call created. A deduplicated row belongs to a concurrent request that
    // may hold live credits, and releasing it here would destroy that request's hold.
    if (!created.deduplicated) {
      const retired = await input.ports.setRedemptionStatus({
        redemptionId: created.redemption.id,
        status: "released",
      });
      if (!retired.ok) {
        // The row is still `reserved` and holds nothing. Naming it distinctly is what lets an
        // operator find it before the sweep "releases" a hold that never existed.
        return { ok: false, reason: "orphaned_reservation_not_retired" };
      }
    }
    return { ok: false, reason: posted.error };
  }

  return {
    ok: true,
    redemptionId: created.redemption.id,
    redeemCents: plan.redeemCents,
    remainingDueCents: plan.remainingDueCents,
    deduplicated: false,
    expiresAtIso,
  };
}

/**
 * Spend the held credits. Called only after the payment has actually succeeded.
 *
 * THE RELEASED-HOLD CASE IS NOT A NO-OP. A hold lives 30 minutes; a Stripe Checkout session lives
 * far longer. A customer can therefore leave the tab open past the expiry sweep, pay the reduced
 * price the session still carries, and arrive here with their credits already back in `available`.
 * Reporting that as "already final" would hand them the discount AND leave them holding the
 * credits — the purchase would be funded by nothing.
 *
 * So a released or expired hold is RE-DEBITED here, under its own idempotency keys so a duplicate
 * delivery still moves money once. If the balance can no longer cover it (they spent it in the
 * meantime) the call FAILS, loudly and retryably, for an operator to settle — which is the honest
 * outcome, because at that point the customer really does owe the difference.
 */
export async function commitReservedCredits(input: {
  redemptionRef: string;
  paymentRecordId?: string | null;
  ports: RewardsStorePort;
}): Promise<{ ok: true; outcome: "committed" | "already_final" | "recommitted"; amountCents: number } | { ok: false; error: string }> {
  const reservation = await input.ports.findRedemption(reserveIdempotencyKey(input.redemptionRef));
  if (!reservation) return { ok: false, error: "reservation_not_found" };

  if (reservation.status === "committed") {
    // Already spent. A duplicate webhook delivery must not spend it twice.
    return { ok: true, outcome: "already_final", amountCents: reservation.amountCents };
  }

  if (reservation.status === "released" || reservation.status === "expired") {
    // The hold went back to the customer before the payment landed, but the payment carries the
    // reduced price. Take the credits now.
    //
    // COMMIT FIRST, RESERVE SECOND — deliberately the reverse of the obvious order.
    //
    // `redeem_commit` moves `reserved -> spent` and `redeem_reserve` moves `available ->
    // reserved`. Posting the reserve first and then failing on the commit would leave the credits
    // parked in `reserved` with no row that can ever release them: the expiry sweep only sees rows
    // whose STATUS is `reserved`, and this row's status is `released`. They would be stranded.
    //
    // So the pair is posted as reserve-then-commit but the FAILURE of either is unwound by the
    // compensating release below, and the redemption row is moved to `committed` only once both
    // have landed. Every step is keyed, so a redelivered webhook repeats none of it.
    const reReserve = await input.ports.postEntry({
      walletId: reservation.walletId,
      entryType: "redeem_reserve",
      amountCents: reservation.amountCents,
      sourceKind: "checkout_redemption",
      paymentRecordId: input.paymentRecordId ?? null,
      redemptionId: reservation.id,
      idempotencyKey: `recommit:reserve:${input.redemptionRef}`,
      reason: "hold expired before settlement; re-debited at commit",
    });
    if (!reReserve.ok) {
      // Cannot cover it — the customer received a discount they no longer have the balance for.
      // Refusing is correct: this needs a person, not a silent success.
      return { ok: false, error: "recommit_insufficient_balance" };
    }

    const reCommit = await input.ports.postEntry({
      walletId: reservation.walletId,
      entryType: "redeem_commit",
      amountCents: reservation.amountCents,
      sourceKind: "checkout_redemption",
      paymentRecordId: input.paymentRecordId ?? null,
      redemptionId: reservation.id,
      idempotencyKey: `recommit:commit:${input.redemptionRef}`,
    });
    if (!reCommit.ok) {
      // UNWIND, so the credits are not stranded in `reserved` with no row that can free them.
      // Best-effort: if this release also fails the caller still gets a hard error, which is what
      // brings a person to look.
      await input.ports
        .postEntry({
          walletId: reservation.walletId,
          entryType: "redeem_release",
          amountCents: reservation.amountCents,
          sourceKind: "checkout_redemption",
          redemptionId: reservation.id,
          idempotencyKey: `recommit:unwind:${input.redemptionRef}`,
          reason: "re-debit could not be committed; hold returned",
        })
        .catch(() => undefined);
      return { ok: false, error: reCommit.error };
    }

    // The row is FINALISED. Leaving it `released` after permanently spending its credits would
    // make the ledger and the redemption record tell two different stories.
    await input.ports.setRedemptionStatus({
      redemptionId: reservation.id,
      status: "committed",
      settleLedgerId: reCommit.entry.id,
      // This row is not in `reserved`, so the ordinary compare-and-set from `reserved` cannot
      // move it. The re-debit is what earns the right to finalise it.
      fromAnyStatus: true,
    });

    return { ok: true, outcome: "recommitted", amountCents: reservation.amountCents };
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

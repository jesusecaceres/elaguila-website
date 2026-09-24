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

/**
 * THE DATABASE REFUSED A MOVEMENT BECAUSE THE PAYMENT'S POSITION CHANGED UNDER US.
 *
 * Not a balance refusal and not a failure: a concurrent delivery for the same payment landed
 * between this call's position read and its post. The event is still valid, its delta is simply
 * stale, so the only correct response is to recompute against the position that now exists.
 * `leonix_rewards_post_entry` raises it under its own SQLSTATE precisely so this case can be told
 * apart from "the wallet cannot cover it".
 */
export const REVERSAL_POSITION_MOVED = "reversal_position_moved";

/**
 * How many times a reversal or restoration recomputes before giving up.
 *
 * Every retry is a LOSS in a race, and a loss only happens when another delivery for the same
 * payment committed — so the position strictly advances and the loop terminates. The cap exists so
 * a pathological storm reports a named, retryable error instead of spinning; four is far more than
 * the number of concurrent events one payment's refund lifecycle can produce.
 */
const POSITION_RETRY_ATTEMPTS = 4;

// ---------------------------------------------------------------------------
// Port
// ---------------------------------------------------------------------------

export type WalletOwnerRef =
  | {
      kind: "business";
      businessId: string;
      /**
       * The auth user this business wallet is being resolved FOR, when one is in hand. Recorded on
       * the wallet as its canonical binding so the customer's later lookups — redemption, wallet
       * read, restoration — return this same wallet instead of re-deriving it from a membership
       * table that can change under them. Optional: a webhook resolving a business by id alone has
       * no user to bind, and binds nothing.
       */
      boundUserId?: string | null;
    }
  | { kind: "user"; ownerUserId: string };

export type WalletSnapshot = {
  id: string;
  pendingCents: number;
  availableCents: number;
  reservedCents: number;
  lifetimeEarnedCents: number;
  lifetimeRedeemedCents: number;
  lifetimeReversedCents: number;
  /**
   * WHAT THE CUSTOMER OWES BACK — never a negative wallet.
   *
   * A refund claws back the credits its payment earned. When those credits were already SPENT the
   * buckets cannot absorb it, so the shortfall is recorded here. Recovery is not value the
   * customer holds; it is value they owe, and their next earnings repay it before becoming
   * spendable. Absent on a store that predates it, so readers must treat `undefined` as zero.
   */
  recoveryCents?: number;
  lifetimeRecoveryAccruedCents?: number;
  lifetimeRecoveryOffsetCents?: number;
  /** Credits given back because a dispute was WON. Never counted as new earning. */
  lifetimeRestoredCents?: number;
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
    | "redeem_recommit"
    | "refund_reversal"
    | "chargeback_reversal"
    | "reversal_restoration"
    | "recovery_accrue"
    | "recovery_offset"
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
  /**
   * THE PAYMENT'S REVERSAL POSITION AS THE CALLER SAW IT — a compare-and-swap token.
   *
   * A reversal or restoration amount is a function of every reversal-family row already on the
   * payment, and those rows are read in a round trip of their own. Passing the COUNT the caller
   * measured against lets the posting statement refuse, under the wallet lock, if anything landed
   * in between. The ledger is append-only so the count only grows: equal means nothing moved.
   */
  expectedPositionRows?: number | null;
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
   * How many reversal-family rows this payment carries right now.
   *
   * Read FIRST, before the sums, and handed back to `postEntry` as `expectedPositionRows`. Reading
   * it first is what makes it safe: a competitor that commits afterwards makes the live count
   * differ and the post is refused, whereas a competitor that committed before is included in
   * both the count and the sums.
   */
  countPaymentPositionRows(paymentRecordId: string): Promise<number>;
  /**
   * What a WON dispute has already given back on this payment. A restoration can never exceed
   * `reversed - restored`, so this is the other half of that bound.
   */
  sumRestoredForPayment?(paymentRecordId: string): Promise<number>;
  /**
   * Which payment a ledger entry belongs to, when the caller holds only its id.
   *
   * `reverse:<kind>:<id>` is globally unique, so a deduplicated reversal may have been made by a
   * movement on an ENTIRELY DIFFERENT payment. Telling those apart is what separates "the rail
   * already settled this row" from "this row's key was spent by somebody else".
   */
  findPaymentRecordIdForLedgerEntry?(entryId: string): Promise<string | null>;
  /**
   * What a payment's reversals of ONE KIND have claimed. A dispute restoration must be bounded by
   * what the DISPUTE took, never by what a separate refund took on the same payment.
   */
  sumReversedForPaymentByKind?(paymentRecordId: string, kind: "refund" | "chargeback"): Promise<number>;
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

    // PROMOTE THE RESIDUAL, NOT ALL-OR-NOTHING.
    //
    // A PARTIAL refund reverses its proportional share and leaves the rest of the earn sitting in
    // `pending`. Refusing to promote anything once a reversal exists stranded that remainder
    // forever: the sweep skipped it on every run, nothing expires it, and the customer is told in
    // both languages that their credits do not expire. A $399 payment with a $39.90 refund left
    // $32.32 permanently unspendable.
    //
    // The refunded share is already gone. What is left is credits for money the customer did in
    // fact pay, so it promotes. A payment that is disputed or otherwise invalidated is refused by
    // `isPaymentStillEligible` above and never reaches here.
    // A SWEEP THAT CANNOT READ THE REVERSALS MUST SKIP, NOT PROMOTE THE FULL AWARD.
    //
    // `-1` is the failed-read sentinel; `.catch(() => -1)` treats a throw the same way. Reading
    // either as 0 would promote credits for money that was refunded, because the sweep would
    // believe nothing had been reversed. Skipping leaves the payment for the next sweep.
    const reversedCents = await input.ports.sumReversedForPayment(candidate.paymentRecordId).catch(() => -1);
    if (reversedCents < 0) {
      out.skippedIneligible += 1;
      continue;
    }
    const promotableCents = Math.max(0, candidate.amountCents - Math.max(0, reversedCents));
    if (promotableCents <= 0) {
      // Fully reversed. There is nothing left to promote, and that is not a failure.
      out.skippedIneligible += 1;
      continue;
    }

    // PROMOTE WHAT IS ACTUALLY THERE.
    //
    // A reversal takes PENDING FIRST, and `pending` is one bucket shared by every payment on the
    // wallet — so a clawback on payment B can consume payment A's pending credits. Asking to
    // promote A's full earn then failed with `negative_balance_refused` on that sweep, and on
    // every sweep after it, forever: the customer lost credits earned on a payment that was never
    // refunded and the failure repeated silently at every run.
    //
    // Clamping to the wallet's live pending balance is what the promotion can honestly do. It is
    // never more than this payment earned, and never more than the wallet holds.
    const walletNow = await input.ports.getWalletById(candidate.walletId);
    const pendingNow = Math.max(0, Number(walletNow?.pendingCents ?? 0) || 0);
    const promoteNowCents = Math.min(promotableCents, pendingNow);
    if (promoteNowCents <= 0) {
      // Another payment's clawback already consumed it. Not a failure to retry forever.
      out.skippedIneligible += 1;
      continue;
    }

    const res = await promotePendingForPayment({
      walletId: candidate.walletId,
      paymentRecordId: candidate.paymentRecordId,
      amountCents: promoteNowCents,
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
    out.promotedCents += promoteNowCents;
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
      /**
       * What this clawback could NOT take, because the customer had already spent the credits.
       * Recorded on the wallet as a recovery balance and repaid out of future earnings before they
       * become spendable — so the clawback is real even when the buckets were empty.
       */
      recoveryAccruedCents: number;
      reason?: string;
    }
  | { ok: true; outcome: "nothing_to_reverse"; reason: string; reversedCents: 0; totalReversedCents: number }
  | {
      ok: false;
      error: string;
      /**
       * Whether this event's refunded BASIS was still recorded, as a zero-amount entry, after the
       * movement itself was refused. The cumulative arithmetic is a delta against that basis, so
       * losing it makes the NEXT refund on the same payment under-reverse by this event's share.
       */
      basisRecorded?: boolean;
      /** What this event was owed but could not take, because the credits were already spent. */
      shortfallCents?: number;
    };

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
  // 3. EXACTLY RIGHT EVEN WHEN TWO DELIVERIES RACE.
  //
  // The cumulative position below is read in its own round trip, so it is STALE the moment another
  // delivery for the same payment commits. Both callers then computed a delta against a position
  // in which the other had not landed, and both moved money: a $100.00 payment that earned 900
  // credits had 1350 clawed back by two concurrent partial refunds, and 1800 by a concurrent
  // refund and dispute. Nothing refused it — the wallet stayed non-negative and the excess became
  // recovery debt the customer never owed, freezing their redemptions and taking their next
  // earnings.
  //
  // The posting statement now enforces the payment-scoped ceiling under the wallet lock, where it
  // is exact, and refuses the loser of a race by a DISTINCT name. Losing is not a failure: the
  // event is valid and only its arithmetic is stale, so this recomputes against the position that
  // now exists and posts again. Each retry follows a competitor's commit, so the position strictly
  // advances and the loop converges — measured, the two races above land on exactly 900.
  let lastError: ReversalResult | null = null;
  for (let attempt = 0; attempt < POSITION_RETRY_ATTEMPTS; attempt += 1) {
    const outcome = await attemptReversal(input);
    if (outcome !== POSITION_RETRY) return outcome;
    lastError = {
      ok: false,
      error: "reversal_position_contended",
      basisRecorded: false,
    };
  }
  // Every attempt lost. Reporting a contended position is the honest outcome: nothing moved, no
  // idempotency key was burned, and the caller (or the refund resolution queue) may retry.
  return lastError ?? { ok: false, error: "reversal_position_contended", basisRecorded: false };
}

/** Sentinel: the posting statement refused because a competitor moved the payment's position. */
const POSITION_RETRY = Symbol("position_retry");

async function attemptReversal(input: {
  paymentRecordId: string;
  kind: "refund" | "chargeback";
  externalId: string;
  eventRefundedCents: number;
  cumulativeRefundedCentsForKind?: number | null;
  ports: RewardsStorePort;
}): Promise<ReversalResult | typeof POSITION_RETRY> {
  // EVERY MONEY INPUT IS COERCED TO A FINITE INTEGER BEFORE IT REACHES THE ARITHMETIC.
  //
  // `Math.max(0, Math.floor(NaN))` is NaN, so a non-finite event amount propagated straight
  // through the delta, produced a `22P02` from the database, and then burned the refund's
  // idempotency key on the basis-recording path. `Infinity` was worse: it reversed the entire
  // award regardless of what was refunded. Neither is reachable from Stripe today; the cumulative
  // branch was already guarded and the per-event branch was not, which is the kind of asymmetry
  // that stops being theoretical the moment a CSV importer or a staff form reaches this.
  const eventRefundedCents = Number.isFinite(input.eventRefundedCents)
    ? Math.max(0, Math.floor(input.eventRefundedCents))
    : 0;

  // A LOOKUP THAT THREW IS NOT A PAYMENT THAT EARNED NOTHING. The adapter throws rather than
  // returning null when its read failed, so this cannot report a silent success for a clawback it
  // never even sized.
  let original: Awaited<ReturnType<RewardsStorePort["findEarnForPayment"]>>;
  try {
    original = await input.ports.findEarnForPayment(input.paymentRecordId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message.slice(0, 200) : "earn_lookup_failed",
      basisRecorded: false,
      shortfallCents: 0,
    };
  }
  if (!original || original.amountCents <= 0) {
    return { ok: true, outcome: "nothing_to_reverse", reason: "payment_earned_nothing", reversedCents: 0, totalReversedCents: 0 };
  }

  const idempotencyKey = reversalIdempotencyKey(input.kind, input.externalId);
  const otherKind = input.kind === "refund" ? "chargeback" : "refund";

  // THE COMPARE-AND-SWAP TOKEN IS READ BEFORE THE SUMS, AND THE ORDER IS THE POINT.
  //
  // A competitor that commits AFTER this read makes the live count differ from it, so the post is
  // refused and recomputed. A competitor that committed BEFORE it is reflected in the count and in
  // every sum below alike. Reading the count last would invert that: the token would look current
  // while the sums it is vouching for were stale.
  const positionRows = await input.ports.countPaymentPositionRows(input.paymentRecordId);

  const [priorBasisSameKind, priorBasisOtherKind, reversedSoFarCents, restoredSoFarCents] = await Promise.all([
    input.ports.sumReversalBasisForPayment(input.paymentRecordId, input.kind),
    input.ports.sumReversalBasisForPayment(input.paymentRecordId, otherKind),
    input.ports.sumReversedForPayment(input.paymentRecordId),
    input.ports.sumRestoredForPayment?.(input.paymentRecordId) ?? Promise.resolve(0),
  ]);

  // `-1` MEANS "WE DO NOT KNOW", AND A REVERSAL MUST NOT BE SIZED FROM THAT.
  //
  // `sumRestoredForPayment` reports it when its query errored. Reading that as 0 makes
  // `alreadyReversedCents` too LARGE, which under-reverses — the customer keeps credits for money
  // they got back — and the failure is silent. Refusing is retryable: the caller queues it.
  if (
    restoredSoFarCents < 0 ||
    reversedSoFarCents < 0 ||
    priorBasisSameKind < 0 ||
    priorBasisOtherKind < 0
  ) {
    return { ok: false, error: "reversal_state_unavailable", basisRecorded: false, shortfallCents: 0 };
  }

  // A RESTORATION PUTS CREDITS BACK, SO IT UNDOES PART OF THE REVERSED POSITION.
  //
  // Without subtracting it, a refund arriving after a won dispute clawed back NOTHING: the
  // position still read "already fully reversed", the delta came out zero, and the customer kept
  // both the money and the rewards. A dispute won and then refunded in full returned 900 cents of
  // credits the customer was no longer entitled to.
  const alreadyReversedCents = Math.max(0, Math.floor(reversedSoFarCents) - Math.floor(restoredSoFarCents));

  // What THIS event adds to the money-returned position. A cumulative rail figure is converted to
  // a contribution by subtracting what is already accounted for; a per-event figure is taken as-is.
  const cumulativeForKind = input.cumulativeRefundedCentsForKind;
  const basisContributionCents =
    typeof cumulativeForKind === "number" && Number.isFinite(cumulativeForKind)
      ? Math.max(0, Math.floor(cumulativeForKind) - priorBasisSameKind)
      : eventRefundedCents;

  const cumulativeRefundedCents = priorBasisSameKind + basisContributionCents + priorBasisOtherKind;

  const deltaCents = computeReversalDeltaCents({
    originallyEarnedCents: original.amountCents,
    originalEligibleNetCents: original.eligibleNetCents,
    cumulativeRefundedCents,
    alreadyReversedCents,
  });

  // Read BEFORE the movement so the recovery accrual can be reported as a fact rather than
  // re-derived from arithmetic the database may have clamped differently.
  const walletBefore = await input.ports.getWalletById(original.walletId);
  const recoveryBefore = Math.max(0, Number(walletBefore?.recoveryCents ?? 0) || 0);

  // The wallet that was CREDITED, read from the earn entry — not re-resolved from the payer.
  const posted = await input.ports.postEntry({
    walletId: original.walletId,
    entryType: input.kind === "refund" ? "refund_reversal" : "chargeback_reversal",
    amountCents: deltaCents,
    sourceKind: input.kind === "refund" ? "stripe_refund" : "stripe_dispute",
    sourceId: input.externalId,
    paymentRecordId: input.paymentRecordId,
    idempotencyKey,
    expectedPositionRows: positionRows,
    meta: {
      basis_contribution_cents: basisContributionCents,
      cumulative_refunded_cents: cumulativeRefundedCents,
      event_refunded_cents: eventRefundedCents,
      originally_earned_cents: original.amountCents,
      already_reversed_before_cents: alreadyReversedCents,
    },
  });
  if (!posted.ok) {
    // A CONTENDED POSITION IS NOT A REFUSED MOVEMENT. Nothing was written, the idempotency key is
    // still free, and the only thing wrong with this event is that its delta was computed against
    // a position a competitor has since advanced. Recording a zero-amount basis row here would
    // burn the key and permanently under-reverse the payment; recomputing is what makes the total
    // exact. The caller's loop does that.
    if (posted.error === REVERSAL_POSITION_MOVED) return POSITION_RETRY;

    // THE BASIS SURVIVES A REFUSED MOVEMENT — BUT ONLY A REAL REFUSAL.
    //
    // A refusal means the database decided this movement must not happen. Recording the event as a
    // ZERO-AMOUNT reversal carrying its basis is right for that case: the cumulative arithmetic is
    // a DELTA against the basis, so losing it makes the NEXT refund under-reverse by exactly this
    // event's share, and the idempotency key is spent either way.
    //
    // IT IS CATASTROPHIC FOR AN INFRASTRUCTURE ERROR. A dropped connection or a five-second
    // gateway timeout is not a decision about money, and writing a zero-amount row under
    // `reverse:<kind>:<id>` burns that refund's key permanently: the redelivery deduplicates
    // against it, the staff queue cannot settle it either, and a fully refunded $100.00 payment
    // keeps its whole 900-credit award for ever. Measured on the real code path with one failed
    // round trip.
    //
    // So this branch is now reached only for a named balance refusal. Everything else returns
    // retryably with NOTHING written, which is what lets the redelivery — or the queue row the
    // webhook files — actually fix it.
    if (posted.error !== "negative_balance_refused") {
      return { ok: false, error: posted.error, basisRecorded: false, shortfallCents: deltaCents };
    }

    const shortfallCents = deltaCents;
    const recorded = await input.ports.postEntry({
      walletId: original.walletId,
      entryType: input.kind === "refund" ? "refund_reversal" : "chargeback_reversal",
      amountCents: 0,
      sourceKind: input.kind === "refund" ? "stripe_refund" : "stripe_dispute",
      sourceId: input.externalId,
      paymentRecordId: input.paymentRecordId,
      idempotencyKey,
      // NO CAS TOKEN HERE, deliberately. This row moves nothing; it exists only so the event's
      // refunded basis survives. Guarding it against a position that has since moved would leave
      // the basis unrecorded and make the NEXT refund under-reverse by this event's share.
      reason: "reversal refused: balance already spent; basis recorded, money not moved",
      meta: {
        basis_contribution_cents: basisContributionCents,
        cumulative_refunded_cents: cumulativeRefundedCents,
        event_refunded_cents: eventRefundedCents,
        originally_earned_cents: original.amountCents,
        already_reversed_before_cents: alreadyReversedCents,
        refused_movement_cents: shortfallCents,
        refusal_reason: posted.error,
      },
    });
    return { ok: false, error: posted.error, basisRecorded: recorded.ok, shortfallCents };
  }

  // A replay matched the existing entry: NOTHING moved, and the audit log must say so rather
  // than reporting the amount this call would have moved had it been the first delivery.
  if (posted.entry.deduplicated) {
    // A DUPLICATE OF SOMETHING ELSE IS NOT A DUPLICATE — IT IS A COLLISION.
    //
    // `reverse:<kind>:<externalId>` is globally unique, so a key already held by a reversal on a
    // DIFFERENT wallet means this event's id belongs to somebody else's movement. Reporting that
    // as `duplicate_delivery` told the webhook the clawback was already applied: the money went
    // back to the customer, the credits stayed, nothing was queued, and Stripe never retried.
    // `postManualAdjustment` has refused this since the staff path was repaired; the webhook path
    // did not, so the same class of mistake was silent on the side that runs unattended.
    // `readPostedEntry` already reports the row that exists, which is what makes this detectable.
    if (posted.entry.walletId !== original.walletId) {
      return {
        ok: false,
        error: "reversal_key_belongs_to_another_wallet",
        basisRecorded: false,
        shortfallCents: 0,
      };
    }
    return {
      ok: true,
      outcome: "no_movement",
      reversedCents: 0,
      totalReversedCents: alreadyReversedCents,
      deduplicated: true,
      recoveryAccruedCents: 0,
      reason: "duplicate_delivery",
    };
  }

  // WHAT THE WALLET COULD NOT COVER IS NOW A DEBT, NOT A FAILURE.
  //
  // The posting function takes everything the buckets hold and records the remainder as
  // `recovery_cents`. Reading the wallet back is what lets this report the split truthfully: how
  // much actually moved, and how much the customer now owes out of future earnings.
  const walletAfter = await input.ports.getWalletById(original.walletId);
  const recoveryAfter = Math.max(0, Number(walletAfter?.recoveryCents ?? 0) || 0);
  const recoveryAccruedCents = Math.max(0, recoveryAfter - recoveryBefore);
  const movedCents = Math.max(0, deltaCents - recoveryAccruedCents);

  return {
    ok: true,
    outcome: movedCents > 0 || recoveryAccruedCents > 0 ? "reversed" : "no_movement",
    reversedCents: movedCents,
    totalReversedCents: alreadyReversedCents + movedCents,
    deduplicated: false,
    recoveryAccruedCents,
    ...(deltaCents === 0 ? { reason: "already_at_proportional_target" } : {}),
    ...(recoveryAccruedCents > 0 ? { reason: "partially_recovered_as_debt" } : {}),
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
    // reduced price. Take the credits now — in ONE movement.
    //
    // THIS WAS A TWO-ENTRY PAIR, AND THE PAIR COULD CREATE MONEY.
    //
    // It posted `redeem_reserve` under one key and `redeem_commit` under another, unwinding with
    // a third key when the commit failed. Every key is permanent, so after an unwind a redelivery
    // found the reserve key ALREADY USED — it moved nothing — while the commit key was still
    // fresh and executed anyway. The commit then decremented `reserved_cents`, a number shared by
    // every live hold on the wallet, so it consumed an UNRELATED checkout's credits: that
    // checkout's own commit was refused forever, its credits were stranded in `reserved` with no
    // operation able to free them, and the wallet ended up with spendable credits that had
    // already bought something. An adversarial review produced 2000 cents from nothing this way.
    //
    // One entry, one key, one atomic movement, guarded in SQL against this reservation's own
    // status. It either happens exactly once or it does not happen at all; there is nothing left
    // to half-apply and no key to burn.
    const redebited = await input.ports.postEntry({
      walletId: reservation.walletId,
      entryType: "redeem_recommit",
      amountCents: reservation.amountCents,
      sourceKind: "checkout_redemption",
      paymentRecordId: input.paymentRecordId ?? null,
      redemptionId: reservation.id,
      idempotencyKey: `recommit:${input.redemptionRef}`,
      reason: "hold expired before settlement; re-debited at commit",
    });
    if (!redebited.ok) {
      // Cannot cover it — the customer received a discount they no longer have the balance for.
      // Refusing is correct: this needs a person, not a silent success.
      return { ok: false, error: redebited.error };
    }
    // The redemption row was advanced to `committed` INSIDE the same statement that moved the
    // money, so there is no second write here that could disagree with the ledger.
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

  // `leonix_rewards_post_entry` advanced the redemption to `committed` under the SAME row lock it
  // moved the money under, refusing outright if the row was no longer `reserved`. The status write
  // that used to live here ran AFTER the money had already moved, so a commit racing the expiry
  // sweep saw both movements land and only then decided which had "won".
  await input.ports.setRedemptionStatus({
    redemptionId: reservation.id,
    status: "committed",
    settleLedgerId: posted.entry.id,
    // Already committed by the posting statement; this only records the settling ledger id, so it
    // must not re-assert a `reserved` precondition that is no longer true.
    fromAnyStatus: true,
  });

  return { ok: true, outcome: "committed", amountCents: reservation.amountCents };
}

/** `unfunded:<ref>` — the debt recorded when a settled purchase's hold can no longer be taken. */
export function unfundedRedemptionIdempotencyKey(redemptionRef: string): string {
  return `unfunded:${redemptionRef}`;
}

/**
 * RECORD AS DEBT WHAT THE CUSTOMER RECEIVED BUT NO LONGER HAS THE BALANCE TO COVER.
 *
 * A hold lives 30 minutes; a Stripe Checkout session lives up to 24 hours. A customer can let the
 * hold expire, spend the returned credits on a SECOND purchase, and then come back and pay the
 * first session — which is still priced at the discount the expired hold was funding. The re-debit
 * at commit is the right answer and usually works; when the balance is gone it cannot, and the
 * purchase was funded by nothing. Measured: a $200.00 balance bought $399.00 of discounts.
 *
 * Refusing is not enough on its own, because the goods have already been delivered and the money
 * has already been charged at the reduced price. The obligation is real, so it is recorded the way
 * every other unfundable clawback is recorded: as `recovery_cents`. The customer owes it, their
 * redemptions pause until it is settled, and their next earnings settle it automatically. Nothing
 * is lost and nothing is invented.
 *
 * The reservation is then finalised so a later retry cannot take the credits a second time.
 */
export async function accrueUnfundedRedemption(input: {
  redemptionRef: string;
  paymentRecordId?: string | null;
  ports: RewardsStorePort;
}): Promise<
  | { ok: true; outcome: "accrued" | "already_recorded"; amountCents: number }
  | { ok: false; error: string }
> {
  const reservation = await input.ports.findRedemption(reserveIdempotencyKey(input.redemptionRef));
  if (!reservation) return { ok: false, error: "reservation_not_found" };
  if (reservation.status === "committed") {
    return { ok: true, outcome: "already_recorded", amountCents: reservation.amountCents };
  }

  // A LIVE HOLD IS NOT AN UNFUNDED PURCHASE, AND RECORDING ONE AS DEBT CHARGES TWICE.
  //
  // This is reached when a commit failed, and a commit can fail for a reason that has nothing to
  // do with the balance: a transient database error while the reservation is still `reserved`.
  // The credits are then sitting in `reserved_cents`, untouched. Accruing a debt for them — and
  // force-finalising the hold, which takes the row out of the expiry sweep's reach — left the
  // customer with the full amount frozen in `reserved` FOR EVER and an equal recovery debt on top:
  // $399.00 taken for a $199.50 obligation, and nothing self-correcting, because a redelivery now
  // finds the row `committed`.
  //
  // The debt is only real when the hold has already gone BACK to the customer and the re-debit
  // could not be covered. A still-live hold is a retryable failure, not a debt.
  if (reservation.status === "reserved") {
    return { ok: false, error: "hold_still_live" };
  }

  const posted = await input.ports.postEntry({
    walletId: reservation.walletId,
    entryType: "recovery_accrue",
    amountCents: reservation.amountCents,
    sourceKind: "checkout_redemption",
    paymentRecordId: input.paymentRecordId ?? null,
    redemptionId: reservation.id,
    idempotencyKey: unfundedRedemptionIdempotencyKey(input.redemptionRef),
    reason: "purchase settled at a credit-reduced price the balance could no longer fund",
  });
  if (!posted.ok) return { ok: false, error: posted.error };

  // FINALISE THE HOLD, or a later retry would re-debit the same credits on top of the debt. The
  // row is already released or expired, so this is not a compare-and-set from `reserved`.
  await input.ports.setRedemptionStatus({
    redemptionId: reservation.id,
    status: "committed",
    settleLedgerId: posted.entry.id,
    fromAnyStatus: true,
  });

  return {
    ok: true,
    outcome: posted.entry.deduplicated ? "already_recorded" : "accrued",
    amountCents: reservation.amountCents,
  };
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

  // Same as the commit path: the posting statement already moved this row out of `reserved` under
  // its own lock. `expired` is a label on an already-released hold, not a second movement.
  await input.ports.setRedemptionStatus({
    redemptionId: reservation.id,
    status: input.expired ? "expired" : "released",
    settleLedgerId: posted.entry.id,
    fromAnyStatus: true,
  });

  return { ok: true, outcome: "released", amountCents: reservation.amountCents };
}

// ---------------------------------------------------------------------------
// WON-DISPUTE RESTORATION
// ---------------------------------------------------------------------------

/** `restore:<disputeId>` — one restoration per dispute, whatever the delivery count. */
export function restorationIdempotencyKey(externalId: string): string {
  return `restore:${externalId}`;
}

export type RestorationResult =
  | {
      ok: true;
      outcome: "restored" | "nothing_to_restore";
      restoredCents: number;
      /** How much of the restoration repaid the customer's recovery debt instead of becoming spendable. */
      recoveryOffsetCents: number;
      deduplicated: boolean;
      reason?: string;
    }
  | { ok: false; error: string };

/**
 * Give back the credits a reversal took, because the dispute was WON.
 *
 * WHY THIS EXISTS. `charge.dispute.created` claws the credits back immediately — correct, because
 * at that moment the money is genuinely contested. When the dispute later closes as WON, Leonix
 * keeps the money and the customer keeps the purchase, but the credits stayed clawed back. The
 * customer paid, and was silently charged the rewards for it.
 *
 * THE THREE PROPERTIES THIS FUNCTION EXISTS FOR
 *
 *  1. IT CAN NEVER GIVE BACK MORE THAN WAS TAKEN. The amount is clamped to
 *     `reversed - alreadyRestored` for this payment, read from the ledger, and the database
 *     refuses anything larger as a second line of defence.
 *  2. IT LANDS ON THE WALLET THAT WAS DEBITED. Ownership is read off the ORIGINAL earn entry,
 *     exactly as the reversal does. A membership change between the charge and the dispute
 *     closing cannot move someone else's credits.
 *  3. IT HAPPENS ONCE. `restore:<disputeId>` is derived from the dispute itself, so a redelivered
 *     `charge.dispute.closed` moves nothing and says so.
 *
 * A restoration repays the customer's RECOVERY DEBT before handing back anything spendable — if
 * the clawback could not be covered at the time, giving credits back while the debt stands would
 * hand over the same value twice. The database performs that split inside the posting statement.
 */
export async function restoreReversedCredits(input: {
  paymentRecordId: string;
  /** The DISPUTE's id. Never the charge id. */
  externalId: string;
  /** What the caller believes should come back; clamped to what was actually reversed. */
  requestedCents?: number | null;
  ports: RewardsStorePort;
}): Promise<RestorationResult> {
  // THE BOUND BELOW IS READ OUTSIDE THE LOCK, SO TWO WON DISPUTES ON ONE PAYMENT RACED IT.
  //
  // Both deliveries read `already restored = 0`, both computed a full restoration, and the
  // wallet-level guard in SQL could not tell them apart because it sums clawbacks across EVERY
  // payment: a second, entirely separate refunded payment had inflated `lifetime_reversed_cents`
  // enough to let both through. Measured on the real code path, a 900-cent chargeback gave back
  // 1800 and the customer's spendable balance doubled. 900 credits from nothing.
  //
  // The posting statement now bounds a restoration by what a dispute took on THIS payment, under
  // the wallet lock, and names the race distinctly so it can be recomputed rather than refused.
  for (let attempt = 0; attempt < POSITION_RETRY_ATTEMPTS; attempt += 1) {
    const outcome = await attemptRestoration(input);
    if (outcome !== POSITION_RETRY) return outcome;
  }
  return { ok: false, error: "restoration_position_contended" };
}

async function attemptRestoration(input: {
  paymentRecordId: string;
  externalId: string;
  requestedCents?: number | null;
  ports: RewardsStorePort;
}): Promise<RestorationResult | typeof POSITION_RETRY> {
  let original: Awaited<ReturnType<RewardsStorePort["findEarnForPayment"]>>;
  try {
    original = await input.ports.findEarnForPayment(input.paymentRecordId);
  } catch (err) {
    // Same rule as the reversal path: a read that failed must not read as "nothing was earned".
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 200) : "earn_lookup_failed" };
  }
  if (!original || original.amountCents <= 0) {
    return { ok: true, outcome: "nothing_to_restore", restoredCents: 0, recoveryOffsetCents: 0, reason: "payment_earned_nothing", deduplicated: false };
  }

  // THE BOUND IS THIS KIND'S CLAWBACK, NOT EVERY CLAWBACK ON THE PAYMENT.
  //
  // `sumReversedForPayment` counts refunds AND chargebacks. Using it here meant a WON DISPUTE gave
  // back the credits a separate, entirely genuine REFUND had taken: a $100 payment refunded $50
  // (450 reversed) and then disputed (450 reversed) restored the full 900 when the dispute was
  // won, leaving the customer with full rewards on $50 they had been refunded. 450 cents from
  // nothing, scaling with the refund.
  const kind: "refund" | "chargeback" = "chargeback";
  // Read first, for the same reason as the reversal path.
  const positionRows = await input.ports.countPaymentPositionRows(input.paymentRecordId);
  const [reversedCents, restoredCents, thisDispute] = await Promise.all([
    input.ports.sumReversedForPaymentByKind?.(input.paymentRecordId, kind) ??
      input.ports.sumReversedForPayment(input.paymentRecordId),
    input.ports.sumRestoredForPayment?.(input.paymentRecordId) ?? Promise.resolve(0),
    // THIS DISPUTE'S OWN CLAWBACK. The reversal it produced is addressable: it was posted under
    // `reverse:chargeback:<disputeId>`.
    input.ports.findLedgerEntryByIdempotencyKey(reversalIdempotencyKey(kind, input.externalId)),
  ]);

  // A BOUND COMPUTED FROM A READ THAT FAILED IS NOT A BOUND.
  //
  // Both sums report `-1` when their query errored, because "nothing has been restored yet" and
  // "we could not find out" are different facts and only one of them permits giving credits back.
  // Reading a failed read as 0 made the per-dispute bound as permissive as the entire clawback.
  // Refusing is retryable and leaves the obligation in the queue; proceeding is not.
  if (reversedCents < 0 || restoredCents < 0) {
    return { ok: false, error: "restoration_state_unavailable" };
  }

  // TWO BOUNDS, AND THE TIGHTER ONE WINS.
  //
  // The payment-wide bound (`reversed - restored`) is what a single dispute needs. It is NOT
  // enough when a payment carries MORE THAN ONE dispute, and that gap created money: a $100.00
  // payment disputed twice at $50.00 each reversed 450 for each dispute, 900 in total. When the
  // FIRST dispute was WON and the second stayed lost, the payment-wide bound read 900 and gave
  // back all 900 — including the 450 that the second dispute took and that Leonix never got back.
  // The customer kept full rewards on $50.00 that had been permanently charged back. 450 cents
  // from nothing, scaling with the number of disputes.
  //
  // A won dispute gives back what THAT DISPUTE took. Its reversal row is addressable by the
  // dispute's own idempotency key, so this is a fact rather than an apportionment. A dispute whose
  // `created` event never arrived has no row, takes nothing, and restores nothing — which is the
  // out-of-order case the refund resolution queue exists to surface.
  const thisDisputeTookCents =
    thisDispute && thisDispute.entryType === "chargeback_reversal"
      ? Math.max(0, Math.floor(thisDispute.amountCents))
      : 0;
  const outstanding = Math.max(
    0,
    Math.min(thisDisputeTookCents, Math.floor(reversedCents) - Math.floor(restoredCents)),
  );
  const requested =
    typeof input.requestedCents === "number" && Number.isFinite(input.requestedCents)
      ? Math.max(0, Math.floor(input.requestedCents))
      : outstanding;
  const restoreCents = Math.min(requested, outstanding);

  if (restoreCents <= 0) {
    return {
      ok: true,
      outcome: "nothing_to_restore",
      restoredCents: 0,
      recoveryOffsetCents: 0,
      reason:
        reversedCents <= 0
          ? "nothing_was_reversed"
          : thisDisputeTookCents <= 0
            ? "nothing_was_reversed"
            : "already_restored",
      deduplicated: false,
    };
  }

  const before = await input.ports.getWalletById(original.walletId);
  const recoveryBefore = Math.max(0, Number(before?.recoveryCents ?? 0) || 0);

  // NEUTRALIZE THE BASIS THIS DISPUTE CONTRIBUTED, or a later refund over-reverses.
  //
  // A reversal's `basis_contribution_cents` is the MONEY-RETURNED position it added, and the
  // cumulative arithmetic sums it across kinds. Restoring the credits without withdrawing that
  // basis left the whole disputed charge permanently in the position: a $100 payment whose
  // dispute was WON, then goodwill-refunded $50, computed a cumulative of $150 against a $100
  // purchase, targeted a 100% reversal, and took the customer's entire 900-cent award instead of
  // the 450 they had actually lost.
  //
  // The withdrawal is proportional to what is being restored, in the same integer-cent arithmetic
  // the forward direction uses, so a partial restoration withdraws a partial basis.
  const basisNeutralizedCents =
    original.amountCents > 0
      ? Math.floor((restoreCents * Math.max(0, original.eligibleNetCents)) / original.amountCents)
      : 0;

  const posted = await input.ports.postEntry({
    // THE WALLET THAT WAS DEBITED, read from the earn entry — never re-resolved from the payer.
    walletId: original.walletId,
    entryType: "reversal_restoration",
    amountCents: restoreCents,
    sourceKind: "stripe_dispute",
    sourceId: input.externalId,
    paymentRecordId: input.paymentRecordId,
    idempotencyKey: restorationIdempotencyKey(input.externalId),
    expectedPositionRows: positionRows,
    reason: "dispute won; reversed credits restored",
    meta: {
      reversed_cents: reversedCents,
      this_dispute_reversed_cents: thisDisputeTookCents,
      already_restored_cents: restoredCents,
      requested_cents: requested,
      recovery_before_cents: recoveryBefore,
      // NEGATIVE, because this row REMOVES money-returned position rather than adding it. The
      // basis sum for the chargeback kind includes restoration rows for exactly this reason.
      basis_contribution_cents: -basisNeutralizedCents,
    },
  });
  // A competitor restored first. Nothing moved and no key was burned, so recompute the bound
  // against the restorations that now exist — which is how the second delivery correctly lands on
  // `nothing_to_restore` instead of handing the credits back twice.
  if (!posted.ok && posted.error === REVERSAL_POSITION_MOVED) return POSITION_RETRY;
  if (!posted.ok) return { ok: false, error: posted.error };

  if (posted.entry.deduplicated) {
    // A redelivered `dispute.closed`. NOTHING moved, and the report says so rather than repeating
    // the amount a first delivery would have moved.
    return { ok: true, outcome: "restored", restoredCents: 0, recoveryOffsetCents: 0, deduplicated: true, reason: "duplicate_delivery" };
  }

  const after = await input.ports.getWalletById(original.walletId);
  const recoveryAfter = Math.max(0, Number(after?.recoveryCents ?? 0) || 0);
  return {
    ok: true,
    outcome: "restored",
    restoredCents: restoreCents,
    recoveryOffsetCents: Math.max(0, recoveryBefore - recoveryAfter),
    deduplicated: false,
  };
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

  // A REFERENCE BELONGS TO ONE WALLET. `adjust:<ref>` carries no wallet, and the reference is
  // staff free text, so the same correction code entered for a SECOND customer deduplicated
  // against the FIRST customer's entry: the call reported success and an amount, the second
  // customer's wallet never moved, and the ledger held one entry on someone else's wallet. The
  // same reference for a different wallet is a mistake, not a replay, so it is refused by name.
  if (posted.entry.deduplicated && posted.entry.walletId !== walletRes.wallet.id) {
    return { ok: false, error: "adjustment_reference_belongs_to_another_wallet" };
  }
  return { ok: true, amountCents: Math.floor(input.amountCents), deduplicated: posted.entry.deduplicated };
}

/**
 * WHY THERE IS NO STAFF WRITE-OFF FOR RECOVERY DEBT — AND WHAT IT WOULD TAKE.
 *
 * One was built in this round and REMOVED in the same round, because an independent reviewer
 * proved it creates money. A staff `recovery_offset` and a won-dispute restoration are two ways of
 * discharging the SAME clawback, and nothing linked them. Measured against real PL/pgSQL on a
 * $100.00 payment whose 900 credits were spent before a full chargeback: forgive the 900 debt,
 * then win the dispute, and the restoration hands back 900 SPENDABLE credits the customer already
 * spent and the business already absorbed. `leonix_rewards_recompute_wallet` agrees with the wrong
 * number, so reconciliation cannot find it. $9.00 created per $100.00, scaling with payment size.
 *
 * The staff offset is invisible to the bound that would have caught it: the SQL restoration bound
 * is scoped by `payment_record_id` and `source_id`, and the offset carried neither.
 *
 * Building it properly needs four things together, not one:
 *   1. the `recovery_offset` post carries `payment_record_id` and the `source_id` of the dispute
 *      whose clawback it discharges;
 *   2. a port read summing staff offsets per payment;
 *   3. `attemptRestoration`'s bound tightened to subtract them;
 *   4. the SAME subtraction inside `leonix_rewards_post_entry`'s restoration arm, because the
 *      database bound is the authoritative one and a TypeScript-only fix is not a fix.
 *
 * Until then the debt is discharged only by future earnings, which is what the locked policy
 * says, and the gap is recorded as an owner decision rather than closed with code that creates
 * credits from nothing.
 */

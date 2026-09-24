/**
 * LEONIX IX REWARDS — BEHAVIORAL proof of the credit contract.
 * Run: npx tsx scripts/verify-ix-rewards-behavior-01.ts
 *
 * Imports the REAL policy (`rewardsPolicy.ts`), the REAL ledger operations
 * (`rewardsLedgerCore.ts`) and the REAL CSV workflow (`rewardsCsvReconciliation.ts`), and drives
 * them against an in-memory store that faithfully reproduces the database's hard guarantees:
 * UNIQUE(idempotency_key), the non-negative bucket CHECKs, and the exact bucket deltas
 * `leonix_rewards_post_entry()` derives in SQL.
 *
 * NO DATABASE, NO NETWORK, NO STRIPE, NO LIVE DATA. Every fixture here is invented.
 *
 * SECTION A — the 9% earn contract
 * SECTION B — refunds, chargebacks, cumulative and original-wallet reversal
 * SECTION C — redemption: reserve / commit / release, the $1 floor, the 50% ceiling, rail minimum
 * SECTION D — idempotency and duplicate external events
 * SECTION E — manual adjustments and authorization
 * SECTION F — promo coexistence, and the real checkout redemption seam
 * SECTION G — SQL/TS agreement on bucket deltas, and schema invariants
 * SECTION H — the 30-day settlement promotion
 * SECTION I — the 30-minute reservation expiry
 * SECTION J — wallet recomputation parity
 * SECTION K — CSV reconciliation: preview, commit, idempotency, rejection, injection
 * SECTION L — staff authorization, customer isolation, search-filter injection refusal
 * SECTION M — no expiration at launch, and honest surfaces
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  CARD_SETTLEMENT_PENDING_DAYS,
  CREDITS_EXPIRE_AT_LAUNCH,
  DEFAULT_RAIL_MINIMUM_CHARGE_CENTS,
  REDEMPTION_MAX_FRACTION_BASIS_POINTS,
  REDEMPTION_MINIMUM_CENTS,
  REDEMPTION_RESERVATION_MINUTES,
  REWARDS_EARN_RATE_BASIS_POINTS,
  assessEarn,
  computeEarnCents,
  computeEligibleNetCents,
  checkoutCreditsCopy,
  computeReversalDeltaCents,
  earnBaseFromPaymentMetadata,
  computeTotalReversalTargetCents,
  NON_PROMOTABLE_PAYMENT_STATUSES,
  formatCreditsCents,
  isPaymentPromotableFromFacts,
  maxRedeemableForPurchaseCents,
  planRedemption,
  recoveryBalanceCopy,
  redemptionRulesCopy,
  resolveRailMinimumChargeCents,
  validateDiscountCombination,
} from "../app/lib/rewards/rewardsPolicy";
import {
  commitReservedCredits,
  earnFromSettledPayment,
  earnIdempotencyKey,
  manualAdjustmentIdempotencyKey,
  postManualAdjustment,
  promoteIdempotencyKey,
  releaseReservedCredits,
  accrueUnfundedRedemption,
  reservationExpiresAtIso,
  reserveCreditsForPurchase,
  reserveIdempotencyKey,
  reversalIdempotencyKey,
  REVERSAL_POSITION_MOVED,
  reverseForRefundOrChargeback,
  restoreReversedCredits,
  restorationIdempotencyKey,
  runPendingPromotionSweep,
  runReservationExpirySweep,
  type LedgerEntryInput,
  type RewardsStorePort,
  type WalletOwnerRef,
  type WalletSnapshot,
} from "../app/lib/rewards/rewardsLedgerCore";
import { isUuid, sanitizeSearchTerm } from "../app/lib/rewards/rewardsStaffQuery";
import { decideInvoiceRenewalEarn } from "../app/lib/listingPlans/invoiceRenewalEarnPolicy";
import {
  CSV_MAX_ROWS,
  CSV_REQUIRED_HEADERS,
  csvCell,
  csvRowIdempotencyKey,
  fingerprintRows,
  looksLikeFormula,
  parseRewardsCsv,
  splitCsvLine,
  toReconciliationCsv,
} from "../app/lib/rewards/rewardsCsvReconciliation";

const failures: string[] = [];
let checks = 0;
function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  checks += 1;
  return Promise.resolve()
    .then(fn)
    .catch((e: unknown) => {
      failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    });
}

/**
 * ORDERING ASSERTIONS MUST GUARD BOTH SIDES.
 *
 * `String.indexOf` returns -1 for an absent needle, and `-1 < N` is TRUE — so `a.indexOf(x) <
 * a.indexOf(y)` passes when x has been DELETED, while announcing that x happens first. Four checks
 * in this suite were written that way, each standing between the suite and a documented defect:
 * the claim-before-move mutual exclusion on the refund queue, the explicit restore path, the
 * checkout hold-leak race, and the unauthenticated admin read. This refuses a missing marker by
 * name instead, so a deletion fails loudly.
 */
function assertOrder(haystack: string, first: string, second: string, why: string): void {
  const a = haystack.indexOf(first);
  const b = haystack.indexOf(second);
  assert.ok(a >= 0, `${why} — expected to find ${JSON.stringify(first)}`);
  assert.ok(b >= 0, `${why} — expected to find ${JSON.stringify(second)}`);
  assert.ok(a < b, `${why} — ${JSON.stringify(first)} must come before ${JSON.stringify(second)}`);
}

const MIGRATION_PATH = "supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql";
type ParsedCsvOk = Extract<ReturnType<typeof parseRewardsCsv>, { ok: true }>;

// ---------------------------------------------------------------------------
// In-memory store that enforces the SAME invariants as the migration.
// ---------------------------------------------------------------------------
/**
 * `entrySeq` mirrors `leonix_rewards_ledger.entry_seq`: a monotonic number drawn INSIDE the
 * movement, which is the canonical replay order in SQL. Modelling it matters — see the replay
 * ordering note on `recompute()` below.
 */
type StoredEntry = LedgerEntryInput & { id: string; entrySeq: number; createdAtMs: number };
type StoredRedemption = {
  id: string;
  walletId: string;
  amountCents: number;
  status: "reserved" | "committed" | "released" | "expired";
  idempotencyKey: string;
  expiresAtIso: string | null;
};

/**
 * `withoutPaymentCeiling` exists so the suite can DEMONSTRATE the defect the ceiling prevents,
 * rather than merely asserting the fixed behaviour. A check that only ever sees the repaired code
 * cannot show it is the repair doing the work; SECTION Q runs the same race both ways.
 */
function makeStore(opts?: { now?: () => number; withoutPaymentCeiling?: boolean }) {
  const wallets = new Map<string, WalletSnapshot & { owner: string }>();
  const entries: StoredEntry[] = [];
  const byIdempotency = new Map<string, string>();
  const redemptions = new Map<string, StoredRedemption>();
  let seq = 0;
  /** The mirror of `nextval('leonix_rewards_ledger_seq')`, drawn inside the movement. */
  let entrySeq = 0;
  const now = opts?.now ?? (() => Date.now());

  function ownerKey(o: WalletOwnerRef): string {
    return o.kind === "business" ? `b:${o.businessId}` : `u:${o.ownerUserId}`;
  }

  /**
   * Mirrors leonix_rewards_post_entry()'s CASE block, INCLUDING the explicit refusals it raises
   * before touching a balance. SECTION G asserts the TS mirror and the SQL agree entry type by
   * entry type, so a change to one that is not made to the other fails the suite.
   */
  function deltasFor(entryType: string, amount: number, w: WalletSnapshot) {
    const d = {
      pending: 0, available: 0, reserved: 0, earned: 0, redeemed: 0, reversed: 0,
      recovery: 0, recoveryAccrued: 0, recoveryOffset: 0, restored: 0,
    };
    const recoveryNow = w.recoveryCents ?? 0;
    switch (entryType) {
      case "earn_pending": {
        // Recovery is repaid before anything becomes spendable — the SQL rule, modelled.
        const off = Math.min(amount, recoveryNow);
        d.pending = amount - off; d.earned = amount; d.recovery = -off; d.recoveryOffset = off;
        break;
      }
      case "earn_promote":
        if (w.pendingCents < amount) throw new Error("promotion_exceeds_pending");
        d.pending = -amount; d.available = amount; break;
      case "earn_available": {
        const off = Math.min(amount, recoveryNow);
        d.available = amount - off; d.earned = amount; d.recovery = -off; d.recoveryOffset = off;
        break;
      }
      case "redeem_reserve":
        // No spending while a clawback is outstanding: the customer's next earnings settle it.
        if (recoveryNow > 0) throw new Error("recovery_outstanding");
        if (w.availableCents < amount) throw new Error("redemption_exceeds_available");
        d.available = -amount; d.reserved = amount; break;
      case "redeem_commit":
        if (w.reservedCents < amount) throw new Error("commit_exceeds_reserved");
        d.reserved = -amount; d.redeemed = amount; break;
      case "redeem_release":
        if (w.reservedCents < amount) throw new Error("release_exceeds_reserved");
        d.reserved = -amount; d.available = amount; break;
      case "redeem_recommit":
        // ONE movement: available -> spent. An expired hold is not in `reserved` any more.
        if (w.availableCents < amount) throw new Error("recommit_exceeds_available");
        d.available = -amount; d.redeemed = amount; break;
      case "refund_reversal":
      case "chargeback_reversal": {
        // WHAT THE WALLET CANNOT COVER BECOMES A DEBT, not a refusal. Pending first, then
        // available; the remainder is recovery, repaid out of future earnings.
        const cover = Math.min(amount, w.pendingCents + w.availableCents);
        if (w.pendingCents >= cover) d.pending = -cover;
        else { d.pending = -w.pendingCents; d.available = -(cover - w.pendingCents); }
        d.reversed = cover;
        d.recovery = amount - cover;
        d.recoveryAccrued = amount - cover;
        break;
      }
      case "reversal_restoration": {
        // THE SAME BOUND THE SQL ENFORCES. `lifetime_recovery_accrued` never shrinks, so a debt
        // already repaid out of earnings still counts toward what the clawback took — otherwise
        // winning the dispute would be refused precisely for the customer who made good on it.
        const takenEver =
          w.lifetimeReversedCents + (w.lifetimeRecoveryAccruedCents ?? 0) - (w.lifetimeRestoredCents ?? 0);
        if (amount > takenEver) throw new Error("restoration_exceeds_reversed");
        // A won dispute repays the debt it created before handing anything back as spendable.
        const off = Math.min(amount, recoveryNow);
        d.recovery = -off; d.recoveryOffset = off;
        d.available = amount - off;
        d.restored = amount;
        break;
      }
      case "recovery_accrue":
        d.recovery = amount; d.recoveryAccrued = amount; break;
      case "recovery_offset":
        if (recoveryNow < amount) throw new Error("offset_exceeds_recovery");
        d.recovery = -amount; d.recoveryOffset = amount; break;
      case "manual_adjustment":
        if (amount > 0) { d.available = amount; d.earned = amount; }
        else {
          // AVAILABLE FIRST, then pending — the opposite order to a reversal, deliberately.
          const draw = -amount;
          if (w.availableCents + w.pendingCents < draw) throw new Error("adjustment_exceeds_balance");
          if (w.availableCents >= draw) d.available = -draw;
          else { d.available = -w.availableCents; d.pending = -(draw - w.availableCents); }
          d.reversed = draw;
        }
        break;
      case "expire":
        if (w.availableCents < amount) throw new Error("expiry_exceeds_available");
        d.available = -amount; d.reversed = amount; break;
      default: throw new Error(`unsupported entry_type ${entryType}`);
    }
    return d;
  }

  /**
   * THE REPLAY'S OWN ARITHMETIC — written separately from `deltasFor` on purpose.
   *
   * `recompute()` used to call `deltasFor`, the SAME function `postEntry` calls. Every "wallet
   * recomputation parity" check was therefore asserting f(x) === f(x): the incremental path and
   * the replay applied identical code to identical entries, so no arithmetic disagreement between
   * them was expressible, and the checks could not fail. They were presented as the guarantee that
   * a reconciliation run cannot rewrite a balance.
   *
   * This mirrors `leonix_rewards_recompute_wallet`'s CASE block — which is written in the replay's
   * own shape, as running totals rather than per-entry deltas — while `deltasFor` mirrors
   * `leonix_rewards_post_entry`'s. Two independent transcriptions of two independent SQL
   * functions: when they disagree, a check fails, which is the whole point of the section.
   *
   * It has no refusals. A replay reproduces what the ledger ALREADY records; refusing a movement
   * that has demonstrably happened is the posting function's job, not this one's.
   */
  function replayInto(acc: WalletSnapshot, entryType: string, amount: number): void {
    const recoveryNow = acc.recoveryCents ?? 0;
    const addRecovery = (d: number) => { acc.recoveryCents = (acc.recoveryCents ?? 0) + d; };
    const addOffset = (d: number) => { acc.lifetimeRecoveryOffsetCents = (acc.lifetimeRecoveryOffsetCents ?? 0) + d; };
    const addAccrued = (d: number) => { acc.lifetimeRecoveryAccruedCents = (acc.lifetimeRecoveryAccruedCents ?? 0) + d; };
    switch (entryType) {
      case "reversal_restoration": {
        const off = Math.min(amount, recoveryNow);
        addRecovery(-off); addOffset(off);
        acc.availableCents += amount - off;
        acc.lifetimeRestoredCents = (acc.lifetimeRestoredCents ?? 0) + amount;
        return;
      }
      case "recovery_accrue":
        addRecovery(amount); addAccrued(amount);
        return;
      case "recovery_offset":
        addRecovery(-amount); addOffset(amount);
        return;
      case "earn_pending": {
        const off = Math.min(amount, recoveryNow);
        addRecovery(-off); addOffset(off);
        acc.pendingCents += amount - off;
        acc.lifetimeEarnedCents += amount;
        return;
      }
      case "earn_promote":
        acc.pendingCents -= amount;
        acc.availableCents += amount;
        return;
      case "earn_available": {
        const off = Math.min(amount, recoveryNow);
        addRecovery(-off); addOffset(off);
        acc.availableCents += amount - off;
        acc.lifetimeEarnedCents += amount;
        return;
      }
      case "redeem_reserve":
        acc.availableCents -= amount;
        acc.reservedCents += amount;
        return;
      case "redeem_commit":
        acc.reservedCents -= amount;
        acc.lifetimeRedeemedCents += amount;
        return;
      case "redeem_release":
        acc.reservedCents -= amount;
        acc.availableCents += amount;
        return;
      case "redeem_recommit":
        acc.availableCents -= amount;
        acc.lifetimeRedeemedCents += amount;
        return;
      case "refund_reversal":
      case "chargeback_reversal": {
        // The shortfall is RE-DERIVED, exactly as the SQL replay re-derives it: the posting arm
        // folds the debt into the same row, so there is no separate entry carrying it.
        const cover = Math.min(amount, acc.pendingCents + acc.availableCents);
        if (acc.pendingCents >= cover) {
          acc.pendingCents -= cover;
        } else {
          acc.availableCents -= cover - acc.pendingCents;
          acc.pendingCents = 0;
        }
        acc.lifetimeReversedCents += cover;
        addRecovery(amount - cover); addAccrued(amount - cover);
        return;
      }
      case "manual_adjustment":
        if (amount > 0) {
          acc.availableCents += amount;
          acc.lifetimeEarnedCents += amount;
          return;
        } else {
          const take = -amount;
          if (acc.availableCents >= take) {
            acc.availableCents -= take;
          } else {
            acc.pendingCents -= take - acc.availableCents;
            acc.availableCents = 0;
          }
          acc.lifetimeReversedCents += take;
          return;
        }
      case "expire":
        acc.availableCents -= amount;
        acc.lifetimeReversedCents += amount;
        return;
      default:
        throw new Error(`replay: unsupported entry_type ${entryType}`);
    }
  }

  /**
   * The TS mirror of leonix_rewards_recompute_wallet(): a REPLAY in posting order, not an
   * aggregate. SECTION J asserts it lands on exactly the incremental balances.
   */
  function recompute(walletId: string): WalletSnapshot {
    const acc: WalletSnapshot = {
      id: walletId,
      pendingCents: 0, availableCents: 0, reservedCents: 0,
      lifetimeEarnedCents: 0, lifetimeRedeemedCents: 0, lifetimeReversedCents: 0,
      recoveryCents: 0, lifetimeRecoveryAccruedCents: 0, lifetimeRecoveryOffsetCents: 0,
      lifetimeRestoredCents: 0,
    };
    // CANONICAL POSTING ORDER, THE SAME ONE SQL USES.
    //
    // This sorted by `createdAtMs` with the synthetic id as the tie-break, and both halves were
    // wrong. `createdAtMs` is this store's clock, which is frozen in most fixtures, so almost
    // every entry ties; the tie-break then compared ids like `e10` and `e9` as STRINGS, and `e10`
    // sorts before `e9`. Past nine entries the replay therefore ran history in an order that never
    // happened — while SQL replays by `entry_seq`. A parity suite whose mirror orders differently
    // from the database cannot prove the database recomputes correctly, and a path-dependent
    // reversal replayed out of order lands on different buckets.
    //
    // `entrySeq` is drawn inside the movement exactly as `nextval()` is drawn inside the wallet
    // lock, so it IS the serialization order. It is total on its own; `createdAtMs` and `id`
    // remain only to mirror the SQL ORDER BY shape.
    const ordered = entries
      .filter((e) => e.walletId === walletId)
      .sort((a, b) => a.entrySeq - b.entrySeq || a.createdAtMs - b.createdAtMs || a.id.localeCompare(b.id));
    for (const e of ordered) {
      replayInto(acc, e.entryType, e.amountCents);
      // THE REFUSAL SQL HAS, MIRRORED — INCLUDING THAT IT FIRES MID-REPLAY.
      //
      // `leonix_rewards_recompute_wallet` raises when a bucket goes negative, and it checks inside
      // the loop: a bucket that dips below zero and is brought back up by a later entry is the
      // signature of an out-of-order or inconsistent ledger, and a check only at the end cannot
      // see it. The mirror had no equivalent at all, so a ledger the database would refuse to
      // reconcile was silently accepted here — which is not a parity mirror.
      if (
        acc.pendingCents < 0 ||
        acc.availableCents < 0 ||
        acc.reservedCents < 0 ||
        (acc.recoveryCents ?? 0) < 0
      ) {
        throw new Error(
          `replay: wallet ${walletId} replays to a negative bucket at entry_seq ${e.entrySeq} (${e.entryType}); the ledger is inconsistent`,
        );
      }
    }
    return acc;
  }

  const port: RewardsStorePort = {
    async resolveWallet(owner) {
      const key = ownerKey(owner);
      for (const w of wallets.values()) if (w.owner === key) return { ok: true, wallet: { ...w } };
      const wallet = {
        id: `w${++seq}`, owner: key,
        pendingCents: 0, availableCents: 0, reservedCents: 0,
        lifetimeEarnedCents: 0, lifetimeRedeemedCents: 0, lifetimeReversedCents: 0,
        recoveryCents: 0, lifetimeRecoveryAccruedCents: 0, lifetimeRecoveryOffsetCents: 0,
        lifetimeRestoredCents: 0,
      };
      wallets.set(wallet.id, wallet);
      return { ok: true, wallet: { ...wallet } };
    },
    async getWalletById(id) { const w = wallets.get(id); return w ? { ...w } : null; },
    async postEntry(input) {
      const dupId = byIdempotency.get(input.idempotencyKey);
      if (dupId) {
        const e = entries.find((x) => x.id === dupId)!;
        return { ok: true, entry: { id: e.id, walletId: e.walletId, entryType: e.entryType, amountCents: e.amountCents, idempotencyKey: e.idempotencyKey, deduplicated: true } };
      }
      const w = wallets.get(input.walletId);
      if (!w) return { ok: false, error: "wallet_not_found" };

      // THE RESERVATION GUARD, MODELLED. `leonix_rewards_post_entry` locks the redemption row for
      // these three entry types, refuses unless its status permits the movement, and advances that
      // status in the SAME statement. Modelling only the bucket arithmetic is precisely how a
      // money-creating defect passed 125 checks: the mock let a commit post against a released
      // hold and quietly consume a neighbouring reservation's credits.
      let guardedRedemption: StoredRedemption | null = null;
      if (
        input.entryType === "redeem_commit" ||
        input.entryType === "redeem_release" ||
        input.entryType === "redeem_recommit"
      ) {
        if (!input.redemptionId) return { ok: false, error: "redemption_id_required" };
        guardedRedemption = [...redemptions.values()].find((r) => r.id === input.redemptionId) ?? null;
        if (!guardedRedemption) return { ok: false, error: "redemption_not_found" };
        if (guardedRedemption.walletId !== input.walletId) return { ok: false, error: "redemption_wallet_mismatch" };
        if (guardedRedemption.amountCents !== input.amountCents) return { ok: false, error: "redemption_amount_mismatch" };
        const allowed =
          input.entryType === "redeem_recommit"
            ? guardedRedemption.status === "released" || guardedRedemption.status === "expired"
            : guardedRedemption.status === "reserved";
        if (!allowed) return { ok: false, error: "redemption_not_in_expected_state" };
      }

      // THE PAYMENT-SCOPED CEILING, MODELLED. `leonix_rewards_post_entry` computes these two
      // numbers from the ledger INSIDE the wallet lock, which is the only place they are exact.
      // The caller's cumulative arithmetic reads them in a separate round trip, so two concurrent
      // deliveries for one payment each computed a delta against a position the other had not yet
      // moved: measured on the real code path, a 900-credit award had 1350 and 1800 clawed back,
      // and a 900-cent chargeback gave back 1800 when two won-dispute deliveries raced. The
      // refusal is named APART from a balance refusal, because the event is valid and only its
      // arithmetic is stale — the core recomputes and posts again.
      if (
        !opts?.withoutPaymentCeiling &&
        (input.entryType === "refund_reversal" ||
          input.entryType === "chargeback_reversal" ||
          input.entryType === "reversal_restoration")
      ) {
        if (!input.paymentRecordId) return { ok: false, error: "payment_record_id_required" };
        // THE COMPARE-AND-SWAP. A ceiling on the payment's TOTAL is not enough on its own: two
        // concurrent partial refunds at cumulative positions 2500 and 5000 of a 10000 payment both
        // stay under the 900-credit award and still sum to 675 where 450 is owed, because the
        // smaller delta was computed against a position the larger one had already advanced. The
        // ledger is append-only, so an unchanged row count means an unchanged position.
        if (typeof input.expectedPositionRows === "number") {
          const live = entries.filter(
            (e) =>
              e.paymentRecordId === input.paymentRecordId &&
              (e.entryType === "refund_reversal" ||
                e.entryType === "chargeback_reversal" ||
                e.entryType === "reversal_restoration"),
          ).length;
          if (live !== input.expectedPositionRows) return { ok: false, error: REVERSAL_POSITION_MOVED };
        }
        if (input.amountCents > 0) {
          const forPayment = entries.filter((e) => e.paymentRecordId === input.paymentRecordId);
          // A restoration RETURNS claim, so it counts negatively in both bounds: a won dispute
          // genuinely frees the payment to be refunded afterwards.
          const claimed = forPayment.reduce(
            (a, e) =>
              a +
              (e.entryType === "refund_reversal" || e.entryType === "chargeback_reversal"
                ? e.amountCents
                : e.entryType === "reversal_restoration"
                  ? -e.amountCents
                  : 0),
            0,
          );
          if (input.entryType === "reversal_restoration") {
            // AND BY WHAT *THIS* DISPUTE TOOK. A payment with two disputes reversed 450 each; the
            // payment-wide sum let the first dispute's win give back all 900, including the 450 the
            // second dispute took and Leonix never recovered.
            if (!input.sourceId) return { ok: false, error: "negative_balance_refused" };
            const thisDisputeTook = forPayment
              .filter((e) => e.entryType === "chargeback_reversal" && e.sourceId === input.sourceId)
              .reduce((a, e) => a + e.amountCents, 0);
            if (input.amountCents > thisDisputeTook) return { ok: false, error: "negative_balance_refused" };
            // Bounded by what the DISPUTE took on THIS payment — never by a separate refund's
            // clawback, and never by another payment's.
            const disputeClaim = forPayment.reduce(
              (a, e) =>
                a +
                (e.entryType === "chargeback_reversal"
                  ? e.amountCents
                  : e.entryType === "reversal_restoration"
                    ? -e.amountCents
                    : 0),
              0,
            );
            if (input.amountCents > disputeClaim) return { ok: false, error: REVERSAL_POSITION_MOVED };
          } else {
            const earnedForPayment = forPayment
              .filter((e) => e.entryType === "earn_pending" || e.entryType === "earn_available")
              .reduce((a, e) => a + e.amountCents, 0);
            if (input.amountCents > earnedForPayment - claimed) {
              return { ok: false, error: REVERSAL_POSITION_MOVED };
            }
          }
        }
      }

      let d: ReturnType<typeof deltasFor>;
      try {
        d = deltasFor(input.entryType, input.amountCents, w);
      } catch {
        // The posting function's explicit refusals, surfaced exactly as the adapter maps them.
        return { ok: false, error: "negative_balance_refused" };
      }
      const next = {
        pendingCents: w.pendingCents + d.pending,
        availableCents: w.availableCents + d.available,
        reservedCents: w.reservedCents + d.reserved,
        recoveryCents: (w.recoveryCents ?? 0) + d.recovery,
      };
      // The database CHECK constraints: refuse, never clamp. Recovery is an amount OWED, so it is
      // non-negative for the same reason the buckets are.
      if (next.pendingCents < 0 || next.availableCents < 0 || next.reservedCents < 0 || next.recoveryCents < 0) {
        return { ok: false, error: "negative_balance_refused" };
      }
      Object.assign(w, next, {
        lifetimeEarnedCents: w.lifetimeEarnedCents + d.earned,
        lifetimeRedeemedCents: w.lifetimeRedeemedCents + d.redeemed,
        lifetimeReversedCents: w.lifetimeReversedCents + d.reversed,
        lifetimeRecoveryAccruedCents: (w.lifetimeRecoveryAccruedCents ?? 0) + d.recoveryAccrued,
        lifetimeRecoveryOffsetCents: (w.lifetimeRecoveryOffsetCents ?? 0) + d.recoveryOffset,
        lifetimeRestoredCents: (w.lifetimeRestoredCents ?? 0) + d.restored,
      });
      const id = `e${++seq}`;
      entries.push({ ...input, id, entrySeq: ++entrySeq, createdAtMs: now() });
      byIdempotency.set(input.idempotencyKey, id);
      // Atomic with the movement, exactly as the SQL does it.
      if (guardedRedemption) {
        guardedRedemption.status = input.entryType === "redeem_release" ? "released" : "committed";
      }
      return { ok: true, entry: { id, walletId: input.walletId, entryType: input.entryType, amountCents: input.amountCents, idempotencyKey: input.idempotencyKey, deduplicated: false } };
    },
    async createRedemption(input) {
      const existing = redemptions.get(input.idempotencyKey);
      if (existing) return { ok: true, redemption: { ...existing }, deduplicated: true };
      const r: StoredRedemption = {
        id: `r${++seq}`,
        walletId: input.walletId,
        amountCents: input.amountCents,
        status: "reserved",
        idempotencyKey: input.idempotencyKey,
        expiresAtIso: input.expiresAtIso,
      };
      redemptions.set(input.idempotencyKey, r);
      return { ok: true, redemption: { ...r }, deduplicated: false };
    },
    async findRedemption(key) { const r = redemptions.get(key); return r ? { ...r } : null; },
    async setRedemptionStatus({ redemptionId, status, fromAnyStatus }) {
      for (const r of redemptions.values()) {
        if (r.id === redemptionId) {
          // Compare-and-set from 'reserved', like the adapter's conditional update — AND the
          // explicit opt-out the adapter honours. Silently dropping `fromAnyStatus` here made the
          // mock disagree with production, which is why two mutations of the finalisation code
          // left all 125 checks green.
          if (!fromAnyStatus && r.status !== "reserved") return { ok: false, error: "redemption_not_reserved" };
          r.status = status;
          return { ok: true };
        }
      }
      return { ok: false, error: "not_found" };
    },
    async findLedgerEntryByIdempotencyKey(key) {
      const id = byIdempotency.get(key);
      if (!id) return null;
      const e = entries.find((x) => x.id === id)!;
      return { id: e.id, walletId: e.walletId, entryType: e.entryType, amountCents: e.amountCents };
    },
    async sumReversedForPaymentByKind(paymentRecordId, kind) {
      const entryType = kind === "refund" ? "refund_reversal" : "chargeback_reversal";
      return entries
        .filter((e) => e.paymentRecordId === paymentRecordId && e.entryType === entryType)
        .reduce((a, e) => a + e.amountCents, 0);
    },
    async sumRestoredForPayment(paymentRecordId) {
      return entries
        .filter((e) => e.paymentRecordId === paymentRecordId && e.entryType === "reversal_restoration")
        .reduce((a, e) => a + e.amountCents, 0);
    },
    async countPaymentPositionRows(paymentRecordId) {
      return entries.filter(
        (e) =>
          e.paymentRecordId === paymentRecordId &&
          (e.entryType === "refund_reversal" ||
            e.entryType === "chargeback_reversal" ||
            e.entryType === "reversal_restoration"),
      ).length;
    },
    async sumReversedForPayment(paymentRecordId) {
      return entries
        .filter((e) => e.paymentRecordId === paymentRecordId && (e.entryType === "refund_reversal" || e.entryType === "chargeback_reversal"))
        .reduce((a, e) => a + e.amountCents, 0);
    },
    async sumReversalBasisForPayment(paymentRecordId, kind) {
      // A won dispute WITHDRAWS the basis it added, via a negative contribution on the
      // restoration row — modelled here because the database does it.
      const entryTypes =
        kind === "refund" ? ["refund_reversal"] : ["chargeback_reversal", "reversal_restoration"];
      const total = entries
        .filter((e) => e.paymentRecordId === paymentRecordId && entryTypes.includes(e.entryType))
        .reduce((a, e) => a + Number((e.meta as { basis_contribution_cents?: number })?.basis_contribution_cents ?? 0), 0);
      return Math.max(0, total);
    },
    async findEarnForPayment(paymentRecordId) {
      const e = entries.find((x) => x.paymentRecordId === paymentRecordId && (x.entryType === "earn_pending" || x.entryType === "earn_available"));
      if (!e) return null;
      return {
        walletId: e.walletId,
        amountCents: e.amountCents,
        eligibleNetCents: Number((e.meta as { eligible_net_cents?: number })?.eligible_net_cents ?? 0),
      };
    },
    async listPromotablePendingEarns({ olderThanIso, limit }) {
      const cutoff = Date.parse(olderThanIso);
      const promoted = new Set(
        entries.filter((e) => e.entryType === "earn_promote").map((e) => e.paymentRecordId),
      );
      return entries
        .filter((e) => e.entryType === "earn_pending" && e.paymentRecordId && e.createdAtMs <= cutoff)
        .filter((e) => !promoted.has(e.paymentRecordId))
        .sort((a, b) => a.createdAtMs - b.createdAtMs)
        .slice(0, limit)
        .map((e) => ({
          walletId: e.walletId,
          paymentRecordId: String(e.paymentRecordId),
          amountCents: e.amountCents,
          earnedAtIso: new Date(e.createdAtMs).toISOString(),
        }));
    },
    async listExpiredReservations({ nowIso, limit }) {
      const nowMs = Date.parse(nowIso);
      const prefix = reserveIdempotencyKey("");
      return Array.from(redemptions.values())
        .filter((r) => r.status === "reserved" && r.expiresAtIso && Date.parse(r.expiresAtIso) <= nowMs)
        .filter((r) => r.idempotencyKey.startsWith(prefix))
        .slice(0, limit)
        .map((r) => ({
          redemptionId: r.id,
          redemptionRef: r.idempotencyKey.slice(prefix.length),
          amountCents: r.amountCents,
        }));
    },
  };

  return { port, wallets, entries, redemptions, recompute };
}

const OWNER: WalletOwnerRef = { kind: "business", businessId: "biz_1" };
const OTHER_OWNER: WalletOwnerRef = { kind: "user", ownerUserId: "user_2" };
const settled = (over: Partial<Parameters<typeof assessEarn>[0]> = {}) => ({
  amountPaidCents: 39900, creditsAppliedCents: 0, promoDiscountCents: 0,
  source: "stripe", settled: true, ...over,
});

/** Seed spendable credits without going through an earn, for redemption-focused tests. */
async function seedAvailable(port: RewardsStorePort, owner: WalletOwnerRef, cents: number, ref: string) {
  const res = await postManualAdjustment({
    owner, amountCents: cents, reason: "test seed", actorAuthUserId: "staff_1", adjustmentRef: ref, ports: port,
  });
  assert.equal(res.ok, true, `seed ${ref} must succeed`);
}

/**
 * Post a raw entry for the recovery types, which no public helper emits on their own: a debt is
 * normally created by a reversal and settled by an earn. These tests need to set one up directly.
 */
async function postEntryDirect(
  port: RewardsStorePort,
  owner: WalletOwnerRef,
  entryType: LedgerEntryInput["entryType"],
  amountCents: number,
  key: string,
) {
  const w = await port.resolveWallet(owner);
  assert.equal(w.ok, true);
  const res = await port.postEntry({
    walletId: (w as { wallet: WalletSnapshot }).wallet.id,
    entryType,
    amountCents,
    sourceKind: "staff_adjustment",
    idempotencyKey: key,
  });
  assert.equal(res.ok, true, `${entryType} ${key} must post`);
}

async function walletOf(port: RewardsStorePort, owner: WalletOwnerRef): Promise<WalletSnapshot> {
  const r = await port.resolveWallet(owner);
  assert.equal(r.ok, true);
  return (r as { wallet: WalletSnapshot }).wallet;
}

async function main() {
  // =========================================================================
  // SECTION A — the 9% earn contract
  // =========================================================================
  await check("A1: the rate is exactly 9%, computed in integer cents", () => {
    assert.equal(REWARDS_EARN_RATE_BASIS_POINTS, 900);
    assert.equal(computeEarnCents(10000), 900, "$100.00 earns $9.00");
    assert.equal(computeEarnCents(39900), 3591, "$399.00 earns $35.91");
    assert.equal(computeEarnCents(0), 0);
    assert.equal(computeEarnCents(-500), 0, "negative never earns");
  });

  await check("A2: rounding is DOWN, so splitting a payment cannot manufacture credits", () => {
    assert.equal(computeEarnCents(11), 0);
    assert.equal(computeEarnCents(12), 1);
    const whole = computeEarnCents(1000);
    const split = computeEarnCents(500) + computeEarnCents(500);
    assert.ok(split <= whole, "sum of parts may never exceed the whole");
  });

  await check("A3: credits spent do not themselves earn credits", () => {
    assert.equal(computeEligibleNetCents({ ...settled({ amountPaidCents: 10000, creditsAppliedCents: 4000 }) }), 6000);
    const a = assessEarn(settled({ amountPaidCents: 10000, creditsAppliedCents: 4000 }));
    assert.equal(a.earns, true);
    assert.equal(a.earnCents, 540, "only the $60 of real money earns, not the $40 of credits");
  });

  await check("A4: unsettled money never earns", () => {
    const a = assessEarn(settled({ settled: false }));
    assert.equal(a.earns, false);
    assert.equal((a as { reason: string }).reason, "not_settled");
  });

  await check("A5: a fully credit-funded purchase earns nothing", () => {
    const a = assessEarn(settled({ amountPaidCents: 5000, creditsAppliedCents: 5000 }));
    assert.equal(a.earns, false);
    assert.equal((a as { reason: string }).reason, "no_eligible_net");
  });

  await check("A6: every payment rail earns — card, cash, check, CSV", () => {
    for (const source of ["stripe", "admin_manual", "office", "csv_import"]) {
      assert.equal(assessEarn(settled({ source })).earns, true, `${source} must earn`);
    }
    assert.equal(assessEarn(settled({ source: "not_a_rail" })).earns, false);
  });

  await check("A7: earning writes a real ledger entry and moves the balance", async () => {
    const { port, entries } = makeStore();
    const res = await earnFromSettledPayment({
      owner: OWNER, paymentRecordId: "pay_1", facts: settled(), sourceKind: "stripe_payment",
      pendingUntilSettlementFinal: true, ports: port,
    });
    assert.equal(res.ok, true);
    assert.equal((res as { outcome: string }).outcome, "earned");
    assert.equal((res as { earnCents: number }).earnCents, 3591);
    const w = await walletOf(port, OWNER);
    assert.equal(w.pendingCents, 3591, "card payments land as PENDING");
    assert.equal(w.availableCents, 0, "and are not spendable yet");
    assert.equal(w.lifetimeEarnedCents, 3591);
    assert.equal(entries.length, 1);
  });

  await check("A8: a cleared manual payment is final, so it earns as available", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({
      owner: OWNER, paymentRecordId: "pay_cash", facts: settled({ source: "admin_manual", amountPaidCents: 10000 }),
      sourceKind: "manual_payment", pendingUntilSettlementFinal: false, ports: port,
    });
    const w = await walletOf(port, OWNER);
    assert.equal(w.availableCents, 900, "cash clears immediately and is spendable");
    assert.equal(w.pendingCents, 0);
  });

  await check("A9: a renewal earns at the same rate under the same idempotency key", async () => {
    const { port, entries } = makeStore();
    const renewal = {
      owner: OWNER, paymentRecordId: "pay_renewal_1", facts: settled({ amountPaidCents: 9900 }),
      sourceKind: "stripe_payment" as const, pendingUntilSettlementFinal: true, ports: port,
    };
    const first = await earnFromSettledPayment(renewal);
    assert.equal((first as { earnCents: number }).earnCents, 891, "$99.00 renewal earns $8.91");
    // The overlapping webhook path delivers the same renewal again.
    const second = await earnFromSettledPayment(renewal);
    assert.equal((second as { deduplicated: boolean }).deduplicated, true);
    assert.equal(entries.length, 1, "one renewal, one ledger entry");
    assert.equal(earnIdempotencyKey("pay_renewal_1"), "earn:payment:pay_renewal_1");
  });

  await check("A10: the renewal webhook path actually awards, and carries the payer", () => {
    const src = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    const paidBlock = src.slice(src.indexOf("export async function handleInvoicePaid"), src.indexOf("export async function handleInvoicePaymentFailed"));
    assert.ok(paidBlock.includes("awardCreditsForSettledPayment"), "an eligible renewal earns");
    assert.ok(paidBlock.includes("owner_user_id: renewalOwnerUserId"), "the renewal row carries its payer");
    assert.ok(paidBlock.includes("pendingUntilSettlementFinal: true"), "renewal card money is pending like any other");
    assert.ok(/renewalPaymentRecordId/.test(paidBlock), "the canonical payment record id anchors the earn");
  });

  // =========================================================================
  // SECTION B — reversal: cumulative, exact, and against the ORIGINAL wallet
  // =========================================================================
  await check("B1: a full refund reverses exactly what was earned", () => {
    assert.equal(
      computeTotalReversalTargetCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, cumulativeRefundedCents: 10000 }),
      900,
    );
  });

  await check("B2: a partial refund reverses proportionally, rounded down", () => {
    assert.equal(computeTotalReversalTargetCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, cumulativeRefundedCents: 5000 }), 450);
    assert.equal(computeTotalReversalTargetCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, cumulativeRefundedCents: 3333 }), 299);
  });

  await check("B3: reversal can never exceed what was earned", () => {
    assert.equal(
      computeTotalReversalTargetCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, cumulativeRefundedCents: 999999 }),
      900,
      "an over-refund still only claws back the credits actually awarded",
    );
    assert.equal(
      computeReversalDeltaCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, cumulativeRefundedCents: 10000, alreadyReversedCents: 900 }),
      0,
      "nothing remains to reverse once fully reversed",
    );
  });

  await check("B4: THREE sequential partial refunds reverse EXACTLY the award, not less", () => {
    // The regression this exists for: computing each event in isolation gives 2 + 2 + 3 = 7 of 9
    // cents, leaving the customer 2 cents of credit for money they were fully refunded.
    let already = 0;
    let cumulative = 0;
    for (const r of [3333, 3333, 3334]) {
      cumulative += r;
      already += computeReversalDeltaCents({
        originallyEarnedCents: 900, originalEligibleNetCents: 10000,
        cumulativeRefundedCents: cumulative, alreadyReversedCents: already,
      });
    }
    assert.equal(already, 900, "a fully refunded payment reverses its entire award");
  });

  await check("B5: out-of-order delivery lands on the same total", () => {
    let already = 0;
    let cumulative = 0;
    for (const r of [3334, 3333, 3333]) {
      cumulative += r;
      already += computeReversalDeltaCents({
        originallyEarnedCents: 900, originalEligibleNetCents: 10000,
        cumulativeRefundedCents: cumulative, alreadyReversedCents: already,
      });
    }
    assert.equal(already, 900);
  });

  await check("B6: a stale event that would move the total BACKWARDS moves nothing", () => {
    assert.equal(
      computeReversalDeltaCents({
        originallyEarnedCents: 900, originalEligibleNetCents: 10000,
        cumulativeRefundedCents: 2000, alreadyReversedCents: 900,
      }),
      0,
      "never a negative movement",
    );
  });

  await check("B7: a refund claws back from pending first, then available", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p1", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    const res = await reverseForRefundOrChargeback({
      paymentRecordId: "p1", eventRefundedCents: 10000, cumulativeRefundedCentsForKind: 10000,
      kind: "refund", externalId: "re_1", ports: port,
    });
    assert.equal((res as { outcome: string }).outcome, "reversed");
    const w = await walletOf(port, OWNER);
    assert.equal(w.pendingCents, 0, "the never-spendable credits are taken back first");
    assert.equal(w.availableCents, 0);
    assert.equal(w.lifetimeReversedCents, 900);
  });

  await check("B8: TWO partial refunds of one charge each reverse — the charge id never collapses them", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p_two", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    // Two DISTINCT refund objects against the same charge, as Stripe actually delivers them.
    const a = await reverseForRefundOrChargeback({ paymentRecordId: "p_two", eventRefundedCents: 5000, kind: "refund", externalId: "re_a", ports: port });
    const b = await reverseForRefundOrChargeback({ paymentRecordId: "p_two", eventRefundedCents: 5000, kind: "refund", externalId: "re_b", ports: port });
    assert.equal((a as { reversedCents: number }).reversedCents, 450);
    assert.equal((b as { reversedCents: number }).reversedCents, 450, "the SECOND refund also reverses");
    assert.equal((await walletOf(port, OWNER)).lifetimeReversedCents, 900, "the whole award came back");
  });

  await check("B9: a reversal debits the ORIGINAL wallet, never a re-resolved one", async () => {
    const { port, entries } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p_orig", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    const originalWallet = (await walletOf(port, OWNER)).id;
    // The payer now also has a SECOND wallet. A reversal must not touch it.
    await seedAvailable(port, OTHER_OWNER, 5000, "other_seed");
    const otherWallet = (await walletOf(port, OTHER_OWNER)).id;
    assert.notEqual(originalWallet, otherWallet);

    await reverseForRefundOrChargeback({ paymentRecordId: "p_orig", eventRefundedCents: 10000, cumulativeRefundedCentsForKind: 10000, kind: "refund", externalId: "re_orig", ports: port });

    const reversalEntry = entries.find((e) => e.entryType === "refund_reversal")!;
    assert.equal(reversalEntry.walletId, originalWallet, "the clawback hit the wallet that was credited");
    assert.equal((await walletOf(port, OTHER_OWNER)).availableCents, 5000, "the other wallet is untouched");
  });

  await check("B10: the reversal path takes no owner at all — it cannot re-resolve one", () => {
    const core = readFileSync("app/lib/rewards/rewardsLedgerCore.ts", "utf8");
    const fn = core.slice(core.indexOf("export async function reverseForRefundOrChargeback"));
    const signature = fn.slice(0, fn.indexOf("): Promise<ReversalResult>"));
    assert.ok(!/\bowner:/.test(signature), `the reversal signature must not accept an owner: ${signature.slice(0, 400)}`);
    assert.ok(fn.includes("walletId: original.walletId"), "it posts to the wallet the earn credited");

    const fulfillment = readFileSync("app/lib/rewards/rewardsFulfillment.ts", "utf8");
    const hook = fulfillment.slice(
      fulfillment.indexOf("export async function reverseCreditsForRefundOrDispute"),
      fulfillment.indexOf("export async function promoteSettledCredits"),
    );
    assert.ok(!hook.includes("resolveWalletOwnerForPayment"), "the hook must not re-resolve ownership at reversal time");
  });

  await check("B11: a chargeback on a payment that earned nothing is a safe no-op", async () => {
    const { port } = makeStore();
    const res = await reverseForRefundOrChargeback({ paymentRecordId: "unknown", eventRefundedCents: 5000, kind: "chargeback", externalId: "dp_1", ports: port });
    assert.equal(res.ok, true);
    assert.equal((res as { outcome: string }).outcome, "nothing_to_reverse");
    assert.equal((res as { reversedCents: number }).reversedCents, 0);
  });

  await check("B12: a dispute AFTER a partial refund composes, never double-reverses", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p_mix", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    await reverseForRefundOrChargeback({ paymentRecordId: "p_mix", eventRefundedCents: 5000, cumulativeRefundedCentsForKind: 5000, kind: "refund", externalId: "re_mix", ports: port });
    const dispute = await reverseForRefundOrChargeback({ paymentRecordId: "p_mix", eventRefundedCents: 5000, kind: "chargeback", externalId: "dp_mix", ports: port });
    assert.equal((dispute as { reversedCents: number }).reversedCents, 450);
    assert.equal((await walletOf(port, OWNER)).lifetimeReversedCents, 900, "exactly the award, no more");
  });

  await check("B13: a wallet can never be driven negative by a reversal", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p2", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    const reserve = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 5000, allowZeroCharge: true, redemptionRef: "rr1", contextKind: "stripe_checkout", ports: port });
    assert.equal(reserve.ok, true);
    await commitReservedCredits({ redemptionRef: "rr1", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 0, "all credits spent");

    // THE CLAWBACK NOW HAPPENS, AS A DEBT. Refusing left the books wrong: money went back to the
    // customer and the reversal simply never occurred, with nothing recording that anything was
    // owed. The wallet still cannot go negative — the shortfall lands in `recovery_cents`.
    const res = await reverseForRefundOrChargeback({ paymentRecordId: "p2", eventRefundedCents: 10000, cumulativeRefundedCentsForKind: 10000, kind: "refund", externalId: "re_2", ports: port });
    assert.equal(res.ok, true, "the clawback is recorded, not abandoned");
    assert.equal((res as { reversedCents: number }).reversedCents, 0, "nothing could be taken from the buckets");
    assert.equal((res as { recoveryAccruedCents: number }).recoveryAccruedCents, 900, "so the whole 900 became a debt");
    const w2 = await walletOf(port, OWNER);
    assert.ok(w2.availableCents >= 0 && w2.pendingCents >= 0, "balances stay non-negative");
    assert.equal(w2.recoveryCents, 900, "and the debt is visible on the wallet");

    // NO FURTHER SPENDING while that debt stands.
    const blocked = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 100, amountDueCents: 5000, redemptionRef: "rr_blocked", contextKind: "stripe_checkout", ports: port });
    assert.equal(blocked.ok, false, "a customer who owes a clawback cannot hold a fresh discount");

    // FUTURE EARNINGS REPAY IT FIRST, and only the remainder becomes spendable.
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p2b", facts: settled({ amountPaidCents: 20000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    const w3 = await walletOf(port, OWNER);
    assert.equal(w3.recoveryCents, 0, "9% of $200 = 1800 clears the 900 debt");
    assert.equal(w3.availableCents, 900, "and 900 of it becomes spendable");
    assert.equal(w3.lifetimeEarnedCents, 900 + 1800, "the customer still EARNED the full amount");
  });

  await check("B14: the webhook keys refunds on each REFUND object, not the charge", () => {
    const src = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    assert.ok(src.includes("reverseRewardsForChargeRefunds"), "refunds are fanned out per refund object");
    const fn = src.slice(src.indexOf("async function reverseRewardsForChargeRefunds"), src.indexOf("/** charge.refunded"));
    assert.ok(fn.includes("charge.refunds?.data"), "each refund object is read");
    assert.ok(/externalId:\s*refund\.id/.test(fn), "the refund's own id is the idempotency anchor");
    // The old defect, stated so a regression is visible: externalId must not simply be charge.id.
    assert.ok(!/externalId:\s*input\.charge\.id\s*,/.test(fn), "the bare charge id is never the anchor");

    // EXACTLY ONE ACCOUNTING SCHEME. A `<chargeId>:cum<N>` fallback used to key a truncated
    // payload off the rail's cumulative position. Because basis contributions from both schemes
    // are summed, the same refunded dollars were counted once under each: an adversarial review
    // reversed 810 cents where 540 was owed, simply by sending one delivery without
    // `charge.refunds` and the next one with it.
    assert.ok(!/cum\$\{/.test(fn), "no second, cumulative-keyed scheme exists beside the refund ids");
    assert.ok(!/externalId:\s*`\$\{input\.charge\.id\}/.test(fn), "no charge-derived key at all");
    // A payload we cannot attribute moves NOTHING, and says so.
    const noRefunds = fn.slice(fn.indexOf("if (!refunds.length) {"), fn.indexOf("// Oldest first"));
    assert.ok(
      !noRefunds.includes("reverseCreditsForRefundOrDispute("),
      "an unattributable refund payload reverses nothing",
    );
    assert.ok(
      noRefunds.includes('rewards_reason: "charge_refunds_absent_from_payload"') && noRefunds.includes("retryable: true"),
      "and the gap is audited as retryable rather than left silent",
    );
  });

  // =========================================================================
  // SECTION C — redemption
  // =========================================================================
  await check("C1: the customer may redeem all, some, or none", () => {
    assert.deepEqual(
      planRedemption({ requestedCents: 500, availableCents: 2000, amountDueCents: 10000, allowZeroCharge: true }),
      { ok: true, redeemCents: 500, remainingDueCents: 9500, cappedBy: null },
    );
    assert.equal(planRedemption({ requestedCents: 0, availableCents: 2000, amountDueCents: 10000 }).ok, false);
  });

  await check("C2: MINIMUM redemption is $1.00 — below it is refused, not rounded away", () => {
    assert.equal(REDEMPTION_MINIMUM_CENTS, 100);
    const below = planRedemption({ requestedCents: 99, availableCents: 5000, amountDueCents: 10000, allowZeroCharge: true });
    assert.equal(below.ok, false);
    assert.equal((below as { reason: string }).reason, "below_minimum");
    assert.equal(planRedemption({ requestedCents: 100, availableCents: 5000, amountDueCents: 10000, allowZeroCharge: true }).ok, true, "exactly $1.00 is allowed");
  });

  await check("C3: MAXIMUM redemption is 50% of the eligible purchase", () => {
    assert.equal(REDEMPTION_MAX_FRACTION_BASIS_POINTS, 5000);
    assert.equal(maxRedeemableForPurchaseCents(10000), 5000);
    assert.equal(maxRedeemableForPurchaseCents(9999), 4999, "rounded DOWN, never above half");
    const p = planRedemption({ requestedCents: 10000, availableCents: 10000, amountDueCents: 10000, allowZeroCharge: true });
    assert.equal((p as { redeemCents: number }).redeemCents, 5000, "half, not the whole purchase");
    assert.equal((p as { cappedBy: string }).cappedBy, "purchase_half_cap");
    assert.equal((p as { remainingDueCents: number }).remainingDueCents, 5000);
  });

  await check("C4: the 50% ceiling measures the PURCHASE, not the post-promo residual", () => {
    // A $100 purchase with a $40 promo leaves $60 due. Half of the PURCHASE is $50, and the
    // customer may spend it — a promo must not shrink how much loyalty value they can apply.
    const p = planRedemption({
      requestedCents: 5000, availableCents: 10000, amountDueCents: 6000,
      eligiblePurchaseCents: 10000, allowZeroCharge: true,
    });
    assert.equal((p as { redeemCents: number }).redeemCents, 5000);
  });

  await check("C5: the rail minimum is preserved, defaulting to 50 cents", () => {
    assert.equal(DEFAULT_RAIL_MINIMUM_CHARGE_CENTS, 50);
    assert.equal(resolveRailMinimumChargeCents(undefined), 50, "no canonical value falls back to 50c");
    assert.equal(resolveRailMinimumChargeCents(10), 50, "a LOOSER value never weakens the floor");
    assert.equal(resolveRailMinimumChargeCents(200), 200, "a STRICTER value wins");

    // $10.00 due, half is $5.00, leaving $5.00 payable — comfortably above the floor.
    const normal = planRedemption({ requestedCents: 10000, availableCents: 10000, amountDueCents: 1000 });
    assert.equal((normal as { redeemCents: number }).redeemCents, 500);

    // A tiny invoice where the floor bites before the $1 minimum can be met.
    const tiny = planRedemption({ requestedCents: 10000, availableCents: 10000, amountDueCents: 120 });
    assert.equal(tiny.ok, false, "nothing >= $1 can be applied while preserving 50c");
    assert.ok((tiny as { maxRedeemableCents: number }).maxRedeemableCents <= 70);
  });

  await check("C6: nothing due, or nothing available, is refused cleanly", () => {
    assert.equal(planRedemption({ requestedCents: 100, availableCents: 100, amountDueCents: 0 }).ok, false);
    assert.equal(planRedemption({ requestedCents: 100, availableCents: 0, amountDueCents: 5000 }).ok, false);
    assert.equal(planRedemption({ requestedCents: -5, availableCents: 100, amountDueCents: 5000 }).ok, false);
  });

  await check("C7: a refusal still reports what COULD be applied", () => {
    const r = planRedemption({ requestedCents: 0, availableCents: 3000, amountDueCents: 10000, allowZeroCharge: true });
    assert.equal(r.ok, false);
    assert.equal((r as { maxRedeemableCents: number }).maxRedeemableCents, 3000);
  });

  await check("C8: reserve moves available→reserved; commit spends it", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 5000, "adj1");
    const r = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 10000, redemptionRef: "ref_c8", contextKind: "stripe_checkout", ports: port });
    assert.equal(r.ok, true);
    let w = await walletOf(port, OWNER);
    assert.equal(w.availableCents, 3000);
    assert.equal(w.reservedCents, 2000, "held, not yet spent");

    await commitReservedCredits({ redemptionRef: "ref_c8", ports: port });
    w = await walletOf(port, OWNER);
    assert.equal(w.reservedCents, 0);
    assert.equal(w.availableCents, 3000, "committing does not return the hold");
    assert.equal(w.lifetimeRedeemedCents, 2000);
  });

  await check("C9: a failed checkout RELEASES the hold back to available", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 5000, "a2");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 10000, redemptionRef: "ref_c9", contextKind: "stripe_checkout", ports: port });
    await releaseReservedCredits({ redemptionRef: "ref_c9", ports: port });
    const w = await walletOf(port, OWNER);
    assert.equal(w.availableCents, 5000, "an abandoned checkout must not consume the balance");
    assert.equal(w.reservedCents, 0);
    assert.equal(w.lifetimeRedeemedCents, 0);
  });

  await check("C10: two concurrent checkouts cannot both spend the last credits", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 1000, "a3");
    const first = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "tabA", contextKind: "stripe_checkout", ports: port });
    assert.equal(first.ok, true);
    const second = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "tabB", contextKind: "stripe_checkout", ports: port });
    assert.equal(second.ok, false, "the second tab has nothing left to reserve");
    const w = await walletOf(port, OWNER);
    assert.equal(w.reservedCents, 1000);
    assert.equal(w.availableCents, 0);
  });

  await check("C11: committing twice is a no-op, not a double spend", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 3000, "a4");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "ref_c11", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "ref_c11", ports: port });
    const again = await commitReservedCredits({ redemptionRef: "ref_c11", ports: port });
    assert.equal(again.ok, true);
    assert.equal((again as { outcome: string }).outcome, "already_final");
    assert.equal((await walletOf(port, OWNER)).lifetimeRedeemedCents, 1000, "still exactly one redemption");
  });

  await check("C12: releasing after commit does not refund the customer twice", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 3000, "a5");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "ref_c12", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "ref_c12", ports: port });
    const rel = await releaseReservedCredits({ redemptionRef: "ref_c12", ports: port });
    assert.equal((rel as { outcome: string }).outcome, "already_final");
    assert.equal((await walletOf(port, OWNER)).availableCents, 2000, "balance unchanged by the late release");
  });

  await check("C13: a REUSED redemption reference grants no phantom discount", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 5000, "a6");
    const a = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "same_ref", contextKind: "stripe_checkout", ports: port });
    const b = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "same_ref", contextKind: "stripe_checkout", ports: port });
    assert.equal((a as { redemptionId: string }).redemptionId, (b as { redemptionId: string }).redemptionId);
    assert.equal((b as { deduplicated: boolean }).deduplicated, true, "the caller is TOLD it is a replay");
    const w = await walletOf(port, OWNER);
    assert.equal(w.reservedCents, 1000, "only one hold exists");
    assert.equal(w.availableCents, 4000, "and only one deduction happened");
  });

  await check("C14: a reference whose hold was RELEASED reports zero, not a live discount", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 5000, "a7");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "dead_ref", contextKind: "stripe_checkout", ports: port });
    await releaseReservedCredits({ redemptionRef: "dead_ref", ports: port });
    const again = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "dead_ref", contextKind: "stripe_checkout", ports: port });
    assert.equal(again.ok, true);
    assert.equal((again as { redeemCents: number }).redeemCents, 0, "a released hold funds nothing");
    assert.equal((again as { deduplicated: boolean }).deduplicated, true);
  });

  await check("C15: a reservation writes its expiry deadline", async () => {
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const { port, redemptions } = makeStore({ now: () => t0 });
    await seedAvailable(port, OWNER, 5000, "a8");
    const r = await reserveCreditsForPurchase({
      owner: OWNER, requestedCents: 1000, amountDueCents: 9000,
      redemptionRef: "exp_ref", contextKind: "stripe_checkout", nowMs: t0, ports: port,
    });
    assert.equal(r.ok, true);
    assert.equal((r as { expiresAtIso: string }).expiresAtIso, reservationExpiresAtIso(t0));
    const stored = redemptions.get(reserveIdempotencyKey("exp_ref"))!;
    assert.equal(Date.parse(stored.expiresAtIso!) - t0, REDEMPTION_RESERVATION_MINUTES * 60_000);
  });

  await check("C16: the earn after a redemption is computed on real money only", async () => {
    const { port } = makeStore();
    // A $100 purchase funded $40 by credits earns 9% of $60, not of $100.
    await earnFromSettledPayment({
      owner: OWNER, paymentRecordId: "c16", facts: settled({ amountPaidCents: 10000, creditsAppliedCents: 4000 }),
      sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port,
    });
    assert.equal((await walletOf(port, OWNER)).pendingCents, 540);
  });

  // =========================================================================
  // SECTION D — idempotency
  // =========================================================================
  await check("D1: a duplicate payment event earns only once", async () => {
    const { port, entries } = makeStore();
    const facts = settled({ amountPaidCents: 10000 });
    const a = await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "dup_1", facts, sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    const b = await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "dup_1", facts, sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    assert.equal((a as { deduplicated: boolean }).deduplicated, false);
    assert.equal((b as { deduplicated: boolean }).deduplicated, true, "the replay is recognized");
    assert.equal(entries.length, 1, "exactly one ledger entry exists");
    assert.equal((await walletOf(port, OWNER)).pendingCents, 900, "the balance moved once");
  });

  await check("D2: a duplicate refund event reports ZERO movement, not a phantom reversal", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p3", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    const first = await reverseForRefundOrChargeback({ paymentRecordId: "p3", eventRefundedCents: 10000, cumulativeRefundedCentsForKind: 10000, kind: "refund", externalId: "re_same", ports: port });
    const second = await reverseForRefundOrChargeback({ paymentRecordId: "p3", eventRefundedCents: 10000, cumulativeRefundedCentsForKind: 10000, kind: "refund", externalId: "re_same", ports: port });

    assert.equal((first as { reversedCents: number }).reversedCents, 900);
    assert.equal(second.ok, true);
    assert.equal((second as { reversedCents: number }).reversedCents, 0, "the AUDIT must report what MOVED");
    assert.equal((second as { deduplicated: boolean }).deduplicated, true);
    assert.equal((second as { totalReversedCents: number }).totalReversedCents, 900);
    assert.equal((await walletOf(port, OWNER)).lifetimeReversedCents, 900, "reversed exactly once");
  });

  await check("D3: concurrent duplicate delivery of the same event moves money once", async () => {
    const { port, entries } = makeStore();
    const facts = settled({ amountPaidCents: 10000 });
    const [a, b] = await Promise.all([
      earnFromSettledPayment({ owner: OWNER, paymentRecordId: "race_1", facts, sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port }),
      earnFromSettledPayment({ owner: OWNER, paymentRecordId: "race_1", facts, sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port }),
    ]);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(entries.filter((e) => e.paymentRecordId === "race_1").length, 1, "one entry, whatever the interleaving");
    assert.equal((await walletOf(port, OWNER)).pendingCents, 900);
  });

  await check("D4: concurrent duplicate RESERVE holds credits once", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 5000, "d4");
    const [a, b] = await Promise.all([
      reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "d4_ref", contextKind: "stripe_checkout", ports: port }),
      reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "d4_ref", contextKind: "stripe_checkout", ports: port }),
    ]);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    const w = await walletOf(port, OWNER);
    assert.equal(w.reservedCents, 1000, "one hold");
    assert.equal(w.availableCents, 4000, "one deduction");
  });

  await check("D5: idempotency keys are namespaced and derived, never random", () => {
    assert.equal(earnIdempotencyKey("abc"), "earn:payment:abc");
    assert.equal(earnIdempotencyKey("abc"), earnIdempotencyKey("abc"), "stable across calls");
    assert.notEqual(earnIdempotencyKey("abc"), earnIdempotencyKey("abd"));
    assert.equal(promoteIdempotencyKey("abc"), "promote:payment:abc");
    assert.equal(manualAdjustmentIdempotencyKey("abc"), "adjust:abc");
    // The refund key names the REFUND, so two refunds of one charge cannot collide.
    assert.notEqual(reversalIdempotencyKey("refund", "re_a"), reversalIdempotencyKey("refund", "re_b"));
    assert.notEqual(reversalIdempotencyKey("refund", "x"), reversalIdempotencyKey("chargeback", "x"));
  });

  // =========================================================================
  // SECTION E — manual adjustments
  // =========================================================================
  await check("E1: a manual adjustment requires an actor and a reason", async () => {
    const { port } = makeStore();
    assert.equal((await postManualAdjustment({ owner: OWNER, amountCents: 100, reason: "", actorAuthUserId: "s", adjustmentRef: "x1", ports: port })).ok, false);
    assert.equal((await postManualAdjustment({ owner: OWNER, amountCents: 100, reason: "ok reason", actorAuthUserId: "", adjustmentRef: "x2", ports: port })).ok, false);
    assert.equal((await postManualAdjustment({ owner: OWNER, amountCents: 0, reason: "ok reason", actorAuthUserId: "s", adjustmentRef: "x3", ports: port })).ok, false);
  });

  await check("E2: a negative adjustment cannot drive the wallet negative", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 500, "y1");
    const res = await postManualAdjustment({ owner: OWNER, amountCents: -5000, reason: "correction", actorAuthUserId: "s", adjustmentRef: "y2", ports: port });
    assert.equal(res.ok, false, "refused, not clamped");
    assert.equal((await walletOf(port, OWNER)).availableCents, 500);
  });

  await check("E3: a negative adjustment draws AVAILABLE first, then pending", async () => {
    const { port } = makeStore();
    // $3.00 pending from a card payment, $2.00 available from a correction.
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "pay_e3", facts: settled({ amountPaidCents: 3334 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    await seedAvailable(port, OWNER, 200, "y3");
    const before = await walletOf(port, OWNER);
    assert.equal(before.pendingCents, 300);
    assert.equal(before.availableCents, 200);

    const res = await postManualAdjustment({ owner: OWNER, amountCents: -350, reason: "staff correction", actorAuthUserId: "s", adjustmentRef: "y4", ports: port });
    assert.equal(res.ok, true);
    const after = await walletOf(port, OWNER);
    assert.equal(after.availableCents, 0, "spendable value goes first");
    assert.equal(after.pendingCents, 150, "the remainder comes out of pending");
  });

  await check("E4: a reused adjustment reference moves nothing twice", async () => {
    const { port } = makeStore();
    const a = await postManualAdjustment({ owner: OWNER, amountCents: 500, reason: "goodwill", actorAuthUserId: "s", adjustmentRef: "dupe_adj", ports: port });
    const b = await postManualAdjustment({ owner: OWNER, amountCents: 500, reason: "goodwill", actorAuthUserId: "s", adjustmentRef: "dupe_adj", ports: port });
    assert.equal((a as { deduplicated: boolean }).deduplicated, false);
    assert.equal((b as { deduplicated: boolean }).deduplicated, true);
    assert.equal((await walletOf(port, OWNER)).availableCents, 500);
  });

  await check("E5: the staff API reports a reused reference as no new movement", () => {
    const src = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    assert.ok(/deduplicated: true[\s\S]{0,200}movedCents: 0/.test(src), "a replayed redeem reports zero movement");
    assert.ok(src.includes("already used"), "and says so in plain words");
    assert.ok(/movedCents: res\.deduplicated \? 0 : res\.amountCents/.test(src), "a replayed adjustment reports zero too");
  });

  // =========================================================================
  // SECTION F — promo coexistence and the real checkout seam
  // =========================================================================
  await check("F1: credits coexist with one promo; two promos remain refused", () => {
    assert.deepEqual(validateDiscountCombination({ promoCodeApplied: true, verifiedIntroDiscountApplied: false, creditsAppliedCents: 500 }), { ok: true });
    assert.deepEqual(validateDiscountCombination({ promoCodeApplied: false, verifiedIntroDiscountApplied: false, creditsAppliedCents: 500 }), { ok: true });
    const two = validateDiscountCombination({ promoCodeApplied: true, verifiedIntroDiscountApplied: true, creditsAppliedCents: 0 });
    assert.equal(two.ok, false);
    assert.equal((two as { reason: string }).reason, "multiple_promo_codes");
  });

  await check("F2: the existing one-promo server rule is untouched", () => {
    const checkoutSrc = readFileSync("app/api/revenue-os/checkout/route.ts", "utf8");
    assert.ok(checkoutSrc.includes("discount_conflict"), "the existing 409 conflict rule still exists");
    assert.ok(checkoutSrc.includes("Only one discount may be applied per checkout."), "its message is unchanged");
  });

  await check("F3: the checkout charges the SERVER-planned amount, never a browser figure", () => {
    const src = readFileSync("app/api/revenue-os/checkout/route.ts", "utf8");
    assert.ok(src.includes("reserveCheckoutCredits"), "credits are reserved server-side");
    assert.ok(src.includes("chargeableAmountCents"), "one derived amount drives the charge");
    assert.ok(/finalAmountCents:\s*chargeableAmountCents/.test(src), "line items are built from the post-credit amount");
    assert.ok(/amountCents:\s*chargeableAmountCents/.test(src), "the Stripe session is created for the post-credit amount");
    assert.ok(src.includes("creditsAppliedCents,"), "the payment record records what credits funded");
    assert.ok(src.includes("requestedCreditsCents"), "the browser's figure is treated as a request, not an instruction");
  });

  await check("F4: every failure path releases the hold; only the paid path commits it", () => {
    const src = readFileSync("app/api/revenue-os/checkout/route.ts", "utf8");
    // COUNTING CALL SITES PROVES NOTHING. Three calls in dead code, three in one branch, or three
    // inside a `catch` that rethrows first all satisfy `length >= 3`, and the guarantee at stake is
    // that an abandoned or failed checkout never permanently consumes a customer's balance. What
    // is assertable from the source is that every release NAMES the failure it is unwinding, and
    // that the three named failures are the three paths that can strand a hold.
    const releaseReasons = [...src.matchAll(/releaseCheckoutCredits\(\{[\s\S]{0,200}?reason:\s*"([a-z_]+)"/g)].map((m) => m[1]);
    for (const expected of [
      // A reused attempt whose session is stale: the old hold must go back before a new one is made.
      "stale_checkout_attempt_released",
      // The authoritative re-plan under the row lock disagreed with the planned figure.
      "planned_credits_no_longer_available",
      // Stripe refused the session, so the purchase the hold was funding does not exist.
      "checkout_session_create_failed",
    ]) {
      assert.ok(
        releaseReasons.includes(expected),
        `a hold is released when ${expected} — found ${JSON.stringify(releaseReasons)}`,
      );
    }
    assert.ok(src.includes("checkout_session_create_failed"), "the synchronous Stripe failure path releases");
    assert.ok(src.includes("stale_checkout_attempt_released"), "a released stale attempt releases its hold");

    const fulfillment = readFileSync("app/lib/listingPlans/revenueFulfillment.ts", "utf8");
    assert.ok(fulfillment.includes("commitCheckoutCredits"), "the hold is committed on the paid path");
    assert.ok(fulfillment.includes("checkout_session_expired"), "an expired session releases the hold");
    // EVERY COMMIT SITE MUST SIT WHERE THE PAYMENT HAS ALREADY SETTLED — which is not the same as
    // "later in the file than `markPaymentRecordPaid`". There are two legitimate sites and they
    // are in the opposite textual order:
    //
    //   1. the ALREADY-PAID branch, taken on every Stripe redelivery. It did not commit at all, so
    //      a first delivery whose commit threw was never retried and the expiry sweep handed the
    //      credits back to a customer who had paid the reduced price.
    //   2. immediately after `markPaymentRecordPaid` SUCCEEDS on a fresh delivery. It used to be
    //      the last step of fulfilment, behind roughly fifteen early returns.
    //
    // So this asserts the CONTEXT of each site rather than its position.
    const commitSites = [...fulfillment.matchAll(/await commitCheckoutCredits\(/g)].map((m) => m.index ?? -1);
    assert.equal(commitSites.length, 2, `exactly two commit sites, found ${commitSites.length}`);

    const clearedBranch = fulfillment.indexOf("if (isPaymentCleared(paymentRecord.payment_status)) {");
    assert.ok(clearedBranch > 0, "the already-paid branch was found");
    const paidCall = fulfillment.indexOf("await markPaymentRecordPaid(");
    assert.ok(paidCall > 0, "the markPaymentRecordPaid call site was found");
    const paidGuard = fulfillment.indexOf("if (!paidResult.ok) {", paidCall);
    assert.ok(paidGuard > paidCall, "the paid-result guard follows it");

    const [redelivery, freshDelivery] = commitSites.sort((a, b) => a - b);
    assert.ok(
      redelivery > clearedBranch && redelivery < paidCall,
      "the redelivery path commits inside the already-paid branch",
    );
    assert.ok(
      freshDelivery > paidGuard,
      "and the fresh path commits only after markPaymentRecordPaid has SUCCEEDED",
    );
    // ...and before the activation gates, so a permanent activation failure cannot strand the hold.
    const firstActivationReturn = fulfillment.indexOf("await activateEntitlementsForPayment({", paidGuard);
    assert.ok(firstActivationReturn > 0, "the activation step was found");
    assert.ok(
      freshDelivery < firstActivationReturn,
      "settling the money a payment was made with does not wait on whether a listing activated",
    );
  });

  await check("F5: the redemption module never calls Stripe", () => {
    const src = readFileSync("app/lib/rewards/rewardsCheckoutRedemption.ts", "utf8");
    assert.ok(!/require\(["']stripe|from ["']stripe["']|new Stripe\(/.test(src), "no Stripe client here");
    assert.ok(src.includes("planRedemption"), "it defers to the one policy function");
  });

  await check("F6: the customer is told the exact figures, in ES and EN", () => {
    const view = { availableCents: 5000, maxRedeemableCents: 2500, appliedCents: 2000, remainingDueCents: 3000 };
    for (const lang of ["es", "en"] as const) {
      const c = checkoutCreditsCopy(lang, view);
      assert.ok(c.available.includes("$50.00"), `${lang} available`);
      assert.ok(c.maximum.includes("$25.00"), `${lang} maximum`);
      assert.ok(c.applied.includes("$20.00"), `${lang} applied`);
      assert.ok(c.remainingDue.includes("$30.00"), `${lang} remaining due`);
      assert.ok(c.note.length > 20, `${lang} note explains the hold`);
    }
    assert.notEqual(checkoutCreditsCopy("es", view).available, checkoutCreditsCopy("en", view).available, "the two languages differ");
  });

  // =========================================================================
  // SECTION G — schema invariants and TS/SQL agreement
  // =========================================================================
  await check("G1: the migration encodes the invariants the tests rely on", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.ok(sql.includes("NOT APPLIED"), "states it has not been applied");
    assert.ok(/available_cents >= 0/.test(sql) && /reserved_cents >= 0/.test(sql) && /pending_cents >= 0/.test(sql), "non-negative bucket CHECKs exist");
    assert.ok(/CREATE UNIQUE INDEX[\s\S]*?leonix_rewards_ledger_idempotency_idx[\s\S]*?\(idempotency_key\)/.test(sql), "UNIQUE(idempotency_key) exists");
    assert.ok(sql.includes("leonix_rewards_ledger_immutable_tg"), "the ledger is append-only by trigger");
    assert.ok(sql.includes("FOR UPDATE"), "the wallet row is locked during a movement");
    assert.ok(/ENABLE ROW LEVEL SECURITY/.test(sql), "RLS is enabled");
    // FOR ALL was the gap: it grants INSERT/UPDATE/DELETE too, and the old pattern did not
    // name it, so the single most dangerous policy form would have passed this check.
    assert.ok(
      !/FOR (INSERT|UPDATE|DELETE|ALL)[\s\S]{0,120}TO (authenticated|anon|public|PUBLIC)/.test(sql),
      "no authenticated write policy exists on any rewards table",
    );
    // EVERY policy statement is examined, not only the ones that happen to say FOR.
    //
    // A policy with NO `FOR` clause defaults to `FOR ALL` in Postgres, which grants
    // INSERT/UPDATE/DELETE as well. The previous loop matched on `FOR\\s+(\\w+)` and therefore
    // simply did not see such a policy: an adversarial review added
    // `CREATE POLICY ... TO authenticated USING (true) WITH CHECK (true)` and every check stayed
    // green. Each statement is now split out and required to declare FOR SELECT explicitly.
    const policies = [...sql.matchAll(/CREATE POLICY[\s\S]*?;/g)].map((m) => m[0]);
    assert.ok(policies.length > 0, "the read policies exist");
    for (const policy of policies) {
      const name = /CREATE POLICY\s+(\S+)/.exec(policy)?.[1] ?? "<unnamed>";
      const forClause = /\bFOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\b/i.exec(policy)?.[1];
      assert.ok(forClause, `policy ${name} must state FOR SELECT explicitly — no FOR clause means FOR ALL`);
      assert.equal(forClause!.toUpperCase(), "SELECT", `policy ${name} must be SELECT-only`);
      assert.ok(
        !/WITH\s+CHECK/i.test(policy),
        `policy ${name} must carry no WITH CHECK — a read policy has nothing to write`,
      );
    }

    // THE LEDGER IS APPEND-ONLY BY A TRIGGER THAT IS ACTUALLY INSTALLED. Naming the trigger is not
    // the same as creating it: deleting the CREATE TRIGGER statement left the name behind in a
    // comment and the suite stayed green.
    assert.ok(
      /CREATE TRIGGER\s+leonix_rewards_ledger_immutable_tg[\s\S]{0,200}?BEFORE\s+UPDATE\s+OR\s+DELETE[\s\S]{0,200}?ON\s+public\.leonix_rewards_ledger[\s\S]{0,200}?EXECUTE\s+FUNCTION/i.test(sql),
      "the immutability trigger is CREATEd on the ledger for UPDATE and DELETE",
    );

    assert.ok(sql.includes("REVOKE ALL ON FUNCTION public.leonix_rewards_post_entry"), "the posting function is not callable from a browser session");
    assert.ok(!/numeric|float|double precision|real\b/i.test(sql.replace(/^\s*--.*$/gm, "")), "no floating-point money column");
  });

  await check("G2: every entry type the TS layer emits is accepted by the SQL CHECK", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const EMITTED = [
      "earn_pending", "earn_promote", "earn_available", "redeem_reserve", "redeem_commit",
      "redeem_release", "refund_reversal", "chargeback_reversal", "manual_adjustment", "expire",
    ];
    for (const t of EMITTED) {
      assert.ok(sql.includes(`'${t}'`), `SQL must accept entry_type ${t}`);
      assert.ok(new RegExp(`WHEN '${t}'|'${t}',|'${t}'\\n`).test(sql), `SQL must handle ${t} in the delta CASE or the CHECK`);
    }
  });

  await check("G3: display formatting never feeds arithmetic", () => {
    assert.equal(formatCreditsCents(3591), "$35.91");
    assert.equal(formatCreditsCents(0), "$0.00");
    assert.equal(formatCreditsCents(-250), "-$2.50");
  });

  await check("G4: EVERY SECURITY DEFINER function pins a hardened search path", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    // Count the declarations themselves, then require each to be followed by a pinned path. A
    // fixed expected count would have to be edited by the same hand that adds a function, so the
    // two numbers are compared to each other instead.
    // Comments talk ABOUT SECURITY DEFINER; only the declarations count.
    const code = sql.replace(/^\s*--.*$/gm, "");
    const declared = (code.match(/\bSECURITY DEFINER\b/g) ?? []).length;
    const definers = code.match(/SECURITY DEFINER[\s\S]{0,400}?SET search_path = ([^\n;]+)/g) ?? [];
    assert.equal(
      definers.length,
      declared,
      `every SECURITY DEFINER must pin a search_path (${declared} declared, ${definers.length} pinned)`,
    );
    assert.ok(declared >= 3, `the money functions are SECURITY DEFINER (found ${declared})`);
    for (const d of definers) {
      const path = d.slice(d.lastIndexOf("SET search_path =") + "SET search_path =".length).trim();
      assert.ok(path.startsWith("pg_catalog"), `search_path must start at pg_catalog: ${path}`);
      assert.ok(path.endsWith("pg_temp"), `pg_temp must be searched LAST: ${path}`);
    }
    assert.ok(!/^\s*SET search_path = public\s*$/m.test(sql), "the unhardened 'public' form is gone");
  });

  await check("G5: EXECUTE is revoked, then granted explicitly to service_role", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.ok(/REVOKE ALL ON FUNCTION public\.leonix_rewards_post_entry[\s\S]*?FROM PUBLIC, anon, authenticated/.test(sql));
    assert.ok(/REVOKE ALL ON FUNCTION public\.leonix_rewards_recompute_wallet\(uuid\) FROM PUBLIC, anon, authenticated/.test(sql));
    assert.ok(/GRANT EXECUTE ON FUNCTION public\.leonix_rewards_post_entry[\s\S]*?TO service_role/.test(sql), "explicit service_role grant");
    assert.ok(/GRANT EXECUTE ON FUNCTION public\.leonix_rewards_recompute_wallet\(uuid\) TO service_role/.test(sql));
    // The revoke must come BEFORE the grant, or the grant is undone.
    assert.ok(
      sql.indexOf("REVOKE ALL ON FUNCTION public.leonix_rewards_post_entry") <
        sql.indexOf("GRANT EXECUTE ON FUNCTION public.leonix_rewards_post_entry"),
      "revoke precedes grant",
    );

    // NO GRANT MAY NAME A BROWSER ROLE. An adversarial review showed the previous assertions were
    // satisfied by `TO service_role, authenticated` — the substring `TO service_role` was present,
    // and a browser JWT could then call the money-moving RPC with any wallet, type and amount.
    // Every grant statement in the migration is now read, and its grantee list checked.
    for (const grant of sql.match(/GRANT[\s\S]*?;/g) ?? []) {
      const to = grant.slice(grant.lastIndexOf(" TO ") + 4).replace(/;\s*$/, "").trim();
      const grantees = to.split(",").map((g) => g.trim());
      const isSelectOnly = /^GRANT\s+SELECT\b/.test(grant.trim());
      for (const grantee of grantees) {
        assert.notEqual(grantee, "anon", `anon is never granted anything: ${grant.trim().slice(0, 90)}`);
        if (grantee === "authenticated") {
          assert.ok(
            isSelectOnly,
            `authenticated may only ever be granted SELECT: ${grant.trim().slice(0, 90)}`,
          );
        }
      }
    }
    // A blanket GRANT ALL is legitimate for service_role and for nobody else.
    for (const grant of sql.match(/GRANT\s+ALL[\s\S]*?;/gi) ?? []) {
      const to = grant.slice(grant.lastIndexOf(" TO ") + 4).replace(/;\s*$/, "").trim();
      assert.equal(to, "service_role", `GRANT ALL may only ever name service_role: ${grant.trim().slice(0, 90)}`);
    }
  });

  await check("G6: no client write grant survives on any rewards table", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    for (const table of ["leonix_rewards_wallets", "leonix_rewards_ledger", "leonix_rewards_redemptions"]) {
      assert.ok(new RegExp(`REVOKE ALL ON TABLE public\\.${table} FROM anon`).test(sql), `${table}: anon revoked`);
      assert.ok(
        new RegExp(`REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public\\.${table} FROM authenticated`).test(sql),
        `${table}: authenticated may not write`,
      );
      assert.ok(new RegExp(`GRANT SELECT ON TABLE public\\.${table} TO authenticated`).test(sql), `${table}: read only`);
    }
  });

  await check("G7: a concurrent insert on the same key recovers gracefully", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.ok(/EXCEPTION\s*\n\s*WHEN unique_violation THEN/.test(sql), "the posting function catches 23505");
    assert.ok(
      /WHEN unique_violation THEN[\s\S]{0,400}SELECT \* INTO v_existing[\s\S]{0,260}RETURN v_existing/.test(sql),
      "and returns the winner's row rather than aborting the caller's transaction",
    );
  });

  await check("G8: over-redemption and over-reversal are REFUSED by name, before any balance moves", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.ok(/redemption of % exceeds available/.test(sql), "over-redemption is refused explicitly");
    // A REVERSAL THAT OUTRUNS THE WALLET NO LONGER REFUSES — it records a debt.
    //
    // Refusing was safe for the wallet and wrong for the books: money went back to the customer
    // and the clawback simply never happened. The reversal now takes everything the wallet holds
    // and accrues the remainder as `recovery_cents`, which future earnings repay first.
    assert.ok(
      !/reversal of % exceeds pending % plus available %/.test(sql),
      "a reversal no longer refuses when the credits were already spent",
    );
    assert.ok(
      /v_cover := LEAST\(p_amount_cents, v_wallet\.pending_cents \+ v_wallet\.available_cents\);/.test(sql),
      "it takes what the wallet holds",
    );
    assert.ok(
      /v_recovery_delta := p_amount_cents - v_cover;/.test(sql),
      "and records the shortfall as a recovery balance",
    );
    // The bounded movements that DO still refuse by name.
    assert.ok(/restoration of % exceeds what was reversed/.test(sql), "over-restoration is refused explicitly");
    assert.ok(/offset of % exceeds recovery/.test(sql), "over-repayment of a debt is refused explicitly");
    assert.ok(
      /has an outstanding recovery balance of %/.test(sql),
      "a redemption is refused by name while a clawback is outstanding",
    );
    assert.ok(/promotion of % exceeds pending/.test(sql), "over-promotion is refused explicitly");
    assert.ok(/adjustment of % exceeds available % plus pending %/.test(sql), "an over-large staff debit is refused");
    assert.ok(/ERRCODE = 'check_violation'/.test(sql), "refusals carry a recognizable SQLSTATE");
  });

  await check("G9: a live reservation must carry a deadline", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.ok(
      /leonix_rewards_redemptions_live_expiry_chk[\s\S]{0,200}status <> 'reserved' OR expires_at IS NOT NULL/.test(sql),
      "a reserved row without expires_at is refused at the database",
    );
    assert.ok(/leonix_rewards_redemptions_expiry_sweep_idx/.test(sql), "the sweep has an index to read");
  });

  await check("G10: a zero-amount reversal is storable, so no event is lost", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    // The zero-amount family is the set of entry types that must be RECORDED even when nothing
    // moved: their idempotency key is what makes the next delivery a no-op, and their meta carries
    // the basis the cumulative arithmetic depends on.
    const zeroAllowed = /entry_type IN \(([\s\S]*?)\) AND amount_cents >= 0/.exec(sql)?.[1] ?? "";
    for (const t of ["refund_reversal", "chargeback_reversal", "reversal_restoration", "recovery_accrue", "recovery_offset"]) {
      assert.ok(zeroAllowed.includes(`'${t}'`), `${t} must be storable at zero`);
    }
    const positiveOnly = /entry_type NOT IN \(([\s\S]*?)\) AND amount_cents > 0/.exec(sql)?.[1] ?? "";
    assert.ok(positiveOnly.includes("'manual_adjustment'"), "everything else still requires a positive magnitude");
    for (const t of ["refund_reversal", "reversal_restoration", "recovery_accrue"]) {
      assert.ok(positiveOnly.includes(`'${t}'`), `${t} is excluded from the positive-only rule consistently`);
    }
  });

  // =========================================================================
  // SECTION H — the 30-day settlement promotion
  // =========================================================================
  const DAY = 86_400_000;

  await check("H1: the window is 30 calendar days", () => {
    assert.equal(CARD_SETTLEMENT_PENDING_DAYS, 30);
  });

  await check("H2: a card earn older than 30 days promotes to spendable", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port } = makeStore({ now: () => clock });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "h2", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    assert.equal((await walletOf(port, OWNER)).pendingCents, 900);

    clock += 31 * DAY;
    const out = await runPendingPromotionSweep({
      nowMs: clock, settlementDays: CARD_SETTLEMENT_PENDING_DAYS, limit: 50, ports: port,
      isPaymentStillEligible: async () => true,
    });
    assert.equal(out.promoted, 1);
    assert.equal(out.promotedCents, 900);
    const w = await walletOf(port, OWNER);
    assert.equal(w.pendingCents, 0);
    assert.equal(w.availableCents, 900, "now spendable");
  });

  await check("H3: a card earn INSIDE the window does not promote", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port } = makeStore({ now: () => clock });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "h3", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    clock += 29 * DAY;
    const out = await runPendingPromotionSweep({ nowMs: clock, settlementDays: 30, limit: 50, ports: port, isPaymentStillEligible: async () => true });
    assert.equal(out.examined, 0, "not yet a candidate");
    assert.equal((await walletOf(port, OWNER)).availableCents, 0);
  });

  await check("H4: a REFUNDED or disputed payment never promotes", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port } = makeStore({ now: () => clock });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "h4", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    clock += 31 * DAY;
    const out = await runPendingPromotionSweep({
      nowMs: clock, settlementDays: 30, limit: 50, ports: port,
      isPaymentStillEligible: async () => false, // the payment record says the money went back
    });
    assert.equal(out.promoted, 0);
    assert.equal(out.skippedIneligible, 1);
    const w = await walletOf(port, OWNER);
    assert.equal(w.pendingCents, 900, "the credits stay pending, where the reversal can still reach them");
    assert.equal(w.availableCents, 0);
  });

  await check("H5: promotion is idempotent across repeated sweeps", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port } = makeStore({ now: () => clock });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "h5", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    clock += 31 * DAY;
    const opts = { nowMs: clock, settlementDays: 30, limit: 50, ports: port, isPaymentStillEligible: async () => true };
    const first = await runPendingPromotionSweep(opts);
    const second = await runPendingPromotionSweep(opts);
    assert.equal(first.promoted, 1);
    assert.equal(second.promoted, 0, "the second sweep finds nothing left to do");
    assert.equal((await walletOf(port, OWNER)).availableCents, 900, "promoted exactly once");
  });

  await check("H6: promotion uses the ORIGINAL wallet", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port, entries } = makeStore({ now: () => clock });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "h6", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    const originalWallet = (await walletOf(port, OWNER)).id;
    await seedAvailable(port, OTHER_OWNER, 100, "h6_other");
    clock += 31 * DAY;
    await runPendingPromotionSweep({ nowMs: clock, settlementDays: 30, limit: 50, ports: port, isPaymentStillEligible: async () => true });
    assert.equal(entries.find((e) => e.entryType === "earn_promote")!.walletId, originalWallet);
  });

  await check("H7: a cleared CASH earn is already available and is never a promotion candidate", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port } = makeStore({ now: () => clock });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "h7", facts: settled({ source: "admin_manual", amountPaidCents: 10000 }), sourceKind: "manual_payment", pendingUntilSettlementFinal: false, ports: port });
    clock += 60 * DAY;
    const out = await runPendingPromotionSweep({ nowMs: clock, settlementDays: 30, limit: 50, ports: port, isPaymentStillEligible: async () => true });
    assert.equal(out.examined, 0, "there is nothing pending to promote");
    assert.equal((await walletOf(port, OWNER)).availableCents, 900);
  });

  await check("B15: a reversal refused for insufficient balance still RECORDS its basis", async () => {
    // The cumulative arithmetic is a DELTA against the recorded basis. A refused reversal used to
    // record nothing at all, so the NEXT refund on the same payment under-reversed by exactly the
    // refused event's share — permanently, unless a human replayed it by hand.
    const { port, entries } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "b15", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 900, "9% of $100, spendable at once");

    // The customer spends every credit.
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 90_000, redemptionRef: "b15_spend", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "b15_spend", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 0);

    // Refund #1 of $30 can move nothing — it becomes a DEBT, and its basis must survive.
    const first = await reverseForRefundOrChargeback({ paymentRecordId: "b15", eventRefundedCents: 3000, kind: "refund", externalId: "re_b15_1", ports: port });
    assert.equal(first.ok, true, "the clawback is recorded rather than abandoned");
    assert.equal((first as { reversedCents: number }).reversedCents, 0, "no bucket could cover it");
    assert.equal((first as { recoveryAccruedCents: number }).recoveryAccruedCents, 270, "so 270 is owed");
    const recorded = entries.filter((e) => e.entryType === "refund_reversal" && e.paymentRecordId === "b15");
    assert.equal(recorded.length, 1, "exactly one record for the event");
    assert.equal(
      Number((recorded[0]!.meta as { basis_contribution_cents?: number }).basis_contribution_cents),
      3000,
      "carrying this event's refunded basis, which the next refund's delta is measured against",
    );
    assert.equal((await walletOf(port, OWNER)).recoveryCents, 270, "the debt is on the wallet");

    // A goodwill correction pays the debt down first, then refund #2 arrives.
    await postManualAdjustment({ owner: OWNER, amountCents: 1000, reason: "goodwill", actorAuthUserId: "staff-1", adjustmentRef: "b15_goodwill", ports: port });
    const second = await reverseForRefundOrChargeback({ paymentRecordId: "b15", eventRefundedCents: 3000, kind: "refund", externalId: "re_b15_2", ports: port });
    assert.equal(second.ok, true);
    // $60 of $100 refunded => floor(900 * 6000/10000) = 540 in total. The first event moved
    // nothing, so this one owes the whole 540 — NOT the 270 a lost basis would have produced.
    assert.equal(
      await port.sumReversedForPayment("b15"),
      540,
      "the running position is exact regardless of what the wallet could cover",
    );

    // The three numbers have to add up: what the buckets gave, plus what is still owed, is the
    // whole clawback. A staff goodwill credit is NOT an earning, so it does not repay the debt —
    // only eligible earnings do, which is exactly what the owner decision says.
    const end = await walletOf(port, OWNER);
    assert.equal(end.lifetimeReversedCents, 270, "270 came out of the buckets");
    assert.equal(end.recoveryCents, 270, "270 is still owed");
    assert.equal(end.availableCents, 730, "the goodwill credit stayed spendable");
  });

  await check("B16: one adjustment reference can never be applied to a SECOND wallet", async () => {
    // `adjust:<ref>` carries no wallet and the reference is staff free text, so the same
    // correction code entered for another customer deduplicated against the FIRST customer's
    // entry: success and an amount were reported, the second wallet never moved, and the ledger
    // held one entry on someone else's wallet.
    const { port, entries } = makeStore();
    const a = await postManualAdjustment({ owner: OWNER, amountCents: 5000, reason: "correction", actorAuthUserId: "staff-1", adjustmentRef: "CORRECTION-1", ports: port });
    assert.equal(a.ok, true);
    assert.equal((await walletOf(port, OWNER)).availableCents, 5000);

    const b = await postManualAdjustment({ owner: OTHER_OWNER, amountCents: 5000, reason: "correction", actorAuthUserId: "staff-1", adjustmentRef: "CORRECTION-1", ports: port });
    assert.equal(b.ok, false, "the reuse is refused, not silently deduplicated");
    assert.equal((b as { error: string }).error, "adjustment_reference_belongs_to_another_wallet");
    assert.equal((await walletOf(port, OTHER_OWNER)).availableCents, 0, "and the second wallet is untouched");
    assert.equal(entries.filter((e) => e.entryType === "manual_adjustment").length, 1, "one entry, on one wallet");

    // A genuine REPLAY on the SAME wallet still deduplicates rather than paying twice.
    const replay = await postManualAdjustment({ owner: OWNER, amountCents: 5000, reason: "correction", actorAuthUserId: "staff-1", adjustmentRef: "CORRECTION-1", ports: port });
    assert.equal(replay.ok, true);
    assert.equal((replay as { deduplicated: boolean }).deduplicated, true);
    assert.equal((await walletOf(port, OWNER)).availableCents, 5000, "still paid exactly once");
  });

  await check("H9: a PARTIAL refund promotes the RESIDUAL, not nothing", async () => {
    // THE DEFECT: a partial refund reversed its proportional share and then blocked promotion
    // forever, so the un-refunded remainder sat in `pending` on every sweep, with nothing to
    // expire it and a customer-facing promise that credits do not expire. $399.00 with a $39.90
    // refund left $32.32 permanently unspendable.
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port } = makeStore({ now: () => clock });
    await earnFromSettledPayment({
      owner: OWNER,
      paymentRecordId: "h9",
      facts: settled({ amountPaidCents: 39_900 }),
      sourceKind: "stripe_payment",
      pendingUntilSettlementFinal: true,
      ports: port,
    });
    assert.equal((await walletOf(port, OWNER)).pendingCents, 3591, "9% of $399.00");

    // A 10% refund reverses 10% of the earn.
    const rev = await reverseForRefundOrChargeback({
      paymentRecordId: "h9",
      eventRefundedCents: 3990,
      kind: "refund",
      externalId: "re_h9_1",
      ports: port,
    });
    assert.equal(rev.ok, true);
    const afterRefund = await walletOf(port, OWNER);
    assert.equal(afterRefund.pendingCents, 3591 - 359, "the refunded share is gone");

    clock += 31 * DAY;
    const sweep = await runPendingPromotionSweep({
      nowMs: clock,
      settlementDays: 30,
      limit: 50,
      ports: port,
      isPaymentStillEligible: async () => true,
    });
    assert.equal(sweep.promoted, 1, "the remainder IS promoted");
    assert.equal(sweep.promotedCents, 3232, "and it is the residual, not the original earn");
    const promoted = await walletOf(port, OWNER);
    assert.equal(promoted.availableCents, 3232, "$32.32 is spendable");
    assert.equal(promoted.pendingCents, 0, "nothing is stranded");

    // A FULLY refunded payment still promotes nothing — the residual is zero, not negative.
    const { port: p2 } = makeStore({ now: () => clock });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "h9b", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: p2 });
    await reverseForRefundOrChargeback({ paymentRecordId: "h9b", eventRefundedCents: 10_000, kind: "refund", externalId: "re_h9b", ports: p2 });
    const full = await runPendingPromotionSweep({ nowMs: clock + 31 * DAY, settlementDays: 30, limit: 50, ports: p2, isPaymentStillEligible: async () => true });
    assert.equal(full.promoted, 0, "a fully refunded payment promotes nothing");
    assert.equal((await walletOf(p2, OWNER)).availableCents, 0);
  });

  await check("H8: eligibility is asked of the PAYMENT RECORD and fails closed", () => {
    const src = readFileSync("app/lib/rewards/rewardsFulfillment.ts", "utf8");
    const fn = src.slice(src.indexOf("async function isPaymentStillPromotable"), src.indexOf("export type PromotionSweepReport"));
    assert.ok(fn.includes("leonix_payment_records"), "the payment record is consulted");
    assert.ok(/if \(error \|\| !payment\) return false;/.test(fn), "an unreadable payment fails CLOSED");
    assert.ok(/if \(disputeError\) return false;/.test(fn), "and so does an unreadable ledger");
    assert.ok(fn.includes("chargeback_reversal"), "a dispute on the ledger is part of the question");
    assert.ok(fn.includes("isPaymentPromotableFromFacts({"), "and the DECISION is the pure rule, not a copy of it");

    // THE RULE ITSELF IS ASSERTED BY BEHAVIOUR, in R4. What is left here is the vocabulary it
    // keys on, which lives beside the rule so a status list and a predicate cannot drift apart.
    //
    // A PARTIAL REFUND MUST NOT INVALIDATE THE WHOLE EARN. `recordRefundOnPaymentRecord` sets both
    // `refunded_at` and `payment_status: "refunded"` for a partial refund, so treating either as
    // invalidation froze the un-refunded remainder in `pending` permanently — while the customer
    // is told, in both languages, that their credits do not expire.
    assert.ok(!/if \(row\.refunded_at\) return false;/.test(fn), "a partial refund does not invalidate the payment");
    assert.ok(
      !NON_PROMOTABLE_PAYMENT_STATUSES.includes("refunded"),
      "`refunded` is not an invalidating status",
    );
    for (const status of ["disputed", "failed", "canceled"]) {
      assert.ok(NON_PROMOTABLE_PAYMENT_STATUSES.includes(status), `${status} still invalidates`);
      assert.equal(
        isPaymentPromotableFromFacts({ paymentStatus: status, manualState: null, disputeLedgerRows: [] }),
        false,
        `and the rule actually withholds on ${status}`,
      );
    }
    assert.equal(
      isPaymentPromotableFromFacts({ paymentStatus: "refunded", manualState: null, disputeLedgerRows: [] }),
      true,
      "while a refunded payment's residual still promotes",
    );
  });

  // =========================================================================
  // SECTION I — the 30-minute reservation expiry
  // =========================================================================
  await check("I1: the hold is 30 minutes", () => {
    assert.equal(REDEMPTION_RESERVATION_MINUTES, 30);
  });

  await check("I2: an abandoned hold is released automatically once it expires", async () => {
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const { port } = makeStore({ now: () => t0 });
    await seedAvailable(port, OWNER, 5000, "i2");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 9000, redemptionRef: "i2_ref", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    assert.equal((await walletOf(port, OWNER)).reservedCents, 2000);

    const out = await runReservationExpirySweep({ nowMs: t0 + 31 * 60_000, limit: 50, ports: port });
    assert.equal(out.released, 1);
    assert.equal(out.releasedCents, 2000);
    const w = await walletOf(port, OWNER);
    assert.equal(w.reservedCents, 0);
    assert.equal(w.availableCents, 5000, "the customer has their balance back");
    assert.equal(w.lifetimeRedeemedCents, 0, "nothing was ever spent");
  });

  await check("I3: a hold INSIDE its window is left alone", async () => {
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const { port } = makeStore({ now: () => t0 });
    await seedAvailable(port, OWNER, 5000, "i3");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 9000, redemptionRef: "i3_ref", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    const out = await runReservationExpirySweep({ nowMs: t0 + 29 * 60_000, limit: 50, ports: port });
    assert.equal(out.examined, 0);
    assert.equal((await walletOf(port, OWNER)).reservedCents, 2000);
  });

  await check("I4: the expiry sweep is idempotent and never touches a committed hold", async () => {
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const { port } = makeStore({ now: () => t0 });
    await seedAvailable(port, OWNER, 5000, "i4");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "i4_committed", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "i4_abandoned", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    await commitReservedCredits({ redemptionRef: "i4_committed", ports: port });

    const late = t0 + 31 * 60_000;
    const first = await runReservationExpirySweep({ nowMs: late, limit: 50, ports: port });
    const second = await runReservationExpirySweep({ nowMs: late, limit: 50, ports: port });
    assert.equal(first.released, 1, "only the abandoned hold is released");
    assert.equal(second.released, 0, "and only once");
    const w = await walletOf(port, OWNER);
    assert.equal(w.lifetimeRedeemedCents, 1000, "the committed purchase stands");
    assert.equal(w.availableCents, 4000);
    assert.equal(w.reservedCents, 0);
  });

  // =========================================================================
  // SECTION J — wallet recomputation parity
  // =========================================================================
  await check("J1: recomputation reproduces a full lifecycle exactly", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port, recompute } = makeStore({ now: () => (clock += 1000) });

    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "j_a", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "j_b", facts: settled({ source: "admin_manual", amountPaidCents: 20000 }), sourceKind: "manual_payment", pendingUntilSettlementFinal: false, ports: port });
    await runPendingPromotionSweep({ nowMs: clock + 40 * DAY, settlementDays: 30, limit: 50, ports: port, isPaymentStillEligible: async () => true });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 500, amountDueCents: 9000, redemptionRef: "j_commit", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "j_commit", ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 400, amountDueCents: 9000, redemptionRef: "j_release", contextKind: "stripe_checkout", ports: port });
    await releaseReservedCredits({ redemptionRef: "j_release", ports: port });
    await reverseForRefundOrChargeback({ paymentRecordId: "j_b", eventRefundedCents: 10000, cumulativeRefundedCentsForKind: 10000, kind: "refund", externalId: "j_re", ports: port });
    await postManualAdjustment({ owner: OWNER, amountCents: 250, reason: "goodwill", actorAuthUserId: "s", adjustmentRef: "j_adj", ports: port });

    const incremental = await walletOf(port, OWNER);
    const replayed = recompute(incremental.id);
    assert.deepEqual(
      { p: replayed.pendingCents, a: replayed.availableCents, r: replayed.reservedCents },
      { p: incremental.pendingCents, a: incremental.availableCents, r: incremental.reservedCents },
      "buckets must match",
    );
    assert.deepEqual(
      { e: replayed.lifetimeEarnedCents, d: replayed.lifetimeRedeemedCents, v: replayed.lifetimeReversedCents },
      { e: incremental.lifetimeEarnedCents, d: incremental.lifetimeRedeemedCents, v: incremental.lifetimeReversedCents },
      "lifetime totals must match too",
    );
  });

  await check("J2: parity holds for the PATH-DEPENDENT case an aggregate would get wrong", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port, recompute } = makeStore({ now: () => (clock += 1000) });
    // A wallet holding BOTH pending and available when a reversal lands: the reversal splits
    // across two buckets, and how it splits depends on the balances at that moment.
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "j2_pending", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "j2_avail", facts: settled({ source: "office", amountPaidCents: 50000 }), sourceKind: "manual_payment", pendingUntilSettlementFinal: false, ports: port });
    const mid = await walletOf(port, OWNER);
    assert.equal(mid.pendingCents, 900);
    assert.equal(mid.availableCents, 4500);

    // Reverse the whole CASH payment: 4500 credits, far more than the 900 pending.
    await reverseForRefundOrChargeback({ paymentRecordId: "j2_avail", eventRefundedCents: 50000, cumulativeRefundedCentsForKind: 50000, kind: "refund", externalId: "j2_re", ports: port });
    const after = await walletOf(port, OWNER);
    assert.equal(after.pendingCents, 0, "pending was consumed first");
    assert.equal(after.availableCents, 900, "the remainder came from available");

    const replayed = recompute(after.id);
    assert.equal(replayed.pendingCents, after.pendingCents);
    assert.equal(replayed.availableCents, after.availableCents);
    assert.equal(replayed.lifetimeReversedCents, after.lifetimeReversedCents);
  });

  await check("J3: parity holds after a negative adjustment that crosses buckets", async () => {
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port, recompute } = makeStore({ now: () => (clock += 1000) });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "j3", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    await seedAvailable(port, OWNER, 300, "j3_seed");
    await postManualAdjustment({ owner: OWNER, amountCents: -500, reason: "correction", actorAuthUserId: "s", adjustmentRef: "j3_adj", ports: port });

    const incremental = await walletOf(port, OWNER);
    assert.equal(incremental.availableCents, 0, "available went first");
    assert.equal(incremental.pendingCents, 700, "then pending");
    const replayed = recompute(incremental.id);
    assert.equal(replayed.availableCents, incremental.availableCents);
    assert.equal(replayed.pendingCents, incremental.pendingCents);
    assert.equal(replayed.lifetimeReversedCents, incremental.lifetimeReversedCents);
  });

  await check("J4: the SQL replay and the SQL posting function derive the SAME bucket deltas", () => {
    // WHAT J1-J3 DO AND DO NOT PROVE. They drive the TypeScript mirror of the posting rules both
    // incrementally and as a replay, which proves the REPLAY SHAPE is right — that ordering and
    // the two path-dependent types are handled consistently. They cannot prove the SQL agrees,
    // because no PL/pgSQL runs in this suite. This check closes that gap the only way a test
    // without a database can: by comparing the two SQL CASE blocks to each other, arm by arm.
    const sql = readFileSync(MIGRATION_PATH, "utf8");

    /** Pull `WHEN '<type>' THEN ...` arms out of one function body, normalized for comparison. */
    function armsOf(fnMarker: string, endMarker: string): Map<string, string> {
      const start = sql.indexOf(fnMarker);
      const body = sql.slice(start, sql.indexOf(endMarker, start));
      const caseBlock = body.slice(body.indexOf("CASE"), body.indexOf("END CASE"));
      const arms = new Map<string, string>();
      const parts = caseBlock.split(/\n\s*WHEN /).slice(1);
      for (const part of parts) {
        const head = part.slice(0, part.indexOf("THEN"));
        const types = (head.match(/'(\w+)'/g) ?? []).map((t) => t.replaceAll("'", ""));
        const bodyText = part
          .slice(part.indexOf("THEN") + 4)
          .replace(/--[^\n]*/g, "")
          // The two functions name their accumulators differently (per-entry deltas vs running
          // totals); normalize the NAMES so the ARITHMETIC is what gets compared.
          .replace(/v_(pending|available|reserved)_delta/g, "$1")
          .replace(/v_wallet\.(pending|available|reserved)_cents/g, "$1")
          .replace(/v_(pending|available|reserved)\b/g, "$1")
          .replace(/p_amount_cents|v_entry\.amount_cents/g, "AMT")
          .replace(/v_earned_delta|v_earned/g, "EARNED")
          .replace(/v_redeemed_delta|v_redeemed/g, "REDEEMED")
          .replace(/v_reversed_delta|v_reversed/g, "REVERSED")
          .replace(/v_draw|v_take/g, "DRAW")
          // Recovery and restoration, normalized the same way. These were missing entirely, which
          // is why the one check built to compare the two CASE blocks could not see that the
          // replay skipped the debt the posting arm accrued.
          .replace(/v_recovery_accrued_delta|v_recovery_accrued/g, "RECOVERY_ACCRUED")
          .replace(/v_recovery_offset_delta|v_recovery_offset/g, "RECOVERY_OFFSET")
          .replace(/v_restored_delta|v_restored/g, "RESTORED")
          // The refusal guard reads `v_wallet.recovery_cents`; that is a CONDITION, not a
          // movement, so it is renamed apart from the delta it guards. Comparing the two would
          // report a false disagreement on every arm that merely checks the debt before acting.
          .replace(/v_wallet\.recovery_cents/g, "RECOVERY_READ")
          .replace(/v_recovery_delta|v_recovery\b/g, "RECOVERY")
          .replace(/\s+/g, " ")
          .trim();
        for (const t of types) arms.set(t, bodyText);
      }
      return arms;
    }

    const postArms = armsOf(
      "FUNCTION public.leonix_rewards_post_entry",
      "COMMENT ON FUNCTION public.leonix_rewards_post_entry",
    );
    const replayArms = armsOf(
      "FUNCTION public.leonix_rewards_recompute_wallet",
      "COMMENT ON FUNCTION public.leonix_rewards_recompute_wallet",
    );

    // THE COMPARATOR'S OWN COVERAGE IS PINNED. This check only speaks when the two arms disagree,
    // so narrowing its field list is silent — and narrowing it is exactly what let the replay skip
    // the recovery deltas and erase a real debt. The list is asserted here so it cannot shrink.
    const comparatorSource = readFileSync("scripts/verify-ix-rewards-behavior-01.ts", "utf8");
    const j4 = comparatorSource.slice(
      comparatorSource.indexOf('await check("J4:'),
      comparatorSource.indexOf('await check("J5:'),
    );
    // Scoped to the LIST ITSELF, not to J4 at large: an assertion that names the fields it is
    // checking for would otherwise match its own text and pass after the list was emptied.
    // Anchored on the multi-line form in the WHOLE file, which only the real loop has: the flat
    // string would match this very expression, and the J4 slice above does not reach the loop.
    const bucketListAt = comparatorSource.indexOf("for (const bucket of [\n");
    assert.ok(bucketListAt > 0, "the arm comparator uses an explicit field list");
    const bucketList = comparatorSource.slice(bucketListAt, comparatorSource.indexOf("]", bucketListAt));
    for (const field of ["RECOVERY", "RECOVERY_ACCRUED", "RECOVERY_OFFSET", "RESTORED", "REVERSED", "EARNED", "REDEEMED"]) {
      assert.ok(
        new RegExp(`"${field}"`).test(bucketList),
        `J4's comparison list must include ${field} — every money field the two CASE blocks touch`,
      );
    }
    for (const rename of ["RECOVERY_READ", "v_recovery_delta"]) {
      assert.ok(j4.includes(rename), `J4 keeps the guard/delta distinction (${rename})`);
    }

    assert.ok(postArms.size >= 9, `the posting CASE was parsed (${postArms.size} arms)`);
    assert.ok(replayArms.size >= 9, `the replay CASE was parsed (${replayArms.size} arms)`);

    // Every type the posting function moves must be replayed, and every bucket it touches must be
    // touched by the replay too. The posting function additionally REFUSES movements that the
    // replay only has to reproduce, so its arm may be the longer of the two.
    for (const [type, postBody] of postArms) {
      const replayBody = replayArms.get(type);
      assert.ok(replayBody !== undefined, `the replay must handle ${type}`);
      // RECOVERY IS IN THIS LIST NOW. It was the one field where the two CASE blocks actually
      // disagreed — the replay skipped it entirely and erased a real debt — and the check written
      // to compare them arm by arm could not see it, because the list stopped at the buckets.
      for (const bucket of [
        "pending", "available", "reserved", "EARNED", "REDEEMED", "REVERSED",
        "RECOVERY", "RECOVERY_ACCRUED", "RECOVERY_OFFSET", "RESTORED",
      ]) {
        const re = new RegExp(`\\b${bucket}\\b`);
        assert.equal(
          re.test(replayBody!),
          re.test(postBody),
          `${type}: posting and replay disagree about whether ${bucket} moves`,
        );

        // AND THE ARITHMETIC ITSELF, not merely that the name appears.
        //
        // Presence alone cannot see a wrong sign or a wrong operand. An adversarial review proved
        // it: changing the replay's `earn_pending` arm from `v_pending + (AMT - v_offset)` to
        // `v_pending + AMT` left every check green while one recompute call credited the full
        // earn AND discharged the debt — 500 cents created. The assigned EXPRESSION is compared,
        // after normalizing the two functions' different shapes for "add this to the bucket".
        const rhsOf = (body: string): string | null => {
          // posting: `bucket := EXPR;`   replay: `bucket := bucket + EXPR;` / `bucket := bucket - EXPR;`
          const m = new RegExp(`\\b${bucket} := ([^;]+);`).exec(body);
          if (!m) return null;
          return m[1]!
            .replace(new RegExp(`^${bucket} \\+ `), "")
            .replace(new RegExp(`^${bucket} - `), "-")
            .replace(/\s+/g, " ")
            .trim()
            // The replay parenthesizes what it adds; the posting function does not. Same
            // arithmetic, different shape, so the wrapper is stripped before comparing.
            .replace(/^\((.*)\)$/, "$1")
            .trim();
        };
        const postRhs = rhsOf(postBody);
        const replayRhs = rhsOf(replayBody!);
        if (postRhs !== null && replayRhs !== null) {
          assert.equal(
            replayRhs,
            postRhs,
            `${type}: posting assigns ${bucket} = "${postRhs}" but the replay assigns "${replayRhs}"`,
          );
        }
      }
      // The pending-first / available-first branch must be present in BOTH wherever it is in either.
      const branchRe = /IF [^;]*>= (AMT|DRAW) THEN/;
      assert.equal(
        branchRe.test(replayBody!),
        branchRe.test(postBody),
        `${type}: the path-dependent branch must be present in both`,
      );
    }
  });

  await check("J5: the SQL recomputation is a REPLAY, not an aggregate", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const fn = sql.slice(sql.indexOf("FUNCTION public.leonix_rewards_recompute_wallet"));
    // CANONICAL ORDER. `created_at` is transaction START time, so under concurrency it is not a
    // total order and a replay using it alone can reconstruct a state that never existed — and
    // then refuse a ledger that is in fact consistent. `entry_seq` is drawn inside the wallet
    // lock, so it IS the serialization order; the timestamp survives only as a tie-break for rows
    // written before the sequence existed.
    assert.ok(
      /FOR v_entry IN[\s\S]{0,600}ORDER BY entry_seq ASC NULLS FIRST, created_at ASC, id ASC/.test(fn),
      "entries are replayed in canonical sequence order",
    );
    assert.ok(
      /nextval\('public\.leonix_rewards_ledger_seq'\)/.test(sql),
      "and that sequence is assigned by the posting function",
    );
    assert.ok(/LOOP[\s\S]*?END LOOP/.test(fn), "there is an actual loop");
    assert.ok(/lifetime_earned_cents = v_earned/.test(fn), "lifetime totals are rebuilt, not left stale");
    assert.ok(/lifetime_redeemed_cents = v_redeemed/.test(fn));
    assert.ok(/lifetime_reversed_cents = v_reversed/.test(fn));
    assert.ok(/replays to a negative bucket/.test(fn), "an inconsistent ledger is refused, not clamped");
    // Both path-dependent orders must be present in the replay.
    assert.ok(/IF v_pending >= v_cover THEN/.test(fn), "reversal replays pending-first");
    assert.ok(/recovery_cents = v_recovery/.test(fn), "the recovery balance is rebuilt too");
    assert.ok(/lifetime_restored_cents = v_restored/.test(fn), "and so is what a won dispute gave back");
    assert.ok(/IF v_available >= v_take THEN/.test(fn), "negative adjustment replays available-first");
  });

  // =========================================================================
  // SECTION K — CSV reconciliation
  // =========================================================================
  const CSV_HEADER = CSV_REQUIRED_HEADERS.join(",");
  const UUID_A = "11111111-1111-4111-8111-111111111111";
  const UUID_B = "22222222-2222-4222-8222-222222222222";

  await check("K1: the header must be exact", () => {
    const wrong = parseRewardsCsv({ content: "reference,amount_cents\r\nabc,100" });
    assert.equal(wrong.ok, false);
    assert.equal((wrong as { code: string }).code, "bad_header");
    assert.equal(parseRewardsCsv({ content: `${CSV_HEADER}\r\n` }).ok, true);
  });

  await check("K2: a valid row parses and derives its own idempotency key", () => {
    const res = parseRewardsCsv({
      content: `${CSV_HEADER}\r\n,${UUID_A},,500,manual_adjustment,BATCH-1-ROW-1,office reconciliation`,
    }) as ParsedCsvOk;
    assert.equal(res.ok, true);
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0]!.amountCents, 500);
    assert.equal(res.rows[0]!.businessId, UUID_A);
    assert.equal(res.rows[0]!.idempotencyKey, csvRowIdempotencyKey("BATCH-1-ROW-1"));
    assert.equal(res.rejections.length, 0);
  });

  await check("K3: formula content is REFUSED, never silently rewritten", () => {
    for (const evil of ["=cmd|'/c calc'!A1", "+1+1", "-2+3", "@SUM(A1)"]) {
      assert.ok(looksLikeFormula(evil), `${evil} must be recognized`);
      const res = parseRewardsCsv({
        content: `${CSV_HEADER}\r\n,${UUID_A},,500,manual_adjustment,REF-OK-1,${evil}`,
      }) as ParsedCsvOk;
      assert.equal(res.rows.length, 0, `${evil} must not be accepted`);
      assert.equal(res.rejections[0]!.code, "formula_content");
    }
  });

  await check("K4: an export neutralizes every cell it writes", () => {
    const csv = toReconciliationCsv([
      { reference: "=1+1", lineNumber: 2, kind: "manual_adjustment", amountCents: 100, outcome: "applied", movedCents: 100, walletId: null, detail: "@evil" },
    ]);
    const body = csv.split("\r\n")[1]!;
    assert.ok(body.includes("'=1+1"), `reference must be neutralized: ${body}`);
    assert.ok(body.includes("'@evil"), "detail must be neutralized too");
    assert.equal(csvCell("=2+2"), "'=2+2");
    assert.equal(csvCell("plain"), "plain");
    assert.equal(csvCell("has,comma"), '"has,comma"');
  });

  await check("K5: bad rows are rejected WITH reasons, and good rows still survive", () => {
    const content = [
      CSV_HEADER,
      `,${UUID_A},,500,manual_adjustment,GOOD-1,fine`,
      `,not-a-uuid,,500,manual_adjustment,BAD-1,bad uuid`,
      `,${UUID_A},,abc,manual_adjustment,BAD-2,bad amount`,
      `,${UUID_A},,500,teleport,BAD-3,bad kind`,
      `,,,500,manual_adjustment,BAD-4,no target`,
      `,${UUID_A},${UUID_B},500,manual_adjustment,BAD-5,two targets`,
      `,${UUID_A},,500,manual_adjustment,x,reference too short`,
      `,${UUID_A},,500,manual_adjustment,GOOD-2,`,
      `,${UUID_A},,500,manual_adjustment,GOOD-3,also fine`,
    ].join("\r\n");
    const res = parseRewardsCsv({ content }) as ParsedCsvOk;
    assert.deepEqual(res.rows.map((r) => r.reference), ["GOOD-1", "GOOD-3"]);
    const codes = res.rejections.map((r) => r.code);
    for (const expected of ["invalid_uuid", "invalid_amount", "invalid_kind", "no_target", "ambiguous_target", "invalid_reference", "invalid_reason"]) {
      assert.ok(codes.includes(expected), `expected a ${expected} rejection, got ${codes.join(",")}`);
    }
    // Every rejection names its line, so an operator can find it.
    for (const r of res.rejections) assert.ok(r.lineNumber >= 2, "rejections carry a line number");
  });

  await check("K6: a repeated reference inside one file is a rejection, not a silent drop", () => {
    const content = [
      CSV_HEADER,
      `,${UUID_A},,500,manual_adjustment,SAME-REF,first`,
      `,${UUID_A},,700,manual_adjustment,SAME-REF,second`,
    ].join("\r\n");
    const res = parseRewardsCsv({ content }) as ParsedCsvOk;
    assert.equal(res.rows.length, 1, "only the first is accepted");
    assert.deepEqual(res.duplicateReferences, ["SAME-REF"]);
    assert.equal(res.rejections[0]!.code, "duplicate_reference_in_file");
  });

  await check("K7: an earn_adjustment must name its payment and may not be negative", () => {
    const noPayment = parseRewardsCsv({ content: `${CSV_HEADER}\r\n,${UUID_A},,500,earn_adjustment,E-1,missing payment` }) as ParsedCsvOk;
    assert.equal(noPayment.rejections[0]!.code, "earn_needs_payment");
    const negative = parseRewardsCsv({ content: `${CSV_HEADER}\r\n${UUID_B},,,-500,earn_adjustment,E-2,negative earn` }) as ParsedCsvOk;
    assert.equal(negative.rejections[0]!.code, "invalid_amount");
  });

  await check("K8: the batch fingerprint changes when the batch changes", () => {
    const row = (businessId: string, amount: number) =>
      `${CSV_HEADER}\r\n,${businessId},,${amount},manual_adjustment,FP-0001,reconciliation note`;
    const a = parseRewardsCsv({ content: row(UUID_A, 500) }) as ParsedCsvOk;
    const same = parseRewardsCsv({ content: row(UUID_A, 500) }) as ParsedCsvOk;
    const amountChanged = parseRewardsCsv({ content: row(UUID_A, 600) }) as ParsedCsvOk;
    const targetChanged = parseRewardsCsv({ content: row(UUID_B, 500) }) as ParsedCsvOk;

    // Guard the fixture itself: a fingerprint comparison over two EMPTY batches would pass
    // vacuously, so assert the rows were actually accepted before comparing.
    assert.equal(a.rows.length, 1, `the fixture must parse: ${JSON.stringify(a.rejections)}`);
    assert.equal(amountChanged.rows.length, 1);
    assert.equal(targetChanged.rows.length, 1);

    assert.equal(a.batchFingerprint, same.batchFingerprint, "the same batch fingerprints identically");
    assert.notEqual(a.batchFingerprint, amountChanged.batchFingerprint, "a changed AMOUNT is detected");
    assert.notEqual(a.batchFingerprint, targetChanged.batchFingerprint, "a changed TARGET is detected");
    assert.ok(fingerprintRows([]).startsWith("0-"), "an empty batch fingerprints as zero rows");
  });

  await check("K9: an imported row moves money ONCE, however many times it is imported", async () => {
    const { port } = makeStore();
    const res = parseRewardsCsv({ content: `${CSV_HEADER}\r\n,${UUID_A},,500,manual_adjustment,IMPORT-1,reconciliation` }) as ParsedCsvOk;
    const row = res.rows[0]!;
    const owner: WalletOwnerRef = { kind: "business", businessId: row.businessId! };

    const first = await postManualAdjustment({ owner, amountCents: row.amountCents, reason: row.reason, actorAuthUserId: "staff", adjustmentRef: row.idempotencyKey, ports: port });
    const second = await postManualAdjustment({ owner, amountCents: row.amountCents, reason: row.reason, actorAuthUserId: "staff", adjustmentRef: row.idempotencyKey, ports: port });
    assert.equal((first as { deduplicated: boolean }).deduplicated, false);
    assert.equal((second as { deduplicated: boolean }).deduplicated, true, "the re-import is recognized");
    assert.equal((await walletOf(port, owner)).availableCents, 500, "the money moved once");
  });

  await check("K10: the file is bounded in size and row count", () => {
    const huge = `${CSV_HEADER}\r\n` + Array.from({ length: CSV_MAX_ROWS + 1 }, (_, i) => `,${UUID_A},,500,manual_adjustment,R-${i},x`).join("\r\n");
    const res = parseRewardsCsv({ content: huge });
    assert.equal(res.ok, false);
    assert.equal((res as { code: string }).code, "too_many_rows");
    const tooBig = parseRewardsCsv({ content: `${CSV_HEADER}\r\n`, byteLength: 99_000_000 });
    assert.equal(tooBig.ok, false);
    assert.equal((tooBig as { code: string }).code, "file_too_large");
  });

  await check("K11: quoted fields parse per RFC4180", () => {
    assert.deepEqual(splitCsvLine('a,"b,c",d'), ["a", "b,c", "d"]);
    assert.deepEqual(splitCsvLine('a,"say ""hi""",c'), ["a", 'say "hi"', "c"]);
    assert.deepEqual(splitCsvLine("a,,c"), ["a", "", "c"]);
  });

  await check("K12: the route commits only the previewed batch, and never mutates on preview", () => {
    const src = readFileSync("app/api/admin/rewards/reconciliation/route.ts", "utf8");
    assert.ok(src.includes("requireRevenueProtectedWriteAccess"), "staff-only, including preview");
    assert.ok(src.includes("batch_fingerprint_mismatch"), "a changed file cannot be committed");
    assert.ok(/mode === "preview"/.test(src), "preview is a distinct mode");
    // Preview must not reach the posting function at all.
    const previewBlock = src.slice(src.indexOf('if (mode === "preview")'), src.indexOf("// COMMIT —"));
    assert.ok(previewBlock.length > 0, "the preview block was located");
    assert.ok(!previewBlock.includes("postManualAdjustment("), "preview writes nothing");
    assert.ok(src.includes("reportCsv"), "the commit returns a downloadable report");
    assert.ok(src.includes("rejections"), "rejected rows travel with every result");
    assert.ok(src.includes("actor_auth_user_id: access.actorAuthUserId"), "the batch is attributed to the staff member");
  });

  await check("K13: an imported row's actor comes from the gate, never from the file", () => {
    const src = readFileSync("app/api/admin/rewards/reconciliation/route.ts", "utf8");
    assert.ok(/actorAuthUserId: access\.actorAuthUserId/.test(src), "the actor is the authenticated staff member");
    assert.ok(!/actorAuthUserId: row\./.test(src), "never a value carried in the file");
    // No secret or payment credential is part of the schema at all.
    for (const forbidden of ["card_number", "cvv", "stripe_secret", "api_key", "password"]) {
      assert.ok(!CSV_REQUIRED_HEADERS.includes(forbidden as never), `${forbidden} must not be an importable column`);
    }
  });

  // =========================================================================
  // SECTION L — authorization, isolation, injection refusal
  // =========================================================================
  await check("L1: the staff rewards GET AUTHENTICATES before it authorizes", () => {
    const src = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    // Comments EXPLAIN the order; they do not establish it. Strip them, so this check measures
    // the code and cannot be satisfied by prose that merely mentions the right function names.
    const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const getBlock = stripComments(src.slice(src.indexOf("export async function GET")));

    // THE DEFECT THIS EXISTS FOR: `getCurrentAdminAccessContext()` never returns null, and with
    // NO admin cookie it returns `normalizedRole: "owner_admin"` so unauthenticated navigation can
    // render. `hasPaymentTrackerAccess()` grants owner_admin unconditionally, and middleware gates
    // `/admin` but not `/api/admin`. Checking only the context therefore authorized a request
    // carrying no cookies at all to read any customer's balance and ledger.
    assert.ok(getBlock.includes("requireAdminCookie"), "the GET checks the admin cookie");
    assertOrder(
      getBlock,
      "requireAdminCookie",
      "getCurrentAdminAccessContext",
      "the cookie check must precede the context read",
    );
    assert.ok(
      true,
      "and checks it BEFORE reading the access context, like the payment-tracker page does",
    );
    assert.ok(getBlock.includes("hasPaymentTrackerAccess"), "then requires payment-tracker READ authority");
    assert.ok(getBlock.includes("ctx.hasAdminCookie"), "and re-asserts the cookie on the resolved context");
    // The dead `!ctx` branch is gone: it could never be true and it read like a guard.
    assert.ok(!/if \(!ctx \|\|/.test(getBlock), "no dead `!ctx` branch masquerading as a check");

    // The page this route claims parity with does exactly these two steps, in this order.
    const page = stripComments(readFileSync("app/admin/(dashboard)/workspace/payment-tracker/page.tsx", "utf8"));
    assert.ok(page.includes("requireAdminCookie("), "the payment tracker page checks the cookie");
    // Compare CALL SITES, not import lines — an import block orders names alphabetically, not by
    // execution, and comparing those positions would measure nothing.
    assertOrder(
      page,
      "requireAdminCookie(",
      "getCurrentAdminAccessContext(",
      "the page authenticates before it resolves a context",
    );
    assert.ok(
      true,
      "in the same order",
    );

    assert.ok(src.includes("requireRevenueProtectedWriteAccess"), "every WRITE stays on the money-write gate");
  });

  await check("L1b: an admin-context default can never BE the authentication", () => {
    // Proof that the shape above matters: the resolver really does hand back owner_admin with no
    // cookie, so any route that treats the context alone as authentication is open.
    const acl = readFileSync("app/admin/_lib/adminAccessControl.ts", "utf8");
    assert.ok(
      /if \(!hasAdminCookie\) \{[\s\S]{0,200}normalizedRole: "owner_admin"/.test(acl),
      "the no-cookie context is owner_admin, which is why the cookie check is the real gate",
    );
    assert.ok(
      /export function hasPaymentTrackerAccess[\s\S]{0,200}isOwnerAdminRole\(ctx\.normalizedRole\)\) return true/.test(acl),
      "and owner_admin passes the payment-tracker check unconditionally",
    );
  });

  await check("L2: the staff API never returns actor identity or internal meta to the browser", () => {
    const src = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    const getBlock = src.slice(src.indexOf("export async function GET"));
    const select = getBlock.match(/\.select\("([^"]*entry_type[^"]*)"\)/)?.[1] ?? "";
    assert.ok(select.length > 0, "the ledger select was found");
    assert.ok(!select.includes("actor_auth_user_id"), `actor identity must not be selected: ${select}`);
    assert.ok(!/\bmeta\b/.test(select), `internal meta must not be selected: ${select}`);
  });

  await check("L3: the customer wallet route resolves identity from the TOKEN, never a parameter", () => {
    const src = readFileSync("app/api/rewards/wallet/route.ts", "utf8");
    assert.ok(src.includes("getBearerUserId"), "identity comes from the bearer token");
    assert.ok(!/searchParams\.get\("(walletId|businessId|ownerUserId)"\)/.test(src), "no wallet is addressable by a request parameter");
    assert.ok(/resolveWalletOwnerForUser\(userId\)/.test(src), "the wallet is resolved from the authenticated user");
    assert.ok(src.includes("auth_required"), "an unauthenticated read is refused");
  });

  await check("L4: a crafted search term cannot inject a PostgREST filter — RUN, not read", () => {
    // The previous version of this check asserted that the sanitizer's SOURCE TEXT contained the
    // characters "(", ")", "," and "." — which is true of every JavaScript function ever written,
    // because `(raw: string)`, `.trim()` and `.slice(0, 60)` all contain them. It would have
    // passed against a sanitizer that replaced nothing. The rule is now EXERCISED.
    const attacks: Array<[string, string]> = [
      ["a,status.eq.deleted", "a comma adds a condition of the caller's choosing"],
      ["a),or=(id.gte.0", "a paren closes the group early"],
      ["a.ilike.%", "a dot forms an operator"],
      ["Bob's Autos", "an apostrophe"],
      ["100%", "a LIKE wildcard"],
      ["a_b", "the single-character LIKE wildcard"],
      ['a"b', "a quote"],
      ["a\\b", "a backslash"],
      ["a*b", "the PostgREST like-star"],
      ["a\nstatus.eq.deleted", "a newline"],
    ];
    for (const [term, why] of attacks) {
      const cleaned = sanitizeSearchTerm(term);
      if (cleaned === null) continue; // refused outright is also correct
      for (const ch of ["(", ")", ",", ".", "%", "_", "*", '"', "'", "\\", "\n", "\r"]) {
        assert.ok(!cleaned.includes(ch), `${why}: ${JSON.stringify(term)} -> ${JSON.stringify(cleaned)} still has ${JSON.stringify(ch)}`);
      }
    }
    // A term that sanitizes away entirely is refused, not searched as "%%" (which matches all).
    assert.equal(sanitizeSearchTerm(",,,"), null);
    assert.equal(sanitizeSearchTerm("%"), null);
    assert.equal(sanitizeSearchTerm("a"), null, "below the minimum length");
    // A legitimate name survives intact enough to be useful.
    assert.equal(sanitizeSearchTerm("Taqueria El Sol"), "Taqueria El Sol");
    // Bounded.
    assert.ok((sanitizeSearchTerm("x".repeat(500)) ?? "").length <= 60);

    const src = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    const or = src.match(/\.or\(`([^`]*)`\)/)?.[1] ?? "";
    assert.ok(or.includes("${q}"), "the sanitized value is what gets interpolated");
    assert.ok(!or.includes("${raw}"), "the raw term never reaches the filter");
    assert.ok(src.includes("query_unusable"), "a term that sanitizes to nothing is refused");
  });

  await check("L5: a wallet target must be a canonical uuid — RUN, not read", () => {
    assert.equal(isUuid("11111111-1111-4111-8111-111111111111"), true);
    for (const bad of [
      "",
      "not-a-uuid",
      "11111111-1111-4111-8111-11111111111",
      "11111111111141118111111111111111",
      "11111111-1111-4111-8111-111111111111 or 1=1",
      "'; drop table x; --",
    ]) {
      assert.equal(isUuid(bad), false, `${JSON.stringify(bad)} must not pass as a uuid`);
    }
    const src = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    const ownerFn = src.slice(src.indexOf("function ownerFromBody"), src.indexOf("export function sanitizeSearchTerm"));
    assert.ok(/isUuid\(businessId\)/.test(ownerFn), "a business target is checked");
    assert.ok(/isUuid\(ownerUserId\)/.test(ownerFn), "a user target is checked");
    assert.ok(src.includes("businessId_invalid"), "the GET refuses a malformed id");
  });

  await check("L6: the scheduler fails CLOSED when its secret is not configured", () => {
    const src = readFileSync("app/api/revenue-os/admin/rewards-sweep/route.ts", "utf8");
    assert.ok(src.includes("timingSafeEqual"), "constant-time comparison");
    const machine = src.slice(src.indexOf("function machineKeyAuthorized"), src.indexOf("function vercelCronAuthorized"));
    const cron = src.slice(src.indexOf("function vercelCronAuthorized"), src.indexOf("async function runRewardsSweeps"));
    for (const [name, block] of [["machineKey", machine], ["vercelCron", cron]] as const) {
      assert.ok(/if \(!configured\) return false;/.test(block), `${name} must fail closed with no secret`);
    }
    assert.ok(src.includes("CRON_SECRET"), "the Vercel Cron convention is used");
    const getBlock = src.slice(src.indexOf("export async function GET"));
    assert.ok(getBlock.includes("vercelCronAuthorized"), "GET is cron-authorized");
    assert.ok(!getBlock.includes("machineKeyAuthorized"), "GET does not accept the machine key");
    assert.ok(!getBlock.includes("requireRevenueProtectedWriteAccess"), "GET does not accept a staff session either");
  });

  await check("L7: the scheduler is authored as configuration, not activated here", () => {
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as { crons: { path: string; schedule: string }[] };
    const entry = vercel.crons.find((c) => c.path === "/api/revenue-os/admin/rewards-sweep");
    assert.ok(entry, "the cron entry exists in configuration");
    assert.ok(typeof entry!.schedule === "string" && entry!.schedule.length > 0, "with a schedule");
  });

  await check("L8: no rewards module reaches live Stripe", () => {
    for (const file of [
      "app/lib/rewards/rewardsPolicy.ts",
      "app/lib/rewards/rewardsLedgerCore.ts",
      "app/lib/rewards/rewardsLedger.ts",
      "app/lib/rewards/rewardsFulfillment.ts",
      "app/lib/rewards/rewardsCheckoutRedemption.ts",
      "app/lib/rewards/rewardsCsvReconciliation.ts",
      "app/api/revenue-os/admin/rewards-sweep/route.ts",
      "app/api/admin/rewards/reconciliation/route.ts",
    ]) {
      const src = readFileSync(file, "utf8");
      assert.ok(!/from ["']stripe["']|new Stripe\(|STRIPE_SECRET_KEY/.test(src), `${file} must not touch Stripe`);
    }
  });

  // =========================================================================
  // SECTION M — no expiration at launch, and honest surfaces
  // =========================================================================
  await check("M1: launch policy has NO credit expiration", () => {
    assert.equal(CREDITS_EXPIRE_AT_LAUNCH, false);
  });

  await check("M2: nothing in the application emits an expiry entry", () => {
    for (const file of [
      "app/lib/rewards/rewardsLedgerCore.ts",
      "app/lib/rewards/rewardsFulfillment.ts",
      "app/lib/rewards/rewardsCheckoutRedemption.ts",
      "app/api/admin/rewards/route.ts",
      "app/api/admin/rewards/reconciliation/route.ts",
      "app/api/revenue-os/admin/rewards-sweep/route.ts",
    ]) {
      const src = readFileSync(file, "utf8");
      assert.ok(
        !/entryType:\s*["']expire["']/.test(src),
        `${file} must not post an 'expire' entry — no launch policy enables expiry`,
      );
    }
  });

  await check("M3: customer copy states credits do NOT expire", () => {
    const rulesEs = redemptionRulesCopy("es");
    const rulesEn = redemptionRulesCopy("en");
    assert.ok(/no vencen/i.test(rulesEs), `ES copy states credits do not expire: ${rulesEs}`);
    assert.ok(/do not expire/i.test(rulesEn), `EN copy states credits do not expire: ${rulesEn}`);
    assert.ok(rulesEs.includes("$1.00") && rulesEn.includes("$1.00"), "the minimum is stated in both");
    assert.ok(/50%|mitad|half/i.test(rulesEs + rulesEn), "the ceiling is stated in both");
  });

  await check("M4: the wallet panel is actually MOUNTED in the owner dashboard", () => {
    const dashboard = readFileSync("app/(site)/dashboard/page.tsx", "utf8");
    assert.ok(dashboard.includes("LeonixCreditsPanel"), "the panel is imported");
    assert.ok(/<LeonixCreditsPanel\s/.test(dashboard), "and rendered");
  });

  await check("M5: the panel shows only capabilities that exist", () => {
    const panel = readFileSync("app/(site)/dashboard/components/LeonixCreditsPanel.tsx", "utf8");
    assert.ok(panel.includes("reservedDisplay"), "reserved is shown as a real figure");
    assert.ok(panel.includes("lifetimeRedeemedDisplay") && panel.includes("lifetimeReversedDisplay"), "lifetime totals are shown");
    assert.ok(panel.includes("pendingAvailableOn"), "the pending availability date is shown when known");
    // A dashboard redeem button would be a control that cannot perform its action.
    assert.ok(!/<button[\s\S]{0,200}(Redeem|Canjear|Usar créditos)/i.test(panel), "no dashboard redeem control that cannot spend");
    // Loading, error and empty states must all be present.
    assert.ok(panel.includes('state === "loading"'), "a loading state");
    assert.ok(panel.includes('state === "error"'), "an error state");
    assert.ok(/activity\.length === 0/.test(panel), "an empty state");
  });

  await check("M6: the wallet API reports every bucket the panel claims to show", () => {
    const src = readFileSync("app/api/rewards/wallet/route.ts", "utf8");
    for (const field of [
      "availableCents", "pendingCents", "reservedCents",
      "lifetimeEarnedCents", "lifetimeRedeemedCents", "lifetimeReversedCents",
      "pendingAvailableOn",
    ]) {
      assert.ok(src.includes(field), `the API must return ${field}`);
    }
    assert.ok(src.includes("CREDITS_EXPIRE_AT_LAUNCH"), "the expiry policy is reported, not guessed at by the panel");
    assert.ok(src.includes("CARD_SETTLEMENT_PENDING_DAYS"), "the availability date uses the one settlement constant");
  });

  // =========================================================================
  // SECTION N — regressions found by adversarial review, each fixed and pinned
  // =========================================================================
  await check("N1: credits are subtracted from the earn base ONCE, not twice", () => {
    // A $100 purchase half-funded by credits: Stripe charges $50, and the record stores $50 as
    // its total because the webhook's amount guard compares Stripe's figure against it. Subtracting
    // the $50 of credits AGAIN gave an earn base of zero — the customer earned nothing on $50 of
    // real money. The flag says the netting already happened.
    const net = earnBaseFromPaymentMetadata({
      amountPaidCents: 5000,
      metadata: { leonix_credits_applied_cents: 5000, leonix_amount_is_net_of_credits: true },
    });
    assert.equal(net.amountPaidCents, 5000);
    assert.equal(net.creditsAppliedCents, 0, "already net: nothing left to subtract");
    assert.equal(assessEarn(settled({ ...net, source: "stripe" })).earnCents, 450, "9% of the real $50");

    // A record whose total is GROSS still has the credits subtracted.
    const gross = earnBaseFromPaymentMetadata({
      amountPaidCents: 10000,
      metadata: { leonix_credits_applied_cents: 4000 },
    });
    assert.equal(gross.creditsAppliedCents, 4000);
    assert.equal(assessEarn(settled({ ...gross, source: "stripe" })).earnCents, 540, "9% of the real $60");

    // The checkout writer sets the flag, so the two cannot drift apart.
    const writer = readFileSync("app/lib/listingPlans/revenuePaymentRecords.ts", "utf8");
    assert.ok(writer.includes("leonix_amount_is_net_of_credits: true"), "the netting writer records that it netted");
    for (const f of ["app/lib/listingPlans/revenueFulfillment.ts", "app/lib/listingPlans/manualClearedPayments.ts"]) {
      assert.ok(readFileSync(f, "utf8").includes("earnBaseFromPaymentMetadata"), `${f} uses the shared base`);
    }
  });

  await check("N2: a subscription's FIRST invoice does not earn a second time", () => {
    // `checkout.session.completed` and `invoice.paid` both fire for a signup, against DIFFERENT
    // payment records — the checkout record carries no stripe_invoice_id, so the unique index
    // cannot collapse them. Awarding on both earned 9% twice on one payment, every signup.
    //
    // EXECUTABLE TRUTH TABLE against the real decision function, not a source-string match: an
    // inverted or loosened comparison changes an answer below and fails this check.
    const decide = (billingReason: string | null | undefined, amountPaidCents = 5000, paymentRecordId: string | null = "pay_1") =>
      decideInvoiceRenewalEarn({ paymentRecordId, billingReason, amountPaidCents });

    const signup = decide("subscription_create");
    assert.equal(signup.earn, false, "the signup invoice earns NOTHING here — checkout already awarded it");
    assert.equal(signup.reason, "signup_invoice_earned_at_checkout");
    assert.equal(signup.audit, false, "and that is not a gap worth auditing");

    for (const renewal of ["subscription_cycle", "subscription_update", "manual", "upcoming"]) {
      const d = decide(renewal);
      assert.equal(d.earn, true, `${renewal} is money the checkout path never saw, so it earns`);
      assert.equal(d.reason, "eligible_renewal");
    }

    // FAIL CLOSED: an absent signal is not evidence of a renewal.
    for (const absent of [null, undefined, "", "   "]) {
      const d = decide(absent);
      assert.equal(d.earn, false, `billing_reason ${JSON.stringify(absent)} must NOT award`);
      assert.equal(d.reason, "invoice_billing_reason_unknown");
      assert.equal(d.audit, true, "and the skip is audited as a visible, retryable gap");
    }

    // No money and no record earn nothing, and are not reported as gaps.
    for (const [amount, reason] of [[0, "no_amount_paid"], [-100, "no_amount_paid"]] as const) {
      const d = decide("subscription_cycle", amount);
      assert.equal(d.earn, false, `amount_paid ${amount} earns nothing`);
      assert.equal(d.reason, reason);
      assert.equal(d.audit, false);
    }
    for (const missing of [null, "", "   "]) {
      const d = decide("subscription_cycle", 5000, missing);
      assert.equal(d.earn, false, "no payment record, no earn");
      assert.equal(d.reason, "no_payment_record");
    }

    // WIRING: the webhook handler must actually route through that decision, and must have no
    // second, ungated award path.
    const src = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    const paid = src.slice(src.indexOf("export async function handleInvoicePaid"));
    assert.ok(paid.includes("decideInvoiceRenewalEarn("), "handleInvoicePaid asks the policy");
    assert.ok(
      /if \(renewalEarnDecision\.earn && renewalPaymentRecordId\) \{[\s\S]{0,400}?awardCreditsForSettledPayment\(/.test(paid),
      "and awards only when the policy says earn",
    );
    assert.equal(
      paid.split("awardCreditsForSettledPayment(").length - 1,
      1,
      "exactly one award call in the invoice.paid path",
    );
    assert.ok(
      !/billing_reason[\s\S]{0,200}awardCreditsForSettledPayment/.test(paid.replace(/decideInvoiceRenewalEarn\([\s\S]*?\}\);/, "")),
      "the handler does not re-derive the signup test inline",
    );
  });

  await check("N3: a COMMITTED hold is never re-served as a fresh discount", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 5000, "n3");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "n3_ref", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "n3_ref", ports: port });
    const spentBalance = await walletOf(port, OWNER);
    assert.equal(spentBalance.availableCents, 4000, "the credits were spent");

    // The same reference again — which a purchase-key-derived reference would produce on the next
    // monthly renewal — must NOT report a live discount.
    const again = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "n3_ref", contextKind: "stripe_checkout", ports: port });
    assert.equal(again.ok, true);
    assert.equal((again as { redeemCents: number }).redeemCents, 0, "a committed hold funds nothing further");
    assert.equal((await walletOf(port, OWNER)).availableCents, 4000, "and nothing moved");
  });

  await check("N3b: the checkout reference is the PAYMENT RECORD, not the reusable attempt key", () => {
    const redemption = readFileSync("app/lib/rewards/rewardsCheckoutRedemption.ts", "utf8");
    assert.ok(/redemptionRef: input\.paymentRecordId/.test(redemption), "the hold is keyed on the payment record");
    assert.ok(!/redemptionRef: input\.checkoutAttemptKey/.test(redemption), "never on the attempt key");

    const route = readFileSync("app/api/revenue-os/checkout/route.ts", "utf8");
    // The hold is taken AFTER the record exists, so an attempt that loses the concurrency race
    // returns without ever reserving anything.
    assertOrder(
      route,
      "createPendingPaymentRecord(",
      "reserveCheckoutCredits(",
      "the payment record exists before any hold is keyed to it",
    );
    assert.ok(
      true,
      "the record is created before any credits are held",
    );
    assert.ok(route.includes("planCheckoutCredits"), "the amount is planned read-only first");
    assert.ok(route.includes("credits_no_longer_available"), "a plan/reserve disagreement aborts rather than charging");
  });

  await check("N4: a hold that expired before payment is RE-DEBITED at commit", async () => {
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const { port } = makeStore({ now: () => t0 });
    await seedAvailable(port, OWNER, 5000, "n4");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 9000, redemptionRef: "n4_ref", contextKind: "stripe_checkout", nowMs: t0, ports: port });

    // The sweep returns the credits while the Stripe session — which lives far longer than the
    // 30-minute hold — is still open at its reduced price.
    await runReservationExpirySweep({ nowMs: t0 + 31 * 60_000, limit: 10, ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 5000, "returned to the customer");

    // The customer then pays. The discount is real, so the credits must be taken now.
    const commit = await commitReservedCredits({ redemptionRef: "n4_ref", paymentRecordId: "n4_pay", ports: port });
    assert.equal(commit.ok, true);
    assert.equal((commit as { outcome: string }).outcome, "recommitted");
    const after = await walletOf(port, OWNER);
    assert.equal(after.availableCents, 3000, "the credits funding the discount are gone");
    assert.equal(after.lifetimeRedeemedCents, 2000);

    // And a redelivered webhook does not take them a second time.
    const again = await commitReservedCredits({ redemptionRef: "n4_ref", paymentRecordId: "n4_pay", ports: port });
    assert.equal(again.ok, true);
    assert.equal((await walletOf(port, OWNER)).availableCents, 3000, "still exactly one debit");
  });

  await check("N4b: a re-debit that the balance cannot cover FAILS rather than passing silently", async () => {
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const { port } = makeStore({ now: () => t0 });
    await seedAvailable(port, OWNER, 2000, "n4b");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 9000, redemptionRef: "n4b_ref", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    await runReservationExpirySweep({ nowMs: t0 + 31 * 60_000, limit: 10, ports: port });
    // The customer spends the returned credits elsewhere.
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 9000, redemptionRef: "n4b_other", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    await commitReservedCredits({ redemptionRef: "n4b_other", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 0);

    const commit = await commitReservedCredits({ redemptionRef: "n4b_ref", ports: port });
    assert.equal(commit.ok, false, "this needs a person, not a silent success");
    // The refusal now comes from the posting function itself — ONE statement that either moves
    // the credits or does not. The old two-entry pair reported its own invented error after
    // having already posted half of the movement.
    assert.equal((commit as { error: string }).error, "negative_balance_refused");
    const after = await walletOf(port, OWNER);
    assert.equal(after.availableCents, 0, "and nothing moved");
    assert.equal(after.reservedCents, 0, "in particular nothing was parked in reserved");

    // THE ROUND-3 REGRESSION GUARD: a retry must not find a half-used keyspace. The old pair
    // burned `recommit:reserve:<ref>` on the first attempt, so the second attempt's fresh
    // `recommit:commit:<ref>` key posted anyway and spent a DIFFERENT reservation's credits.
    const retry = await commitReservedCredits({ redemptionRef: "n4b_ref", ports: port });
    assert.equal(retry.ok, false, "a retry is still refused, not silently succeeded");
    const afterRetry = await walletOf(port, OWNER);
    assert.deepEqual(
      [afterRetry.availableCents, afterRetry.reservedCents, afterRetry.lifetimeRedeemedCents],
      [after.availableCents, after.reservedCents, after.lifetimeRedeemedCents],
      "a retry moves nothing at all",
    );
  });

  await check("N4e: the REDEMPTION ROW's status tracks the money, on every path", async () => {
    // Two mutations of the finalisation code used to leave all checks green, because nothing
    // asserted the row's status after a re-debit and the in-memory port silently dropped the
    // `fromAnyStatus` opt-out the real adapter honours. The status is now moved by the posting
    // statement itself, so it is asserted directly on every transition.
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const statusOf = async (port: RewardsStorePort, ref: string) =>
      (await port.findRedemption(reserveIdempotencyKey(ref)))?.status ?? null;

    // reserve -> commit
    const { port: a } = makeStore({ now: () => t0 });
    await seedAvailable(a, OWNER, 5000, "n4e_a");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 90_000, redemptionRef: "A", contextKind: "stripe_checkout", nowMs: t0, ports: a });
    assert.equal(await statusOf(a, "A"), "reserved");
    await commitReservedCredits({ redemptionRef: "A", ports: a });
    assert.equal(await statusOf(a, "A"), "committed", "a spent hold is committed");

    // reserve -> release
    const { port: b } = makeStore({ now: () => t0 });
    await seedAvailable(b, OWNER, 5000, "n4e_b");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 90_000, redemptionRef: "B", contextKind: "stripe_checkout", nowMs: t0, ports: b });
    await releaseReservedCredits({ redemptionRef: "B", ports: b });
    assert.equal(await statusOf(b, "B"), "released", "a returned hold is released");

    // reserve -> expire -> RE-DEBIT. The row must end up committed, not left released.
    const { port: c } = makeStore({ now: () => t0 });
    await seedAvailable(c, OWNER, 5000, "n4e_c");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 90_000, redemptionRef: "C", contextKind: "stripe_checkout", nowMs: t0, ports: c });
    await runReservationExpirySweep({ nowMs: t0 + 31 * 60_000, limit: 10, ports: c });
    assert.equal(await statusOf(c, "C"), "expired", "the sweep marks it expired");
    const recommit = await commitReservedCredits({ redemptionRef: "C", ports: c });
    assert.equal(recommit.ok, true);
    assert.equal((recommit as { outcome: string }).outcome, "recommitted");
    assert.equal(
      await statusOf(c, "C"),
      "committed",
      "a re-debited hold is COMMITTED — the ledger and the redemption row must tell one story",
    );
    assert.equal((await walletOf(c, OWNER)).lifetimeRedeemedCents, 2000, "and the money moved once");
  });

  await check("N4d: commit and the expiry sweep cannot BOTH move the same hold", async () => {
    // The old shape read the redemption row, posted, and only THEN compare-and-set. Commit and
    // release therefore both read `reserved`, both posted, and the loser learned it had lost
    // AFTER its money had already moved: the same 2000 cents were spent and returned at once.
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const { port } = makeStore({ now: () => t0 });
    await seedAvailable(port, OWNER, 5000, "n4d");
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 90_000, redemptionRef: "A", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 3000, amountDueCents: 90_000, redemptionRef: "B", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    assert.deepEqual(
      [(await walletOf(port, OWNER)).availableCents, (await walletOf(port, OWNER)).reservedCents],
      [0, 5000],
    );

    const committed = await commitReservedCredits({ redemptionRef: "A", ports: port });
    assert.equal(committed.ok, true);
    // The sweep now reaches the SAME hold. It must move nothing.
    const released = await releaseReservedCredits({ redemptionRef: "A", expired: true, ports: port });
    assert.equal(released.ok, true, "a late release is reported, not thrown");
    assert.equal((released as { outcome: string }).outcome, "already_final", "and it is a no-op");
    const after = await walletOf(port, OWNER);
    assert.deepEqual(
      [after.availableCents, after.reservedCents, after.lifetimeRedeemedCents],
      [0, 3000, 2000],
      "A was spent exactly once; B's hold is intact",
    );

    // The reverse order too: a released hold cannot then be committed against `reserved`.
    const relB = await releaseReservedCredits({ redemptionRef: "B", ports: port });
    assert.equal(relB.ok, true);
    const lateCommit = await commitReservedCredits({ redemptionRef: "B", ports: port });
    // It becomes a RE-DEBIT, which is correct and takes from available — never from another
    // reservation's share of `reserved`.
    assert.equal(lateCommit.ok, true);
    assert.equal((lateCommit as { outcome: string }).outcome, "recommitted");
    const end = await walletOf(port, OWNER);
    assert.deepEqual(
      [end.availableCents, end.reservedCents, end.lifetimeRedeemedCents],
      [0, 0, 5000],
      "5000 held, 5000 spent, nothing created and nothing stranded",
    );
  });

  await check("N4c: a failed re-debit can NEVER consume another reservation's credits", async () => {
    // THE BLOCKER. Reproduced exactly as an adversarial review produced it: 2000 cents out of
    // nothing, plus 1000 cents stranded in `reserved` that no operation could free.
    const t0 = Date.parse("2026-09-21T12:00:00.000Z");
    const { port } = makeStore({ now: () => t0 });
    await seedAvailable(port, OWNER, 10_000, "n4c");

    // Hold A is taken, then expires and is returned.
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 90_000, redemptionRef: "A", contextKind: "stripe_checkout", nowMs: t0, ports: port });
    await runReservationExpirySweep({ nowMs: t0 + 31 * 60_000, limit: 10, ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 10_000, "A was returned in full");

    // Hold B is an unrelated, live checkout.
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 3000, amountDueCents: 90_000, redemptionRef: "B", contextKind: "stripe_checkout", nowMs: t0 + 32 * 60_000, ports: port });
    const held = await walletOf(port, OWNER);
    assert.deepEqual([held.availableCents, held.reservedCents], [7000, 3000]);

    // A's payment lands anyway. Inject a transient failure on the FIRST re-debit attempt only.
    const realPost = port.postEntry.bind(port);
    let failNext = true;
    port.postEntry = async (entry) => {
      if (failNext && entry.entryType === "redeem_recommit") {
        failNext = false;
        return { ok: false, error: "transient" };
      }
      return realPost(entry);
    };
    const first = await commitReservedCredits({ redemptionRef: "A", ports: port });
    assert.equal(first.ok, false, "the transient failure is reported");
    const afterFail = await walletOf(port, OWNER);
    assert.deepEqual(
      [afterFail.availableCents, afterFail.reservedCents],
      [7000, 3000],
      "a failed re-debit leaves the wallet exactly as it was",
    );

    // The webhook is redelivered. This is where money used to appear from nowhere.
    const second = await commitReservedCredits({ redemptionRef: "A", ports: port });
    assert.equal(second.ok, true, "the retry now succeeds cleanly");
    const afterRetry = await walletOf(port, OWNER);
    assert.deepEqual(
      [afterRetry.availableCents, afterRetry.reservedCents],
      [5000, 3000],
      "A's 2000 came out of AVAILABLE — B's 3000 hold is untouched",
    );

    // And B's own honest commit still works, which it did not before.
    port.postEntry = realPost;
    const bCommit = await commitReservedCredits({ redemptionRef: "B", ports: port });
    assert.equal(bCommit.ok, true, "B commits normally");
    const final = await walletOf(port, OWNER);
    assert.deepEqual(
      [final.availableCents, final.reservedCents, final.lifetimeRedeemedCents],
      [5000, 0, 5000],
      "5000 granted as discount, 5000 debited — nothing created, nothing stranded",
    );
  });

  await check("N5: a reservation whose ledger post is refused does not survive as a live hold", async () => {
    // THE FAULT IS INJECTED, not arranged by balance.
    //
    // The first version of this check seeded 1000, reserved all of it, then reserved again and
    // expected the LEDGER POST to be refused after the row was created. It never got that far:
    // `planRedemption` saw a zero balance and refused at the PLANNING step, before
    // `createRedemption` ran at all. No row was created, the `if (orphan)` guard skipped the only
    // assertion that tested the fix, and deleting the fix entirely left this check passing.
    //
    // The window being tested is narrow and real: `createRedemption` must run first (the ledger
    // entry needs its id), so anything that fails the post AFTERWARDS leaves a row in `reserved`
    // holding nothing. Only a fault injected at exactly that point exercises it.
    const { port, redemptions } = makeStore();
    await seedAvailable(port, OWNER, 5000, "n5_seed");

    const realPostEntry = port.postEntry.bind(port);
    let failNextReserve = false;
    port.postEntry = async (input) => {
      if (failNextReserve && input.entryType === "redeem_reserve") {
        return { ok: false, error: "injected_post_failure" };
      }
      return realPostEntry(input);
    };

    failNextReserve = true;
    const refused = await reserveCreditsForPurchase({
      owner: OWNER, requestedCents: 1000, amountDueCents: 9000,
      redemptionRef: "n5_orphan", contextKind: "stripe_checkout", ports: port,
    });
    failNextReserve = false;
    assert.equal(refused.ok, false, "the reserve is refused");

    // The row WAS created before the post failed. It must not be left looking like a live hold.
    const orphan = redemptions.get(reserveIdempotencyKey("n5_orphan"));
    assert.ok(orphan, "the fixture must actually reach createRedemption, or it proves nothing");
    assert.notEqual(orphan!.status, "reserved", "a row that holds nothing must not look like a live hold");

    // And the sweep must not 'release' it, conjuring credits that were never held.
    const before = await walletOf(port, OWNER);
    const out = await runReservationExpirySweep({ nowMs: Date.now() + 3_600_000, limit: 10, ports: port });
    const after = await walletOf(port, OWNER);
    assert.equal(out.released, 0, "there is no live hold to release");
    assert.equal(
      after.availableCents + after.reservedCents,
      before.availableCents + before.reservedCents,
      "the sweep must not create value",
    );
    assert.equal(after.availableCents, 5000, "the balance is untouched by the refused reserve");
  });

  await check("N5b: a deduplicated row is never retired out from under a concurrent request", async () => {
    // A row returned as `deduplicated` belongs to another request that may hold LIVE credits.
    // Releasing it on this request's failure would destroy that hold.
    const src = readFileSync("app/lib/rewards/rewardsLedgerCore.ts", "utf8");
    assert.ok(/if \(!created\.deduplicated\) \{/.test(src), "only a row THIS call created is retired");
    assert.ok(src.includes("orphaned_reservation_not_retired"), "a failed retirement is named, not swallowed");
  });

  await check("N6: the CSV fingerprint binds the customer-visible REASON text", () => {
    const row = (reason: string) =>
      `${CSV_HEADER}\r\n,${UUID_A},,500,manual_adjustment,FP-REASON-1,${reason}`;
    const approved = parseRewardsCsv({ content: row("office reconciliation") }) as ParsedCsvOk;
    const swapped = parseRewardsCsv({ content: row("call 555-0100 to claim your prize") }) as ParsedCsvOk;
    assert.equal(approved.rows.length, 1);
    assert.equal(swapped.rows.length, 1);
    // That text is written into the immutable ledger and shown to the customer, so a commit must
    // not be able to substitute it under a fingerprint the operator approved.
    assert.notEqual(approved.batchFingerprint, swapped.batchFingerprint, "a changed REASON is detected");
  });

  await check("N6b: the fingerprint is a cryptographic digest, not a 32-bit hash", () => {
    const fp = parseRewardsCsv({
      content: `${CSV_HEADER}\r\n,${UUID_A},,500,manual_adjustment,FP-LEN-1,reconciliation`,
    }) as ParsedCsvOk;
    const digest = fp.batchFingerprint.split("-").slice(1).join("-");
    // 32 bits is 8 hex characters and brute-forceable in seconds by varying the free-form
    // reference until a collision is found.
    assert.ok(digest.length >= 32, `digest is ${digest.length} hex chars, need >= 32`);
    assert.ok(/^[0-9a-f]+$/.test(digest), "hex digest");
    const src = readFileSync("app/lib/rewards/rewardsCsvReconciliation.ts", "utf8");
    assert.ok(src.includes('createHash("sha256")'), "sha-256");
  });

  await check("N7: a CSV rejection points at the REAL line in the file", () => {
    // Blank lines used to be filtered out BEFORE numbering, so a bad row on file line 5 was
    // reported as line 3 and the operator looked at the wrong row.
    const content = [
      CSV_HEADER,
      "",
      `,${UUID_A},,500,manual_adjustment,GOODLINE-1,fine`,
      "",
      `,not-a-uuid,,500,manual_adjustment,BADLINE-1,bad target`,
    ].join("\r\n");
    const res = parseRewardsCsv({ content }) as ParsedCsvOk;
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0]!.lineNumber, 3, "the good row really is on line 3");
    assert.equal(res.rejections.length, 1);
    assert.equal(res.rejections[0]!.lineNumber, 5, "and the bad row really is on line 5");
  });

  await check("N8: a preview shows the operator the text they are certifying", () => {
    const route = readFileSync("app/api/admin/rewards/reconciliation/route.ts", "utf8");
    const previewBlock = route.slice(route.indexOf('if (mode === "preview")'), route.indexOf("// COMMIT —"));
    assert.ok(previewBlock.includes("reason: row.reason"), "the preview rows carry the reason text");
    const csvModule = readFileSync("app/lib/rewards/rewardsCsvReconciliation.ts", "utf8");
    assert.ok(/reason\?: string;/.test(csvModule), "the result row type carries it");
    assert.ok(csvModule.includes('"reason",\n    "detail",'), "and the exported report includes it");
  });

  await check("N9: a staff clawback is never rendered to the customer as a credit", () => {
    const panel = readFileSync("app/(site)/dashboard/components/LeonixCreditsPanel.tsx", "utf8");
    assert.ok(panel.includes("function isDebitRow"), "the sign decides for signed types");
    assert.ok(/if \(row\.amountCents < 0\) return true;/.test(panel), "a negative amount is a debit");
    assert.ok(panel.includes("const isDebit = isDebitRow(row);"), "and the row uses it");
    // A hold leaves `available`, so it is a debit too.
    assert.ok(/DEBIT_TYPES = new Set\(\[[\s\S]{0,200}"redeem_reserve"/.test(panel), "a reserve shows as a debit");
  });

  await check("N10: a wallet is never resolved from an empty payment id", () => {
    const src = readFileSync("app/lib/rewards/rewardsLedger.ts", "utf8");
    assert.ok(src.includes("export async function resolveWalletOwnerForUser"), "a user-scoped resolver exists");
    assert.ok(
      /if \(!paymentRecordId\) return resolveWalletOwnerForUser/.test(src),
      "an empty payment id means 'no payment', not 'the empty payment'",
    );
    // No caller passes the empty sentinel any more.
    for (const f of ["app/api/rewards/wallet/route.ts", "app/lib/rewards/rewardsCheckoutRedemption.ts"]) {
      assert.ok(
        !/paymentRecordId: ""/.test(readFileSync(f, "utf8")),
        `${f} must not resolve a wallet through an empty payment id`,
      );
    }
    // Bare membership must not silently hand an individual's credits to a business.
    assert.ok(
      /const owned = rows\.filter\(\(r\) => r\.is_primary_owner === true\);[\s\S]{0,160}if \(owned\.length === 1\)/.test(src),
      "primary ownership decides, not any active membership",
    );
    assert.ok(!/if \(rows\.length === 1\) return \{ kind: "business"/.test(src), "a single bare membership is not ownership");
  });

  // ===============================================================================================
  // SECTION P — SOURCE CLOSEOUT: recovery, restoration, canonical wallet, the refund queue
  // Every check closes an item the previous report listed as genuinely unbuilt.
  // ===============================================================================================

  await check("P1: a clawback the wallet cannot cover becomes a DEBT, repaid by future earnings", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p1", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 90_000, redemptionRef: "p1_spend", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "p1_spend", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 0, "every credit spent");

    const rev = await reverseForRefundOrChargeback({ paymentRecordId: "p1", eventRefundedCents: 10_000, kind: "refund", externalId: "re_p1", ports: port });
    assert.equal(rev.ok, true);
    assert.equal((rev as { reversedCents: number }).reversedCents, 0, "nothing was left to take");
    assert.equal((rev as { recoveryAccruedCents: number }).recoveryAccruedCents, 900, "so the whole 900 is owed");
    const owed = await walletOf(port, OWNER);
    assert.equal(owed.recoveryCents, 900);
    assert.ok(owed.availableCents >= 0 && owed.pendingCents >= 0, "never negative");

    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p1b", facts: settled({ amountPaidCents: 5_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    const mid = await walletOf(port, OWNER);
    assert.equal(mid.recoveryCents, 450, "9% of $50 pays down half the debt");
    assert.equal(mid.availableCents, 0, "and none of it became spendable");
    assert.equal(mid.lifetimeEarnedCents, 900 + 450, "the customer still EARNED it");

    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p1c", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    const clear = await walletOf(port, OWNER);
    assert.equal(clear.recoveryCents, 0, "the debt is settled");
    assert.equal(clear.availableCents, 450, "900 earned, 450 of it repaid the remainder");
  });

  await check("P1b: a PENDING card earn repays the debt too, before it can ever be promoted", async () => {
    // Most earnings arrive pending — card money waits out the settlement window. If only the
    // immediately-available path repaid the debt, a customer who owed a clawback could sit on
    // pending credits that promote straight into spendable value and never settle what they owe.
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 1_000, "p1b_seed");
    await postEntryDirect(port, OWNER, "recovery_accrue", 600, "p1b_debt");
    assert.equal((await walletOf(port, OWNER)).recoveryCents, 600);

    // 9% of $100 = 900 pending. 600 of it settles the debt; 300 remains pending.
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p1b_pay", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    const w = await walletOf(port, OWNER);
    assert.equal(w.recoveryCents, 0, "the pending earn repaid the debt");
    assert.equal(w.pendingCents, 300, "and only the remainder is still pending");
    assert.equal(w.lifetimeEarnedCents, 1_000 + 900, "the full amount was still earned");
  });

  await check("P2: no new hold may be taken while a debt is outstanding", async () => {
    const { port } = makeStore();
    await seedAvailable(port, OWNER, 5_000, "p2_seed");
    await postEntryDirect(port, OWNER, "recovery_accrue", 500, "p2_debt");
    assert.equal((await walletOf(port, OWNER)).recoveryCents, 500);

    const blocked = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1_000, amountDueCents: 90_000, redemptionRef: "p2_ref", contextKind: "stripe_checkout", ports: port });
    assert.equal(blocked.ok, false, "a customer who owes a clawback cannot hold a fresh discount");
    assert.equal((await walletOf(port, OWNER)).availableCents, 5_000, "and nothing moved");

    await postEntryDirect(port, OWNER, "recovery_offset", 500, "p2_settle");
    const allowed = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1_000, amountDueCents: 90_000, redemptionRef: "p2_ref2", contextKind: "stripe_checkout", ports: port });
    assert.equal(allowed.ok, true, "a pause, not a penalty");
  });

  await check("P3: a WON dispute restores what its reversal took — once, and never more", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p3", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    await reverseForRefundOrChargeback({ paymentRecordId: "p3", eventRefundedCents: 10_000, kind: "chargeback", externalId: "dp_p3", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 0, "the dispute clawed it all back");

    const restored = await restoreReversedCredits({ paymentRecordId: "p3", externalId: "dp_p3", ports: port });
    assert.equal(restored.ok, true);
    assert.equal((restored as { restoredCents: number }).restoredCents, 900, "exactly what was taken");
    const back = await walletOf(port, OWNER);
    assert.equal(back.availableCents, 900, "spendable again");
    assert.equal(back.lifetimeEarnedCents, 900, "a restoration is NOT new earning");
    assert.equal(back.lifetimeRestoredCents, 900, "it is counted as a restoration");

    // TWO INDEPENDENT GUARDS, and a redelivery hits whichever comes first. The BOUND refuses it
    // because nothing is outstanding any more; the idempotency key would refuse it even if the
    // bound somehow allowed it. Either way nothing moves, which is the property that matters.
    const again = await restoreReversedCredits({ paymentRecordId: "p3", externalId: "dp_p3", ports: port });
    assert.equal(again.ok, true);
    assert.equal((again as { restoredCents: number }).restoredCents, 0, "a duplicate delivery moves nothing");
    assert.equal(
      (again as { outcome: string }).outcome,
      "nothing_to_restore",
      "and says so rather than reporting the amount a first delivery would have moved",
    );
    assert.equal((await walletOf(port, OWNER)).availableCents, 900);
    assert.equal(
      (await walletOf(port, OWNER)).lifetimeRestoredCents,
      900,
      "restored exactly once, whatever the delivery count",
    );

    const forged = await restoreReversedCredits({ paymentRecordId: "p3", externalId: "dp_forged", requestedCents: 5_000, ports: port });
    assert.equal((forged as { restoredCents: number }).restoredCents, 0, "nothing outstanding, nothing restored");
    assert.equal((await walletOf(port, OWNER)).availableCents, 900, "a second dispute id mints nothing");
    assert.equal(restorationIdempotencyKey("dp_p3"), "restore:dp_p3");
  });

  await check("P4: a restoration never hands back value the clawback never took", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p4", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 90_000, redemptionRef: "p4_spend", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "p4_spend", ports: port });
    await reverseForRefundOrChargeback({ paymentRecordId: "p4", eventRefundedCents: 10_000, kind: "chargeback", externalId: "dp_p4", ports: port });
    assert.equal((await walletOf(port, OWNER)).recoveryCents, 900, "the whole clawback became a debt");

    // WINNING THE DISPUTE CANCELS THE DEBT — it does not mint spendable credits.
    //
    // The clawback took nothing from the buckets (they were empty) and recorded 900 as owed. So
    // the restoration's whole effect is to cancel that 900: the customer owes nothing, and no
    // spendable balance appears out of a purchase whose credits they had already used.
    const res = await restoreReversedCredits({ paymentRecordId: "p4", externalId: "dp_p4", ports: port });
    assert.equal(res.ok, true);
    assert.equal((res as { restoredCents: number }).restoredCents, 900, "the full clawback is undone");
    assert.equal((res as { recoveryOffsetCents: number }).recoveryOffsetCents, 900, "entirely by cancelling the debt");
    const after = await walletOf(port, OWNER);
    assert.equal(after.recoveryCents, 0, "nothing is owed any more");
    assert.equal(after.availableCents, 0, "and no spendable credits appeared from nowhere");

    // And it still cannot happen twice.
    const twice = await restoreReversedCredits({ paymentRecordId: "p4", externalId: "dp_p4", ports: port });
    assert.equal((twice as { restoredCents: number }).restoredCents, 0);
    assert.equal((await walletOf(port, OWNER)).availableCents, 0);
  });

  await check("P4b: winning a dispute still restores after the debt was already repaid", async () => {
    // THE CASE THAT BROKE THE FIRST BOUND. The clawback could not be covered, so it became a
    // 900-cent debt; the customer then earned and the debt was settled out of those earnings. At
    // that point `lifetime_reversed` is 0 and `recovery` is 0 — so a bound built from those two
    // said "nothing was ever taken" and REFUSED the restoration, charging the rewards to the one
    // customer who had paid the charge AND made good on the clawback.
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p4b", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 90_000, redemptionRef: "p4b_spend", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "p4b_spend", ports: port });
    await reverseForRefundOrChargeback({ paymentRecordId: "p4b", eventRefundedCents: 10_000, kind: "chargeback", externalId: "dp_p4b", ports: port });
    assert.equal((await walletOf(port, OWNER)).recoveryCents, 900, "the clawback became a debt");

    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p4b_next", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    const settledUp = await walletOf(port, OWNER);
    assert.equal(settledUp.recoveryCents, 0, "the debt is paid");
    assert.equal(settledUp.availableCents, 0, "and it consumed the whole new earn");
    assert.equal(settledUp.lifetimeReversedCents, 0, "no bucket ever gave up the original clawback");

    const res = await restoreReversedCredits({ paymentRecordId: "p4b", externalId: "dp_p4b", ports: port });
    assert.equal(res.ok, true, "the restoration is not refused");
    assert.equal((res as { restoredCents: number }).restoredCents, 900, "the full clawback comes back");
    const end = await walletOf(port, OWNER);
    assert.equal(end.availableCents, 900, "as spendable credits, since the debt is already settled");
    assert.equal(end.lifetimeEarnedCents, 1_800, "and it is still not counted as new earning");
  });

  await check("P4c: the in-memory store handles EXACTLY the entry types the SQL does", () => {
    // THE FAILURE MODE THIS CLOSES. A money-creating bug shipped here once because the store
    // modelled only bucket arithmetic while the database enforced more, so the tests passed
    // against a store that disagreed with production. Adding an arm to one side and forgetting
    // the other is the same mistake in slower motion, so the two sets are compared directly.
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const postFn = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.leonix_rewards_post_entry"));
    const postCase = postFn.slice(postFn.indexOf("CASE p_entry_type"), postFn.indexOf("END CASE;"));
    const sqlTypes = new Set(
      [...postCase.matchAll(/WHEN ((?:'[a-z_]+'(?:, )?)+) THEN/g)]
        .flatMap((m) => m[1]!.split(",").map((t) => t.trim().replace(/'/g, ""))),
    );

    const self = readFileSync("scripts/verify-ix-rewards-behavior-01.ts", "utf8");
    const deltas = self.slice(self.indexOf("const recoveryNow = w.recoveryCents"), self.indexOf("default: throw new Error(`unsupported entry_type"));
    const mockTypes = new Set([...deltas.matchAll(/case "([a-z_]+)":/g)].map((m) => m[1]!));

    const core = readFileSync("app/lib/rewards/rewardsLedgerCore.ts", "utf8");
    const union = core.slice(core.indexOf("export type LedgerEntryInput"), core.indexOf("amountCents: number;", core.indexOf("export type LedgerEntryInput")));
    const tsTypes = new Set([...union.matchAll(/\| "([a-z_]+)"/g)].map((m) => m[1]!));

    assert.ok(sqlTypes.size >= 12, `the SQL CASE was parsed (${sqlTypes.size} arms)`);
    const missingFromMock = [...sqlTypes].filter((t) => !mockTypes.has(t)).sort();
    const missingFromSql = [...mockTypes].filter((t) => !sqlTypes.has(t)).sort();
    const missingFromUnion = [...sqlTypes].filter((t) => !tsTypes.has(t)).sort();
    assert.deepEqual(missingFromMock, [], "every SQL entry type is modelled by the store");
    assert.deepEqual(missingFromSql, [], "the store models nothing the database would refuse");
    assert.deepEqual(missingFromUnion, [], "and the TypeScript union names them all");

    // The stored VOCABULARY and the handled arms must be the same set too. A type the CHECK
    // accepts but the CASE does not handle falls through to `unsupported entry_type` — safe, but
    // it means a row shape exists that nothing can ever post, which is drift worth catching.
    const typeChk = /entry_type IN \(([\s\S]*?)\)\),/.exec(sql)?.[1] ?? "";
    const vocabulary = new Set([...typeChk.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]!));
    assert.ok(vocabulary.size >= 12, `the entry_type CHECK was parsed (${vocabulary.size} values)`);
    assert.deepEqual(
      [...vocabulary].filter((t) => !sqlTypes.has(t)).sort(),
      [],
      "every storable entry type is handled by the posting function",
    );
    assert.deepEqual(
      [...sqlTypes].filter((t) => !vocabulary.has(t)).sort(),
      [],
      "and the posting function handles nothing the CHECK would reject",
    );

    // Every REFUSAL the SQL states by name must also be modelled, or the store would let through
    // a movement the database aborts — which is how the tests came to certify a wallet the
    // database would never have produced.
    const sqlRefusals = [
      ["exceeds pending", "promotion_exceeds_pending"],
      ["has an outstanding recovery balance", "recovery_outstanding"],
      ["redemption of % exceeds available", "redemption_exceeds_available"],
      ["commit of % exceeds reserved", "commit_exceeds_reserved"],
      ["release of % exceeds reserved", "release_exceeds_reserved"],
      ["re-debit of % exceeds available", "recommit_exceeds_available"],
      ["restoration of % exceeds what was reversed", "restoration_exceeds_reversed"],
      ["offset of % exceeds recovery", "offset_exceeds_recovery"],
      ["adjustment of % exceeds available", "adjustment_exceeds_balance"],
      ["expiry of % exceeds available", "expiry_exceeds_available"],
    ] as const;
    for (const [inSql, inMock] of sqlRefusals) {
      assert.ok(postCase.includes(inSql) || postFn.includes(inSql), `SQL refuses: ${inSql}`);
      assert.ok(deltas.includes(inMock), `and the store models it: ${inMock}`);
    }
  });

  await check("P10 BLOCKER: a won dispute restores only what the DISPUTE took", async () => {
    // AN ADVERSARIAL REVIEW PRODUCED 450 CENTS FROM NOTHING HERE. The bound summed refunds AND
    // chargebacks, so winning a dispute also gave back the credits a separate, entirely genuine
    // refund had clawed back — leaving the customer with full rewards on money they were refunded.
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p10", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 900);

    // A real $50 refund takes half.
    await reverseForRefundOrChargeback({ paymentRecordId: "p10", eventRefundedCents: 5_000, kind: "refund", externalId: "re_p10", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 450, "the refund took its proportional half");

    // The customer then disputes the charge; the dispute takes the rest.
    await reverseForRefundOrChargeback({ paymentRecordId: "p10", eventRefundedCents: 10_000, kind: "chargeback", externalId: "dp_p10", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 0);

    // Leonix WINS the dispute. Only the DISPUTE's clawback comes back.
    const res = await restoreReversedCredits({ paymentRecordId: "p10", externalId: "dp_p10", ports: port });
    assert.equal(res.ok, true);
    assert.equal(
      (res as { restoredCents: number }).restoredCents,
      450,
      "exactly what the dispute took — NOT the refund's 450 as well",
    );
    assert.equal(
      (await walletOf(port, OWNER)).availableCents,
      450,
      "the customer keeps rewards on the $50 they actually paid, and none on the $50 refunded",
    );
  });

  await check("P11 BLOCKER: a refund AFTER a restoration still claws back", async () => {
    // The reversed position counted restorations as if they were still reversed, so a refund
    // following a won dispute computed a delta of zero: the customer got the money back AND kept
    // every credit. 900 cents from nothing.
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p11", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    await reverseForRefundOrChargeback({ paymentRecordId: "p11", eventRefundedCents: 10_000, kind: "chargeback", externalId: "dp_p11", ports: port });
    await restoreReversedCredits({ paymentRecordId: "p11", externalId: "dp_p11", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 900, "dispute won, credits back");

    // Leonix now refunds the charge anyway.
    const refund = await reverseForRefundOrChargeback({ paymentRecordId: "p11", eventRefundedCents: 10_000, kind: "refund", externalId: "re_p11", ports: port });
    assert.equal(refund.ok, true);
    const moved =
      (refund as { reversedCents: number }).reversedCents +
      (refund as { recoveryAccruedCents: number }).recoveryAccruedCents;
    assert.equal(moved, 900, "the refund claws back the full award, not zero");
    assert.equal((await walletOf(port, OWNER)).availableCents, 0, "no credits survive a full refund");
  });

  await check("P12 BLOCKER: recomputation RECONSTRUCTS the debt, it does not erase it", () => {
    // The SQL replay skipped the recovery deltas entirely, on the strength of a comment claiming a
    // separate `recovery_accrue` row carried them. No such row is ever emitted: the posting arm
    // folds the shortfall into the same statement that writes the reversal. So one reconciliation
    // call wrote `recovery_cents = 0` over a real debt — which also lifts the redemption block,
    // handing the customer credits they owed and letting them spend them.
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const replay = sql.slice(sql.indexOf("FUNCTION public.leonix_rewards_recompute_wallet"));
    const arm = replay.slice(replay.indexOf("WHEN 'refund_reversal', 'chargeback_reversal' THEN"), replay.indexOf("WHEN 'manual_adjustment' THEN", replay.indexOf("WHEN 'refund_reversal', 'chargeback_reversal' THEN")));
    assert.ok(
      /v_recovery := v_recovery \+ \(v_entry\.amount_cents - v_cover\);/.test(arm),
      "the replay re-derives the shortfall the posting arm folded in",
    );
    assert.ok(
      /v_recovery_accrued := v_recovery_accrued \+ \(v_entry\.amount_cents - v_cover\);/.test(arm),
      "and the monotonic accrual the restoration bound depends on",
    );
    // There is genuinely no separate accrual row to rely on: the posting arm emits ONE entry.
    const postArm = sql.slice(sql.indexOf("WHEN 'refund_reversal', 'chargeback_reversal' THEN"), sql.indexOf("WHEN 'manual_adjustment' THEN"));
    assert.ok(
      /v_recovery_accrued_delta := p_amount_cents - v_cover;/.test(postArm),
      "the posting arm accrues the debt inline",
    );
    assert.ok(!/INSERT INTO public\.leonix_rewards_ledger/.test(postArm), "and emits no second ledger row");
  });

  await check("P13: the SQL rules this system depends on are asserted, not assumed", () => {
    // EIGHT INDEPENDENT MUTATIONS of this migration once left the whole suite green: deleting the
    // debt repayment from both earn arms, the redemption debt-block, the restoration bound, the
    // reservation status guard, the sequence assignment and the queue's RLS. Those are the rules
    // the money depends on, so each is now pinned to the CONDITION rather than to a message.
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const post = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.leonix_rewards_post_entry"));
    const armOf = (name: string) => {
      const at = post.indexOf(`WHEN '${name}' THEN`);
      assert.ok(at > 0, `the ${name} arm exists`);
      return post.slice(at, post.indexOf("    WHEN ", at + 10));
    };

    // Earnings repay the debt before anything becomes spendable — BOTH arms.
    for (const [arm, bucket] of [["earn_pending", "v_pending_delta"], ["earn_available", "v_available_delta"]] as const) {
      const body = armOf(arm);
      assert.ok(/v_offset := LEAST\(p_amount_cents, v_wallet\.recovery_cents\);/.test(body), `${arm} computes the repayment`);
      assert.ok(new RegExp(`${bucket} := p_amount_cents - v_offset;`).test(body), `${arm} credits only the remainder`);
      assert.ok(/v_recovery_delta := -v_offset;/.test(body), `${arm} reduces the debt`);
      assert.ok(/v_earned_delta := p_amount_cents;/.test(body), `${arm} still counts the full amount as earned`);
    }

    // No spending while a debt stands.
    const reserve = armOf("redeem_reserve");
    assert.ok(
      /IF v_wallet\.recovery_cents > 0 THEN[\s\S]{0,300}RAISE EXCEPTION/.test(reserve),
      "redeem_reserve REFUSES while a recovery balance is outstanding",
    );

    // The restoration bound, as a live condition.
    const restore = armOf("reversal_restoration");
    assert.ok(
      /IF p_amount_cents > v_wallet\.lifetime_reversed_cents \+ v_wallet\.lifetime_recovery_accrued_cents[\s\S]{0,120}RAISE EXCEPTION/.test(restore),
      "a restoration cannot exceed what the clawback took, in either form",
    );

    // The reservation guard — the defect that once produced 2000 cents from nothing.
    const claim = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.leonix_rewards_claim_redemption"), sql.indexOf("CREATE OR REPLACE FUNCTION public.leonix_rewards_post_entry"));
    assert.ok(/FOR UPDATE/.test(claim), "the redemption row is locked");
    assert.ok(
      /IF v_redemption\.status <> 'reserved' THEN[\s\S]{0,200}RAISE EXCEPTION/.test(claim),
      "and a commit or release against a non-reserved hold is refused",
    );
    assert.ok(
      /IF v_redemption\.status NOT IN \('released', 'expired'\) THEN[\s\S]{0,200}RAISE EXCEPTION/.test(claim),
      "and a re-debit is restricted to a hold that was actually returned",
    );
    assert.ok(/IF v_redemption\.wallet_id <> p_wallet_id THEN/.test(claim), "and a hold cannot be claimed across wallets");

    // The sequence is assigned in the INSERT, not merely mentioned somewhere in the file.
    const insert = post.slice(post.indexOf("INSERT INTO public.leonix_rewards_ledger"), post.indexOf("RETURNING", post.indexOf("INSERT INTO public.leonix_rewards_ledger")));
    assert.ok(
      /nextval\('public\.leonix_rewards_ledger_seq'\)/.test(insert),
      "entry_seq is drawn inside the posting statement, under the wallet lock",
    );

    // The staff-only queue is RLS-enabled and reachable by no browser role.
    assert.ok(
      /ALTER TABLE public\.leonix_rewards_refund_resolutions ENABLE ROW LEVEL SECURITY;/.test(sql),
      "the refund queue has RLS enabled",
    );
    assert.ok(
      /REVOKE ALL ON TABLE public\.leonix_rewards_refund_resolutions FROM anon, authenticated;/.test(sql),
      "and is revoked from every browser role",
    );
  });

  await check("P14: one payment's clawback cannot strand another payment's promotion forever", async () => {
    // `pending` is ONE bucket shared by every payment on the wallet, and a reversal takes pending
    // first — so a clawback on payment B consumes payment A's pending credits. Asking to promote
    // A's full earn then failed `negative_balance_refused` on that sweep and on every sweep after
    // it, forever: credits lost on a payment that was never refunded, failing silently each run.
    let clock = Date.parse("2026-01-01T00:00:00.000Z");
    const { port } = makeStore({ now: () => clock });

    // A: card money, pending. B: cash money, immediately spendable, and spent.
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p14_A", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p14_B", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "manual_payment", pendingUntilSettlementFinal: false, ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 90_000, redemptionRef: "p14_spend", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "p14_spend", ports: port });
    assert.deepEqual(
      [(await walletOf(port, OWNER)).pendingCents, (await walletOf(port, OWNER)).availableCents],
      [900, 0],
      "A is pending, B is spent",
    );

    // B is refunded in full. Pending-first means it takes A's credits.
    await reverseForRefundOrChargeback({ paymentRecordId: "p14_B", eventRefundedCents: 10_000, kind: "refund", externalId: "re_p14_B", ports: port });
    assert.equal((await walletOf(port, OWNER)).pendingCents, 0, "A's pending credits absorbed B's clawback");

    // A's window passes. The sweep must not fail — there is simply nothing left to promote.
    clock += 31 * DAY;
    const sweep = await runPendingPromotionSweep({ nowMs: clock, settlementDays: 30, limit: 50, ports: port, isPaymentStillEligible: async () => true });
    // THE SWEEP HAS TO HAVE LOOKED. Asserting only `failed === 0` and `promotedCents === 0` is
    // satisfied in full by a sweep that does NOTHING, for ever — a stub returning zeros passed
    // this named-blocker check completely. Examining the candidate is what makes the zeros mean
    // "there was nothing to promote" rather than "nothing was attempted".
    assert.ok(sweep.examined >= 1, "the sweep actually examined A's pending earn");
    assert.equal(sweep.failed, 0, "the sweep does not fail, this run or any run after it");
    assert.equal(sweep.promotedCents, 0, "and it promotes only what is actually there");
    assert.equal(sweep.skippedIneligible, sweep.examined, "every candidate was skipped for a stated reason");

    // And a later sweep is equally quiet, rather than retrying the same impossible promotion.
    const again = await runPendingPromotionSweep({ nowMs: clock + DAY, settlementDays: 30, limit: 50, ports: port, isPaymentStillEligible: async () => true });
    assert.equal(again.failed, 0, "no permanent failure loop");

    // THE POSITIVE CONTROL. A sweep that promotes nothing under any circumstances would satisfy
    // every assertion above; this one proves the same sweep still moves credits when there ARE
    // credits to move, so the quiet above is a judgement rather than a no-op.
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p14_C", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    clock += 31 * DAY;
    const third = await runPendingPromotionSweep({ nowMs: clock, settlementDays: 30, limit: 50, ports: port, isPaymentStillEligible: async () => true });
    assert.equal(third.promoted, 1, "C promotes");
    assert.equal(third.promotedCents, 900, "for exactly what it earned");
    assert.equal((await walletOf(port, OWNER)).availableCents, 900, "and the credits are spendable");
  });

  await check("P15: EARNING resolves through the binding WITHOUT killing the payment link", () => {
    // THIS CHECK WAS THE BLIND SPOT. It asserted that the link lookup text was still present and
    // that the binding was read first — both textually true while the link branch was
    // UNREACHABLE. `resolveWalletOwnerForUser` never returns null for a real user (it falls
    // through to `{kind:"user"}`), so short-circuiting on it returned on every identified payer
    // and silently disabled staff payment-to-business attribution: a $1,000 invoice linked to a
    // company credited 9,000 cents to the employee's personal wallet and pinned it there.
    //
    // So the property is REACHABILITY, not presence, and it is asserted on the control flow.
    const adapter = readFileSync("app/lib/rewards/rewardsLedger.ts", "utf8");
    const fn = adapter.slice(
      adapter.indexOf("export async function resolveWalletOwnerForPayment"),
      adapter.indexOf("export async function findBoundWalletOwner"),
    );

    // It must short-circuit on a lookup that CAN return null, not on the total resolver.
    assert.ok(
      /const bound = await findBoundWalletOwner\(input\.ownerUserId\);/.test(fn),
      "the short-circuit uses the binding lookup, which returns null when none exists",
    );
    assert.ok(
      !/await resolveWalletOwnerForUser\(input\.ownerUserId\);[\s\S]{0,80}if \(bound\) return bound;/.test(fn),
      "and NOT the total resolver, which never returns null and would make the link branch dead",
    );

    // The lookup it short-circuits on must genuinely be able to answer "no identity yet".
    const finder = adapter.slice(
      adapter.indexOf("export async function findBoundWalletOwner"),
      adapter.indexOf("export async function resolveWalletOwnerForUser"),
    );
    assert.ok(/\.eq\("bound_user_id", ownerUserId\)/.test(finder), "it reads the binding");
    assert.ok(/return null;\s*\}\s*$/m.test(finder) || finder.trimEnd().endsWith("return null;\n}"),
      "and returns null when the customer has no bound wallet");

    // The link branch must still be REACHED after that short-circuit.
    const bindAt = fn.indexOf("findBoundWalletOwner(input.ownerUserId)");
    const linkAt = fn.indexOf('.from("business_external_links")');
    assert.ok(bindAt > 0 && linkAt > bindAt, "the link lookup follows the binding, and is reachable");
    assert.ok(
      /boundUserId: input\.ownerUserId \?\? null/.test(fn),
      "a link-resolved business carries the payer through so the identity is pinned once",
    );
  });

  await check("P18 HIGH: a WON dispute withdraws the basis it added", async () => {
    // A reversal's basis is the MONEY-RETURNED position it added, summed across kinds. Restoring
    // the credits without withdrawing that basis left the whole disputed charge in the position
    // permanently: a $100 payment, dispute WON, then a $50 goodwill refund computed a cumulative
    // of $150 against a $100 purchase, targeted a 100% reversal, and took the customer's entire
    // 900-cent award instead of the 450 they had actually lost.
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p18", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 900);

    await reverseForRefundOrChargeback({ paymentRecordId: "p18", eventRefundedCents: 10_000, cumulativeRefundedCentsForKind: 10_000, kind: "chargeback", externalId: "dp_p18", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 0, "the dispute took it all");

    await restoreReversedCredits({ paymentRecordId: "p18", externalId: "dp_p18", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 900, "winning gave it back");

    // The basis for the chargeback kind must now be ZERO: that money was not, in the end, returned.
    assert.equal(
      await port.sumReversalBasisForPayment("p18", "chargeback"),
      0,
      "the won dispute's basis is withdrawn, not left standing",
    );

    // A later $50 goodwill refund must claw back HALF, not everything.
    const refund = await reverseForRefundOrChargeback({ paymentRecordId: "p18", eventRefundedCents: 5_000, cumulativeRefundedCentsForKind: 5_000, kind: "refund", externalId: "re_p18", ports: port });
    assert.equal(refund.ok, true);
    assert.equal(
      (refund as { reversedCents: number }).reversedCents,
      450,
      "9% of the $50 actually refunded — NOT the whole award",
    );
    assert.equal(
      (await walletOf(port, OWNER)).availableCents,
      450,
      "the customer keeps rewards on the $50 they still paid",
    );
  });

  await check("P16: a failed or out-of-order won-dispute restoration is QUEUED, not dropped", () => {
    const src = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    const fn = src.slice(src.indexOf("export async function handleDisputeClosed"));
    assert.ok(fn.includes("restoreCreditsForWonDispute("), "a won dispute restores");
    assert.ok(
      fn.includes("enqueueUnattributableRefund("),
      "and a failure lands in the queue — `restore:<disputeId>` is never retried on its own",
    );
    assert.ok(
      /won_dispute_restoration_found_nothing_to_restore/.test(fn),
      "including the ORDERING case: closed-won processed before dispute-created has no clawback " +
        "to undo yet, and the one that lands afterwards would stand permanently",
    );
    assert.ok(
      /!restored\.ok \|\|\s*\(restored\.outcome === "skipped" && !QUIET_SKIPS\.has/.test(fn),
      "both the failure and the nothing-to-restore case are caught",
    );
    // AND THE ORDINARY CASES ARE QUIET. A redelivered `dispute.closed` correctly finds nothing
    // outstanding; filing that as "money is owed" put a false row in front of staff for every
    // redelivery, and acting on one would hand the customer the award a second time.
    const quiet = fn.slice(fn.indexOf("const QUIET_SKIPS"), fn.indexOf(");", fn.indexOf("const QUIET_SKIPS")));
    for (const reason of ["payment_earned_nothing", "already_restored", "rewards_not_configured"]) {
      assert.ok(quiet.includes(`"${reason}"`), `${reason} must not file a staff row`);
    }
    assert.ok(
      !quiet.includes('"nothing_was_reversed"'),
      "but the ORDERING case — closed-won before dispute-created — still must",
    );
  });

  await check("P17: the adapter SELECTS every column its snapshot reads", () => {
    // THE DEFECT THIS EXISTS FOR. `WALLET_COLUMNS` omitted the recovery columns while
    // `toSnapshot` read them, so `recoveryCents` was a hardcoded zero for every TypeScript
    // observer: a clawback that moved NOTHING and accrued a 900-cent debt was audited, and shown
    // to staff, as "reversed 900, recovery 0". It shipped because an edit silently never landed
    // and nothing asserted the select — a grep for the column name in the file would have passed.
    //
    // So the required set is DERIVED from what the snapshot actually reads, not hand-listed here:
    // a future field added to the snapshot and forgotten in the select fails this check by itself.
    const adapter = readFileSync("app/lib/rewards/rewardsLedger.ts", "utf8");

    const colsAt = adapter.indexOf("const WALLET_COLUMNS =");
    assert.ok(colsAt > 0, "WALLET_COLUMNS exists");
    const columnsLiteral = adapter.slice(colsAt, adapter.indexOf(";", colsAt));
    const selected = new Set(
      [...columnsLiteral.matchAll(/([a-z_]+_cents|id|bound_user_id)/g)].map((m) => m[1]!),
    );

    const snapAt = adapter.indexOf("function toSnapshot(");
    const snapshot = adapter.slice(snapAt, adapter.indexOf("\n}", snapAt));
    const read = [...snapshot.matchAll(/row\.([a-z_]+)/g)].map((m) => m[1]!);
    assert.ok(read.length >= 7, `the snapshot reads columns (${read.length} found)`);

    const missing = [...new Set(read)].filter((c) => !selected.has(c)).sort();
    assert.deepEqual(
      missing,
      [],
      `every column the snapshot reads must be SELECTed, or it silently reads zero: ${missing.join(", ")}`,
    );

    // The recovery mechanism specifically: these five are what make the debt visible to every
    // TypeScript observer and every audit line.
    for (const col of [
      "recovery_cents",
      "lifetime_recovery_accrued_cents",
      "lifetime_recovery_offset_cents",
      "lifetime_restored_cents",
      "bound_user_id",
    ]) {
      assert.ok(selected.has(col), `WALLET_COLUMNS must select ${col}`);
    }

    // And the binding guard reads a column it selects, rather than always seeing undefined.
    const resolveAt = adapter.indexOf("async resolveWallet(owner: WalletOwnerRef)");
    const resolveBlock = adapter.slice(resolveAt, adapter.indexOf("async getWalletById", resolveAt));
    if (/row\.bound_user_id/.test(resolveBlock)) {
      assert.ok(selected.has("bound_user_id"), "the binding guard reads a column that is selected");
    }
  });

  await check("P19: the queue can SETTLE the obligation it files, and entry_seq cannot be skipped", () => {
    // M-4: a row filed by the ORDERING case records credits the customer is OWED. The only
    // money-moving outcome was `reversed`, which for such a row has a zero basis and moves
    // nothing; settling it with `adjust` credits `available` but leaves `lifetime_restored`
    // untouched, so the SQL restoration bound stays open and a later `restore:<disputeId>` could
    // pay it a second time. The queue needs a settlement that moves the bound with the money.
    const api = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    const block = api.slice(api.indexOf('if (action === "refund_resolve")'), api.indexOf("// SEARCH — name and phone"));
    assert.ok(block.includes("restoreCreditsForWonDispute("), "the queue can settle a restoration");
    assert.ok(block.includes("dispute_id_required"), "and requires the dispute id that keys it");
    assertOrder(
      block,
      "wantsRestore",
      "restoreCreditsForWonDispute(",
      "the restore path is chosen explicitly, never inferred",
    );
    assert.ok(
      true,
      "the restore path is chosen explicitly, not inferred",
    );

    // S-1: a row inserted without `nextval` would sort before ALL history under NULLS FIRST and
    // reconstruct a state that never existed. The column defaults and is NOT NULL, so no future
    // writer can opt out of the canonical order.
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    // ADDED WITHOUT A DEFAULT, ON PURPOSE. `ADD COLUMN ... DEFAULT nextval(...)` has a VOLATILE
    // default, so PostgreSQL rewrites the table and assigns the sequence in HEAP order — which is
    // not chronological order, and the replay sorts by `entry_seq` first. Measured: a ledger
    // stored in a different order from the one it was written in replayed to `pending -600` and
    // the recompute refused a wallet that was in fact consistent. The column is added empty, filled
    // in `ORDER BY created_at, id`, and only then given the default and the NOT NULL.
    assert.ok(
      /ADD COLUMN IF NOT EXISTS entry_seq bigint;/.test(sql),
      "entry_seq is added without a volatile default, so no table rewrite assigns it in heap order",
    );
    assert.ok(
      /row_number\(\) OVER \(ORDER BY created_at ASC, id ASC\)/.test(sql),
      "and the backfill assigns it in the order the rows were written",
    );
    assert.ok(
      /ALTER COLUMN entry_seq SET DEFAULT nextval\('public\.leonix_rewards_ledger_seq'\)/.test(sql),
      "the default is attached afterwards, so no future writer can opt out of the canonical order",
    );
    assert.ok(
      /DISABLE TRIGGER leonix_rewards_ledger_immutable_tg/.test(sql),
      "and the backfill stands the append-only trigger down for its one statement, rather than being dead code that would fail if it ever had work",
    );
    assert.ok(
      /ALTER COLUMN entry_seq SET NOT NULL;/.test(sql),
      "and cannot be NULL, so the replay order is total for every row",
    );
  });

  await check("P5: recovery copy is honest in both languages and never claims expiry", () => {
    for (const lang of ["es", "en"] as const) {
      const copy = recoveryBalanceCopy(lang, { recoveryCents: 3_232 });
      assert.ok(copy.heading.includes("$32.32"), `${lang} names the amount`);
      assert.ok(copy.detail.length > 60, `${lang} explains rather than labels`);
      assert.ok(/no vencen|do not expire/.test(copy.detail), `${lang} states that credits do not expire`);
      assert.ok(/efectivo|in cash/.test(copy.detail), `${lang} says there is nothing to pay in cash`);
      assert.ok(!/multa|penalty/i.test(copy.detail), `${lang} does not invent a penalty`);
    }
    // AND THE TWO LANGUAGES ARE ACTUALLY DIFFERENT. Every assertion above is satisfied by a
    // function that ignores `lang` and returns one Spanish string for everybody — which is how an
    // English-speaking customer comes to be told about their debt in Spanish.
    const es = recoveryBalanceCopy("es", { recoveryCents: 3_232 });
    const en = recoveryBalanceCopy("en", { recoveryCents: 3_232 });
    assert.notEqual(en.heading, es.heading, "the heading is translated, not shared");
    assert.notEqual(en.detail, es.detail, "and so is the explanation");
    assert.ok(/Credits owed back/.test(en.heading), "English reads as English");
    assert.ok(/Créditos por devolver/.test(es.heading), "and Spanish as Spanish");
  });

  await check("P6: recomputation reproduces recovery and restoration exactly", async () => {
    const { port, recompute } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p6", facts: settled({ amountPaidCents: 10_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 500, amountDueCents: 90_000, redemptionRef: "p6_a", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "p6_a", ports: port });
    await reverseForRefundOrChargeback({ paymentRecordId: "p6", eventRefundedCents: 10_000, kind: "chargeback", externalId: "dp_p6", ports: port });
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p6b", facts: settled({ amountPaidCents: 3_000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    await restoreReversedCredits({ paymentRecordId: "p6", externalId: "dp_p6", ports: port });

    const live = await walletOf(port, OWNER);
    const replayed = recompute(live.id);
    assert.deepEqual(
      [replayed.pendingCents, replayed.availableCents, replayed.reservedCents, replayed.recoveryCents, replayed.lifetimeRestoredCents],
      [live.pendingCents, live.availableCents, live.reservedCents, live.recoveryCents, live.lifetimeRestoredCents],
      "the replay lands on exactly the incremental balances",
    );
    assert.deepEqual(
      [replayed.lifetimeEarnedCents, replayed.lifetimeRedeemedCents, replayed.lifetimeReversedCents],
      [live.lifetimeEarnedCents, live.lifetimeRedeemedCents, live.lifetimeReversedCents],
      "and on the same lifetime totals",
    );
  });

  await check("P7: the canonical wallet is PINNED — a membership change cannot move a balance", () => {
    const adapter = readFileSync("app/lib/rewards/rewardsLedger.ts", "utf8");
    const fn = adapter.slice(adapter.indexOf("export async function resolveWalletOwnerForUser"));
    const bindingAt = fn.indexOf('.eq("bound_user_id", ownerUserId)');
    const membershipAt = fn.indexOf('.from("business_memberships")');
    assert.ok(bindingAt > 0, "the binding is read");
    assert.ok(membershipAt > 0, "the membership rules still exist");
    assert.ok(bindingAt < membershipAt, "and the binding is read FIRST — membership decides only the first answer");

    const resolveAt = adapter.indexOf("async resolveWallet(owner: WalletOwnerRef)");
    const resolveBlock = adapter.slice(resolveAt, adapter.indexOf("async getWalletById", resolveAt));
    assert.ok(resolveBlock.includes("bound_user_id: bindUserId"), "a new wallet is born bound");
    assert.ok(resolveBlock.includes('.is("bound_user_id", null)'), "an existing wallet adopts a binding only if it has none");

    // THE MOVEMENT'S DESTINATION IS PROVED BEHAVIOURALLY, IN Q16, NOT BY READING THE SOURCE.
    //
    // This used to slice 4,000 characters after the function's `export` and grep for
    // `walletId: original.walletId`. That is a check on the shape of one file: extracting the body
    // into a helper — which is exactly what the concurrency repair did — turned a correct
    // implementation red, and moving the literal into a comment would have turned an incorrect one
    // green. Q16 rigs the store so that RE-RESOLVING the owner answers with a different wallet,
    // then asserts on where the ledger rows actually landed.
    const core = readFileSync("app/lib/rewards/rewardsLedgerCore.ts", "utf8");
    assert.ok(
      core.includes("walletId: original.walletId"),
      "the reversal path still names the earn entry's wallet",
    );
  });

  await check("P8: an unattributable refund is QUEUED, not merely logged", () => {
    const src = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    const fn = src.slice(src.indexOf("async function reverseRewardsForChargeRefunds"), src.indexOf("/** charge.refunded"));
    const noRefunds = fn.slice(fn.indexOf("if (!refunds.length) {"), fn.indexOf("// Oldest first"));
    assert.ok(noRefunds.includes("enqueueUnattributableRefund("), "the event lands in a durable queue");
    assert.ok(!noRefunds.includes("reverseCreditsForRefundOrDispute("), "and still reverses nothing automatically");
    assert.ok(noRefunds.includes("retryable: true"), "and is marked retryable");

    const queue = readFileSync("app/lib/rewards/rewardsRefundResolutionQueue.ts", "utf8");
    assert.ok(queue.includes("PG_UNIQUE_VIOLATION"), "a redelivery bumps attempts rather than duplicating");
    assert.ok(queue.includes('.eq("status", "open")'), "closing is a compare-and-set from open");
    assert.ok(queue.includes('error: "note_required"'), "a resolution is explained");
    assert.ok(queue.includes('error: "actor_required"'), "and attributed");

    // THE STAFF RESOLUTION PATH IS NOT ASSERTED HERE ANY MORE — IT IS EXECUTED.
    //
    // Everything this check used to claim about `app/api/admin/rewards/route.ts` it claimed by
    // reading the file: which literal appeared, and in what order `indexOf` found it. An
    // independent reviewer showed exactly what that is worth. They relocated the refund-id guard
    // to AFTER `closeRefundResolution` and left a comment mentioning it where the guard had been —
    // `indexOf` found the comment, the ordering assertion passed, and an operator who typed a bad
    // id now destroyed the obligation silently. They also rewrote `Boolean(row.externalRef)` as
    // `row.externalRef !== null && row.externalRef !== ""` — identical behaviour — and this check
    // went RED. Green for a hole, red for a rename: the wrong sign on both axes.
    //
    // `scripts/verify-ix-rewards-route-behavior-01.ts` CALLS the handler instead. Y1 sends a bad
    // refund id and asserts the row is still open; Y2 and Y3 settle a won-dispute row the two ways
    // it can and cannot be settled; Y4 and Y5 assert the idempotency anchor comes from the row;
    // Y6 races two staff on one row; Y7 and Y8 assert a re-file changes neither the meaning of the
    // amount nor which dispute it is about. Each one fails for the DEFECT and survives the rename.
    //
    // What stays here is the one claim that suite cannot make: that those checks exist at all, so
    // the coverage cannot be deleted while this check goes on passing.
    const routeSuite = readFileSync("scripts/verify-ix-rewards-route-behavior-01.ts", "utf8");
    for (const [name, what] of [
      ["Y1", "a refusal leaves the row open"],
      ["Y2", "a won-dispute row cannot be settled as a clawback"],
      ["Y3", "but CAN be closed by an audited no-action decision"],
      ["Y4", "a typed id that disagrees with the row is refused"],
      ["Y5", "a cumulative row is never keyed on a typed id"],
      ["Y6", "the claim is exclusive"],
      ["Y7", "a re-file keeps a cumulative amount cumulative"],
      ["Y8", "a re-file keeps the dispute it is about"],
    ] as const) {
      assert.ok(
        routeSuite.includes(`await check("${name}:`),
        `the executable check ${name} (${what}) must exist — this check no longer covers it`,
      );
    }

    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.ok(
      /resolution_outcome IN \('reversed', 'restored', 'no_action_required'\)/.test(sql),
      "and the database's outcome vocabulary admits it",
    );

    // THE QUEUE IS REACHABLE. A backlog nobody can navigate to is a silent drop with extra steps.
    const acl = readFileSync("app/admin/_lib/adminAccessControl.ts", "utf8");
    const navAt = acl.indexOf("export function getAllowedWorkspaceNavHrefs");
    assert.ok(navAt >= 0, "the workspace nav allowlist was located");
    const nav = acl.slice(navAt);
    for (const href of ["/admin/workspace/rewards", "/admin/workspace/rewards-refunds"]) {
      assert.ok(nav.includes(`"${href}"`), `${href} is reachable from the workspace navigation`);
    }
    // AND IT IS GATED BY THE SAME AUTHORITY THE SCREENS DEMAND.
    //
    // They rode `hasPaymentTrackerAccess` — owner_admin or any roster member with
    // `can_view_payments` — while both pages require a roster `super_admin`. A billing-support
    // member saw both links and was bounced to `/admin/team?access_denied=1` every time they
    // clicked: the dead end moved from the API to the navigation rather than closing.
    assert.ok(
      /if \(hasRewardsWorkspaceAccess\(ctx\)\) \{[\s\S]{0,400}\/admin\/workspace\/rewards-refunds/.test(nav),
      "the two rewards links ride the rewards gate, not the payment tracker's",
    );
    const navComponent = readFileSync("app/admin/_components/AdminWorkspaceNav.tsx", "utf8");
    assert.ok(navComponent.includes('"/admin/workspace/rewards-refunds"'), "and the nav component renders it");

    // AND THE SCREEN CAN ACTUALLY SETTLE EVERY STATE IT SHOWS.
    //
    // Won-dispute rows record credits the customer is OWED. With no restore control the only
    // safe-looking button was "no action", which closed the row having moved nothing and left the
    // customer permanently charged the rewards for a dispute they had won.
    const queueUi = readFileSync(
      "app/admin/(dashboard)/workspace/rewards-refunds/RewardsRefundQueueClient.tsx",
      "utf8",
    );
    assert.ok(/resolve\(row, "restored"\)/.test(queueUi), "the queue offers a RESTORE action");
    assert.ok(queueUi.includes("disputeId"), "and a field for the dispute id it needs");
    assert.ok(queueUi.includes("externalRef"), "and surfaces which dispute or refund the row is about");
    assert.ok(/statusFilter/.test(queueUi), "resolved rows can be reviewed, not just open ones");
  });

  await check("P9: the checkout control previews, never decides, and never claims expiry", () => {
    const panel = readFileSync("app/(site)/clasificados/components/LeonixCheckoutCreditsPanel.tsx", "utf8");
    assert.ok(panel.includes("maxRedeemableForPurchaseCents("), "the 50% ceiling comes from the policy module");
    assert.ok(panel.includes("REDEMPTION_MINIMUM_CENTS"), "and so does the $1 floor");
    assert.ok(panel.includes("REDEMPTION_RESERVATION_MINUTES"), "and the 30-minute hold");
    // Strip the file header: it EXPLAINS the rule, so matching it would be reading the comment
    // rather than the component. What matters is that no rendered string claims expiry.
    const panelCodeAt = panel.indexOf("import { useCallback");
    assert.ok(panelCodeAt > 0, "the component body was located — a missing marker would slice the file to one character and pass every negative assertion below");
    const panelCode = panel.slice(panelCodeAt);
    assert.ok(panelCode.length > 500, "and the body is the component, not a fragment");
    assert.ok(!/vencen|expire/i.test(panelCode), "no rendered string claims credits expire");
    for (const state of ['"loading"', '"ready"', '"signed_out"', '"empty"', '"error"']) {
      assert.ok(panel.includes(state), `the ${state} state exists`);
    }
    assert.ok(panel.includes("recoveryBalanceCopy("), "a recovery balance is EXPLAINED, not silently refused");

    const payload = readFileSync("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts", "utf8");
    assert.ok(payload.includes("requestedCreditsCents"), "the request carries the figure");
    const client = readFileSync("app/lib/listingPlans/revenueCategoryCheckoutClient.ts", "utf8");
    for (const field of ["creditsAppliedCents", "remainingDueCents", "creditsRefusedReason"]) {
      assert.ok(client.includes(field), `the caller reads back ${field} instead of discarding it`);
    }
    const checkpoint = readFileSync("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx", "utf8");
    assert.ok(
      /creditsEligible \?/.test(checkpoint) || /creditsEligible &&/.test(checkpoint),
      "the control is opt-in per category",
    );
    // ...AND IT NO LONGER EXCLUDES MONTHLY PLANS. It used to mount only when
    // `!basePackageIsMonthly`, with a notice in its place saying credits did not apply to monthly
    // plans. Credits now reach those plans through a first-invoice coupon, so that notice would be
    // false — and a notice that is no longer true is a defect, not merely stale copy.
    assert.ok(
      !/creditsEligible && !basePackageIsMonthly/.test(checkpoint),
      "the monthly exclusion is gone from the mount condition",
    );
    assert.ok(
      !/do not apply to monthly plans/i.test(checkpoint),
      "and the notice that said otherwise is gone with it",
    );
    // A customer applying credits to a subscription must be told the renewal price is unchanged.
    const creditsPanelSrc = readFileSync("app/(site)/clasificados/components/LeonixCheckoutCreditsPanel.tsx", "utf8");
    assert.ok(
      /recurringAmountCents/.test(creditsPanelSrc) && /al mes/.test(creditsPanelSrc) && /a month/.test(creditsPanelSrc),
      "the panel states the unchanged monthly price, in both languages",
    );
    // WHY THE CONTROL MOUNTS ON A MONTHLY PLAN NOW.
    //
    // It used to be hidden there, and correctly: the discount was applied by lowering a line item
    // that recurs monthly, so credits were refused on recurring plans by name. Mounting the
    // control anyway let the customer apply credits, read a green "Credits applied · Remaining to
    // pay", press pay, and be told it could not be done — a phantom discount with extra steps.
    //
    // Credits now reach those plans through a first-invoice coupon, so the action the control
    // offers is one the server will honour. What must stay true is the thing that made hiding it
    // right: the control must never promise something the server refuses. The refusal that
    // remains — a finite-term contract promo holding the single discount slot — is surfaced as a
    // named `creditsRefusedReason` rather than a silent full-price charge.
    assert.ok(
      /creditsRefusedReason/.test(
        readFileSync(
          "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
          "utf8",
        ),
      ),
      "and a refusal the server does make is surfaced, rather than silence",
    );
    // THE FIGURE HAS TO REACH THE CALLER. The control can be mounted, read a balance and preview a
    // discount, and still be decorative if the amount never leaves the component.
    assert.ok(
      /onRequestedCentsChange=\{setRequestedCreditsCents\}/.test(checkpoint),
      "the control reports the chosen amount upward",
    );
    const finalAction = checkpoint.slice(checkpoint.indexOf("const handleFinalAction ="), checkpoint.indexOf("const loadingLabel"));
    assert.ok(
      /void onCheckout\?\.\(\{[\s\S]*?requestedCreditsCents,/.test(finalAction),
      "and the checkout context carries it — otherwise the control is decorative",
    );
    const servicios = readFileSync("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx", "utf8");
    assert.ok(
      /\(ctx\.requestedCreditsCents \?\? 0\) > 0 && \(checkout\.creditsAppliedCents \?\? 0\) <= 0/.test(servicios),
      "a phantom discount stops the checkout instead of redirecting",
    );
    // AND THE CUSTOMER IS TOLD WHY, when the server said why. The generic "we could not apply your
    // credits" was all anyone ever saw, including for the one refusal that is permanent and has
    // nothing to do with their balance.
    assert.ok(
      /checkout\.creditsRefusedReason === "not_available_on_recurring_plan"/.test(servicios),
      "the server's refusal reason reaches the customer",
    );
  });


  // =========================================================================
  // SECTION Q — CONCURRENCY, PER-PAYMENT ACCOUNTING, AND DETERMINISTIC REPLAY
  //
  // Everything above drives one operation at a time. That is how a money defect survived: the
  // cumulative position a reversal computes against is read in its OWN round trip, so it is stale
  // the moment another delivery for the same payment commits. Sequentially the arithmetic is
  // exact; concurrently, two valid events each computed a delta against a position in which the
  // other had not landed and BOTH moved money.
  //
  // These checks interleave the real functions at their real await points, and every one of them
  // runs the same race twice: once against a store WITHOUT the payment-scoped ceiling, which
  // reproduces the measured defect, and once against the real store, which must land on exactly
  // the sequential answer. A check that only ever sees the repaired path cannot show the repair is
  // what does the work.
  // =========================================================================

  /** Net credits a payment has given back: reversals minus restorations. Never above its award. */
  function paymentPosition(entries: Array<{ paymentRecordId?: string | null; entryType: string; amountCents: number }>, paymentRecordId: string) {
    const rows = entries.filter((e) => e.paymentRecordId === paymentRecordId);
    const awarded = rows
      .filter((e) => e.entryType === "earn_pending" || e.entryType === "earn_available")
      .reduce((a, e) => a + e.amountCents, 0);
    const clawed = rows.reduce(
      (a, e) =>
        a +
        (e.entryType === "refund_reversal" || e.entryType === "chargeback_reversal"
          ? e.amountCents
          : e.entryType === "reversal_restoration"
            ? -e.amountCents
            : 0),
      0,
    );
    const disputeClaim = rows.reduce(
      (a, e) =>
        a +
        (e.entryType === "chargeback_reversal"
          ? e.amountCents
          : e.entryType === "reversal_restoration"
            ? -e.amountCents
            : 0),
      0,
    );
    const restored = rows.filter((e) => e.entryType === "reversal_restoration").reduce((a, e) => a + e.amountCents, 0);
    return { awarded, clawed, disputeClaim, restored };
  }

  const earnOn = (port: RewardsStorePort, paymentRecordId: string, paidCents: number, pending = false, owner: WalletOwnerRef = OWNER) =>
    earnFromSettledPayment({
      owner,
      paymentRecordId,
      facts: settled({ amountPaidCents: paidCents }),
      sourceKind: "stripe_payment",
      pendingUntilSettlementFinal: pending,
      ports: port,
    });

  await check("Q1: two concurrent PARTIAL refunds converge on the sequential total, not past it", async () => {
    // $100.00 paid, 900 credits awarded. Stripe reports a CUMULATIVE refunded figure per event, so
    // the two deliveries carry 5000 and 10000. Sequentially the deltas are 450 and 450.
    const run = async (withoutPaymentCeiling: boolean) => {
      const { port, entries, wallets } = makeStore({ withoutPaymentCeiling });
      await earnOn(port, "pay_q1", 10000);
      await Promise.all([
        reverseForRefundOrChargeback({ paymentRecordId: "pay_q1", kind: "refund", externalId: "re_q1a", eventRefundedCents: 5000, cumulativeRefundedCentsForKind: 5000, ports: port }),
        reverseForRefundOrChargeback({ paymentRecordId: "pay_q1", kind: "refund", externalId: "re_q1b", eventRefundedCents: 5000, cumulativeRefundedCentsForKind: 10000, ports: port }),
      ]);
      return { pos: paymentPosition(entries, "pay_q1"), wallet: [...wallets.values()][0]! };
    };

    // THE DEFECT, REPRODUCED. Without the ceiling both deliveries move, and the excess lands on the
    // customer as recovery debt they never owed — which also freezes their redemptions.
    const broken = await run(true);
    assert.equal(broken.pos.clawed, 1350, "the unguarded race must still reproduce the measured over-reversal");
    assert.ok((broken.wallet.recoveryCents ?? 0) > 0, "and the excess becomes debt the customer never owed");

    const fixed = await run(false);
    assert.equal(fixed.pos.awarded, 900, "the award is unchanged");
    assert.equal(fixed.pos.clawed, 900, "a fully refunded payment gives back exactly what it awarded");
    assert.equal(fixed.wallet.recoveryCents ?? 0, 0, "and no phantom debt is created");
  });

  await check("Q2: two concurrent FULL refund deliveries cannot claw back twice", async () => {
    // A rail that reports per-event amounts, delivered to two workers at once.
    const run = async (withoutPaymentCeiling: boolean) => {
      const { port, entries } = makeStore({ withoutPaymentCeiling });
      await earnOn(port, "pay_q2", 10000);
      await Promise.all([
        reverseForRefundOrChargeback({ paymentRecordId: "pay_q2", kind: "refund", externalId: "re_q2a", eventRefundedCents: 10000, ports: port }),
        reverseForRefundOrChargeback({ paymentRecordId: "pay_q2", kind: "refund", externalId: "re_q2b", eventRefundedCents: 10000, ports: port }),
      ]);
      return paymentPosition(entries, "pay_q2");
    };
    assert.equal((await run(true)).clawed, 1800, "the unguarded race reverses 200% of the award");
    assert.equal((await run(false)).clawed, 900, "guarded, the payment gives back exactly its award");
  });

  await check("Q3: a refund and a dispute landing together claw back the award ONCE", async () => {
    const run = async (withoutPaymentCeiling: boolean) => {
      const { port, entries } = makeStore({ withoutPaymentCeiling });
      await earnOn(port, "pay_q3", 10000);
      await Promise.all([
        reverseForRefundOrChargeback({ paymentRecordId: "pay_q3", kind: "refund", externalId: "re_q3", eventRefundedCents: 10000, ports: port }),
        reverseForRefundOrChargeback({ paymentRecordId: "pay_q3", kind: "chargeback", externalId: "dp_q3", eventRefundedCents: 10000, ports: port }),
      ]);
      return paymentPosition(entries, "pay_q3");
    };
    assert.equal((await run(true)).clawed, 1800, "the unguarded race double-claws a refunded-and-disputed payment");
    const fixed = await run(false);
    assert.equal(fixed.clawed, 900, "guarded, the money returned is accounted for once");
    // The loser records its basis at ZERO rather than moving credits, so a later won dispute on
    // that same dispute id correctly restores nothing: the dispute took nothing.
    assert.equal(fixed.disputeClaim, 0, "the dispute that took nothing can restore nothing");
  });

  await check("Q4: a WON dispute restores what THAT dispute took, not the payment's whole clawback", async () => {
    // $100.00 paid, 900 credits. TWO partial disputes of $50.00 each: each reverses 450.
    // Dispute 1 is WON; dispute 2 stays lost, so Leonix never gets that $50.00 back.
    const build = async () => {
      const { port, entries, wallets } = makeStore();
      await earnOn(port, "pay_q4", 10000, true);
      await reverseForRefundOrChargeback({ paymentRecordId: "pay_q4", kind: "chargeback", externalId: "dp_q4_1", eventRefundedCents: 5000, cumulativeRefundedCentsForKind: 5000, ports: port });
      await reverseForRefundOrChargeback({ paymentRecordId: "pay_q4", kind: "chargeback", externalId: "dp_q4_2", eventRefundedCents: 5000, cumulativeRefundedCentsForKind: 10000, ports: port });
      return { port, entries, wallets };
    };

    const { port, entries, wallets } = await build();
    assert.equal(paymentPosition(entries, "pay_q4").clawed, 900, "both disputes took 450 each");

    const restored = await restoreReversedCredits({ paymentRecordId: "pay_q4", externalId: "dp_q4_1", ports: port });
    assert.ok(restored.ok && restored.outcome === "restored");
    assert.equal(restored.ok && "restoredCents" in restored ? restored.restoredCents : -1, 450, "exactly what dispute 1 took");
    const w = [...wallets.values()][0]!;
    assert.equal(w.availableCents, 450, "the customer keeps rewards on the $50.00 they were not charged back");
    assert.equal(w.lifetimeRestoredCents ?? 0, 450, "and the payment's other dispute is untouched");

    // THE DATABASE REFUSES IT TOO, so a caller that computes the old payment-wide figure cannot
    // simply assert it. This is the backstop, not the primary path.
    const second = await build();
    const overreach = await restoreReversedCredits({ paymentRecordId: "pay_q4", externalId: "dp_q4_1", requestedCents: 900, ports: second.port });
    assert.equal(
      [...second.wallets.values()][0]!.lifetimeRestoredCents ?? 0,
      450,
      "an over-large request is clamped to the dispute's own clawback, never honoured",
    );
    assert.ok(overreach.ok, "and it is not an error for a caller to ask for more than is owed");

    // A dispute with no clawback of its own — `closed(won)` delivered before `created` — restores
    // nothing rather than helping itself to another dispute's.
    const third = await build();
    const orphan = await restoreReversedCredits({ paymentRecordId: "pay_q4", externalId: "dp_never_created", ports: third.port });
    assert.ok(orphan.ok && orphan.outcome === "nothing_to_restore", "an unknown dispute restores nothing");
    assert.equal([...third.wallets.values()][0]!.lifetimeRestoredCents ?? 0, 0, "and moves no credits");
  });

  await check("Q3b: the residual cap binds when the purchase is larger than what is still due", () => {
    // THE CAP NOTHING COULD REACH. Every redemption fixture in this suite omitted
    // `eligiblePurchaseCents`, so `purchase === amountDue` and half-of-purchase always bound first
    // — the rail-floor / amount-due cap could be deleted outright with all 179 checks green.
    // It binds only when the eligible PURCHASE is materially larger than what is still DUE, which
    // is the ordinary part-paid invoice and the promo-reduced residual.
    const plan = planRedemption({
      requestedCents: 100_000,
      availableCents: 100_000,
      // $10.00 still owed on a $1,000.00 purchase: half of the purchase is $500.00, so only the
      // residual can stop the customer wiping the invoice out below the rail's floor.
      amountDueCents: 1_000,
      eligiblePurchaseCents: 100_000,
    });
    assert.ok(plan.ok, "a redemption is possible");
    assert.equal(plan.ok && plan.redeemCents, 950, "capped to leave the rail's 50-cent floor payable");
    assert.equal(plan.ok && plan.remainingDueCents, DEFAULT_RAIL_MINIMUM_CHARGE_CENTS, "which is exactly what remains due");
    assert.equal(plan.ok && plan.cappedBy, "minimum_charge", "and the reason names the rail, not the balance");

    // With a rail that CAN settle at zero, the same request takes the whole residual and no more.
    const counter = planRedemption({
      requestedCents: 100_000,
      availableCents: 100_000,
      amountDueCents: 1_000,
      eligiblePurchaseCents: 100_000,
      allowZeroCharge: true,
    });
    assert.equal(counter.ok && counter.redeemCents, 1_000, "a cash rail may be settled to zero");
    assert.equal(counter.ok && counter.remainingDueCents, 0, "leaving nothing to pay");
    assert.equal(counter.ok && counter.cappedBy, "amount_due", "capped by the invoice itself");

    // And a caller-supplied floor is honoured only when it is STRICTER than the canonical one.
    const looser = planRedemption({ requestedCents: 100_000, availableCents: 100_000, amountDueCents: 1_000, eligiblePurchaseCents: 100_000, minimumChargeCents: 10 });
    assert.equal(looser.ok && looser.remainingDueCents, DEFAULT_RAIL_MINIMUM_CHARGE_CENTS, "a looser floor is ignored");
    const stricter = planRedemption({ requestedCents: 100_000, availableCents: 100_000, amountDueCents: 1_000, eligiblePurchaseCents: 100_000, minimumChargeCents: 200 });
    assert.equal(stricter.ok && stricter.remainingDueCents, 200, "a stricter one is honoured");
  });

  await check("Q4b: two WON disputes restoring CONCURRENTLY each give back only their own", async () => {
    const { port, entries, wallets } = makeStore();
    await earnOn(port, "pay_q4b", 10000, true);
    await reverseForRefundOrChargeback({ paymentRecordId: "pay_q4b", kind: "chargeback", externalId: "dpb_1", eventRefundedCents: 5000, cumulativeRefundedCentsForKind: 5000, ports: port });
    await reverseForRefundOrChargeback({ paymentRecordId: "pay_q4b", kind: "chargeback", externalId: "dpb_2", eventRefundedCents: 5000, cumulativeRefundedCentsForKind: 10000, ports: port });
    await Promise.all([
      restoreReversedCredits({ paymentRecordId: "pay_q4b", externalId: "dpb_1", ports: port }),
      restoreReversedCredits({ paymentRecordId: "pay_q4b", externalId: "dpb_2", ports: port }),
    ]);
    const pos = paymentPosition(entries, "pay_q4b");
    assert.equal(pos.restored, 900, "both disputes were won, so both clawbacks come back");
    assert.equal(pos.clawed, 0, "and the payment ends with nothing clawed back");
    const w = [...wallets.values()][0]!;
    assert.equal(w.availableCents, 900, "the customer is whole, and no further");
    assert.equal(
      entries.filter((e) => e.entryType === "reversal_restoration").length,
      2,
      "one restoration per dispute, whatever the interleaving",
    );
  });

  await check("Q5: a duplicate delivery of the SAME refund object moves money once, even racing itself", async () => {
    const { port, entries, wallets } = makeStore();
    await earnOn(port, "pay_q5", 10000);
    const both = await Promise.all([
      reverseForRefundOrChargeback({ paymentRecordId: "pay_q5", kind: "refund", externalId: "re_q5", eventRefundedCents: 5000, ports: port }),
      reverseForRefundOrChargeback({ paymentRecordId: "pay_q5", kind: "refund", externalId: "re_q5", eventRefundedCents: 5000, ports: port }),
    ]);
    const rows = entries.filter((e) => e.idempotencyKey === reversalIdempotencyKey("refund", "re_q5"));
    assert.equal(rows.length, 1, "one refund object, one ledger row");
    assert.equal(paymentPosition(entries, "pay_q5").clawed, 450, "and exactly one proportional clawback");
    assert.equal([...wallets.values()][0]!.availableCents, 450, "the balance reflects one reversal");
    assert.ok(both.some((r) => r.ok && "deduplicated" in r && r.deduplicated === true), "the replay reports that nothing moved");
  });

  await check("Q6: the retry never burns the idempotency key — one event, one row, exact total", async () => {
    // Losing the race must not write a zero-amount basis row under the event's key: that key is
    // permanent, so the event could never be recomputed and the payment would under-reverse for
    // ever. The loser recomputes and posts its REAL delta instead.
    const { port, entries } = makeStore();
    await earnOn(port, "pay_q6", 10000);
    await Promise.all([
      reverseForRefundOrChargeback({ paymentRecordId: "pay_q6", kind: "refund", externalId: "re_q6a", eventRefundedCents: 2500, cumulativeRefundedCentsForKind: 2500, ports: port }),
      reverseForRefundOrChargeback({ paymentRecordId: "pay_q6", kind: "refund", externalId: "re_q6b", eventRefundedCents: 2500, cumulativeRefundedCentsForKind: 5000, ports: port }),
    ]);
    for (const id of ["re_q6a", "re_q6b"]) {
      assert.equal(
        entries.filter((e) => e.idempotencyKey === reversalIdempotencyKey("refund", id)).length,
        1,
        `${id} produced exactly one ledger row`,
      );
    }
    // $50.00 of a $100.00 payment went back; 9% of that is 450.
    assert.equal(paymentPosition(entries, "pay_q6").clawed, 450, "and the cumulative total is exactly proportional");
  });

  await check("Q7: two checkouts racing for the same balance cannot both reserve it", async () => {
    const { port, wallets } = makeStore();
    await earnOn(port, "pay_q7", 100000); // 9000 credits
    const [a, b] = await Promise.all([
      reserveCreditsForPurchase({ owner: OWNER, requestedCents: 9000, amountDueCents: 50000, redemptionRef: "q7a", contextKind: "stripe_checkout", ports: port }),
      reserveCreditsForPurchase({ owner: OWNER, requestedCents: 9000, amountDueCents: 50000, redemptionRef: "q7b", contextKind: "stripe_checkout", ports: port }),
    ]);
    const w = [...wallets.values()][0]!;
    assert.equal(w.availableCents + w.reservedCents, 9000, "no credit is created or lost by the race");
    assert.ok(w.reservedCents <= 9000, "the wallet never holds more than it has");
    assert.equal([a, b].filter((r) => r.ok).length, 1, "exactly one checkout gets the balance");
  });

  await check("Q8: a commit and a release racing the same hold settle it exactly once", async () => {
    const { port, wallets, entries } = makeStore();
    await earnOn(port, "pay_q8", 100000);
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 5000, amountDueCents: 50000, redemptionRef: "q8", contextKind: "stripe_checkout", ports: port });
    const [c, r] = await Promise.all([
      commitReservedCredits({ redemptionRef: "q8", ports: port }),
      releaseReservedCredits({ redemptionRef: "q8", ports: port }),
    ]);
    const w = [...wallets.values()][0]!;
    assert.equal(w.reservedCents, 0, "the hold is settled");
    // Committed => the credits are spent (available 4000, redeemed 5000).
    // Released  => the credits come back (available 9000, redeemed 0).
    const committed = w.lifetimeRedeemedCents === 5000 && w.availableCents === 4000;
    const released = w.lifetimeRedeemedCents === 0 && w.availableCents === 9000;
    assert.ok(committed || released, `exactly one outcome, got available=${w.availableCents} redeemed=${w.lifetimeRedeemedCents}`);
    const settlements = entries.filter((e) => e.entryType === "redeem_commit" || e.entryType === "redeem_release" || e.entryType === "redeem_recommit");
    assert.equal(settlements.length, 1, "and exactly one settling ledger row");
    assert.equal([c, r].filter((x) => x.ok && "outcome" in x && (x.outcome === "committed" || x.outcome === "released")).length, 1, "only one caller settled it");
  });

  await check("Q9: the expiry sweep racing a commit never lets both movements land", async () => {
    const base = Date.UTC(2026, 0, 1);
    let clock = base;
    const { port, wallets, entries } = makeStore({ now: () => clock });
    await earnOn(port, "pay_q9", 100000);
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 5000, amountDueCents: 50000, redemptionRef: "q9", contextKind: "stripe_checkout", nowMs: clock, ports: port });
    clock = base + (REDEMPTION_RESERVATION_MINUTES + 1) * 60_000;
    await Promise.all([
      runReservationExpirySweep({ nowMs: clock, limit: 10, ports: port }),
      commitReservedCredits({ redemptionRef: "q9", ports: port }),
    ]);
    const w = [...wallets.values()][0]!;
    assert.equal(w.reservedCents, 0, "nothing is stranded in reserved");
    assert.equal(w.availableCents + w.lifetimeRedeemedCents, 9000, "credits are neither created nor destroyed by the race");
    const reserves = entries.filter((e) => e.entryType === "redeem_reserve").length;
    const settles = entries.filter((e) => ["redeem_commit", "redeem_release", "redeem_recommit"].includes(e.entryType)).length;
    assert.ok(settles <= reserves + 1, "no settlement without a matching hold");
  });

  await check("Q10: an earn racing a clawback leaves no negative bucket and no phantom debt", async () => {
    const { port, wallets } = makeStore();
    await earnOn(port, "pay_q10a", 10000);
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 10000, redemptionRef: "q10", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "q10", ports: port });
    await Promise.all([
      reverseForRefundOrChargeback({ paymentRecordId: "pay_q10a", kind: "refund", externalId: "re_q10", eventRefundedCents: 10000, ports: port }),
      earnOn(port, "pay_q10b", 10000),
    ]);
    const w = [...wallets.values()][0]!;
    for (const [name, v] of [["pending", w.pendingCents], ["available", w.availableCents], ["reserved", w.reservedCents], ["recovery", w.recoveryCents ?? 0]] as const) {
      assert.ok(v >= 0, `${name} must never be negative (got ${v})`);
    }
    // Earned 1800 across two payments, spent 900, clawed back 900. Whatever the interleaving, the
    // customer's net position is zero: either the debt was repaid by the new earn, or the new earn
    // was consumed by the clawback.
    assert.equal(w.availableCents - (w.recoveryCents ?? 0), 0, "the net position is the same under either interleaving");
  });

  await check("Q11: PROPERTY — no payment ever gives back more credits than it awarded", async () => {
    // A randomised event stream over several payments on ONE wallet, mixing sequential and
    // concurrent delivery. The per-payment invariant is what the aggregate bucket model cannot
    // state on its own, and it is the one an adversarial review broke.
    let state = 20260921;
    const rnd = (n: number) => {
      // xorshift — deterministic, so a failure is reproducible from the seed printed below.
      state ^= state << 13; state >>>= 0;
      state ^= state >> 17;
      state ^= state << 5; state >>>= 0;
      return state % n;
    };
    for (let trial = 0; trial < 40; trial += 1) {
      const { port, entries, wallets } = makeStore();
      const payments: string[] = [];
      for (let i = 0; i < 3; i += 1) {
        const id = `t${trial}_p${i}`;
        payments.push(id);
        await earnOn(port, id, 5000 + rnd(20) * 1000, rnd(2) === 0);
      }
      const ops: Array<() => Promise<unknown>> = [];
      for (let i = 0; i < 6; i += 1) {
        const target = payments[rnd(payments.length)]!;
        const kind: "refund" | "chargeback" = rnd(2) === 0 ? "refund" : "chargeback";
        const ext = `${kind}_${trial}_${i}`;
        const amount = 1000 + rnd(30) * 1000;
        ops.push(() =>
          reverseForRefundOrChargeback({ paymentRecordId: target, kind, externalId: ext, eventRefundedCents: amount, ports: port }),
        );
        if (rnd(3) === 0) {
          ops.push(() => restoreReversedCredits({ paymentRecordId: target, externalId: ext, ports: port }));
        }
      }
      // Half the trials deliver concurrently, half sequentially.
      if (trial % 2 === 0) await Promise.all(ops.map((f) => f()));
      else for (const f of ops) await f();

      for (const id of payments) {
        const pos = paymentPosition(entries, id);
        assert.ok(
          pos.clawed <= pos.awarded,
          `trial ${trial} (seed 20260921): payment ${id} gave back ${pos.clawed} of an award of ${pos.awarded}`,
        );
        assert.ok(pos.clawed >= 0, `trial ${trial}: payment ${id} has a negative net clawback (${pos.clawed})`);
        assert.ok(
          pos.restored <= pos.restored + pos.disputeClaim,
          `trial ${trial}: payment ${id} restored ${pos.restored} against a dispute claim of ${pos.disputeClaim}`,
        );
      }
      const w = [...wallets.values()][0]!;
      for (const [name, v] of [["pending", w.pendingCents], ["available", w.availableCents], ["reserved", w.reservedCents], ["recovery", w.recoveryCents ?? 0]] as const) {
        assert.ok(v >= 0, `trial ${trial}: ${name} went negative (${v})`);
      }

      // THE WALLET ACCOUNTING IDENTITY. The per-payment ceiling above says no payment gives back
      // more than it awarded; this says the WALLET's books close. Every credit is in exactly one
      // of four places: still held, spent, clawed back, or used to repay a debt — and the only
      // sources are earning and restoration.
      //
      //   held + spent + clawed back  ==  earned + restored − repaid
      //
      // `lifetime_recovery_offset_cents` appears NEGATIVE because a repayment consumes an earn (or
      // a restoration) without ever reaching a bucket: it is value that was counted as earned and
      // then immediately owed away. This stream generates no standalone `recovery_offset` entry —
      // a staff write-off — which is the one movement that would need its own term.
      const held = w.pendingCents + w.availableCents + w.reservedCents;
      assert.equal(
        held + w.lifetimeRedeemedCents + w.lifetimeReversedCents,
        w.lifetimeEarnedCents + (w.lifetimeRestoredCents ?? 0) - (w.lifetimeRecoveryOffsetCents ?? 0),
        `trial ${trial}: the wallet's books do not close — held ${held}, redeemed ${w.lifetimeRedeemedCents}, ` +
          `reversed ${w.lifetimeReversedCents}, earned ${w.lifetimeEarnedCents}, ` +
          `restored ${w.lifetimeRestoredCents ?? 0}, repaid ${w.lifetimeRecoveryOffsetCents ?? 0}`,
      );

      // And the debt is exactly what was accrued minus what has been repaid — never invented.
      assert.equal(
        w.recoveryCents ?? 0,
        (w.lifetimeRecoveryAccruedCents ?? 0) - (w.lifetimeRecoveryOffsetCents ?? 0),
        `trial ${trial}: the outstanding debt disagrees with its own history`,
      );
    }
  });

  await check("Q12: PROPERTY — the replay reproduces the live wallet for every randomised stream", async () => {
    // THE GENERATOR HAS TO SURVIVE THE MULTIPLY.
    //
    // This was `state = (state * 1103515245 + 12345) >>> 0`, and `state * 1103515245` reaches ~2^62
    // as a double — so the low bits are ROUNDED AWAY before the mask. Measured from the seed this
    // check uses: `rnd(4)` returned 0 forty times running and `rnd(2)` returned 0 forty times
    // running. Every earn was pending, every operation was a refund reversal, and the whole
    // randomised replay test exercised TWO of the thirteen replay arms — while being the sole
    // justification for writing `replayInto` separately from `deltasFor`. Four arms of the replay
    // could be broken with the suite green.
    //
    // `Math.imul` is a 32-bit multiply that keeps the low bits, which is the half that carries the
    // entropy. The arm census at the end of this check is what stops it silently regressing again.
    let state = 991;
    const rnd = (n: number) => {
      state = (Math.imul(state, 1103515245) + 12345) >>> 0;
      return (state >>> 8) % n;
    };
    const armsSeen = new Set<string>();
    for (let trial = 0; trial < 25; trial += 1) {
      const { port, wallets, recompute, entries } = makeStore({ now: () => Date.UTC(2026, 0, 1) });
      const payments: string[] = [];
      for (let i = 0; i < 3; i += 1) {
        const id = `r${trial}_p${i}`;
        payments.push(id);
        await earnOn(port, id, 4000 + rnd(30) * 1000, rnd(2) === 0);
      }
      // Disputes that actually happened, so a restoration has something real to give back. Aiming
      // one at an invented id restores nothing, which is correct behaviour and useless coverage:
      // it is why the `reversal_restoration` arm was never reached even after the generator was
      // repaired.
      const disputes: Array<{ payment: string; externalId: string }> = [];
      for (let i = 0; i < 8; i += 1) {
        const target = payments[rnd(payments.length)]!;
        switch (rnd(4)) {
          case 0:
            await reverseForRefundOrChargeback({ paymentRecordId: target, kind: "refund", externalId: `rr${trial}_${i}`, eventRefundedCents: 1000 + rnd(20) * 1000, ports: port });
            break;
          case 1: {
            const externalId = `rc${trial}_${i}`;
            await reverseForRefundOrChargeback({ paymentRecordId: target, kind: "chargeback", externalId, eventRefundedCents: 1000 + rnd(20) * 1000, ports: port });
            disputes.push({ payment: target, externalId });
            break;
          }
          case 2: {
            if (disputes.length === 0) break;
            const won = disputes[rnd(disputes.length)]!;
            await restoreReversedCredits({ paymentRecordId: won.payment, externalId: won.externalId, ports: port });
            break;
          }
          default: {
            const ref = `rx${trial}_${i}`;
            const reserved = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 100 + rnd(20) * 100, amountDueCents: 50000, redemptionRef: ref, contextKind: "stripe_checkout", ports: port });
            if (reserved.ok) {
              if (rnd(2) === 0) await commitReservedCredits({ redemptionRef: ref, ports: port });
              else await releaseReservedCredits({ redemptionRef: ref, ports: port });
            }
            break;
          }
        }
      }
      // A DEBT, AND THEN AN EARN THAT REPAYS IT — on a wallet of its own, so the outcome does not
      // depend on what the random stream happened to leave in the first wallet's buckets.
      //
      // Left to the generator this never happened in ANY trial, so the replay's
      // recovery-repayment branch — the one arm whose mutation the SQL suite caught and the mirror
      // did not — was never replayed at all.
      const debtPayment = `r${trial}_debt`;
      await earnOn(port, debtPayment, 20000, false, OTHER_OWNER); // 1800 spendable
      const spendRef = `rx${trial}_spend`;
      const spend = await reserveCreditsForPurchase({ owner: OTHER_OWNER, requestedCents: 1800, amountDueCents: 50000, redemptionRef: spendRef, contextKind: "stripe_checkout", ports: port });
      assert.ok(spend.ok, `trial ${trial}: the debt fixture could not spend its credits`);
      await commitReservedCredits({ redemptionRef: spendRef, ports: port });
      // The credits are gone, so the clawback cannot be covered and becomes debt.
      await reverseForRefundOrChargeback({ paymentRecordId: debtPayment, kind: "refund", externalId: `rd${trial}`, eventRefundedCents: 20000, ports: port });
      // ...and the next earnings settle it before any of them become spendable.
      await earnOn(port, `r${trial}_repay`, 30000, true, OTHER_OWNER);

      const debtWallet = await walletOf(port, OTHER_OWNER);
      assert.ok(
        (debtWallet.lifetimeRecoveryAccruedCents ?? 0) > 0,
        `trial ${trial}: the debt fixture created no recovery debt`,
      );
      assert.ok(
        (debtWallet.lifetimeRecoveryOffsetCents ?? 0) > 0,
        `trial ${trial}: and no earn repaid any of it`,
      );

      // EVERY wallet in the store replays, not just the first one.
      for (const live of wallets.values()) {
        for (const e of entries) if (e.walletId === live.id) armsSeen.add(e.entryType);
        const replayed = recompute(live.id);
        for (const field of ["pendingCents", "availableCents", "reservedCents", "lifetimeEarnedCents", "lifetimeRedeemedCents", "lifetimeReversedCents", "recoveryCents", "lifetimeRecoveryAccruedCents", "lifetimeRecoveryOffsetCents", "lifetimeRestoredCents"] as const) {
          assert.equal(
            replayed[field] ?? 0,
            live[field] ?? 0,
            `trial ${trial}: replay disagrees with the live wallet on ${field}`,
          );
        }
      }
    }

    // THE CENSUS. A parity test proves nothing about an arm it never reaches, and a generator that
    // quietly stops generating is invisible without this. Every arm the streams above are built to
    // produce must actually have been produced.
    for (const arm of [
      "earn_pending",
      "earn_available",
      "refund_reversal",
      "chargeback_reversal",
      "reversal_restoration",
      "redeem_reserve",
      "redeem_commit",
      "redeem_release",
    ]) {
      assert.ok(
        armsSeen.has(arm),
        `the randomised streams never posted a ${arm} — they reached only ${[...armsSeen].sort().join(", ")}`,
      );
    }
  });

  await check("Q12b: the replay mirror REFUSES an inconsistent ledger, exactly as SQL does", async () => {
    // A parity mirror that accepts a history the database would reject is not a mirror. This is
    // the one refusal `leonix_rewards_recompute_wallet` has, and the TS side had no equivalent.
    const frozen = Date.UTC(2026, 0, 1);
    const { port, wallets, entries, recompute } = makeStore({ now: () => frozen });
    await earnOn(port, "pay_q12b", 10000); // 900 available
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 10000, redemptionRef: "q12b", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "q12b", ports: port });
    const wallet = [...wallets.values()][0]!;
    assert.doesNotThrow(() => recompute(wallet.id), "a consistent ledger replays cleanly");

    // Put the history into an order that never happened: the commit before the earn that funded
    // it. Nothing in production can do this — the ledger is append-only and `entry_seq` is drawn
    // under the wallet lock — which is exactly why the refusal needs a test that can.
    const earn = entries.find((e) => e.entryType === "earn_available")!;
    const commit = entries.find((e) => e.entryType === "redeem_commit")!;
    const earnSeq = earn.entrySeq;
    earn.entrySeq = commit.entrySeq + 1;
    commit.entrySeq = earnSeq;
    assert.throws(
      () => recompute(wallet.id),
      /replays to a negative bucket at entry_seq/,
      "and an impossible one is refused, naming the entry it broke on",
    );
  });

  await check("Q13: replay order is the POSTING order, not the clock or the id string", async () => {
    // Every entry here shares one millisecond, and there are more than nine of them. The store used
    // to break that tie on the synthetic id, where `e10` sorts before `e9` as a STRING — replaying
    // a history that never happened, in an order where the path-dependent reversal takes from a
    // different bucket. SQL replays by `entry_seq`, so the mirror must too.
    const frozen = Date.UTC(2026, 0, 1);
    const { port, wallets, recompute, entries } = makeStore({ now: () => frozen });
    await earnOn(port, "pay_q13", 200000, true);       // 18000 pending
    for (let i = 0; i < 6; i += 1) {
      await reverseForRefundOrChargeback({ paymentRecordId: "pay_q13", kind: "refund", externalId: `re_q13_${i}`, eventRefundedCents: 10000, cumulativeRefundedCentsForKind: 10000 * (i + 1), ports: port });
    }
    await earnOn(port, "pay_q13b", 50000);             // 4500 available
    const ref = "q13";
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 50000, redemptionRef: ref, contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: ref, ports: port });

    const wallet = [...wallets.values()][0]!;
    const walletEntries = entries.filter((e) => e.walletId === wallet.id);
    assert.ok(walletEntries.length >= 10, `the tie-break is actually exercised (${walletEntries.length} entries in one millisecond)`);
    assert.equal(new Set(walletEntries.map((e) => e.createdAtMs)).size, 1, "every entry shares one timestamp");
    // The sequence is dense and strictly increasing in posting order.
    const seqs = walletEntries.map((e) => e.entrySeq);
    assert.deepEqual(seqs, [...seqs].sort((a, b) => a - b), "entry_seq records the order movements serialized");
    const replayed = recompute(wallet.id);
    assert.equal(replayed.pendingCents, wallet.pendingCents, "pending replays exactly");
    assert.equal(replayed.availableCents, wallet.availableCents, "available replays exactly");
    assert.equal(replayed.lifetimeReversedCents, wallet.lifetimeReversedCents, "reversed replays exactly");
    assert.equal(replayed.recoveryCents ?? 0, wallet.recoveryCents ?? 0, "recovery replays exactly");
  });

  await check("Q14: SQL bounds a reversal and a restoration BY PAYMENT, under the wallet lock", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const fn = sql.slice(
      sql.indexOf("FUNCTION public.leonix_rewards_post_entry"),
      sql.indexOf("COMMENT ON FUNCTION public.leonix_rewards_post_entry"),
    );
    // The lock has to come FIRST, or the position is read outside it and the guard is decorative.
    const lockAt = fn.indexOf("FROM public.leonix_rewards_wallets WHERE id = p_wallet_id FOR UPDATE");
    assert.ok(lockAt > 0, "the wallet row is locked");
    const reversalArm = fn.slice(fn.indexOf("WHEN 'refund_reversal', 'chargeback_reversal' THEN"), fn.indexOf("WHEN 'manual_adjustment' THEN"));
    assert.ok(fn.indexOf("WHEN 'refund_reversal'") > lockAt, "and the CASE runs inside the lock");
    // The bound is computed FROM THE LEDGER, not taken from the caller.
    assert.ok(/SELECT COALESCE\(SUM\(l\.amount_cents\), 0\) INTO v_payment_earned/.test(reversalArm), "the payment's award is read from the ledger");
    assert.ok(/INTO v_payment_claimed/.test(reversalArm), "and so is what has already been claimed against it");
    assert.ok(/reversal_restoration'\s*\n?\s*THEN -l\.amount_cents/.test(reversalArm.replace(/\s+/g, " ").replace(/reversal_restoration' THEN -l\.amount_cents/, "reversal_restoration'\nTHEN -l.amount_cents")) || /reversal_restoration'\s+THEN -l\.amount_cents/.test(reversalArm), "a restoration returns claim rather than adding it");
    assert.ok(/IF p_amount_cents > v_payment_earned - v_payment_claimed THEN/.test(reversalArm), "and a reversal beyond the remaining claim is refused");
    assert.ok(/leonix_rewards_position_moved/.test(reversalArm), "under a name the caller can tell apart from a balance refusal");
    assert.ok(/USING ERRCODE = 'LX001'/.test(reversalArm), "and its own SQLSTATE");

    const restoreArm = fn.slice(fn.indexOf("WHEN 'reversal_restoration' THEN"), fn.indexOf("WHEN 'recovery_accrue' THEN"));
    assert.ok(/chargeback_reversal' THEN l\.amount_cents/.test(restoreArm), "a restoration is bounded by the DISPUTE's clawback");
    assert.ok(!/refund_reversal/.test(restoreArm.slice(restoreArm.indexOf("INTO v_payment_claimed"))), "never by a separate refund's");
    assert.ok(/leonix_rewards_position_moved: restoration/.test(restoreArm), "and its race is named too");

    // Both arms REQUIRE a payment, or the bound could be skipped by omitting one.
    for (const arm of [reversalArm, restoreArm]) {
      assert.ok(/IF p_payment_record_id IS NULL THEN[\s\S]{0,300}RAISE EXCEPTION/.test(arm), "the bound cannot be skipped by omitting the payment");
    }
  });

  await check("Q15: the store mirrors the SQL payment bound, and the adapter names the race apart", () => {
    // PARITY, IN BOTH DIRECTIONS. If the mirror drops the bound, SECTION Q's races go green
    // against a store that is no longer the database.
    const suite = readFileSync("scripts/verify-ix-rewards-behavior-01.ts", "utf8");
    const storePost = suite.slice(suite.indexOf("    async postEntry(input) {"), suite.indexOf("    async createRedemption(input) {"));
    assert.ok(storePost.includes("REVERSAL_POSITION_MOVED"), "the mirror refuses a moved position by the same name");
    assert.ok(storePost.includes('error: "payment_record_id_required"'), "and requires the payment the bound is measured against");
    assert.ok(/earnedForPayment - claimed/.test(storePost), "and computes the same remaining claim");
    assert.ok(/disputeClaim/.test(storePost), "and bounds a restoration by the dispute's own clawback");

    const adapter = readFileSync("app/lib/rewards/rewardsLedger.ts", "utf8");
    const postBlock = adapter.slice(adapter.indexOf("    async postEntry(input: LedgerEntryInput) {"), adapter.indexOf("    async createRedemption(input) {"));
    const movedAt = postBlock.indexOf("REVERSAL_POSITION_MOVED");
    const refusedAt = postBlock.indexOf("negative_balance_refused");
    assert.ok(movedAt > 0, "the adapter maps the race to its own error");
    assert.ok(movedAt < refusedAt, "and does so BEFORE collapsing everything into a balance refusal");
    assert.ok(postBlock.includes('"LX001"') || postBlock.includes("PG_POSITION_MOVED"), "keyed on the SQLSTATE the function raises");
    assert.ok(postBlock.includes("leonix_rewards_position_moved"), "and on the message token, because PostgREST does not always surface a SQLSTATE");

    const core = readFileSync("app/lib/rewards/rewardsLedgerCore.ts", "utf8");
    assert.ok(/if \(posted\.error === REVERSAL_POSITION_MOVED\) return POSITION_RETRY;/.test(core), "the core recomputes rather than recording a basis it would be stuck with");

    // BOTH POSITION-DEPENDENT PATHS SEND THE TOKEN, and both read it BEFORE the sums it vouches
    // for. Only the reversal path was covered; the restoration path's token had no coverage at all
    // even though its own comment calls it load-bearing. The database now refuses a
    // position-dependent movement that arrives without one, so an omission is loud rather than
    // silent — but a path that stopped sending it would simply start failing in production, which
    // is why it is asserted here too.
    for (const fnName of ["attemptReversal", "attemptRestoration"]) {
      const at = core.indexOf(`async function ${fnName}(`);
      assert.ok(at > 0, `${fnName} was found`);
      const body = core.slice(at, core.indexOf("\n}\n", at));
      assertOrder(
        body,
        "countPaymentPositionRows(",
        "await Promise.all([",
        `${fnName} reads the position token BEFORE the sums it vouches for`,
      );
      assert.ok(
        /expectedPositionRows: positionRows,/.test(body),
        `${fnName} sends the token with the movement`,
      );
    }
    const sqlForToken = readFileSync(MIGRATION_PATH, "utf8");
    assert.equal(
      (sqlForToken.match(/requires p_expected_position_rows/g) ?? []).length,
      2,
      "and the database REQUIRES it for both, rather than defaulting it away",
    );
    assertOrder(
      core,
      "if (posted.error === REVERSAL_POSITION_MOVED) return POSITION_RETRY;",
      "THE BASIS SURVIVES A REFUSED MOVEMENT",
      "a lost race recomputes before anything can burn the key",
    );
    // AND THE BASIS ROW IS WRITTEN ONLY FOR A REAL REFUSAL. A dropped connection is not a decision
    // about money, and a zero-amount row under `reverse:<kind>:<id>` burns that refund's key for
    // ever: the redelivery deduplicates against it and the staff queue cannot settle it either.
    assert.ok(
      /if \(posted\.error !== "negative_balance_refused"\) \{[\s\S]{0,200}basisRecorded: false/.test(core),
      "an infrastructure error returns retryably with nothing written",
    );
  });

  await check("Q16: the ORIGINAL wallet is debited even when ownership would resolve elsewhere", async () => {
    // BEHAVIOURAL, not textual. The store is rigged so that re-resolving the owner at reversal or
    // restoration time would return a DIFFERENT wallet. Only reading the wallet off the earn entry
    // lands the movement where the credits actually went.
    const { port, wallets, entries } = makeStore();
    await earnOn(port, "pay_q16", 10000);
    const originalWalletId = [...wallets.values()][0]!.id;
    const decoy = await port.resolveWallet(OTHER_OWNER);
    assert.ok(decoy.ok);
    const decoyWalletId = decoy.ok ? decoy.wallet.id : "";
    assert.notEqual(decoyWalletId, originalWalletId);

    // From here on, ANY ownership re-resolution answers with the decoy wallet.
    const rigged: RewardsStorePort = {
      ...port,
      async resolveWallet() {
        const w = await port.getWalletById(decoyWalletId);
        return w ? { ok: true as const, wallet: w } : { ok: false as const, error: "missing" };
      },
    };

    await reverseForRefundOrChargeback({ paymentRecordId: "pay_q16", kind: "chargeback", externalId: "dp_q16", eventRefundedCents: 10000, ports: rigged });
    await restoreReversedCredits({ paymentRecordId: "pay_q16", externalId: "dp_q16", ports: rigged });

    for (const type of ["chargeback_reversal", "reversal_restoration"]) {
      const row = entries.find((e) => e.entryType === type && e.paymentRecordId === "pay_q16");
      assert.ok(row, `${type} was posted`);
      assert.equal(row!.walletId, originalWalletId, `${type} must debit the wallet the earn credited`);
    }
    const decoyWallet = wallets.get(decoyWalletId)!;
    assert.equal(decoyWallet.availableCents, 0, "the wallet ownership would resolve to today is untouched");
    assert.equal(decoyWallet.lifetimeReversedCents, 0, "in both directions");
    assert.equal(wallets.get(originalWalletId)!.availableCents, 900, "and the original wallet ends whole after the dispute is won");
  });


  // =========================================================================
  // SECTION R — THE SEAMS. Checkout identity, recurring pricing, the unfunded
  // hold, the won dispute's aftermath, and the paths that used to fail silently.
  // =========================================================================

  await check("R1: spending credits requires an identity this SERVER verified", () => {
    const route = readFileSync("app/api/revenue-os/checkout/route.ts", "utf8");

    // `ownerUserId` still falls back to the body when no bearer token is present — a guest
    // checkout has no session and the field is an attribution hint there. It is NOT an acceptable
    // input to a wallet: with no Authorization header at all, a request naming any customer's auth
    // id had that customer's balance planned, held and spent on the attacker's listing.
    assert.ok(
      /const creditsOwnerUserId = serverVerifiedOwnerUserId \?\? bearerUserId \?\? null;/.test(route),
      "credits resolve through a server-verified identity only",
    );
    assert.ok(
      !/creditsOwnerUserId[^\n]*body\.ownerUserId/.test(route),
      "and that identity is never read from the request body",
    );
    // Both wallet-touching calls take it. Planning against the victim is enough to leak a balance;
    // reserving against them spends it.
    for (const call of ["planCheckoutCredits({", "reserveCheckoutCredits({"]) {
      const at = route.indexOf(call);
      assert.ok(at > 0, `${call} is present`);
      const block = route.slice(at, at + 400);
      assert.ok(
        /ownerUserId: creditsOwnerUserId,/.test(block),
        `${call} is given the verified identity, not the request's`,
      );
    }
    // AND THE SOURCE OF THAT IDENTITY IS WATCHED, not just the line that reads it.
    //
    // An adversarial review defeated the assertion above without touching it: it left
    // `creditsOwnerUserId = serverVerifiedOwnerUserId ?? bearerUserId ?? null` exactly as written
    // and poisoned the SOURCE instead — `serverVerifiedOwnerUserId = body.ownerUserId || ...` in
    // one of the ownership gates. Every regex still matched and the attacker-named wallet was
    // planned, held and spent. So every assignment to that variable is enumerated, and each must
    // take its value from a server-side gate.
    const verifiedAssignments = [...route.matchAll(/serverVerifiedOwnerUserId = ([^;]+);/g)].map((m) => m[1]!.trim());
    assert.ok(verifiedAssignments.length >= 4, `every assignment was found (${verifiedAssignments.length})`);
    for (const rhs of verifiedAssignments) {
      assert.ok(
        /^ownerGate\.ownerUserId$/.test(rhs),
        `the server-verified identity is assigned only from an ownership gate, never from "${rhs}"`,
      );
    }
    // ...and each of those gates is itself given the BEARER user, not a body value.
    for (const [, gateCall] of [...route.matchAll(/const ownerGate = await (\w+)\(\{([\s\S]{0,400}?)\}\);/g)].entries()) {
      void gateCall;
    }
    const gateArgs = [...route.matchAll(/ownerGate = await \w+\(\{([\s\S]{0,400}?)\}\);/g)].map((m) => m[1]!);
    assert.ok(gateArgs.length >= 4, `every ownership gate call was found (${gateArgs.length})`);
    for (const args of gateArgs) {
      assert.ok(
        /bearerUserId/.test(args),
        "each ownership gate is asked about the BEARER user",
      );
      assert.ok(
        !/body\.ownerUserId/.test(args),
        "and never about an identity the request body supplied",
      );
    }

    // The module itself still refuses an absent identity rather than resolving a null wallet.
    const redemption = readFileSync("app/lib/rewards/rewardsCheckoutRedemption.ts", "utf8");
    assert.equal(
      (redemption.match(/if \(!input\.ownerUserId\) return \w+\("auth_required"\)/g) ?? []).length,
      2,
      "both the plan and the reserve refuse without an identity",
    );
  });

  await check("R2: credits never reduce a RECURRING price", () => {
    const stripe = readFileSync("app/lib/listingPlans/revenueStripe.ts", "utf8");
    // The mechanism that makes this a money leak: the credit-reduced amount IS the recurring price.
    assert.ok(
      /unit_amount: Math\.max\(0, Math\.floor\(item\.unitAmountCents\)\)/.test(stripe),
      "line items are priced from the amount the route computed",
    );
    assert.ok(
      /recurring: \{ interval: "month" as const \}/.test(stripe),
      "and in subscription mode that same line item recurs monthly",
    );

    // THE RULE CHANGED, AND THE CHECK CHANGED WITH IT — DELIBERATELY, NOT QUIETLY.
    //
    // This used to require `creditsBlockedByRecurringPrice = stripeMode === "subscription"`:
    // credits were refused outright on any recurring plan, because reducing the line item would
    // have set the subscription's price for ever. Credits now reach a subscription through a
    // Stripe `duration: "once"` coupon on the FIRST invoice — the same mechanism the verified-intro
    // discount uses — so the refusal is gone and the invariant it protected is not.
    //
    // The invariant is what this check now asserts, and it is stronger: on a recurring checkout the
    // line item must be the FULL price, so no credit can ever reach the recurring amount. `S1` in
    // the route suite proves it by executing the route and reading the `unit_amount` the route
    // asked Stripe for; here the structural guarantee is pinned so the two cannot drift.
    const route = readFileSync("app/api/revenue-os/checkout/route.ts", "utf8");
    assert.ok(
      /const chargeableAmountCents = isRecurringCheckout\s*\n\s*\? amountCents\s*\n\s*: Math\.max\(0, amountCents - creditsAppliedCents\);/.test(route),
      "a recurring checkout prices its line items at the FULL amount — credits never touch them",
    );
    assert.ok(
      /ensureRewardsFirstInvoiceCoupon\(/.test(route),
      "and the reduction rides a first-invoice coupon instead",
    );

    // The coupon is `once`, or it is a permanent price cut wearing a discount's name.
    const rewardsCoupon = readFileSync("app/lib/listingPlans/rewardsFirstInvoiceStripeCoupon.ts", "utf8");
    assert.ok(/duration: "once"/.test(rewardsCoupon), "the credits coupon discounts the first invoice only");
    assert.ok(
      /coupon\.duration === "once"/.test(rewardsCoupon),
      "and a coupon retrieved under that id is validated before it is trusted",
    );

    // ONE REFUSAL REMAINS, because a session has one discount slot.
    assert.ok(
      /creditsRefusedReason = "not_available_with_contract_term_promo";/.test(route),
      "a finite-term contract coupon still occupies the slot, and the customer is told by name",
    );

    // The codebase's own precedent for a first-payment-only discount, kept intact.
    const coupon = readFileSync("app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts", "utf8");
    assert.ok(
      /duration: "once"/.test(coupon),
      "the once-coupon mechanism this path was modelled on still exists",
    );
  });

  await check("R3: a settled purchase the balance can no longer fund becomes DEBT, not a loss", async () => {
    // A hold lives 30 minutes; a Stripe Checkout session lives up to 24 hours. The customer can let
    // the hold lapse, spend the returned credits on a second purchase, and then pay the first
    // session — still priced at the discount the lapsed hold was funding. Re-debiting is the right
    // answer and usually works; when the balance is gone it cannot.
    const { port, wallets, entries } = makeStore();
    await earnOn(port, "pay_r3", 100000); // 9000 credits

    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 5000, amountDueCents: 50000, redemptionRef: "r3_a", contextKind: "stripe_checkout", ports: port });
    await releaseReservedCredits({ redemptionRef: "r3_a", expired: true, ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 9000, "the lapsed hold went back to the customer");

    // They spend it on a different purchase.
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 9000, amountDueCents: 90000, redemptionRef: "r3_b", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "r3_b", ports: port });
    assert.equal((await walletOf(port, OWNER)).availableCents, 0, "and the balance is gone");

    // Now the first session is paid. The re-debit cannot be covered.
    const late = await commitReservedCredits({ redemptionRef: "r3_a", ports: port });
    assert.ok(!late.ok, "the re-debit is refused rather than silently succeeding");

    // THE OBLIGATION IS RECORDED. Refusing alone left Leonix short: the goods were delivered at a
    // reduced price and nothing in the ledger said anything was owed.
    const debt = await accrueUnfundedRedemption({ redemptionRef: "r3_a", paymentRecordId: "pay_r3", ports: port });
    assert.ok(debt.ok && debt.outcome === "accrued", "the shortfall is recorded as recovery debt");
    const owing = await walletOf(port, OWNER);
    assert.equal(owing.recoveryCents ?? 0, 5000, "for exactly the discount that was not funded");
    assert.equal(owing.availableCents, 0, "and no bucket goes negative");

    // Redemption pauses while the debt stands.
    const blocked = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 100, amountDueCents: 50000, redemptionRef: "r3_c", contextKind: "stripe_checkout", ports: port });
    assert.ok(!blocked.ok, "no new discount while the debt is outstanding");

    // A RETRY MUST NOT TAKE IT TWICE. The hold is finalised, so a later commit finds it settled.
    const again = await accrueUnfundedRedemption({ redemptionRef: "r3_a", paymentRecordId: "pay_r3", ports: port });
    assert.ok(again.ok && again.outcome === "already_recorded", "a retry records nothing further");
    assert.equal((await walletOf(port, OWNER)).recoveryCents ?? 0, 5000, "and the debt is unchanged");
    const retryCommit = await commitReservedCredits({ redemptionRef: "r3_a", ports: port });
    assert.ok(retryCommit.ok && retryCommit.outcome === "already_final", "and a redelivered commit is a no-op");
    assert.equal(
      entries.filter((e) => e.entryType === "recovery_accrue" && e.paymentRecordId === "pay_r3").length,
      1,
      "one unfunded purchase, one debt entry",
    );

    // Future earnings settle it before becoming spendable.
    await earnOn(port, "pay_r3b", 100000); // 9000 credits
    const after = await walletOf(port, OWNER);
    assert.equal(after.recoveryCents ?? 0, 0, "the next earnings repay the debt first");
    assert.equal(after.availableCents, 4000, "and only the remainder is spendable");
    assert.equal([...wallets.values()][0]!.lifetimeRecoveryOffsetCents ?? 0, 5000, "the repayment is recorded");

    // And the checkout seam actually reaches for this, rather than logging and moving on.
    const redemption = readFileSync("app/lib/rewards/rewardsCheckoutRedemption.ts", "utf8");
    assert.ok(
      /accrueUnfundedRedemption\(\{/.test(redemption),
      "commitCheckoutCredits records the debt when the re-debit cannot be covered",
    );
    assert.ok(
      /rewards_outcome: debt\.ok \? "commit_failed_debt_recorded" : "commit_failed_debt_unrecorded"/.test(redemption),
      "and says in the audit trail which of the two happened",
    );
  });

  await check("R4: a WON dispute stops withholding — on the payment record and in the ledger", async () => {
    // `disputed` is a state, not a verdict. It never cleared, and the promotion sweep refuses a
    // disputed payment outright, so the un-disputed remainder of a partially disputed payment sat
    // frozen in `pending` for ever while every surface said credits do not expire.
    const foundations = readFileSync("app/lib/listingPlans/refundDisputeFoundations.ts", "utf8");
    assert.ok(
      /dispute_prior_payment_status: record\.payment_status == null \? null : String\(record\.payment_status\)/.test(foundations),
      "marking a payment disputed records what to go back to",
    );
    assert.ok(
      /export async function clearWonDisputeOnPaymentRecord/.test(foundations),
      "and there is a path back",
    );
    assert.ok(
      /\.eq\("payment_status", "disputed"\)/.test(
        foundations.slice(foundations.indexOf("export async function clearWonDisputeOnPaymentRecord")),
      ),
      "which is a compare-and-set, so it never clobbers a status something else has changed",
    );
    const events = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    const closed = events.slice(events.indexOf("export async function handleDisputeClosed"));
    assertOrder(
      closed,
      "clearWonDisputeOnPaymentRecord(",
      "restoreCreditsForWonDispute(",
      "the payment is un-disputed as part of handling the win",
    );

    // THE LEDGER SIDE. Asking only whether a `chargeback_reversal` row EXISTS made the block
    // permanent: the row is append-only, so a payment whose dispute Leonix won never promoted
    // again. What matters is whether a clawback is still OUTSTANDING.
    const fulfillment = readFileSync("app/lib/rewards/rewardsFulfillment.ts", "utf8");

    // THE RULE ITSELF, EXERCISED. It used to live inside the database query, where no test could
    // reach it: the sweep is driven with an INJECTED eligibility predicate, so a mutation reverting
    // this rule to "does any chargeback row exist" was caught by nothing at all. A mutation run
    // proved that, which is why the decision is now pure and asserted here directly.
    const promotable = (rows: Array<{ entryType: string; amountCents: number }>, paymentStatus: string | null = "paid") =>
      isPaymentPromotableFromFacts({ paymentStatus, manualState: null, disputeLedgerRows: rows });

    assert.equal(promotable([]), true, "an untouched payment promotes");
    assert.equal(promotable([{ entryType: "chargeback_reversal", amountCents: 450 }]), false, "an open dispute withholds");
    assert.equal(
      promotable([
        { entryType: "chargeback_reversal", amountCents: 450 },
        { entryType: "reversal_restoration", amountCents: 450 },
      ]),
      true,
      "a dispute that was WON stops withholding — the clawback is no longer outstanding",
    );
    assert.equal(
      promotable([
        { entryType: "chargeback_reversal", amountCents: 450 },
        { entryType: "chargeback_reversal", amountCents: 450 },
        { entryType: "reversal_restoration", amountCents: 450 },
      ]),
      false,
      "and a payment with a SECOND dispute still outstanding keeps withholding",
    );
    assert.equal(promotable([], "disputed"), false, "a payment still marked disputed withholds");
    assert.equal(promotable([], "refunded"), true, "but a partially refunded one does not — its residual is real money");
    assert.equal(promotable([], "failed"), false, "a failed payment never promotes");
    assert.equal(promotable([], "canceled"), false, "nor a canceled one");
    assert.equal(
      isPaymentPromotableFromFacts({ paymentStatus: "paid", manualState: "reversed", disputeLedgerRows: [] }),
      false,
      "nor one a person reversed by hand",
    );
    assert.equal(
      isPaymentPromotableFromFacts({ paymentStatus: "paid", manualState: "rejected", disputeLedgerRows: [] }),
      false,
      "nor one a person rejected",
    );
    assert.equal(
      isPaymentPromotableFromFacts({ paymentStatus: "paid", manualState: "cleared", disputeLedgerRows: [] }),
      true,
      "while a cleared manual payment promotes normally",
    );

    // The fulfillment adapter fetches the facts and delegates, rather than re-deriving the rule.
    const adapterFn = fulfillment.slice(
      fulfillment.indexOf("async function isPaymentStillPromotable"),
      fulfillment.indexOf("export type PromotionSweepReport"),
    );
    assert.ok(/isPaymentPromotableFromFacts\(\{/.test(adapterFn), "the adapter delegates to the pure rule");
    assert.ok(/if \(disputeError\) return false;/.test(adapterFn), "and a ledger it cannot read never clears a payment");

    // And behaviourally: a payment disputed in part, then won, promotes its remainder.
    const base = Date.UTC(2026, 0, 1);
    let clock = base;
    const { port } = makeStore({ now: () => clock });
    await earnOn(port, "pay_r4", 10000, true); // 900 pending
    await reverseForRefundOrChargeback({ paymentRecordId: "pay_r4", kind: "chargeback", externalId: "dp_r4", eventRefundedCents: 5000, cumulativeRefundedCentsForKind: 5000, ports: port });
    await restoreReversedCredits({ paymentRecordId: "pay_r4", externalId: "dp_r4", ports: port });
    clock = base + 31 * DAY;
    const sweep = await runPendingPromotionSweep({ nowMs: clock, settlementDays: 30, limit: 10, ports: port, isPaymentStillEligible: async () => true });
    assert.equal(sweep.failed, 0, "the sweep does not fail");
    const w = await walletOf(port, OWNER);
    assert.equal(w.pendingCents + w.availableCents, 900, "the customer keeps every credit the payment awarded");
    assert.equal(w.availableCents, 900, "and all of it is spendable — nothing is stranded");
  });

  await check("R5: a payment lookup that FAILED is never reported as 'not our payment'", () => {
    const events = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    // `stripe_payment_intent_id` carries an ordinary index, not a unique one, so two rows for one
    // intent made `maybeSingle()` return an ERROR. Reading `data` as null then settled a refund or
    // a dispute as handled with nothing reversed, no queue row, and no Stripe retry.
    assert.ok(
      !/\.eq\("stripe_payment_intent_id", intentId\)\s*\n\s*\.maybeSingle\(\)/.test(events),
      "no intent lookup uses maybeSingle, which errors on a duplicate row",
    );
    assert.equal(
      (events.match(/payment_record_lookup_failed/g) ?? []).length,
      3,
      "the charge lookup and both dispute lookups fail retryably instead",
    );
    assert.equal(
      (events.match(/\.eq\("stripe_payment_intent_id", intentId\)\s*\n\s*\.order\("created_at", \{ ascending: true \}\)\s*\n\s*\.limit\(1\)/g) ?? []).length,
      3,
      "and each takes the oldest row deterministically",
    );
  });

  await check("R6: a reversal that FAILED is queued for a person, named by its own event", () => {
    const events = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    // The result used to be discarded at both sites, so an ATTRIBUTABLE refund whose reversal
    // failed vanished: the handler reported `completed`, Stripe never retried, and no row said the
    // credits were still spendable.
    const loop = events.slice(
      events.indexOf("const ordered = [...refunds].sort("),
      events.indexOf("/** charge.refunded"),
    );
    assert.ok(loop.length > 300, "the per-refund loop was located");
    assert.ok(/const reversed = await reverseCreditsForRefundOrDispute\(/.test(loop), "the loop reads the result");
    // THE CONDITION, NOT ITS PRESENCE. `if (false) { enqueue… }` keeps every literal in place.
    assert.ok(
      /if \(!reversed\.ok\) \{[\s\S]{0,400}enqueueUnattributableRefund\(/.test(loop),
      "and files durable work on a real failure, under a live condition",
    );
    assert.ok(/externalRef: refund\.id/.test(loop), "named by the refund, so several failures stay several rows");

    const created = events.slice(
      events.indexOf("export async function handleDisputeCreated"),
      events.indexOf("export async function handleDisputeClosed"),
    );
    assert.ok(/const disputeReversal = await reverseCreditsForRefundOrDispute\(/.test(created), "the dispute path reads its result too");
    assert.ok(/if \(!disputeReversal\.ok\) \{[\s\S]{0,600}enqueueUnattributableRefund\(/.test(created), "and files the failure");
    assert.ok(/externalRef: input\.dispute\.id/.test(created), "named by the dispute");

    const closed = events.slice(events.indexOf("export async function handleDisputeClosed"));
    const restorationEnqueue = closed.slice(
      closed.indexOf("if (needsAPerson) {"),
      closed.indexOf("await writeRevenueAuditLog({", closed.indexOf("if (needsAPerson) {")),
    );
    assert.ok(restorationEnqueue.length > 200, "the won-dispute enqueue was located");
    assert.ok(
      /externalRef: input\.dispute\.id/.test(restorationEnqueue),
      "and a won dispute's unfinished restoration is filed under ITS dispute id, so two disputes are two rows",
    );

    const sql = readFileSync(MIGRATION_PATH, "utf8");
    assert.ok(
      /\(payment_record_id, kind, cumulative_refunded_cents, COALESCE\(external_ref, ''\)\)/.test(sql),
      "the dedupe key includes the external ref, so two problems cannot collapse into one row",
    );
    const queue = readFileSync("app/lib/rewards/rewardsRefundResolutionQueue.ts", "utf8");
    assert.ok(
      /COALESCE\(external_ref, ''\)/.test(queue) || /\.filter\("external_ref",/.test(queue),
      "and the bump lookup normalises the same way the index does",
    );
    assert.ok(
      /\.insert\(\{[\s\S]{0,600}\}\)\s*\n\s*\.select\("id"\)\s*\n\s*\.single\(\);[\s\S]{0,400}retryError/.test(queue),
      "a row resolved between the failed insert and the lookup is re-filed rather than lost",
    );
  });

  await check("R7: a business binding lasts exactly as long as the membership it was granted under", () => {
    const adapter = readFileSync("app/lib/rewards/rewardsLedger.ts", "utf8");
    // The binding pins which wallet a customer uses so a membership change cannot move their
    // balance — right in that direction, wrong in the other: a REMOVED member kept reading and
    // spending the business wallet, which by then held their successor's earnings.
    assert.ok(
      /async function businessBindingRevoked\(businessId: string, userId: string\)/.test(adapter),
      "a business binding is checked against the membership",
    );
    const helper = adapter.slice(adapter.indexOf("async function businessBindingRevoked"));
    const helperBody = helper.slice(0, helper.indexOf("\n}\n") + 3);

    // THE QUESTION IS "WAS IT TAKEN AWAY", NOT "IS THERE ONE".
    //
    // Asking whether an ACTIVE membership exists severed the binding for every customer who never
    // had a membership at all — which is an ordinary case, because `resolveWalletOwnerForPayment`
    // binds a payer to a business wallet through a STAFF-VERIFIED external link with no membership
    // involved. Those customers ended up earning into one wallet and reading another: their own
    // wallet read returned $0.00 while their balance sat in the business wallet, their checkout
    // could not resolve a wallet at all, and a staff correction failed with a duplicate-key error.
    assert.ok(
      /if \(rows\.length === 0\) return false;/.test(helperBody),
      "no membership relationship at all means nothing was revoked, so the binding stands",
    );
    // WHAT DECIDES A REVOCATION IS NOT ASSERTED HERE — IT IS EXECUTED.
    //
    // This used to pin the exact source line. Two things were wrong with that. It went RED for a
    // pure extract-variable refactor, and it went GREEN for the defect: the line it pinned asked
    // "is none of them active", which treated a PENDING INVITATION (`invited`, which the CHECK
    // constraint admits and `MembershipStatus` declares) as a revocation and released the binding
    // of a customer who had been invited to a business — irreversibly, because once a personal
    // wallet exists the resolver takes the `owner_user_id` branch for ever. The regex could not
    // see it, because the defect WAS the line it required.
    //
    // `Z12` and `Z13` in the route suite run the real resolver against each membership status.
    const routeSuiteR7 = readFileSync("scripts/verify-ix-rewards-route-behavior-01.ts", "utf8");
    for (const name of ["Z6", "Z7", "Z8", "Z12"]) {
      assert.ok(
        routeSuiteR7.includes(`await check("${name}:`),
        `the executable check ${name} must exist — this check no longer covers what it decides`,
      );
    }
    assert.ok(/if \(error\) return false;/.test(helperBody), "a table we cannot read is not evidence of removal");
    // Both resolvers honour it; a PERSONAL binding is unconditional.
    for (const fnName of ["findBoundWalletOwner", "resolveWalletOwnerForUser"]) {
      const fn = adapter.slice(adapter.indexOf(`export async function ${fnName}`));
      const body = fn.slice(0, fn.indexOf("\n}\n") + 3);
      // THE RESULT HAS TO DECIDE SOMETHING. An adversarial review kept the call and its `await`
      // and threw the value away (`void revoked; if (!(false)) {}`) — every presence check still
      // matched and a removed member kept spending the business wallet. So the call must appear
      // inside the condition that returns or falls through, not merely somewhere in the body.
      assert.ok(
        /if \((?:!\()?await businessBindingRevoked\(businessId, ownerUserId\)\)?\)/.test(body),
        `${fnName} branches on the result of the revocation check, rather than merely calling it`,
      );
      assert.ok(
        /owner_user_id\)/.test(body),
        `${fnName} still returns a personal binding unconditionally`,
      );
    }
  });

  await check("R8: a staff correction lands on the wallet the customer can actually see", () => {
    const api = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    // Returning `{ kind: "user" }` verbatim bypassed the binding and broke in both directions: a
    // customer bound to a BUSINESS wallet was un-adjustable (the adapter tried to make a second
    // wallet and hit the bound_user_id unique index, surfacing a raw duplicate-key string), and a
    // correction that did land would have gone into a wallet the customer's surfaces never read.
    assert.ok(
      /return \(await resolveWalletOwnerForUser\(ownerUserId\)\) \?\? \{ kind: "user", ownerUserId \};/.test(api),
      "a staff-supplied user id resolves through the canonical binding",
    );
    // A record whose total is already net of credits cannot take more.
    assert.ok(
      /if \(preRow && preMeta\.leonix_amount_is_net_of_credits === true\) \{[\s\S]{0,300}payment_record_already_net_of_credits/.test(api),
      "counter credits are refused on a record whose total was already reduced",
    );
    // AND THE REFUSAL PRECEDES THE MONEY, not just the metadata write. It used to run after the
    // reserve AND the commit, so by the time it refused the customer's balance was already lighter
    // and the redemption row said `committed`: staff saw a 409 and charged the counter price in
    // full. A refusal that runs after the money has moved is not a refusal.
    assertOrder(
      api,
      "payment_record_already_net_of_credits",
      "reserveCreditsForPurchase({",
      "the refusal precedes the hold it is protecting",
    );
    assertOrder(
      api,
      "payment_record_already_net_of_credits",
      "leonix_credits_applied_cents: priorCredits",
      "and the metadata write it is protecting",
    );
    // And the READ of a customer's money is gated by real authentication, not a settable cookie.
    // COMMENTS ARE STRIPPED BEFORE ANY ORDERING IS READ. The prose above this gate NAMES both
    // functions while explaining the defect, so an ordering assertion over the raw text is reading
    // the explanation rather than the code.
    const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const getBlock = stripComments(api.slice(api.indexOf("export async function GET")));
    assertOrder(
      getBlock,
      "requireRevenueProtectedWriteAccess(",
      "hasPaymentTrackerAccess(",
      "the strong gate runs before the role check",
    );
    assert.ok(
      /const readAccess = await requireRevenueProtectedWriteAccess\(\);/.test(getBlock),
      "reading another customer's balance needs more than `leonix_admin=1`",
    );
  });

  await check("R9: the SQL money engine is proven by EXECUTION, and only ever locally", () => {
    // Everything this suite says about PL/pgSQL is read off the file. The one way to know the
    // posting function refuses an over-redemption, that the wallet lock serializes two callers, and
    // that the replay lands on the incremental balances is to RUN it.
    const runner = readFileSync("scripts/verify-ix-rewards-sql-behavior-01.sh", "utf8");
    const suite = readFileSync("scripts/sql/verify-ix-rewards-sql-behavior-01.sql", "utf8");

    // SAFETY FIRST: it must be incapable of touching anything that matters.
    assert.ok(/refusing to run against non-local PGHOST/.test(runner), "a non-local host is refused");
    assert.ok(/PGPASSWORD/.test(runner) && /DATABASE_URL/.test(runner), "and so is a password or a connection URL");
    assert.ok(/createdb "\$DB"/.test(runner) && /dropdb --if-exists "\$DB"/.test(runner), "it creates and drops its own database");
    assert.ok(/exit 77/.test(runner), "and reports a missing PostgreSQL as SKIPPED, never as passed");

    // It applies the migration UNMODIFIED, and twice, because it is written to be re-appliable.
    assert.ok(/-f "\$MIGRATION"/.test(runner), "the real migration file is what gets applied");
    assert.equal((runner.match(/-f "\$MIGRATION"/g) ?? []).length, 2, "applied twice, proving idempotency");

    // A harness that quietly stops asserting is worse than none.
    assert.ok(/MIN_ASSERTIONS=\d+/.test(runner), "a floor is pinned under the assertion count");
    const floor = Number(/MIN_ASSERTIONS=(\d+)/.exec(runner)?.[1] ?? 0);
    assert.ok(floor >= 80, `the floor is meaningful (${floor})`);

    // And the suite covers the guarantees that cannot be read off the text.
    for (const [marker, why] of [
      ["S1", "idempotency"],
      ["S2", "the non-negative refusals"],
      ["S3", "pending-first reversal and recovery debt"],
      ["S4", "the payment-scoped ceiling"],
      ["S5", "the per-dispute restoration bound"],
      ["S6", "the compare-and-swap"],
      ["S7", "the redemption lifecycle"],
      ["S8", "replay parity"],
      ["S9", "replay order under a frozen clock"],
      ["S10", "append-only enforcement"],
      ["S11", "grants and RLS"],
      ["S12", "the entry-type vocabulary"],
    ] as const) {
      assert.ok(suite.includes(`-- ${marker}.`) || suite.includes(`'${marker} `), `the SQL suite covers ${why}`);
    }
    assert.ok(/concurrency: two sessions/.test(runner), "and two genuinely concurrent sessions are exercised");

    // THE TIMING FLOOR IS EXECUTED, NOT READ.
    //
    // The two cross-session races are proofs only because the racing session is MEASURED waiting on
    // the wallet lock. An independent reviewer set that floor to zero and left both suites green:
    // "queued on the lock" became a caption over a number nothing checked. Reading the arithmetic
    // out of the file would not have caught it either — the arithmetic was correct, the floor was
    // not. So the guard is RUN, with a degenerate value, and must refuse.
    const degenerate = spawnSync("bash", ["scripts/verify-ix-rewards-sql-behavior-01.sh"], {
      env: { ...process.env, LEONIX_HOLD_SECONDS: "0" },
      encoding: "utf8",
    });
    assert.equal(degenerate.status, 1, "a degenerate timing floor is refused outright");

    // AND THE SUITE'S FIXTURES MUST BE THE SHAPE PRODUCTION USES.
    //
    // Its Stripe ids were four to eight characters. A reviewer conditioned the per-dispute
    // restoration bound on `length(p_source_id) < 12` — so it applied to test-shaped ids and not to
    // real ones — and all 373 assertions stayed green while a payment disputed twice, with one won,
    // restored 900 instead of 450. 450 credits from nothing, in the authoritative engine. A fixture
    // shorter than production is a fixture a defect can hide behind, so the shape is pinned here.
    const sqlIds = [...suite.matchAll(/\b(?:dp|re)_[A-Za-z0-9_]+/g)].map((m) => m[0]);
    assert.ok(sqlIds.length >= 20, `the SQL suite names a meaningful number of rail ids (${sqlIds.length})`);
    for (const id of new Set(sqlIds)) {
      assert.equal(
        id.length,
        27,
        `the SQL fixture ${id} is ${id.length} characters; every genuine Stripe id is 27`,
      );
    }
    assert.ok(
      /degenerate concurrency timing floor/.test(`${degenerate.stdout ?? ""}${degenerate.stderr ?? ""}`),
      "and says so by name rather than passing quietly",
    );
  });

  await check("Z1: the certification document cites only checks that exist", () => {
    // DOCUMENTATION MUST MATCH EXECUTABLE REALITY, and the cheapest way for it to stop doing so is
    // for a check to be renamed or removed while a table in the document goes on citing it. Every
    // check name the scenario matrix names is resolved against the two suites here, so the
    // document cannot quietly become a list of tests that no longer exist.
    const doc = readFileSync("docs/rewards/LEONIX_IX_REWARDS_FINANCIAL_CERTIFICATION.md", "utf8");
    const start = doc.indexOf("## 4b. Financial scenario matrix");
    const end = doc.indexOf("## 5. Concurrency and lock analysis");
    assert.ok(start > 0 && end > start, "the scenario matrix section was located");
    const section = doc.slice(start, end);

    const suite = readFileSync("scripts/verify-ix-rewards-behavior-01.ts", "utf8");
    const sqlSuite = readFileSync("scripts/sql/verify-ix-rewards-sql-behavior-01.sql", "utf8");
    const routeSuiteSrc = readFileSync("scripts/verify-ix-rewards-route-behavior-01.ts", "utf8");
    const behaviourNames = new Set([...suite.matchAll(/await check\("([A-Za-z0-9]+)/g)].map((m) => m[1]!));
    const routeNames = new Set([...routeSuiteSrc.matchAll(/await check\("([A-Za-z0-9]+)/g)].map((m) => m[1]!));
    const sqlNames = new Set([...sqlSuite.matchAll(/'(S\d+) /g)].map((m) => m[1]!));

    const cited = new Set([...section.matchAll(/`([A-Z]\d+[a-z]?)`/g)].map((m) => m[1]!));
    assert.ok(cited.size >= 40, `the matrix cites a meaningful number of checks (${cited.size})`);
    for (const name of cited) {
      assert.ok(
        behaviourNames.has(name) || sqlNames.has(name) || routeNames.has(name),
        `the certification document cites a check named ${name}, which exists in neither suite`,
      );
    }

    // ...and the headline numbers it reports are the numbers these suites actually produce.
    // Z1 is the last check, and `check()` has already counted it, so this is the final total the
    // run will print.
    assert.ok(
      doc.includes(`${checks} behavioural checks`),
      `the document reports this suite's check count (${checks})`,
    );
    const sqlFloor = /MIN_ASSERTIONS=(\d+)/.exec(readFileSync("scripts/verify-ix-rewards-sql-behavior-01.sh", "utf8"))?.[1];
    assert.ok(sqlFloor && doc.includes(`${sqlFloor} in-session assertions`), `the document reports the SQL assertion count (${sqlFloor})`);

    // ...and the route suite's, which is the one a reader is most likely to doubt.
    const routeChecks = (routeSuiteSrc.match(/await check\("/g) ?? []).length;
    assert.ok(routeChecks >= 30, `the route suite is a meaningful size (${routeChecks})`);
    assert.ok(
      doc.includes(`${routeChecks} checks that EXECUTE the route handlers`),
      `the document reports the route suite's check count (${routeChecks})`,
    );
    // And the mutation harness's, because "67 mutations" is a load-bearing claim in §11.
    const mutationSrc = readFileSync("scripts/verify-ix-rewards-mutation-01.ts", "utf8");
    const mutations = (mutationSrc.match(/\n {4}suite: "(behavior|sql|route)",/g) ?? []).length;
    assert.ok(
      doc.includes(`The harness carries **${mutations}** mutations`),
      `the document reports the mutation count (${mutations})`,
    );
  });

  if (failures.length) {
    console.error(`verify-ix-rewards-behavior-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  console.log(`verify-ix-rewards-behavior-01: OK (${checks} behavioral checks, no DB, no network, no Stripe)`);
}

void main();

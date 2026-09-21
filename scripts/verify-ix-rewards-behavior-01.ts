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
  formatCreditsCents,
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
  reservationExpiresAtIso,
  reserveCreditsForPurchase,
  reserveIdempotencyKey,
  reversalIdempotencyKey,
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

const MIGRATION_PATH = "supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql";
type ParsedCsvOk = Extract<ReturnType<typeof parseRewardsCsv>, { ok: true }>;

// ---------------------------------------------------------------------------
// In-memory store that enforces the SAME invariants as the migration.
// ---------------------------------------------------------------------------
type StoredEntry = LedgerEntryInput & { id: string; createdAtMs: number };
type StoredRedemption = {
  id: string;
  walletId: string;
  amountCents: number;
  status: "reserved" | "committed" | "released" | "expired";
  idempotencyKey: string;
  expiresAtIso: string | null;
};

function makeStore(opts?: { now?: () => number }) {
  const wallets = new Map<string, WalletSnapshot & { owner: string }>();
  const entries: StoredEntry[] = [];
  const byIdempotency = new Map<string, string>();
  const redemptions = new Map<string, StoredRedemption>();
  let seq = 0;
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
    const ordered = entries
      .filter((e) => e.walletId === walletId)
      .sort((a, b) => a.createdAtMs - b.createdAtMs || a.id.localeCompare(b.id));
    for (const e of ordered) {
      const d = deltasFor(e.entryType, e.amountCents, acc);
      acc.pendingCents += d.pending;
      acc.availableCents += d.available;
      acc.reservedCents += d.reserved;
      acc.lifetimeEarnedCents += d.earned;
      acc.lifetimeRedeemedCents += d.redeemed;
      acc.lifetimeReversedCents += d.reversed;
      acc.recoveryCents = (acc.recoveryCents ?? 0) + d.recovery;
      acc.lifetimeRecoveryAccruedCents = (acc.lifetimeRecoveryAccruedCents ?? 0) + d.recoveryAccrued;
      acc.lifetimeRecoveryOffsetCents = (acc.lifetimeRecoveryOffsetCents ?? 0) + d.recoveryOffset;
      acc.lifetimeRestoredCents = (acc.lifetimeRestoredCents ?? 0) + d.restored;
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
      entries.push({ ...input, id, createdAtMs: now() });
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
    async sumRestoredForPayment(paymentRecordId) {
      return entries
        .filter((e) => e.paymentRecordId === paymentRecordId && e.entryType === "reversal_restoration")
        .reduce((a, e) => a + e.amountCents, 0);
    },
    async sumReversedForPayment(paymentRecordId) {
      return entries
        .filter((e) => e.paymentRecordId === paymentRecordId && (e.entryType === "refund_reversal" || e.entryType === "chargeback_reversal"))
        .reduce((a, e) => a + e.amountCents, 0);
    },
    async sumReversalBasisForPayment(paymentRecordId, kind) {
      const entryType = kind === "refund" ? "refund_reversal" : "chargeback_reversal";
      return entries
        .filter((e) => e.paymentRecordId === paymentRecordId && e.entryType === entryType)
        .reduce((a, e) => a + Number((e.meta as { basis_contribution_cents?: number })?.basis_contribution_cents ?? 0), 0);
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
    const releases = src.match(/releaseCheckoutCredits\(/g) ?? [];
    assert.ok(releases.length >= 3, `expected release on stale-attempt, record-failure and stripe-failure paths, found ${releases.length}`);
    assert.ok(src.includes("checkout_session_create_failed"), "the synchronous Stripe failure path releases");
    assert.ok(src.includes("stale_checkout_attempt_released"), "a released stale attempt releases its hold");

    const fulfillment = readFileSync("app/lib/listingPlans/revenueFulfillment.ts", "utf8");
    assert.ok(fulfillment.includes("commitCheckoutCredits"), "the hold is committed on the paid path");
    assert.ok(fulfillment.includes("checkout_session_expired"), "an expired session releases the hold");
    // The commit must come after the payment is actually marked paid, not before. Measured against
    // the CALL SITE, not the import line — both names appear in the import block at the top.
    const paidCall = fulfillment.indexOf("await markPaymentRecordPaid(");
    const commitCall = fulfillment.indexOf("await commitCheckoutCredits(");
    assert.ok(paidCall > 0, "the markPaymentRecordPaid call site was found");
    assert.ok(commitCall > 0, "the commitCheckoutCredits call site was found");
    assert.ok(paidCall < commitCall, "credits are only spent after the payment is marked paid");
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
    assert.ok(fn.includes("NON_PROMOTABLE_PAYMENT_STATUSES"), "disputed/failed/canceled statuses withhold promotion");
    assert.ok(fn.includes("chargeback_reversal"), "and so does a dispute already on the ledger");

    // A PARTIAL REFUND MUST NOT INVALIDATE THE WHOLE EARN. `recordRefundOnPaymentRecord` sets
    // both `refunded_at` and `payment_status: "refunded"` for a partial refund, so treating
    // either as invalidation froze the un-refunded remainder in `pending` permanently — while the
    // customer is told, in both languages, that their credits do not expire.
    assert.ok(!/if \(row\.refunded_at\) return false;/.test(fn), "a partial refund does not invalidate the payment");
    assert.ok(
      !/\.in\("entry_type", \["refund_reversal", "chargeback_reversal"\]\)/.test(fn),
      "the existence of ANY reversal no longer blocks promotion",
    );
    const statuses = src.slice(src.indexOf("const NON_PROMOTABLE_PAYMENT_STATUSES"), src.indexOf(";", src.indexOf("const NON_PROMOTABLE_PAYMENT_STATUSES")));
    assert.ok(!statuses.includes('"refunded"'), "`refunded` is not an invalidating status");
    for (const s of ["disputed", "failed", "canceled"]) {
      assert.ok(statuses.includes(`"${s}"`), `${s} still invalidates`);
    }
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

    assert.ok(postArms.size >= 9, `the posting CASE was parsed (${postArms.size} arms)`);
    assert.ok(replayArms.size >= 9, `the replay CASE was parsed (${replayArms.size} arms)`);

    // Every type the posting function moves must be replayed, and every bucket it touches must be
    // touched by the replay too. The posting function additionally REFUSES movements that the
    // replay only has to reproduce, so its arm may be the longer of the two.
    for (const [type, postBody] of postArms) {
      const replayBody = replayArms.get(type);
      assert.ok(replayBody !== undefined, `the replay must handle ${type}`);
      for (const bucket of ["pending", "available", "reserved", "EARNED", "REDEEMED", "REVERSED"]) {
        const re = new RegExp(`\\b${bucket}\\b`);
        assert.equal(
          re.test(replayBody!),
          re.test(postBody),
          `${type}: posting and replay disagree about whether ${bucket} moves`,
        );
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
      /FOR v_entry IN[\s\S]{0,600}ORDER BY entry_seq ASC NULLS LAST, created_at ASC, id ASC/.test(fn),
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
    assert.ok(
      getBlock.indexOf("requireAdminCookie") < getBlock.indexOf("getCurrentAdminAccessContext"),
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
    assert.ok(
      page.indexOf("requireAdminCookie(c)") < page.indexOf("await getCurrentAdminAccessContext()"),
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
    assert.ok(
      route.indexOf("const paymentInsert = await createPendingPaymentRecord(") < route.indexOf("await reserveCheckoutCredits("),
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

  await check("P5: recovery copy is honest in both languages and never claims expiry", () => {
    for (const lang of ["es", "en"] as const) {
      const copy = recoveryBalanceCopy(lang, { recoveryCents: 3_232 });
      assert.ok(copy.heading.includes("$32.32"), `${lang} names the amount`);
      assert.ok(copy.detail.length > 60, `${lang} explains rather than labels`);
      assert.ok(/no vencen|do not expire/.test(copy.detail), `${lang} states that credits do not expire`);
      assert.ok(/efectivo|in cash/.test(copy.detail), `${lang} says there is nothing to pay in cash`);
      assert.ok(!/multa|penalty/i.test(copy.detail), `${lang} does not invent a penalty`);
    }
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

    const core = readFileSync("app/lib/rewards/rewardsLedgerCore.ts", "utf8");
    for (const fnName of ["reverseForRefundOrChargeback", "restoreReversedCredits"]) {
      const body = core.slice(core.indexOf(`export async function ${fnName}`), core.indexOf(`export async function ${fnName}`) + 4_000);
      assert.ok(/walletId: original\.walletId/.test(body), `${fnName} posts to the wallet the earn credited`);
    }
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

    const api = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    const resolveBlock = api.slice(api.indexOf('if (action === "refund_resolve")'), api.indexOf("// SEARCH — name and phone"));
    assert.ok(resolveBlock.includes("reverseCreditsForRefundOrDispute("), "it settles through the one reversal path");
    // ASSERT THE GUARD, NOT THE MESSAGE. An error string survives `if (false)`; the condition is
    // the thing that refuses a reversal with no stable idempotency anchor — which is the entire
    // reason the row is in this queue.
    assert.ok(
      /if \(!refundExternalId \|\| refundExternalId\.length < 4\) \{[\s\S]{0,200}refund_external_id_required/.test(resolveBlock),
      "a canonical refund id is REQUIRED to reverse, enforced by a live condition",
    );
    assert.ok(
      resolveBlock.indexOf("refund_external_id_required") < resolveBlock.indexOf("reverseCreditsForRefundOrDispute("),
      "and it is checked before any movement is attempted",
    );
    assert.ok(
      resolveBlock.indexOf("reverseCreditsForRefundOrDispute(") < resolveBlock.indexOf("closeRefundResolution("),
      "the money moves BEFORE the row closes, so 'resolved' always describes a real movement",
    );
  });

  await check("P9: the checkout control previews, never decides, and never claims expiry", () => {
    const panel = readFileSync("app/(site)/clasificados/components/LeonixCheckoutCreditsPanel.tsx", "utf8");
    assert.ok(panel.includes("maxRedeemableForPurchaseCents("), "the 50% ceiling comes from the policy module");
    assert.ok(panel.includes("REDEMPTION_MINIMUM_CENTS"), "and so does the $1 floor");
    assert.ok(panel.includes("REDEMPTION_RESERVATION_MINUTES"), "and the 30-minute hold");
    // Strip the file header: it EXPLAINS the rule, so matching it would be reading the comment
    // rather than the component. What matters is that no rendered string claims expiry.
    const panelCode = panel.slice(panel.indexOf('import { useCallback'));
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
    assert.ok(/creditsEligible \?/.test(checkpoint), "the control is opt-in per category");
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
  });

  if (failures.length) {
    console.error(`verify-ix-rewards-behavior-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  console.log(`verify-ix-rewards-behavior-01: OK (${checks} behavioral checks, no DB, no network, no Stripe)`);
}

void main();

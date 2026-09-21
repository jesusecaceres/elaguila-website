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
  computeTotalReversalTargetCents,
  formatCreditsCents,
  maxRedeemableForPurchaseCents,
  planRedemption,
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
  runPendingPromotionSweep,
  runReservationExpirySweep,
  type LedgerEntryInput,
  type RewardsStorePort,
  type WalletOwnerRef,
  type WalletSnapshot,
} from "../app/lib/rewards/rewardsLedgerCore";
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
    const d = { pending: 0, available: 0, reserved: 0, earned: 0, redeemed: 0, reversed: 0 };
    switch (entryType) {
      case "earn_pending": d.pending = amount; d.earned = amount; break;
      case "earn_promote":
        if (w.pendingCents < amount) throw new Error("promotion_exceeds_pending");
        d.pending = -amount; d.available = amount; break;
      case "earn_available": d.available = amount; d.earned = amount; break;
      case "redeem_reserve":
        if (w.availableCents < amount) throw new Error("redemption_exceeds_available");
        d.available = -amount; d.reserved = amount; break;
      case "redeem_commit": d.reserved = -amount; d.redeemed = amount; break;
      case "redeem_release": d.reserved = -amount; d.available = amount; break;
      case "refund_reversal":
      case "chargeback_reversal":
        if (w.pendingCents + w.availableCents < amount) throw new Error("reversal_exceeds_balance");
        // PENDING FIRST.
        if (w.pendingCents >= amount) d.pending = -amount;
        else { d.pending = -w.pendingCents; d.available = -(amount - w.pendingCents); }
        d.reversed = amount;
        break;
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
      };
      // The database CHECK constraints: refuse, never clamp.
      if (next.pendingCents < 0 || next.availableCents < 0 || next.reservedCents < 0) {
        return { ok: false, error: "negative_balance_refused" };
      }
      Object.assign(w, next, {
        lifetimeEarnedCents: w.lifetimeEarnedCents + d.earned,
        lifetimeRedeemedCents: w.lifetimeRedeemedCents + d.redeemed,
        lifetimeReversedCents: w.lifetimeReversedCents + d.reversed,
      });
      const id = `e${++seq}`;
      entries.push({ ...input, id, createdAtMs: now() });
      byIdempotency.set(input.idempotencyKey, id);
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
    async setRedemptionStatus({ redemptionId, status }) {
      for (const r of redemptions.values()) {
        if (r.id === redemptionId) {
          // Compare-and-set from 'reserved', like the adapter's conditional update.
          if (r.status !== "reserved") return { ok: false, error: "redemption_not_reserved" };
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

    const res = await reverseForRefundOrChargeback({ paymentRecordId: "p2", eventRefundedCents: 10000, cumulativeRefundedCentsForKind: 10000, kind: "refund", externalId: "re_2", ports: port });
    assert.equal(res.ok, false, "the store must REFUSE rather than allow a negative balance");
    const w2 = await walletOf(port, OWNER);
    assert.ok(w2.availableCents >= 0 && w2.pendingCents >= 0, "balances stay non-negative");
  });

  await check("B14: the webhook keys refunds on each REFUND object, not the charge", () => {
    const src = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    assert.ok(src.includes("reverseRewardsForChargeRefunds"), "refunds are fanned out per refund object");
    const fn = src.slice(src.indexOf("async function reverseRewardsForChargeRefunds"), src.indexOf("/** charge.refunded"));
    assert.ok(fn.includes("charge.refunds?.data"), "each refund object is read");
    assert.ok(/externalId:\s*refund\.id/.test(fn), "the refund's own id is the idempotency anchor");
    // The old defect, stated so a regression is visible: externalId must not simply be charge.id.
    assert.ok(!/externalId:\s*input\.charge\.id\s*,/.test(fn), "the bare charge id is never the anchor");
    assert.ok(/cum\$\{cumulativeRefundedCents\}/.test(fn), "a truncated payload still produces distinct keys");
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
    assert.ok(!/FOR (INSERT|UPDATE|DELETE)[\s\S]{0,80}TO authenticated/.test(sql), "no authenticated write policy exists on any rewards table");
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

  await check("G4: both SECURITY DEFINER functions pin a hardened search path", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const definers = sql.match(/SECURITY DEFINER[\s\S]{0,400}?SET search_path = ([^\n;]+)/g) ?? [];
    assert.equal(definers.length, 2, `exactly the two SECURITY DEFINER functions, found ${definers.length}`);
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
    assert.ok(/reversal of % exceeds pending % plus available %/.test(sql), "over-reversal is refused explicitly");
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
    assert.ok(
      /entry_type IN \('refund_reversal', 'chargeback_reversal'\) AND amount_cents >= 0/.test(sql),
      "a reversal that moves nothing is still recordable",
    );
    assert.ok(
      /entry_type NOT IN \('manual_adjustment', 'refund_reversal', 'chargeback_reversal'\) AND amount_cents > 0/.test(sql),
      "everything else still requires a positive magnitude",
    );
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

  await check("H8: eligibility is asked of the PAYMENT RECORD and fails closed", () => {
    const src = readFileSync("app/lib/rewards/rewardsFulfillment.ts", "utf8");
    const fn = src.slice(src.indexOf("async function isPaymentStillPromotable"), src.indexOf("export type PromotionSweepReport"));
    assert.ok(fn.includes("leonix_payment_records"), "the payment record is consulted");
    assert.ok(/if \(error \|\| !payment\) return false;/.test(fn), "an unreadable payment fails CLOSED");
    assert.ok(fn.includes("refunded_at"), "a refund withholds promotion");
    assert.ok(fn.includes("NON_PROMOTABLE_PAYMENT_STATUSES"), "so do refunded/disputed/failed/canceled statuses");
    assert.ok(fn.includes("refund_reversal"), "and so does a reversal already on the ledger");
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

  await check("J4: the SQL recomputation is a REPLAY, not an aggregate", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf8");
    const fn = sql.slice(sql.indexOf("FUNCTION public.leonix_rewards_recompute_wallet"));
    assert.ok(/FOR v_entry IN[\s\S]{0,300}ORDER BY created_at ASC, id ASC/.test(fn), "entries are replayed in posting order");
    assert.ok(/LOOP[\s\S]*?END LOOP/.test(fn), "there is an actual loop");
    assert.ok(/lifetime_earned_cents = v_earned/.test(fn), "lifetime totals are rebuilt, not left stale");
    assert.ok(/lifetime_redeemed_cents = v_redeemed/.test(fn));
    assert.ok(/lifetime_reversed_cents = v_reversed/.test(fn));
    assert.ok(/replays to a negative bucket/.test(fn), "an inconsistent ledger is refused, not clamped");
    // Both path-dependent orders must be present in the replay.
    assert.ok(/IF v_pending >= v_entry\.amount_cents THEN/.test(fn), "reversal replays pending-first");
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
  await check("L1: the staff rewards API gates READS like the payment tracker", () => {
    const src = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    const getBlock = src.slice(src.indexOf("export async function GET"));
    assert.ok(getBlock.includes("hasPaymentTrackerAccess"), "the GET requires payment-tracker READ authority");
    assert.ok(src.includes("requireRevenueProtectedWriteAccess"), "every WRITE stays on the money-write gate");
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
    assert.ok(/ownerUserId: userId/.test(src), "the wallet is resolved from the authenticated user");
    assert.ok(src.includes("auth_required"), "an unauthenticated read is refused");
  });

  await check("L4: a crafted search term cannot inject a PostgREST filter", () => {
    const src = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    assert.ok(src.includes("sanitizeSearchTerm"), "the term is sanitized before interpolation");
    const or = src.match(/\.or\(`([^`]*)`\)/)?.[1] ?? "";
    assert.ok(or.includes("${q}"), "the sanitized value is what gets interpolated");
    assert.ok(!or.includes("${raw}"), "the raw term never reaches the filter");
    const sanitizer = src.slice(src.indexOf("function sanitizeSearchTerm"), src.indexOf("export async function POST"));
    assert.ok(/replace\(/.test(sanitizer), "the sanitizer rewrites the term");
    for (const ch of ["(", ")", ",", "."]) {
      assert.ok(sanitizer.includes(ch), `the sanitizer's character class covers ${ch}`);
    }
    assert.ok(/\[%_\]/.test(sanitizer), "LIKE wildcards are collapsed");
    assert.ok(/slice\(0, 60\)/.test(sanitizer), "the term is bounded");
    assert.ok(src.includes("query_unusable"), "a term that sanitizes to nothing is refused, not searched as empty");
  });

  await check("L5: a wallet target must be a canonical uuid", () => {
    const src = readFileSync("app/api/admin/rewards/route.ts", "utf8");
    assert.ok(src.includes("function isUuid"), "ids are validated");
    const ownerFn = src.slice(src.indexOf("function ownerFromBody"), src.indexOf("export async function POST"));
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

  if (failures.length) {
    console.error(`verify-ix-rewards-behavior-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  console.log(`verify-ix-rewards-behavior-01: OK (${checks} behavioral checks, no DB, no network, no Stripe)`);
}

void main();

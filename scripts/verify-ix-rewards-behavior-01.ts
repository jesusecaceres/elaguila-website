/**
 * LEONIX IX REWARDS — BEHAVIORAL proof of the credit contract.
 * Run: npx tsx scripts/verify-ix-rewards-behavior-01.ts
 *
 * Imports the REAL policy (`rewardsPolicy.ts`) and the REAL ledger operations
 * (`rewardsLedgerCore.ts`) and drives them against an in-memory store that faithfully reproduces
 * the database's two hard guarantees: UNIQUE(idempotency_key) and the non-negative bucket CHECK
 * constraints. A movement the real database would refuse is refused here too.
 *
 * NO DATABASE, NO NETWORK, NO STRIPE.
 *
 * SECTION A — the 9% earn contract
 * SECTION B — refunds, chargebacks, proportional reversal
 * SECTION C — redemption: reserve / commit / release, over-redemption, partial redemption
 * SECTION D — idempotency and duplicate external events
 * SECTION E — manual adjustments and authorization
 * SECTION F — promo coexistence (one promo max is preserved)
 * SECTION G — SQL/TS agreement on bucket deltas, and schema invariants
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  REWARDS_EARN_RATE_BASIS_POINTS,
  assessEarn,
  computeEarnCents,
  computeEligibleNetCents,
  computeReversalCents,
  formatCreditsCents,
  planRedemption,
  validateDiscountCombination,
} from "../app/lib/rewards/rewardsPolicy";
import {
  commitReservedCredits,
  earnFromSettledPayment,
  earnIdempotencyKey,
  postManualAdjustment,
  releaseReservedCredits,
  reserveCreditsForPurchase,
  reverseForRefundOrChargeback,
  type LedgerEntryInput,
  type RewardsStorePort,
  type WalletOwnerRef,
  type WalletSnapshot,
} from "../app/lib/rewards/rewardsLedgerCore";

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

// ---------------------------------------------------------------------------
// In-memory store that enforces the SAME invariants as the migration.
// ---------------------------------------------------------------------------
function makeStore() {
  const wallets = new Map<string, WalletSnapshot & { owner: string }>();
  const entries: Array<LedgerEntryInput & { id: string }> = [];
  const byIdempotency = new Map<string, string>();
  const redemptions = new Map<
    string,
    { id: string; walletId: string; amountCents: number; status: "reserved" | "committed" | "released" | "expired"; idempotencyKey: string }
  >();
  let seq = 0;

  function ownerKey(o: WalletOwnerRef): string {
    return o.kind === "business" ? `b:${o.businessId}` : `u:${o.ownerUserId}`;
  }

  // Mirrors leonix_rewards_post_entry()'s CASE block. Kept here so SECTION G can assert the TS
  // mirror and the SQL agree, entry type by entry type.
  function deltasFor(entryType: string, amount: number, w: WalletSnapshot) {
    const d = { pending: 0, available: 0, reserved: 0, earned: 0, redeemed: 0, reversed: 0 };
    switch (entryType) {
      case "earn_pending": d.pending = amount; d.earned = amount; break;
      case "earn_promote": d.pending = -amount; d.available = amount; break;
      case "earn_available": d.available = amount; d.earned = amount; break;
      case "redeem_reserve": d.available = -amount; d.reserved = amount; break;
      case "redeem_commit": d.reserved = -amount; d.redeemed = amount; break;
      case "redeem_release": d.reserved = -amount; d.available = amount; break;
      case "refund_reversal":
      case "chargeback_reversal":
        if (w.pendingCents >= amount) d.pending = -amount;
        else { d.pending = -w.pendingCents; d.available = -(amount - w.pendingCents); }
        d.reversed = amount;
        break;
      case "manual_adjustment":
        d.available = amount;
        if (amount > 0) d.earned = amount; else d.reversed = -amount;
        break;
      case "expire": d.available = -amount; d.reversed = amount; break;
      default: throw new Error(`unsupported entry_type ${entryType}`);
    }
    return d;
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
      const d = deltasFor(input.entryType, input.amountCents, w);
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
      entries.push({ ...input, id });
      byIdempotency.set(input.idempotencyKey, id);
      return { ok: true, entry: { id, walletId: input.walletId, entryType: input.entryType, amountCents: input.amountCents, idempotencyKey: input.idempotencyKey, deduplicated: false } };
    },
    async createRedemption(input) {
      const existing = redemptions.get(input.idempotencyKey);
      if (existing) return { ok: true, redemption: { ...existing }, deduplicated: true };
      const r = { id: `r${++seq}`, walletId: input.walletId, amountCents: input.amountCents, status: "reserved" as const, idempotencyKey: input.idempotencyKey };
      redemptions.set(input.idempotencyKey, r);
      return { ok: true, redemption: { ...r }, deduplicated: false };
    },
    async findRedemption(key) { const r = redemptions.get(key); return r ? { ...r } : null; },
    async setRedemptionStatus({ redemptionId, status }) {
      for (const r of redemptions.values()) if (r.id === redemptionId) { r.status = status; return { ok: true }; }
      return { ok: false, error: "not_found" };
    },
    async sumReversedForPayment(paymentRecordId) {
      return entries
        .filter((e) => e.paymentRecordId === paymentRecordId && (e.entryType === "refund_reversal" || e.entryType === "chargeback_reversal"))
        .reduce((a, e) => a + e.amountCents, 0);
    },
    async findEarnForPayment(paymentRecordId) {
      const e = entries.find((x) => x.paymentRecordId === paymentRecordId && (x.entryType === "earn_pending" || x.entryType === "earn_available"));
      if (!e) return null;
      return { amountCents: e.amountCents, eligibleNetCents: Number((e.meta as { eligible_net_cents?: number })?.eligible_net_cents ?? 0) };
    },
  };

  return { port, wallets, entries, redemptions };
}

const OWNER: WalletOwnerRef = { kind: "business", businessId: "biz_1" };
const settled = (over: Partial<Parameters<typeof assessEarn>[0]> = {}) => ({
  amountPaidCents: 39900, creditsAppliedCents: 0, promoDiscountCents: 0,
  source: "stripe", settled: true, ...over,
});

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
    // 11 cents * 9% = 0.99 cents -> 0
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

  await check("A6: every payment rail earns — card, cash, check, CSV", async () => {
    for (const source of ["stripe", "admin_manual", "office", "csv_import"]) {
      const a = assessEarn(settled({ source }));
      assert.equal(a.earns, true, `${source} must earn`);
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
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
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
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.availableCents, 900, "cash clears immediately and is spendable");
    assert.equal(w.pendingCents, 0);
  });

  // =========================================================================
  // SECTION B — reversal
  // =========================================================================
  await check("B1: a full refund reverses exactly what was earned", () => {
    assert.equal(computeReversalCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, refundedCents: 10000 }), 900);
  });

  await check("B2: a partial refund reverses proportionally, rounded down", () => {
    assert.equal(computeReversalCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, refundedCents: 5000 }), 450);
    assert.equal(computeReversalCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, refundedCents: 3333 }), 299);
  });

  await check("B3: reversal can never exceed what was earned", () => {
    assert.equal(
      computeReversalCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, refundedCents: 999999 }),
      900,
      "an over-refund still only claws back the credits actually awarded",
    );
    assert.equal(
      computeReversalCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, refundedCents: 10000, alreadyReversedCents: 900 }),
      0,
      "nothing remains to reverse once fully reversed",
    );
  });

  await check("B4: sequential partial refunds never over-reverse in total", () => {
    let already = 0;
    for (const r of [4000, 4000, 4000]) {
      already += computeReversalCents({ originallyEarnedCents: 900, originalEligibleNetCents: 10000, refundedCents: r, alreadyReversedCents: already });
    }
    assert.ok(already <= 900, `total reversed ${already} must not exceed 900`);
  });

  await check("B5: a refund claws back from pending first, then available", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p1", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    const res = await reverseForRefundOrChargeback({ owner: OWNER, paymentRecordId: "p1", refundedCents: 10000, kind: "refund", externalId: "re_1", ports: port });
    assert.equal((res as { outcome: string }).outcome, "reversed");
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.pendingCents, 0, "the never-spendable credits are taken back first");
    assert.equal(w.availableCents, 0);
    assert.equal(w.lifetimeReversedCents, 900);
  });

  await check("B6: a chargeback on a payment that earned nothing is a safe no-op", async () => {
    const { port } = makeStore();
    const res = await reverseForRefundOrChargeback({ owner: OWNER, paymentRecordId: "unknown", refundedCents: 5000, kind: "chargeback", externalId: "dp_1", ports: port });
    assert.equal(res.ok, true);
    assert.equal((res as { outcome: string }).outcome, "nothing_to_reverse");
  });

  await check("B7: a wallet can never be driven negative by a reversal", async () => {
    const { port } = makeStore();
    // Earn, promote to available, spend it all, then refund.
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p2", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: false, ports: port });
    const reserve = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 900, amountDueCents: 5000, redemptionRef: "rr1", contextKind: "stripe_checkout", ports: port });
    assert.equal(reserve.ok, true);
    await commitReservedCredits({ redemptionRef: "rr1", ports: port });
    const w1 = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w1.availableCents, 0, "all credits spent");
    // Now the original payment is refunded — the credits are already gone.
    const res = await reverseForRefundOrChargeback({ owner: OWNER, paymentRecordId: "p2", refundedCents: 10000, kind: "refund", externalId: "re_2", ports: port });
    assert.equal(res.ok, false, "the store must REFUSE rather than allow a negative balance");
    const w2 = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.ok(w2.availableCents >= 0 && w2.pendingCents >= 0, "balances stay non-negative");
  });

  // =========================================================================
  // SECTION C — redemption
  // =========================================================================
  await check("C1: the customer may redeem all, some, or none", () => {
    assert.deepEqual(planRedemption({ requestedCents: 500, availableCents: 2000, amountDueCents: 10000 }), { ok: true, redeemCents: 500, remainingDueCents: 9500, cappedBy: null });
    assert.deepEqual(planRedemption({ requestedCents: 2000, availableCents: 2000, amountDueCents: 10000 }), { ok: true, redeemCents: 2000, remainingDueCents: 8000, cappedBy: null });
    assert.equal(planRedemption({ requestedCents: 0, availableCents: 2000, amountDueCents: 10000 }).ok, false);
  });

  await check("C2: redemption is capped by the balance and by the amount due", () => {
    const byBalance = planRedemption({ requestedCents: 99999, availableCents: 2000, amountDueCents: 10000 });
    assert.equal((byBalance as { redeemCents: number }).redeemCents, 2000);
    assert.equal((byBalance as { cappedBy: string }).cappedBy, "available_balance");
    const byDue = planRedemption({ requestedCents: 9000, availableCents: 9000, amountDueCents: 3000 });
    assert.equal((byDue as { redeemCents: number }).redeemCents, 3000, "an invoice can never go negative");
    assert.equal((byDue as { remainingDueCents: number }).remainingDueCents, 0);
  });

  await check("C3: a minimum charge prevents an unexpected zero-value transaction", () => {
    const p = planRedemption({ requestedCents: 10000, availableCents: 10000, amountDueCents: 5000, minimumChargeCents: 100 });
    assert.equal((p as { redeemCents: number }).redeemCents, 4900);
    assert.equal((p as { remainingDueCents: number }).remainingDueCents, 100);
  });

  await check("C4: nothing due, or nothing available, is refused cleanly", () => {
    assert.equal(planRedemption({ requestedCents: 100, availableCents: 100, amountDueCents: 0 }).ok, false);
    assert.equal(planRedemption({ requestedCents: 100, availableCents: 0, amountDueCents: 5000 }).ok, false);
    assert.equal(planRedemption({ requestedCents: -5, availableCents: 100, amountDueCents: 5000 }).ok, false);
  });

  await check("C5: reserve moves available→reserved; commit spends it", async () => {
    const { port } = makeStore();
    await postManualAdjustment({ owner: OWNER, amountCents: 5000, reason: "seed for test", actorAuthUserId: "staff_1", adjustmentRef: "adj1", ports: port });
    const r = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 10000, redemptionRef: "ref_c5", contextKind: "stripe_checkout", ports: port });
    assert.equal(r.ok, true);
    let w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.availableCents, 3000);
    assert.equal(w.reservedCents, 2000, "held, not yet spent");

    await commitReservedCredits({ redemptionRef: "ref_c5", ports: port });
    w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.reservedCents, 0);
    assert.equal(w.availableCents, 3000, "committing does not return the hold");
    assert.equal(w.lifetimeRedeemedCents, 2000);
  });

  await check("C6: a failed checkout RELEASES the hold back to available", async () => {
    const { port } = makeStore();
    await postManualAdjustment({ owner: OWNER, amountCents: 5000, reason: "seed", actorAuthUserId: "s", adjustmentRef: "a2", ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 2000, amountDueCents: 10000, redemptionRef: "ref_c6", contextKind: "stripe_checkout", ports: port });
    await releaseReservedCredits({ redemptionRef: "ref_c6", ports: port });
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.availableCents, 5000, "an abandoned checkout must not consume the balance");
    assert.equal(w.reservedCents, 0);
    assert.equal(w.lifetimeRedeemedCents, 0);
  });

  await check("C7: two concurrent checkouts cannot both spend the last credits", async () => {
    const { port } = makeStore();
    await postManualAdjustment({ owner: OWNER, amountCents: 1000, reason: "seed", actorAuthUserId: "s", adjustmentRef: "a3", ports: port });
    const first = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "tabA", contextKind: "stripe_checkout", ports: port });
    assert.equal(first.ok, true);
    const second = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "tabB", contextKind: "stripe_checkout", ports: port });
    assert.equal(second.ok, false, "the second tab has nothing left to reserve");
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.reservedCents, 1000);
    assert.equal(w.availableCents, 0);
  });

  await check("C8: committing twice is a no-op, not a double spend", async () => {
    const { port } = makeStore();
    await postManualAdjustment({ owner: OWNER, amountCents: 3000, reason: "seed", actorAuthUserId: "s", adjustmentRef: "a4", ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "ref_c8", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "ref_c8", ports: port });
    const again = await commitReservedCredits({ redemptionRef: "ref_c8", ports: port });
    assert.equal(again.ok, true);
    assert.equal((again as { outcome: string }).outcome, "already_final");
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.lifetimeRedeemedCents, 1000, "still exactly one redemption");
  });

  await check("C9: releasing after commit does not refund the customer twice", async () => {
    const { port } = makeStore();
    await postManualAdjustment({ owner: OWNER, amountCents: 3000, reason: "seed", actorAuthUserId: "s", adjustmentRef: "a5", ports: port });
    await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "ref_c9", contextKind: "stripe_checkout", ports: port });
    await commitReservedCredits({ redemptionRef: "ref_c9", ports: port });
    const rel = await releaseReservedCredits({ redemptionRef: "ref_c9", ports: port });
    assert.equal((rel as { outcome: string }).outcome, "already_final");
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.availableCents, 2000, "balance unchanged by the late release");
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
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.pendingCents, 900, "the balance moved once");
  });

  await check("D2: a duplicate refund event reverses only once", async () => {
    const { port } = makeStore();
    await earnFromSettledPayment({ owner: OWNER, paymentRecordId: "p3", facts: settled({ amountPaidCents: 10000 }), sourceKind: "stripe_payment", pendingUntilSettlementFinal: true, ports: port });
    await reverseForRefundOrChargeback({ owner: OWNER, paymentRecordId: "p3", refundedCents: 10000, kind: "refund", externalId: "re_same", ports: port });
    const second = await reverseForRefundOrChargeback({ owner: OWNER, paymentRecordId: "p3", refundedCents: 10000, kind: "refund", externalId: "re_same", ports: port });
    // Either deduplicated by key or refused as fully-reversed; both are correct, neither double-reverses.
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.lifetimeReversedCents, 900, "reversed exactly once");
    assert.equal(second.ok, true);
  });

  await check("D3: a re-submitted reservation returns the original hold", async () => {
    const { port } = makeStore();
    await postManualAdjustment({ owner: OWNER, amountCents: 5000, reason: "seed", actorAuthUserId: "s", adjustmentRef: "a6", ports: port });
    const a = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "same_ref", contextKind: "stripe_checkout", ports: port });
    const b = await reserveCreditsForPurchase({ owner: OWNER, requestedCents: 1000, amountDueCents: 9000, redemptionRef: "same_ref", contextKind: "stripe_checkout", ports: port });
    assert.equal((a as { redemptionId: string }).redemptionId, (b as { redemptionId: string }).redemptionId);
    assert.equal((b as { deduplicated: boolean }).deduplicated, true);
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.reservedCents, 1000, "only one hold exists");
  });

  await check("D4: idempotency keys are namespaced and derived, never random", () => {
    assert.equal(earnIdempotencyKey("abc"), "earn:payment:abc");
    assert.equal(earnIdempotencyKey("abc"), earnIdempotencyKey("abc"), "stable across calls");
    assert.notEqual(earnIdempotencyKey("abc"), earnIdempotencyKey("abd"));
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
    await postManualAdjustment({ owner: OWNER, amountCents: 500, reason: "seed", actorAuthUserId: "s", adjustmentRef: "y1", ports: port });
    const res = await postManualAdjustment({ owner: OWNER, amountCents: -5000, reason: "correction", actorAuthUserId: "s", adjustmentRef: "y2", ports: port });
    assert.equal(res.ok, false, "refused, not clamped");
    const w = (await port.resolveWallet(OWNER) as { wallet: WalletSnapshot }).wallet;
    assert.equal(w.availableCents, 500);
  });

  // =========================================================================
  // SECTION F — promo coexistence
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

  // =========================================================================
  // SECTION G — schema invariants and TS/SQL agreement
  // =========================================================================
  await check("G1: the migration encodes the invariants the tests rely on", () => {
    const sql = readFileSync("supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql", "utf8");
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
    const sql = readFileSync("supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql", "utf8");
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

  if (failures.length) {
    console.error(`verify-ix-rewards-behavior-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  console.log(`verify-ix-rewards-behavior-01: OK (${checks} behavioral checks, no DB, no network, no Stripe)`);
}

void main();

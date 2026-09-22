/**
 * LEONIX STAFF GATEWAY — Gate 7 Rewards office-sale bridge (no Rewards rebuild).
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-rewards-office-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_CATEGORY_PACKAGE_PAIR,
} from "../app/lib/listingPlans/businessAccessLevel";
import {
  FULL_BUSINESS_LIST_PRICE_CENTS,
  QUICK_BUSINESS_LIST_PRICE_CENTS,
  VERIFIED_INTRO_QUICK_FIRST_INVOICE_CENTS,
  evaluateListingPackagePaymentAuthority,
  type PaymentAuthorityRecordFacts,
} from "../app/lib/listingPlans/listingPackagePaymentAuthority";
import {
  DEFAULT_RAIL_MINIMUM_CHARGE_CENTS,
  REWARDS_EARN_RATE_BASIS_POINTS,
  assessEarn,
  computeEarnCents,
  maxRedeemableForPurchaseCents,
} from "../app/lib/rewards/rewardsPolicy";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const QUICK = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple;
const FULL = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.full;
const SRC = "servicios_public_listings";
const LISTING = "listing-office";

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function rec(over: Partial<PaymentAuthorityRecordFacts> = {}): PaymentAuthorityRecordFacts {
  return {
    id: "pay-1",
    listing_source: SRC,
    listing_id: LISTING,
    category: "servicios",
    package_key: QUICK,
    currency: "usd",
    source: "admin_manual",
    payment_status: "paid",
    manual_state: "cleared",
    amount_cents: QUICK_BUSINESS_LIST_PRICE_CENTS,
    amount_total_cents: QUICK_BUSINESS_LIST_PRICE_CENTS,
    amount_paid_cents: QUICK_BUSINESS_LIST_PRICE_CENTS,
    refunded_at: null,
    canceled_at: null,
    verified_intro_discount_redemption_id: null,
    metadata: null,
    ...over,
  };
}

function decide(over: Parameters<typeof evaluateListingPackagePaymentAuthority>[0] extends infer T ? Partial<T> : never) {
  return evaluateListingPackagePaymentAuthority({
    listingSource: SRC,
    listingId: LISTING,
    packageKey: QUICK,
    category: "servicios",
    currency: "usd",
    records: [rec()],
    ...over,
  });
}

function main() {
  check("1: no Rewards + authoritative full payment publishes the matched package", () => {
    const d = decide({});
    assert.equal(d.ok, true);
    if (d.ok) assert.equal(d.expectedCents, 24900);
  });

  check("2: eligible Rewards reserved then committed once with residual qualifies; reserved-only does not", () => {
    const residual = rec({
      amount_cents: 12450,
      amount_paid_cents: 12450,
      amount_total_cents: 12450,
      metadata: { leonix_credits_applied_cents: 12450, leonix_amount_is_net_of_credits: true },
    });
    const committed = decide({
      records: [residual],
      rewards: [{ listing_id: LISTING, package_key: QUICK, status: "committed", credits_applied_cents: 12450 }],
    });
    assert.equal(committed.ok, true);
    const reserved = decide({
      records: [residual],
      rewards: [{ listing_id: LISTING, package_key: QUICK, status: "reserved", credits_applied_cents: 12450 }],
    });
    assert.equal(reserved.ok, false);
    if (!reserved.ok) assert.equal(reserved.error, "rewards_not_committed");
  });

  check("3: canceled payment fails closed with canceled_payment", () => {
    const d = decide({ records: [rec({ payment_status: "canceled", canceled_at: "2026-09-22T00:00:00Z" })] });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "canceled_payment");
  });

  check("4: duplicate/replayed Rewards callback moves no balance twice", () => {
    const d = decide({
      rewards: [{ listing_id: LISTING, package_key: QUICK, status: "committed", credits_applied_cents: 12450, replayed: true }],
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "rewards_replay");
  });

  check("5: underfunded / mismatched / over-redemption fail exact codes", () => {
    const under = decide({
      records: [rec({ amount_cents: 50, amount_paid_cents: 50, amount_total_cents: 50 })],
    });
    assert.equal(under.ok, false);
    if (!under.ok) assert.equal(under.error, "underpaid");
    const over = decide({
      records: [
        rec({
          amount_cents: 50,
          amount_paid_cents: 50,
          amount_total_cents: 50,
          metadata: { leonix_credits_applied_cents: 24850, leonix_amount_is_net_of_credits: true },
        }),
      ],
      rewards: [{ listing_id: LISTING, package_key: QUICK, status: "committed", credits_applied_cents: 24850 }],
    });
    assert.equal(over.ok, false);
    if (!over.ok) assert.equal(over.error, "rewards_over_redemption");
    assert.equal(maxRedeemableForPurchaseCents(24900), 12450);
  });

  check("6: Quick payment + Rewards context cannot publish Full", () => {
    const d = evaluateListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: FULL,
      category: "servicios",
      records: [rec()],
      rewards: [{ listing_id: LISTING, package_key: QUICK, status: "committed", credits_applied_cents: 12450 }],
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "wrong_package");
    assert.equal(FULL_BUSINESS_LIST_PRICE_CENTS, 39900);
  });

  check("7: refund/dispute fail closed once; listing is not deleted in this helper", () => {
    const refunded = decide({ records: [rec({ payment_status: "refunded", refunded_at: "2026-09-22T00:00:00Z" })] });
    assert.equal(refunded.ok, false);
    if (!refunded.ok) assert.equal(refunded.error, "refunded_payment");
    const disputed = decide({ records: [rec({ payment_status: "disputed" })] });
    assert.equal(disputed.ok, false);
    if (!disputed.ok) assert.equal(disputed.error, "disputed_payment");
    const authority = read("app/lib/listingPlans/listingPackagePaymentAuthority.ts");
    assert.equal(authority.includes("DELETE FROM"), false);
  });

  check("8: 9% earn uses integer cents; credits do not earn credits; residual floor is 50¢; intro is $211.65", () => {
    assert.equal(REWARDS_EARN_RATE_BASIS_POINTS, 900);
    assert.equal(computeEarnCents(24900), 2241);
    const earn = assessEarn({
      amountPaidCents: 24900,
      creditsAppliedCents: 0,
      promoDiscountCents: 0,
      source: "admin_manual",
      settled: true,
    });
    assert.equal(earn.earns, true);
    if (earn.earns) assert.equal(earn.earnCents, 2241);
    const noEarnOnCredits = assessEarn({
      amountPaidCents: 24900,
      creditsAppliedCents: 24900,
      promoDiscountCents: 0,
      source: "admin_manual",
      settled: true,
    });
    assert.equal(noEarnOnCredits.earns, false);
    assert.equal(DEFAULT_RAIL_MINIMUM_CHARGE_CENTS, 50);
    assert.equal(VERIFIED_INTRO_QUICK_FIRST_INVOICE_CENTS, 21165);
    const introEarn = computeEarnCents(21165);
    assert.equal(introEarn, 1904);
  });

  check("9: authority helper is wired into assisted custody GET", () => {
    const custody = read("app/api/admin/sales-preview/custody/route.ts");
    assert.ok(custody.includes("readListingPackagePaymentAuthority"));
    assert.ok(custody.includes("wrong_package"));
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-rewards-office-01: ALL CHECKS EXECUTED AND PASSED");
}

main();

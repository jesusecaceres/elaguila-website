/**
 * GATE 1 — listing + package payment authority.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-listing-package-payment-authority-01.ts
 *
 * Mandatory regressions:
 *   Quick-paid → Full refused
 *   Full-selected → Quick-payment refused
 *
 * Pure evaluator + source wiring. No Stripe, no Supabase writes, no live network.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_CATEGORY_PACKAGE_PAIR,
} from "../app/lib/listingPlans/businessAccessLevel";
import {
  FULL_BUSINESS_LIST_PRICE_CENTS,
  QUICK_BUSINESS_LIST_PRICE_CENTS,
  VERIFIED_INTRO_QUICK_FIRST_INVOICE_CENTS,
  canonicalRecordableAmountsCents,
  evaluateListingPackagePaymentAuthority,
  isCanonicalRecordedAmountForPackage,
  paymentAuthorityHttpError,
  verifiedIntroFirstInvoiceCents,
  type PaymentAuthorityRecordFacts,
} from "../app/lib/listingPlans/listingPackagePaymentAuthority";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const failures: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const QUICK = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple;
const FULL = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.full;
const SRC = "servicios_public_listings";
const LISTING = "listing-gate1";

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

check("intro invoice is exactly $211.65 / 21165¢ of $249", () => {
  assert.equal(verifiedIntroFirstInvoiceCents(QUICK_BUSINESS_LIST_PRICE_CENTS), 21165);
  assert.equal(VERIFIED_INTRO_QUICK_FIRST_INVOICE_CENTS, 21165);
  assert.equal(FULL_BUSINESS_LIST_PRICE_CENTS, 39900);
});

check("canonical recordable amounts for Quick are list + intro only", () => {
  assert.deepEqual(canonicalRecordableAmountsCents(QUICK).sort(), [21165, 24900]);
  assert.equal(isCanonicalRecordedAmountForPackage(QUICK, 24900), true);
  assert.equal(isCanonicalRecordedAmountForPackage(QUICK, 21165), true);
  assert.equal(isCanonicalRecordedAmountForPackage(QUICK, 39900), false);
  assert.equal(isCanonicalRecordedAmountForPackage(FULL, 24900), false);
  assert.equal(isCanonicalRecordedAmountForPackage(FULL, 39900), true);
  assert.equal(isCanonicalRecordedAmountForPackage(FULL, 21165), false);
});

check("MANDATORY: Quick-paid → Full refused with wrong_package", () => {
  const d = decide({ packageKey: FULL, records: [rec({ package_key: QUICK })] });
  assert.equal(d.ok, false);
  if (d.ok) throw new Error("unreachable");
  assert.equal(d.error, "wrong_package");
  assert.equal(paymentAuthorityHttpError(d).error, "wrong_package_payment");
  assert.equal(paymentAuthorityHttpError(d).status, 402);
});

check("MANDATORY: Full-selected → Quick-payment refused (same listing, wrong package)", () => {
  const d = evaluateListingPackagePaymentAuthority({
    listingSource: SRC,
    listingId: LISTING,
    packageKey: FULL,
    category: "servicios",
    records: [rec({ package_key: QUICK, amount_cents: 24900, amount_paid_cents: 24900, amount_total_cents: 24900 })],
  });
  assert.equal(d.ok, false);
  if (!d.ok) assert.equal(d.error, "wrong_package");
});

check("MANDATORY: Full payment cannot be reinterpreted as Quick", () => {
  const d = decide({
    packageKey: QUICK,
    records: [
      rec({
        package_key: FULL,
        amount_cents: 39900,
        amount_paid_cents: 39900,
        amount_total_cents: 39900,
      }),
    ],
  });
  assert.equal(d.ok, false);
  if (!d.ok) assert.equal(d.error, "wrong_package");
});

check("cleared Quick $249 on the matched package publishes Quick", () => {
  const d = decide({});
  assert.equal(d.ok, true);
  if (d.ok) {
    assert.equal(d.reason, "payment_record");
    assert.equal(d.expectedCents, 24900);
    assert.equal(d.coveredCents, 24900);
  }
});

check("verified-intro $211.65 qualifies Quick and never Full", () => {
  const intro = rec({
    amount_cents: 21165,
    amount_paid_cents: 21165,
    amount_total_cents: 21165,
    verified_intro_discount_redemption_id: "intro-1",
  });
  const quick = decide({ records: [intro] });
  assert.equal(quick.ok, true);
  const full = decide({ packageKey: FULL, records: [intro] });
  assert.equal(full.ok, false);
  if (!full.ok) assert.equal(full.error, "wrong_package");
});

check("$211.65 without intro redemption is underpaid for list Quick", () => {
  const d = decide({
    records: [rec({ amount_cents: 21165, amount_paid_cents: 21165, amount_total_cents: 21165 })],
  });
  assert.equal(d.ok, false);
  if (!d.ok) assert.equal(d.error, "underpaid");
});

check("Stripe webhook paid/succeeded qualifies; pending/unpaid do not", () => {
  const paid = decide({
    records: [rec({ source: "stripe_webhook", payment_status: "paid", manual_state: null })],
  });
  assert.equal(paid.ok, true);
  const pending = decide({
    records: [rec({ source: "stripe_checkout", payment_status: "pending", manual_state: null })],
  });
  assert.equal(pending.ok, false);
  if (!pending.ok) assert.equal(pending.error, "pending_payment");
});

check("Terminal paid qualifies when source is stripe_terminal", () => {
  const d = decide({
    records: [rec({ source: "stripe_terminal", payment_status: "succeeded", manual_state: null })],
  });
  assert.equal(d.ok, true);
});

check("owner_override is not payment", () => {
  const d = decide({ records: [rec({ source: "owner_override" })] });
  assert.equal(d.ok, false);
  if (!d.ok) assert.equal(d.error, "owner_override_not_payment");
});

check("refunded / disputed / reversed / rejected fail closed", () => {
  const refunded = decide({ records: [rec({ refunded_at: "2026-09-22T00:00:00Z" })] });
  assert.equal(refunded.ok, false);
  if (!refunded.ok) assert.equal(refunded.error, "refunded_payment");
  const disputed = decide({ records: [rec({ payment_status: "disputed" })] });
  assert.equal(disputed.ok, false);
  if (!disputed.ok) assert.equal(disputed.error, "disputed_payment");
  const reversed = decide({ records: [rec({ manual_state: "reversed" })] });
  assert.equal(reversed.ok, false);
  if (!reversed.ok) assert.equal(reversed.error, "reversed_payment");
  const rejected = decide({ records: [rec({ manual_state: "rejected", payment_status: "failed" })] });
  assert.equal(rejected.ok, false);
  if (!rejected.ok) assert.equal(rejected.error, "rejected_payment");
});

check("wrong listing / currency / missing package fail closed", () => {
  const listing = decide({ records: [rec({ listing_id: "other" })] });
  assert.equal(listing.ok, false);
  if (!listing.ok) assert.equal(listing.error, "wrong_listing");
  const currency = decide({ records: [rec({ currency: "mxn" })] });
  assert.equal(currency.ok, false);
  if (!currency.ok) assert.equal(currency.error, "wrong_currency");
  const missing = evaluateListingPackagePaymentAuthority({
    listingSource: SRC,
    listingId: LISTING,
    packageKey: "",
    records: [rec()],
  });
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.error, "missing_package_key");
});

check("underpay fails; overpay on the matched package is allowed", () => {
  const under = decide({
    records: [rec({ amount_cents: 10000, amount_paid_cents: 10000, amount_total_cents: 10000 })],
  });
  assert.equal(under.ok, false);
  if (!under.ok) assert.equal(under.error, "underpaid");
  const over = decide({
    records: [rec({ amount_cents: 26000, amount_paid_cents: 26000, amount_total_cents: 26000 })],
  });
  assert.equal(over.ok, true);
});

check("committed Rewards + residual covering list qualifies; reserved-only does not", () => {
  const residual = rec({
    amount_cents: 12450,
    amount_paid_cents: 12450,
    amount_total_cents: 12450,
    metadata: { leonix_credits_applied_cents: 12450, leonix_amount_is_net_of_credits: true },
  });
  const ok = decide({
    records: [residual],
    rewards: [{ listing_id: LISTING, package_key: QUICK, status: "committed", credits_applied_cents: 12450 }],
  });
  assert.equal(ok.ok, true);
  const reserved = decide({
    records: [residual],
    rewards: [{ listing_id: LISTING, package_key: QUICK, status: "reserved", credits_applied_cents: 12450 }],
  });
  assert.equal(reserved.ok, false);
  if (!reserved.ok) assert.equal(reserved.error, "rewards_not_committed");
});

check("Rewards over-redemption (>50%) fails", () => {
  const d = decide({
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
  assert.equal(d.ok, false);
  if (!d.ok) assert.equal(d.error, "rewards_over_redemption");
});

check("live entitlement for the exact package qualifies; Quick entitlement cannot publish Full", () => {
  const live = evaluateListingPackagePaymentAuthority({
    listingSource: SRC,
    listingId: LISTING,
    packageKey: FULL,
    category: "servicios",
    records: [],
    entitlements: [
      {
        listing_id: LISTING,
        package_key: FULL,
        status: "active",
        revoked_at: null,
        starts_at: "2026-01-01T00:00:00Z",
        ends_at: "2027-01-01T00:00:00Z",
      },
    ],
  });
  assert.equal(live.ok, true);
  const mismatch = evaluateListingPackagePaymentAuthority({
    listingSource: SRC,
    listingId: LISTING,
    packageKey: FULL,
    records: [],
    entitlements: [
      {
        listing_id: LISTING,
        package_key: QUICK,
        status: "active",
        revoked_at: null,
        starts_at: "2026-01-01T00:00:00Z",
        ends_at: "2027-01-01T00:00:00Z",
      },
    ],
  });
  assert.equal(mismatch.ok, false);
});

check("query strings and bodies are not inputs of the evaluator", () => {
  const src = read("app/lib/listingPlans/listingPackagePaymentAuthority.ts");
  assert.ok(!src.includes("searchParams"));
  assert.ok(!src.includes("req.body"));
  assert.ok(!/function evaluateListingPackagePaymentAuthority[\s\S]{0,400}query/.test(src));
});

check("WIRING: every assisted publish path uses refuseUnlessAuthoritativePayment with packageKey", () => {
  const files = [
    "app/api/admin/sales-preview/publish/route.ts",
    "app/api/clasificados/servicios/publish/route.ts",
    "app/api/clasificados/restaurantes/publish/route.ts",
    "app/api/clasificados/autos/assisted-publish/route.ts",
    "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts",
  ];
  for (const f of files) {
    const src = read(f);
    assert.ok(src.includes("refuseUnlessAuthoritativePayment("), `${f} must call the canonical helper`);
    assert.ok(/packageKey\s*:/.test(src), `${f} must pass packageKey`);
    assert.ok(!src.includes("hasClearedManualPaymentForListing("), `${f} must not keep the listing-only helper`);
  }
});

check("WIRING: listing-only helper is gone from custody; server helper selects package_key", () => {
  const custody = read("app/lib/business/assistedListingCustody.ts");
  assert.ok(!custody.includes('.eq("manual_state", "cleared")'), "custody no longer listing-only-clears");
  assert.ok(custody.includes("hasAuthoritativePaymentForListingPackage"), "custody re-exports the package-bound helper");
  const server = read("app/lib/listingPlans/listingPackagePaymentAuthorityServer.ts");
  assert.ok(server.includes("package_key"), "server helper selects package_key");
  assert.ok(server.includes("leonix_payment_records"), "server helper reads the payment ledger");
  assert.ok(server.includes("listing_package_entitlements"), "server helper reads entitlements");
  assert.ok(server.includes("leonix_rewards_redemptions"), "server helper reads committed redemptions");
  assert.ok(!/\.eq\(["']verified_state["']\)/.test(server), "must not add a verified_state column");
});

check("WIRING: Payment Tracker API never reads searchParams for amount/package/listing", () => {
  const api = read("app/api/admin/revenue-os/manual-payments/route.ts");
  assert.ok(!api.includes("searchParams"));
  assert.ok(api.includes("await request.json()"));
  assert.ok(api.includes("body.packageKey"));
  assert.ok(api.includes("body.amountCents"));
  const record = read("app/lib/listingPlans/manualClearedPayments.ts");
  assert.ok(record.includes("isCanonicalRecordedAmountForPackage"));
  assert.ok(record.includes("amount_package_mismatch"));
  assert.ok(record.includes("category_package_mismatch"));
});

check("four pair categories share the $249/$399 split; excluded families are not in the pair map", () => {
  assert.equal(BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple, "servicios_quick_monthly");
  assert.equal(BUSINESS_CATEGORY_PACKAGE_PAIR.restaurantes.full, "restaurantes_base_monthly");
  assert.equal(BUSINESS_CATEGORY_PACKAGE_PAIR.autos.simple, "autos_dealer_quick_monthly");
  assert.equal(BUSINESS_CATEGORY_PACKAGE_PAIR["bienes-raices"].full, "br_agent_monthly");
  for (const cat of ["rentas", "empleos", "autos-privado", "comida-local"]) {
    assert.equal(cat in BUSINESS_CATEGORY_PACKAGE_PAIR, false, cat);
  }
});

if (failures.length) {
  console.error(`verify-listing-package-payment-authority-01: FAIL ${failures.length}/${checks}`);
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}
console.log(`verify-listing-package-payment-authority-01: PASS (${checks} checks)`);

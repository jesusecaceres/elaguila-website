/**
 * LEGACY SUBSCRIPTION RENEWAL — BEHAVIOR (executes the REAL `handleInvoicePaid` and
 * `reconcileLegacySubscription`, with only Stripe and Supabase replaced by in-memory stubs).
 *
 * The seeded rows/subscription are the EXACT facts read from the canonical database and Stripe test mode on
 * 2026-09-24 for Servicios `autos-mechanics` (payment d1ce7075…, entitlements 59ef2691… / 9d7977ee…,
 * subscription sub_1TsmdU… active to 2026-10-13). This proves, end to end and without touching the shared
 * database:
 *   - a normal modern subscription renews (no adoption),
 *   - an evidence-backed LEGACY subscription is adopted and its entitlement(s) extend to period end + 7 days,
 *   - the resolver then recognises PRO coupons for the real listing,
 *   - a replay is idempotent (no second record, no second payment row, no second extension),
 *   - a forged / unpaid / mismatched claim is refused with the reason recorded (ignored, never adopted),
 *   - a Stripe outage is RETRYABLE (nothing written), and a revoked entitlement is never revived,
 *   - a BASE payment can only ever adopt its BASE entitlement (never PRO),
 *   - the admin reconcile is a dry-run by default and idempotent when applied.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-legacy-subscription-renewal-behavior-01.ts
 */
import { strict as assert } from "node:assert";
import { __reset, __rows, __seed } from "./lib/stubs/supabaseServer.mjs";
import { __failSubscriptionRetrieve, __resetStripe, __seedSubscription } from "./lib/stubs/stripe.mjs";
import { handleInvoicePaid, reconcileLegacySubscription } from "../app/lib/listingPlans/revenueSubscriptionEvents";
import { decideBusinessToolsAccess, decideCategoryListingPlan, type EntitlementRowFacts } from "../app/lib/listingPlans/categoryCommercialPlanPolicy";

process.env.STRIPE_SECRET_KEY = "sk_test_harness_only";

type Row = Record<string, unknown>;
const rowsOf = (table: string): Row[] => (__rows as (t: string) => Row[])(table);

const failures: string[] = [];
async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}

const NOW = Date.parse("2026-09-24T18:00:00Z");
const PERIOD_END_S = 1791908594; // 2026-10-13T16:23:14Z
const PERIOD_END_MS = PERIOD_END_S * 1000;
const PLUS_7D_ISO = new Date(PERIOD_END_MS + 7 * 86_400_000).toISOString();
const SUB = "sub_1TsmdURxP2tafN4zMmw9g6I0";
const LISTING = "ef6977d5-d280-44d4-a986-bf94e371a565";
const PAYMENT = "d1ce7075-724a-4d6a-a59c-9da4a562cc9d";
const OWNER = "086b3ea8-f6bb-4353-96a3-919f801bdd16";
const BASE_ENT = "59ef2691-7b4f-46b4-970c-37146d5e0f08";
const ADDON_ENT = "9d7977ee-3764-4b4b-833b-5bd3200de10f";
const INVOICE = "in_1UFGByRxP2tafN4zvpg9rG8X";
const META = {
  leonix_payment_record_id: PAYMENT,
  leonix_category: "servicios",
  leonix_listing_id: LISTING,
  leonix_package_key: "servicios_base_monthly",
  leonix_owner_user_id: OWNER,
  leonix_billing_mode: "monthly_subscription",
};

function seedLegacy(over: { metadata?: Record<string, string>; paymentStatus?: string; entStatus?: string; stripeStatus?: string } = {}) {
  __reset();
  __resetStripe();
  __seed("leonix_payment_records", [
    { id: PAYMENT, category: "servicios", listing_id: LISTING, package_key: "servicios_base_monthly", payment_status: over.paymentStatus ?? "paid", stripe_subscription_id: SUB, owner_user_id: OWNER },
  ]);
  __seed("listing_package_entitlements", [
    { id: BASE_ENT, category: "servicios", listing_source: "servicios", listing_id: LISTING, package_key: "servicios_base_monthly", grant_source: "stripe_webhook", package_tier: "digital_only", status: over.entStatus ?? "active", starts_at: "2026-07-13T16:23:21.448Z", ends_at: "2026-08-12T16:23:21.448Z", payment_record_id: PAYMENT, subscription_record_id: null, metadata: {} },
    { id: ADDON_ENT, category: "servicios", listing_source: "servicios_public_listings", listing_id: LISTING, package_key: "servicios_offers_addon", grant_source: "stripe_webhook", package_tier: "digital_only", status: over.entStatus ?? "active", starts_at: "2026-07-13T16:23:23.065Z", ends_at: "2026-08-12T16:23:23.065Z", payment_record_id: PAYMENT, subscription_record_id: null, metadata: {} },
  ]);
  __seed("leonix_subscription_records", []);
  __seedSubscription({
    id: SUB,
    status: over.stripeStatus ?? "active",
    customer: "cus_UsXiMQDcHJ1hpS",
    metadata: over.metadata ?? META,
    latest_invoice: INVOICE,
    items: { data: [{ current_period_start: 1789316594, current_period_end: PERIOD_END_S, price: { id: "price_1TsmazRxP2tafN4zUx6a26Rp" } }] },
  });
}
const invoice = (id = INVOICE, sub = SUB) =>
  ({
    id,
    amount_paid: 37350,
    currency: "usd",
    customer: "cus_UsXiMQDcHJ1hpS",
    billing_reason: "subscription_cycle",
    parent: { subscription_details: { subscription: sub } },
    lines: { data: [{ period: { end: PERIOD_END_S } }] },
  }) as never;
const ents = () => rowsOf("listing_package_entitlements");
const facts = (): EntitlementRowFacts[] =>
  ents().map((e) => ({ id: String(e.id), packageKey: (e.package_key as string) ?? null, grantSource: (e.grant_source as string) ?? null, packageTier: (e.package_tier as string) ?? null, status: String(e.status), startsAt: (e.starts_at as string) ?? null, endsAt: (e.ends_at as string) ?? null }));
const couponsAllowed = () =>
  decideBusinessToolsAccess({ plan: decideCategoryListingPlan({ category: "servicios", rows: facts(), nowMs: NOW }), capability: "coupons_offers" });

async function main() {
await check("BEFORE: the real listing's rows read 'expired' and deny coupons (the reported defect)", () => {
  seedLegacy();
  const d = couponsAllowed();
  assert.equal(d.allowed, false);
  assert.equal(d.reasonCode, "expired");
});

await check("legacy invoice.paid: ADOPTED from payment evidence, base + add-on extended to period end + 7d, coupons recognised", async () => {
  seedLegacy();
  const r = await handleInvoicePaid({ invoice: invoice(), eventId: "evt_1" });
  assert.deepEqual([r.ok, r.outcome], [true, "completed"], JSON.stringify(r));
  const recs = rowsOf("leonix_subscription_records");
  assert.equal(recs.length, 1);
  assert.equal(recs[0]!.stripe_subscription_id, SUB);
  assert.equal(recs[0]!.package_entitlement_id, BASE_ENT);
  assert.equal(recs[0]!.category, "servicios");
  assert.equal(recs[0]!.listing_id, LISTING);
  assert.equal(recs[0]!.package_key, "servicios_base_monthly");
  assert.equal(recs[0]!.owner_user_id, OWNER);
  assert.equal(new Date(String(recs[0]!.current_period_end)).getTime(), PERIOD_END_MS);
  for (const id of [BASE_ENT, ADDON_ENT]) {
    const e = ents().find((x) => x.id === id)!;
    assert.equal(e.status, "active");
    assert.equal(new Date(String(e.ends_at)).toISOString(), PLUS_7D_ISO, `${id} ends at period end + 7 days`);
    assert.equal(e.subscription_record_id, recs[0]!.id, `${id} linked to the record`);
  }
  const d = couponsAllowed();
  assert.equal(d.allowed, true, "the real PRO listing regains coupons_offers");
  assert.equal(d.reasonCode, "active_package");
  assert.equal(rowsOf("leonix_payment_records").filter((p) => p.stripe_invoice_id === INVOICE).length, 1, "one renewal payment row for the invoice");
});

await check("replay of the SAME event/invoice is idempotent: no second record, payment row or extension change", async () => {
  seedLegacy();
  await handleInvoicePaid({ invoice: invoice(), eventId: "evt_1" });
  const before = JSON.stringify({ recs: rowsOf("leonix_subscription_records"), ents: ents(), pays: rowsOf("leonix_payment_records") });
  const again = await handleInvoicePaid({ invoice: invoice(), eventId: "evt_1" });
  assert.deepEqual([again.ok, again.outcome], [true, "completed"]);
  assert.equal(rowsOf("leonix_subscription_records").length, 1);
  assert.equal(rowsOf("leonix_payment_records").filter((p) => p.stripe_invoice_id === INVOICE).length, 1);
  const strip = (s: string) => s.replace(/"(updated_at|at)":"[^"]*"/g, "");
  assert.equal(strip(JSON.stringify({ recs: rowsOf("leonix_subscription_records"), ents: ents(), pays: rowsOf("leonix_payment_records") })), strip(before));
});

await check("a NEXT month's renewal on the now-adopted subscription takes the NORMAL path (no adoption) and extends again", async () => {
  seedLegacy();
  await handleInvoicePaid({ invoice: invoice(), eventId: "evt_1" });
  const nextEnd = PERIOD_END_S + 30 * 86_400;
  __seedSubscription({ id: SUB, status: "active", customer: "cus_UsXiMQDcHJ1hpS", metadata: META, latest_invoice: "in_next", items: { data: [{ current_period_start: PERIOD_END_S, current_period_end: nextEnd, price: { id: "p" } }] } });
  const next = { ...(invoice("in_next") as object), lines: { data: [{ period: { end: nextEnd } }] } } as never;
  const r = await handleInvoicePaid({ invoice: next, eventId: "evt_2" });
  assert.deepEqual([r.ok, r.outcome], [true, "completed"]);
  assert.equal(rowsOf("leonix_subscription_records").length, 1, "still one record");
  const e = ents().find((x) => x.id === BASE_ENT)!;
  assert.equal(new Date(String(e.ends_at)).getTime(), (nextEnd + 7 * 86_400) * 1000);
});

await check("a modern subscription that ALREADY has a record renews on the NORMAL path (no adoption)", async () => {
  seedLegacy();
  __seed("leonix_subscription_records", [{ id: "rec1", stripe_subscription_id: SUB, status: "active", category: "servicios", listing_id: LISTING, package_key: "servicios_base_monthly", package_entitlement_id: BASE_ENT, owner_user_id: OWNER, metadata: null }]);
  const r = await handleInvoicePaid({ invoice: invoice(), eventId: "evt_m" });
  assert.deepEqual([r.ok, r.outcome], [true, "completed"]);
  assert.equal(new Date(String(ents().find((x) => x.id === BASE_ENT)!.ends_at)).toISOString(), PLUS_7D_ISO);
});

await check("forged / unproven claims are REFUSED (ignored with the reason recorded), nothing adopted, nothing extended", async () => {
  const cases: Array<[string, Parameters<typeof seedLegacy>[0], string]> = [
    ["payment not paid", { paymentStatus: "pending" }, "legacy_adoption_refused_payment_not_paid"],
    ["metadata names another listing", { metadata: { ...META, leonix_listing_id: "another-listing" } }, "legacy_adoption_refused_payment_identity_mismatch"],
    ["metadata names a different payment", { metadata: { ...META, leonix_payment_record_id: "ffffffff-0000-4000-8000-000000000000" } }, "legacy_adoption_refused_payment_record_missing"],
    ["stripe subscription canceled", { stripeStatus: "canceled" }, "legacy_adoption_refused_subscription_not_active"],
  ];
  for (const [label, over, code] of cases) {
    seedLegacy(over);
    const r = await handleInvoicePaid({ invoice: invoice(), eventId: `evt_${label}` });
    assert.deepEqual([r.ok, r.outcome, r.code], [true, "ignored", code], label);
    assert.equal(rowsOf("leonix_subscription_records").length, 0, `${label}: no record`);
    assert.ok(ents().every((e) => String(e.ends_at).startsWith("2026-08-12")), `${label}: nothing extended`);
    assert.equal(couponsAllowed().allowed, false, `${label}: coupons stay denied`);
  }
  seedLegacy({ metadata: {} });
  const notOurs = await handleInvoicePaid({ invoice: invoice(), eventId: "evt_foreign" });
  assert.deepEqual([notOurs.ok, notOurs.outcome, notOurs.code], [true, "ignored", "not_leonix_subscription"], "a subscription with no Leonix metadata is not ours");
});

await check("Stripe unreachable => RETRYABLE (500 to Stripe), nothing written; a revoked entitlement is never revived", async () => {
  seedLegacy();
  __failSubscriptionRetrieve();
  const r = await handleInvoicePaid({ invoice: invoice(), eventId: "evt_down" });
  assert.deepEqual([r.ok, r.outcome], [false, "failed_retryable"]);
  assert.equal(r.code, "legacy_adoption_stripe_unavailable");
  assert.equal(rowsOf("leonix_subscription_records").length, 0);
  seedLegacy({ entStatus: "revoked" });
  const revoked = await handleInvoicePaid({ invoice: invoice(), eventId: "evt_rev" });
  assert.deepEqual([revoked.ok, revoked.outcome, revoked.code], [true, "ignored", "legacy_adoption_refused_entitlement_revoked"]);
  assert.ok(ents().every((e) => e.status === "revoked"), "admin-terminal rows stay revoked");
});

await check("a BASE payment adopts only its BASE entitlement — it can never surface PRO or coupons", async () => {
  __reset();
  __resetStripe();
  const QSUB = "sub_quickbase";
  const QPAY = "aaaaaaaa-0000-4000-8000-000000000001";
  const QLISTING = "11111111-0000-4000-8000-000000000001";
  __seed("leonix_payment_records", [{ id: QPAY, category: "servicios", listing_id: QLISTING, package_key: "servicios_quick_monthly", payment_status: "paid", stripe_subscription_id: QSUB, owner_user_id: OWNER }]);
  __seed("listing_package_entitlements", [{ id: "quickent", category: "servicios", listing_source: "servicios", listing_id: QLISTING, package_key: "servicios_quick_monthly", grant_source: "stripe_webhook", package_tier: "digital_only", status: "active", starts_at: "2026-07-13T00:00:00Z", ends_at: "2026-08-12T00:00:00Z", payment_record_id: QPAY, subscription_record_id: null, metadata: {} }]);
  __seed("leonix_subscription_records", []);
  __seedSubscription({ id: QSUB, status: "active", customer: "c", metadata: { leonix_payment_record_id: QPAY, leonix_category: "servicios", leonix_listing_id: QLISTING, leonix_package_key: "servicios_quick_monthly" }, latest_invoice: "in_q", items: { data: [{ current_period_start: 1789316594, current_period_end: PERIOD_END_S, price: { id: "p" } }] } });
  const r = await handleInvoicePaid({ invoice: invoice("in_q", QSUB), eventId: "evt_q" });
  assert.deepEqual([r.ok, r.outcome], [true, "completed"]);
  const rows = rowsOf("listing_package_entitlements");
  assert.equal(rows.length, 1, "no row created");
  assert.equal(rows[0]!.package_key, "servicios_quick_monthly", "still BASE");
  const plan = decideCategoryListingPlan({ category: "servicios", rows: rows.map((e) => ({ id: String(e.id), packageKey: e.package_key as string, grantSource: e.grant_source as string, packageTier: "digital_only", status: String(e.status), startsAt: e.starts_at as string, endsAt: e.ends_at as string })), nowMs: NOW });
  assert.equal(decideBusinessToolsAccess({ plan, capability: "coupons_offers" }).allowed, false, "BASE renewed, coupons still denied");
});

await check("admin reconcile: DRY-RUN writes nothing and reports the planned ends_at; APPLY is idempotent", async () => {
  seedLegacy();
  const dry = await reconcileLegacySubscription({ stripeSubscriptionId: SUB, dryRun: true });
  assert.equal(dry.ok, true);
  assert.equal(dry.code, "dry_run");
  assert.equal(dry.plannedEndsAt, PLUS_7D_ISO);
  assert.deepEqual(dry.entitlementIds, [BASE_ENT, ADDON_ENT]);
  assert.equal(rowsOf("leonix_subscription_records").length, 0, "dry-run created no record");
  assert.ok(ents().every((e) => String(e.ends_at).startsWith("2026-08-12")), "dry-run changed no entitlement");
  const a = await reconcileLegacySubscription({ stripeSubscriptionId: SUB, dryRun: false });
  assert.equal(a.ok, true, JSON.stringify(a));
  assert.equal(couponsAllowed().allowed, true);
  const snap = () => JSON.stringify({ r: rowsOf("leonix_subscription_records").map((x) => x.id), e: ents().map((x) => [x.id, x.ends_at, x.status]) });
  const first = snap();
  const b = await reconcileLegacySubscription({ stripeSubscriptionId: SUB, dryRun: false });
  assert.equal(b.ok, true);
  assert.equal(snap(), first, "a second apply changes nothing");
  assert.equal(rowsOf("leonix_payment_records").filter((p) => p.stripe_invoice_id).length, 0, "reconcile creates no payment rows / rewards (no money moved)");
});


  await check("DUPLICATE paying subscription (same listing + package): reported on dry-run, an APPLY is refused until acknowledged; a canceled sibling is not a duplicate", async () => {
    seedLegacy();
    const OTHER = "sub_dupe_other";
    __seed("leonix_payment_records", [
      ...rowsOf("leonix_payment_records"),
      { id: "bbbbbbbb-0000-4000-8000-000000000002", category: "servicios", listing_id: LISTING, package_key: "servicios_base_monthly", payment_status: "paid", stripe_subscription_id: OTHER, owner_user_id: OWNER },
    ]);
    __seedSubscription({ id: OTHER, status: "active", customer: "cus_other", metadata: {}, latest_invoice: "in_o", items: { data: [{ current_period_start: 1, current_period_end: PERIOD_END_S, price: { id: "p" } }] } });
    __seedSubscription({ id: SUB, status: "active", customer: "cus_UsXiMQDcHJ1hpS", metadata: META, latest_invoice: INVOICE, items: { data: [{ current_period_start: 1789316594, current_period_end: PERIOD_END_S, price: { id: "p" } }] } });
    const dry = await reconcileLegacySubscription({ stripeSubscriptionId: SUB, dryRun: true });
    assert.equal(dry.ok, true);
    assert.deepEqual(dry.duplicateSubscriptionIds, [OTHER]);
    const refused = await reconcileLegacySubscription({ stripeSubscriptionId: SUB, dryRun: false });
    assert.equal(refused.ok, false);
    assert.equal(refused.code, "refused_duplicate_subscription_review_required");
    assert.equal(rowsOf("leonix_subscription_records").length, 0, "nothing written while a duplicate is unacknowledged");
    const acked = await reconcileLegacySubscription({ stripeSubscriptionId: SUB, dryRun: false, acknowledgeDuplicates: true });
    assert.equal(acked.ok, true, JSON.stringify(acked));
    // a CANCELED sibling is not a duplicate
    seedLegacy();
    __seed("leonix_payment_records", [
      ...rowsOf("leonix_payment_records"),
      { id: "bbbbbbbb-0000-4000-8000-000000000003", category: "servicios", listing_id: LISTING, package_key: "servicios_base_monthly", payment_status: "paid", stripe_subscription_id: "sub_gone", owner_user_id: OWNER },
    ]);
    __seedSubscription({ id: "sub_gone", status: "canceled", customer: "c", metadata: {}, latest_invoice: "x", items: { data: [] } });
    __seedSubscription({ id: SUB, status: "active", customer: "cus_UsXiMQDcHJ1hpS", metadata: META, latest_invoice: INVOICE, items: { data: [{ current_period_start: 1789316594, current_period_end: PERIOD_END_S, price: { id: "p" } }] } });
    const clean = await reconcileLegacySubscription({ stripeSubscriptionId: SUB, dryRun: true });
    assert.deepEqual(clean.duplicateSubscriptionIds, []);
  });
}

main().then(() => {
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-legacy-subscription-renewal-behavior-01: all checks passed");
}).catch((e) => {
  console.error(e);
  process.exit(1);
});

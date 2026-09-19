/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 3 (Admin commercial truth, 2026-09-18).
 *
 * Extends the read-only Servicios Admin commercial-truth projection with the actual
 * leonix_payment_records row (previously not projected at all — an operator could see "linked"/
 * "not_linked" derived from the subscription record, but never the real payment_status, amount, or
 * paid_at). Bounded read, REAL/PARTIAL/NEEDS_PROOF/UNAVAILABLE discipline preserved, canonical match
 * is category + listing_id (no listing_source column exists on this table, and none is added).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate3-admin-payment-record.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const OPS = "app/admin/_lib/serviciosCommercialOps.ts";
const CARD = "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx";

check("commercial ops row type now carries real payment-record fields", () => {
  const src = raw(OPS);
  for (const field of [
    "paymentRecordStatus",
    "paymentAmountPaidCents",
    "paymentAmountExpectedCents",
    "paymentPaidAt",
    "paymentStripePaymentIntentId",
  ]) {
    assert.ok(src.includes(`${field}:`), `row type must declare ${field}`);
  }
});

check("payment-record read is bounded, read-only, and keyed on category + listing_id only (no listing_source)", () => {
  const src = raw(OPS);
  const idx = src.indexOf('.from("leonix_payment_records")');
  assert.ok(idx > 0, "must actually query the real table");
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes('.eq("category", SERVICIOS_BASE_CHECKOUT.category)'));
  assert.ok(block.includes('.eq("package_key", SERVICIOS_BASE_CHECKOUT.packageKey)'));
  assert.ok(block.includes('.in("listing_id", ids)'), "bounded to the caller's current page of ids");
  assert.ok(!block.includes("listing_source"), "leonix_payment_records has no listing_source column — must not filter on it");
  assert.ok(!/\.insert\(|\.update\(|\.upsert\(|\.delete\(/.test(src), "this module must remain strictly read-only");
});

check("missing payment record degrades honestly (PARTIAL, truthful note) — never collapses to unpaid/zero", () => {
  const src = raw(OPS);
  const idx = src.indexOf("if (!rec) {");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes('"PARTIAL"'), "absence must be PARTIAL, not a fabricated REAL zero/unpaid claim");
  assert.ok(!block.includes('"not_purchased"'), "payment-record absence must not be worded as a purchase-status claim");
});

check("card renders every new payment-record field", () => {
  const src = raw(CARD);
  for (const label of ["Payment status", "Amount paid", "Amount expected", "Paid at", "Stripe payment intent"]) {
    assert.ok(src.includes(`label="${label}"`), `card must render a "${label}" truth row`);
  }
});

check("Gate 12/G12-D: published_at now has its own distinct display, separate from updated_at", () => {
  const src = raw(CARD);
  assert.ok(src.includes('{formatWhen(row.updated_at)}'), "Updated must show only updated_at, no fallback");
  assert.ok(src.includes('{formatWhen(row.published_at)}'), "Published at must be its own field");
  assert.ok(!src.includes("formatWhen(row.updated_at, row.published_at)"), "the old conflated fallback call must be gone");
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate3-admin-payment-record: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate3-admin-payment-record: PASS");

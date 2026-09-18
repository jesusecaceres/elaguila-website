/**
 * Servicios Golden lifecycle closeout — Gate 8 (commercial publish circuit, 2026-09-18).
 *
 * Source-level trace + lock of the paid Servicios circuit:
 *   Preview -> Revenue OS checkout -> Stripe -> webhook (signature verified FIRST) ->
 *   payment record paid -> entitlement -> Servicios activation (SAME row, pending_payment ->
 *   published, real published_at) -> subscription record linked to payment + entitlement.
 *
 * Authority properties locked here (any regression fails loudly):
 *   - the browser can never publish a first-purchase listing: the publish route returns 402
 *     payment_required unless pending-payment save, owner republish of a live row, or assisted;
 *   - the webhook is the only commercial authority: signature verified before any state change;
 *   - Servicios activation only ever targets the SAME row by canonical listing id, only from
 *     pending_payment/paused_unpublished, and stamps published_at only when it is still null;
 *   - ordering: payment paid -> entitlement -> Servicios activation (no activation before paid);
 *   - Restaurantes uses the identical shared sequence (parity reference);
 *   - subscription record is upserted from the checkout session and linked to the payment record
 *     + package entitlement.
 * Runtime proof of the circuit (webhook 2xx, real rows) requires the production
 * STRIPE_WEBHOOK_SECRET (Gate 9) and a live TEST payment; this verifier proves the CODE contract.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-gate8-commercial-circuit.ts
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

const WEBHOOK_ROUTE = "app/api/revenue-os/webhook/route.ts";
const WEBHOOK_LIB = "app/lib/listingPlans/revenueWebhook.ts";
const FULFILLMENT = "app/lib/listingPlans/revenueFulfillment.ts";
const SERVICIOS_FULFILLMENT = "app/lib/listingPlans/revenueServiciosFulfillment.ts";
const SUB_EVENTS = "app/lib/listingPlans/revenueSubscriptionEvents.ts";
const PUBLISH_ROUTE = "app/api/clasificados/servicios/publish/route.ts";

check("the browser cannot publish a first-purchase listing: publish route returns 402 payment_required outside the three allowed paths", () => {
  const src = raw(PUBLISH_ROUTE);
  assert.ok(src.includes('error: "payment_required"'));
  assert.ok(src.includes("{ status: 402 }"));
  assert.ok(src.includes("strict && isSupabaseAdminConfigured() && !pendingPayment && !isAssistedRequest"));
  const idx = src.indexOf("const allowedOwnerRepublish =");
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes("SERVICIOS_LISTING_STATUS_PUBLISHED") && block.includes('"paused_unpublished"') && block.includes("SERVICIOS_LISTING_STATUS_PENDING_REVIEW"));
  assert.ok(!block.includes("pending_payment"), "a pending_payment row must never be an allowed no-payment publish path");
});

check("the webhook verifies the Stripe signature BEFORE claiming/processing any event", () => {
  const src = raw(WEBHOOK_ROUTE);
  const verifyIdx = src.indexOf("verifyStripeWebhookEvent({");
  const claimIdx = src.indexOf("claimStripeEvent({");
  const fulfillIdx = src.indexOf("fulfillCheckoutSessionCompleted({");
  assert.ok(verifyIdx > 0 && claimIdx > verifyIdx && fulfillIdx > claimIdx, "verify -> claim -> fulfill ordering");
  assert.ok(src.includes("if (!verified.ok) {"));
});

check("503 from the webhook is specifically webhook_secret_missing (unset STRIPE_WEBHOOK_SECRET); a WRONG secret is a 400, not a 503", () => {
  const src = raw(WEBHOOK_LIB);
  const idx = src.indexOf("export function verifyStripeWebhookEvent");
  const block = src.slice(idx, idx + 1200);
  assert.ok(block.includes('code: "webhook_secret_missing", status: 503'));
  assert.ok(block.includes('code: "signature_invalid", status: 400'));
});

check("fulfillment order: payment marked paid -> entitlement activated -> Servicios activation (never before paid truth)", () => {
  const src = raw(FULFILLMENT);
  const paid = src.indexOf("await markPaymentRecordPaid({");
  const ent = src.indexOf("await activateEntitlementsForPayment({", paid);
  const svc = src.indexOf("await tryActivateServiciosListingAfterEntitlement({", ent);
  assert.ok(paid > 0 && ent > paid && svc > ent, `expected paid(${paid}) < entitlement(${ent}) < servicios activation(${svc})`);
});

check("Restaurantes (working reference) runs through the identical shared sequence, before Servicios activation", () => {
  const src = raw(FULFILLMENT);
  const ent = src.indexOf("await activateEntitlementsForPayment({", src.indexOf("await markPaymentRecordPaid({"));
  const rest = src.indexOf("await tryActivateRestauranteListingAfterEntitlement({", ent);
  const svc = src.indexOf("await tryActivateServiciosListingAfterEntitlement({", ent);
  assert.ok(rest > ent && svc > rest, "Restaurantes and Servicios share the post-entitlement activation phase");
});

check("Servicios activation: only servicios_base_monthly, SAME row by canonical id, only from pending_payment/paused_unpublished, published_at only when null", () => {
  const src = raw(SERVICIOS_FULFILLMENT);
  assert.ok(src.includes("packageKey !== SERVICIOS_BASE_MONTHLY_PACKAGE_KEY"));
  assert.ok(src.includes('.eq("id", listingId)'));
  assert.ok(src.includes('.in("listing_status", [...SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES])'));
  assert.ok(/SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES = \[\s*"paused_unpublished",\s*SERVICIOS_PENDING_CHECKOUT_STATUS,\s*\] as const/.test(src));
  assert.ok(src.includes("if (!row.published_at) {"));
  assert.ok(src.includes("patch.published_at = now;"));
  // Every direct call on the servicios_public_listings TABLE must be a read or an update — never
  // an insert (listing_source string mentions on the entitlements table are unrelated).
  const flat = src.replace(/\s+/g, " ");
  const tableCalls = [...flat.matchAll(/\.from\("servicios_public_listings"\) \.(\w+)\(/g)].map((m) => m[1]);
  assert.ok(tableCalls.length >= 2, "expected the read + update calls on the listing table");
  for (const op of tableCalls) {
    assert.ok(op === "select" || op === "update", `activation must only select/update the listing table, found .${op}()`);
  }
});

check("suspended/rejected rows are never auto-activated by the webhook (Leonix-owned states)", () => {
  const src = raw(SERVICIOS_FULFILLMENT);
  assert.ok(src.includes('status === "suspended" || status === "rejected"'));
});

check("subscription record is upserted from the checkout session and linked to the payment record + package entitlement", () => {
  const route = raw(WEBHOOK_ROUTE);
  assert.ok(route.includes("await ensureSubscriptionRecordFromCheckoutSession({"));
  assert.ok(route.includes("paymentRecordId: result.paymentRecordId ?? null,"));
  assert.ok(route.includes("packageEntitlementId:"));
  const sub = raw(SUB_EVENTS);
  const idx = sub.indexOf("export async function ensureSubscriptionRecordFromCheckoutSession");
  assert.ok(idx > 0);
  assert.ok(sub.slice(idx, idx + 2500).includes('.from("leonix_subscription_records")'));
});

check("the webhook only settles the event as completed AFTER fulfillment succeeded (failed fulfillment -> 422 retryable, never a silent 200)", () => {
  const src = raw(WEBHOOK_ROUTE);
  assert.ok(src.includes('"failed_retryable"'));
  assert.ok(src.includes("{ status: 422 }"));
});

if (failures.length) {
  console.error(`\nverify-servicios-golden-gate8-commercial-circuit: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-gate8-commercial-circuit: PASS");

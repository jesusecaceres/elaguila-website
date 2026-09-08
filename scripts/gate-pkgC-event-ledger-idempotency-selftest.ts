/**
 * Package C Build 1 — Gates 2/3/4/5: event ledger, idempotency, subscription lifecycle.
 *
 * Behavioral tests on the pure decision logic (claim decisions, transition table, grace math,
 * ends-at computation, attempt-key determinism) + source pins for the DB/Stripe wiring.
 *
 * Run from repo root: npx tsx scripts/gate-pkgC-event-ledger-idempotency-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { decideDuplicateClaim, STALE_PROCESSING_MINUTES } from "../app/lib/listingPlans/stripeEventLedgerPolicy";
import {
  computeGraceEndsAt,
  decideSubscriptionTransition,
  isGraceExpired,
  laneSuspensionSpecForCategory,
  SUBSCRIPTION_GRACE_DAYS,
  computeEndsAt,
} from "../app/lib/listingPlans/subscriptionLifecyclePolicy";
import { computeCheckoutAttemptKey } from "../app/lib/listingPlans/checkoutAttemptIdentity";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — ledger claim decisions (sequential + concurrent replay semantics). */
{
  const now = Date.now();
  // Sequential replay of a completed event → skip, respond 200.
  assert.equal(decideDuplicateClaim({ status: "completed", processing_started_at: null }, now), "skip_done");
  assert.equal(decideDuplicateClaim({ status: "ignored", processing_started_at: null }, now), "skip_done");
  assert.equal(decideDuplicateClaim({ status: "failed_terminal", processing_started_at: null }, now), "skip_done");
  // Retryable failure → reclaim (Stripe redelivery is the retry scheduler).
  assert.equal(decideDuplicateClaim({ status: "failed_retryable", processing_started_at: null }, now), "reclaim");
  assert.equal(decideDuplicateClaim({ status: "received", processing_started_at: null }, now), "reclaim");
  // Concurrent replay: a FRESH processing row is owned elsewhere → skip.
  assert.equal(
    decideDuplicateClaim({ status: "processing", processing_started_at: new Date(now - 60_000).toISOString() }, now),
    "skip_processing",
  );
  // Crash self-heal: stale processing is re-claimable.
  assert.equal(
    decideDuplicateClaim(
      { status: "processing", processing_started_at: new Date(now - (STALE_PROCESSING_MINUTES + 1) * 60_000).toISOString() },
      now,
    ),
    "reclaim",
  );
}

/* 2 — subscription transition table (locked lifecycle semantics). */
{
  // First failure starts grace; visibility stays.
  const failed = decideSubscriptionTransition("active", "invoice_payment_failed");
  assert.equal(failed.next, "grace");
  assert.deepEqual(failed.effects, ["start_grace"]);
  // Recovery from grace: active + recovery recorded, no visibility change needed (never lost).
  const recovered = decideSubscriptionTransition("grace", "invoice_paid");
  assert.equal(recovered.next, "active");
  assert.ok(recovered.effects.includes("record_recovery"));
  assert.ok(!recovered.effects.includes("restore_visibility"));
  // Recovery from payment suspension RESTORES visibility.
  const restored = decideSubscriptionTransition("suspended", "invoice_paid", { suspensionReason: "payment_failure" });
  assert.equal(restored.next, "active");
  assert.ok(restored.effects.includes("restore_visibility"));
  // Recovery never lifts a chargeback suspension via invoice.paid.
  const chargebackHeld = decideSubscriptionTransition("suspended", "invoice_paid", { suspensionReason: "chargeback" });
  assert.ok(!chargebackHeld.effects.includes("restore_visibility"));
  // Grace expiry suspends.
  const expired = decideSubscriptionTransition("grace", "grace_expired");
  assert.equal(expired.next, "suspended");
  assert.ok(expired.effects.includes("suspend_visibility"));
  // Cancel-at-period-end deletion honors paid-through (no immediate visibility suspension).
  const cape = decideSubscriptionTransition("active", "subscription_deleted", { endedReason: "canceled_at_period_end" });
  assert.equal(cape.next, "canceled");
  assert.ok(!cape.effects.includes("suspend_visibility"));
  // Final-failure deletion suspends now, preserving content.
  const finalFail = decideSubscriptionTransition("grace", "subscription_deleted", { endedReason: "payment_failure_final" });
  assert.ok(finalFail.effects.includes("suspend_visibility"));
  // Dispute suspends + flags review; dispute won restores.
  const disputed = decideSubscriptionTransition("active", "dispute_created");
  assert.equal(disputed.next, "suspended");
  assert.ok(disputed.effects.includes("flag_admin_review"));
  const won = decideSubscriptionTransition("suspended", "dispute_closed_won", { suspensionReason: "chargeback" });
  assert.ok(won.effects.includes("restore_visibility"));
}

/* 3 — locked 7-CALENDAR-DAY grace math. */
{
  assert.equal(SUBSCRIPTION_GRACE_DAYS, 7);
  const start = new Date("2026-08-05T12:00:00Z");
  const end = computeGraceEndsAt(start);
  assert.equal(end.toISOString(), "2026-08-12T12:00:00.000Z");
  assert.equal(isGraceExpired(end, Date.parse("2026-08-12T11:59:00Z")), false);
  assert.equal(isGraceExpired(end, Date.parse("2026-08-12T12:01:00Z")), true);
  assert.equal(isGraceExpired(null), false);
}

/* 4 — subscription ends-at: real period end + 7d backstop; explicit +30d fallback. */
{
  const monthly = getRevenuePackageDefinition("restaurantes_base_monthly")!;
  const start = new Date("2026-08-05T00:00:00Z");
  const periodEnd = new Date("2026-09-05T00:00:00Z");
  const withReal = computeEndsAt(start, monthly, periodEnd);
  assert.equal(withReal.toISOString(), "2026-09-12T00:00:00.000Z", "real period end + 7d grace backstop");
  const fallback = computeEndsAt(start, monthly, null);
  assert.equal(fallback.toISOString(), "2026-09-11T00:00:00.000Z", "fallback = +30d + 7d backstop");
  // One-time products keep durationDays semantics, no grace backstop.
  const oneTime = getRevenuePackageDefinition("br_fsbo_45d")!;
  const fsbo = computeEndsAt(start, oneTime);
  assert.equal(fsbo.toISOString(), "2026-09-19T00:00:00.000Z", "45-day one-time, no backstop");
}

/* 5 — purchase-attempt identity: deterministic, order-insensitive add-ons, identity-scoped. */
{
  const base = {
    ownerUserId: "User-1",
    listingSource: "restaurantes",
    listingId: "L1",
    packageKey: "restaurantes_base_monthly",
    billingMode: "monthly_subscription",
  };
  const a = computeCheckoutAttemptKey({ ...base, addOns: [{ key: "restaurantes_offers_addon", quantity: 1 }] });
  const b = computeCheckoutAttemptKey({ ...base, addOns: [{ key: "RESTAURANTES_OFFERS_ADDON", quantity: 1 }] });
  assert.equal(a, b, "add-on key normalization: same purchase = same key");
  const c = computeCheckoutAttemptKey({ ...base });
  assert.notEqual(a, c, "different add-on selection = different purchase attempt");
  const d = computeCheckoutAttemptKey({ ...base, ownerUserId: "user-2", addOns: [{ key: "restaurantes_offers_addon", quantity: 1 }] });
  assert.notEqual(a, d, "different owner = different attempt (no cross-owner reuse)");
  const e = computeCheckoutAttemptKey({ ...base, operation: "renew_listing", addOns: [{ key: "restaurantes_offers_addon", quantity: 1 }] });
  assert.notEqual(a, e, "renewal is a distinct purchase identity");
}

/* 6 — wiring pins: Stripe idempotency key, invoice uniqueness, 23505 recovery, event list. */
{
  const stripeHelper = read("app/lib/listingPlans/revenueStripe.ts");
  assert.ok(stripeHelper.includes("idempotencyKey"), "Stripe request idempotency wired");
  assert.ok(stripeHelper.includes("${attemptKey}:${"), "idempotency key = stable attempt identity + generation");

  const paymentRecords = read("app/lib/listingPlans/revenuePaymentRecords.ts");
  assert.ok(paymentRecords.includes('error?.code === "23505"'), "concurrent attempt insert resolves via 23505 signal");

  const entitlement = read("app/lib/listingPlans/revenueEntitlementFulfillment.ts");
  assert.ok(entitlement.includes('pkgError?.code === "23505"'), "duplicate entitlement insert re-selects idempotently");
  assert.ok(entitlement.includes("extendEntitlementForInvoicePaid"), "invoice.paid extension exists");
  assert.ok(entitlement.includes("entitlement_revoked_requires_admin"), "revoked is never auto-revived");

  const webhookLib = read("app/lib/listingPlans/revenueWebhook.ts");
  for (const evt of [
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "charge.refunded",
    "charge.dispute.created",
    "charge.dispute.closed",
  ]) {
    assert.ok(webhookLib.includes(`"${evt}"`), `supported event declared: ${evt}`);
  }
  const routeSrc = read("app/api/revenue-os/webhook/route.ts");
  for (const handler of [
    "handleInvoicePaid",
    "handleInvoicePaymentFailed",
    "handleSubscriptionUpdated",
    "handleSubscriptionDeleted",
    "handleChargeRefunded",
    "handleDisputeCreated",
    "handleDisputeClosed",
  ]) {
    assert.ok(routeSrc.includes(handler), `real handler dispatched (never string-only): ${handler}`);
  }
  const events = read("app/lib/listingPlans/revenueSubscriptionEvents.ts");
  assert.ok(events.includes("subscription.items?.data?.[0]"), "post-Basil item-level period read with fallback");
  assert.ok(events.includes("parent?.subscription_details?.subscription"), "post-Basil invoice subscription pointer with fallback");
  assert.ok(events.includes("stripe_invoice_id"), "per-invoice renewal payment records (M5 uniqueness target)");
}

/* 7 — CAS suspension/restore precedence (payment recovery never overrides other actors). */
{
  const lifecycle = read("app/lib/listingPlans/subscriptionLifecycle.ts");
  assert.ok(lifecycle.includes('.eq("suspended_reason", "payment")'), "restore CAS requires the payment reason marker");
  assert.ok(lifecycle.includes("payment_restore_skipped_listing_owned_elsewhere"), "skipped restores are audited");
  // Lane specs use ONLY existing status vocabularies.
  assert.equal(laneSuspensionSpecForCategory("restaurantes")?.suspendedValue, "suspended");
  assert.equal(laneSuspensionSpecForCategory("servicios")?.suspendedValue, "suspended");
  assert.equal(laneSuspensionSpecForCategory("autos")?.suspendedValue, "payment_failed");
  assert.equal(laneSuspensionSpecForCategory("bienes-raices")?.suspendedValue, "suspended");
  assert.equal(laneSuspensionSpecForCategory("empleos"), null, "no invented lanes");
}

console.log("gate-pkgC-event-ledger-idempotency-selftest: all assertions passed.");

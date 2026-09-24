/**
 * Gate QB-CONVERGENCE-02 — BEHAVIORAL proof of Quick→Full subscription convergence.
 * Run: npx tsx scripts/verify-quick-convergence-behavior-01.ts
 *
 * This is not a string-matching verifier. It imports the REAL planner
 * (`quickToFullConvergencePure.ts`) and the REAL executor
 * (`quickToFullConvergenceCore.ts`) and drives them with fake Stripe/ledger/audit ports,
 * asserting on observable behaviour: which Stripe calls were made, with which arguments,
 * what the audit trail says, and whether the result is retryable.
 *
 * NO LIVE STRIPE CALL AND NO DATABASE ACCESS OCCURS — the ports are in-memory fakes.
 *
 * Covers the seven owner-required scenarios:
 *   1. Full success converges Quick (immediately, with proration — never period-end).
 *   2. Failed/abandoned Full checkout preserves Quick.
 *   3. Duplicate webhook is harmless (and reuses the same Stripe idempotency key).
 *   4. Missing Quick subscription is a safe no-op.
 *   5. Stripe cancellation failure is auditable AND retryable.
 *   6. Unrelated subscriptions are never modified.
 *   7. The correct customer, category, package and subscription are selected.
 */
import { strict as assert } from "node:assert";
import {
  isFullBasePackageKey,
  planQuickToFullConvergence,
  quickPackageKeyForCategory,
  type FullPaymentFact,
  type QuickSubscriptionSnapshot,
} from "../app/lib/listingPlans/quickToFullConvergencePure";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import {
  decideSubscriptionTransition,
  hasLiveFullBaseEntitlement,
  isQuickBaseSubscription,
  isSupersededQuickSubscriptionDeletion,
} from "../app/lib/listingPlans/subscriptionLifecyclePolicy";
import {
  convergenceIdempotencyKey,
  executeQuickToFullConvergence,
  type ConvergenceAuditEntry,
  type ConvergenceLedgerPort,
  type ConvergenceStripePort,
} from "../app/lib/listingPlans/quickToFullConvergenceCore";

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
// Fakes. Every Stripe interaction is recorded so tests assert on real effects.
// ---------------------------------------------------------------------------
type CancelCall = { subscriptionId: string; prorate: boolean; idempotencyKey: string };
type LedgerRecord = {
  ownerUserId: string;
  category: string;
  packageKey: string;
  listingId: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
};

function makeFakes(opts: {
  quickRecord?: LedgerRecord | null;
  /** Several ledger rows; the fake ledger filters them by the query exactly as SQL would. */
  ledgerRecords?: LedgerRecord[];
  ledgerError?: string;
  subscriptionState?: { status: string; cancelAtPeriodEnd: boolean; customerId: string | null };
  retrieveError?: string;
  cancelError?: string;
}) {
  const cancelCalls: CancelCall[] = [];
  const retrieveCalls: string[] = [];
  const audit: ConvergenceAuditEntry[] = [];

  const stripe: ConvergenceStripePort = {
    async retrieveSubscription(subscriptionId) {
      retrieveCalls.push(subscriptionId);
      if (opts.retrieveError) return { ok: false, error: opts.retrieveError };
      const s = opts.subscriptionState ?? { status: "active", cancelAtPeriodEnd: false, customerId: "cus_quick" };
      return { ok: true, status: s.status, cancelAtPeriodEnd: s.cancelAtPeriodEnd, customerId: s.customerId };
    },
    async cancelSubscriptionImmediately(subscriptionId, o) {
      cancelCalls.push({ subscriptionId, prorate: o.prorate, idempotencyKey: o.idempotencyKey });
      if (opts.cancelError) return { ok: false, error: opts.cancelError };
      return { ok: true, status: "canceled" };
    },
  };

  const ledgerQueries: Array<Parameters<ConvergenceLedgerPort["findPaidQuickSubscription"]>[0]> = [];
  const ledger: ConvergenceLedgerPort = {
    async findPaidQuickSubscription(query) {
      ledgerQueries.push(query);
      if (opts.ledgerError) return { ok: false, error: opts.ledgerError };
      if (opts.ledgerRecords) {
        // Same predicate the production adapter applies: owner + category + package + LISTING.
        const match = opts.ledgerRecords.find(
          (r) =>
            r.ownerUserId === query.ownerUserId &&
            r.category === query.category &&
            r.packageKey === query.quickPackageKey &&
            r.listingId === query.listingId,
        );
        return { ok: true, record: match ?? null };
      }
      return { ok: true, record: opts.quickRecord ?? null };
    },
  };

  return {
    ports: { stripe, ledger, audit: { async record(e: ConvergenceAuditEntry) { audit.push(e); } } },
    cancelCalls,
    retrieveCalls,
    ledgerQueries,
    audit,
  };
}

const FULL_PAID: FullPaymentFact = {
  ownerUserId: "user_1",
  category: "servicios",
  packageKey: "servicios_base_monthly",
  listingId: "lst_1",
  paid: true,
  stripeCustomerId: "cus_quick",
  stripeSubscriptionId: "sub_full_new",
};

const QUICK_RECORD: LedgerRecord = {
  ownerUserId: "user_1",
  category: "servicios",
  packageKey: "servicios_quick_monthly",
  listingId: "lst_1",
  stripeSubscriptionId: "sub_quick_old",
  stripeCustomerId: "cus_quick",
};

async function main() {
  // =========================================================================
  // PURE PLANNER — the policy itself
  // =========================================================================
  await check("planner: package-key classification is real", () => {
    assert.equal(isFullBasePackageKey("servicios_base_monthly"), true);
    assert.equal(isFullBasePackageKey("servicios_quick_monthly"), false);
    assert.equal(quickPackageKeyForCategory("autos"), "autos_dealer_quick_monthly");
    assert.equal(quickPackageKeyForCategory("not_a_category"), null);
  });

  await check("planner: cancel_at_period_end is NOT treated as converged", () => {
    const quick: QuickSubscriptionSnapshot = {
      ...QUICK_RECORD,
      status: "active",
      cancelAtPeriodEnd: true, // previously-scheduled period-end cancellation
    };
    const plan = planQuickToFullConvergence(FULL_PAID, quick);
    assert.equal(
      plan.action,
      "cancel_quick_immediately",
      "a Quick sub already flagged cancel_at_period_end must still be hard-cancelled — otherwise both plans bill concurrently",
    );
  });

  await check("planner: unpaid Full preserves Quick (scenario 2)", () => {
    const plan = planQuickToFullConvergence({ ...FULL_PAID, paid: false }, { ...QUICK_RECORD, status: "active", cancelAtPeriodEnd: false });
    assert.deepEqual(plan, { action: "skip", reason: "full_payment_not_authoritative" });
  });

  await check("planner: never cancels the subscription just purchased", () => {
    const plan = planQuickToFullConvergence(
      { ...FULL_PAID, stripeSubscriptionId: "sub_same" },
      { ...QUICK_RECORD, stripeSubscriptionId: "sub_same", status: "active", cancelAtPeriodEnd: false },
    );
    assert.deepEqual(plan, { action: "skip", reason: "same_subscription" });
  });

  await check("planner: refuses on identity mismatch (scenario 6/7)", () => {
    const base: QuickSubscriptionSnapshot = { ...QUICK_RECORD, status: "active", cancelAtPeriodEnd: false };
    assert.deepEqual(
      planQuickToFullConvergence(FULL_PAID, { ...base, ownerUserId: "user_OTHER" }),
      { action: "refuse", reason: "owner_mismatch" },
    );
    assert.deepEqual(
      planQuickToFullConvergence(FULL_PAID, { ...base, category: "autos" }),
      { action: "refuse", reason: "category_mismatch" },
    );
    assert.deepEqual(
      planQuickToFullConvergence(FULL_PAID, { ...base, packageKey: "some_other_package" }),
      { action: "refuse", reason: "package_mismatch" },
    );
    assert.deepEqual(
      planQuickToFullConvergence(FULL_PAID, { ...base, stripeCustomerId: "cus_SOMEONE_ELSE" }),
      { action: "refuse", reason: "customer_mismatch" },
    );
  });

  await check("planner: an UNVERIFIABLE Quick customer refuses — it is not a matching customer", () => {
    // 2026-09-21 audit follow-up. Reaching the planner with a null customer means the Stripe
    // retrieve SUCCEEDED and returned no customer AND the ledger has no copy — the one guard that
    // stops this code touching the wrong customer's subscription would otherwise be silently
    // disabled in exactly the case where the data is least trustworthy.
    const base: QuickSubscriptionSnapshot = { ...QUICK_RECORD, status: "active", cancelAtPeriodEnd: false };
    assert.deepEqual(
      planQuickToFullConvergence(FULL_PAID, { ...base, stripeCustomerId: null }),
      { action: "refuse", reason: "customer_unverified" },
      "a Quick subscription whose customer cannot be established is never cancelled",
    );
    // Scoped: when the FULL side has no customer id either, the guard was never evaluable in this
    // environment and behaviour is unchanged — otherwise every convergence would be blocked.
    assert.deepEqual(
      planQuickToFullConvergence(
        { ...FULL_PAID, stripeCustomerId: null },
        { ...base, stripeCustomerId: null },
      ),
      { action: "cancel_quick_immediately", quickSubscriptionId: base.stripeSubscriptionId, prorate: true },
      "a webhook shape that carries no customer at all does not block convergence",
    );
    // (A refusal is never retried; that invariant is asserted by the executor scenarios below.)
  });

  await check("planner: already-cancelled Quick is a skip, not an error (scenario 3)", () => {
    for (const status of ["canceled", "incomplete_expired"]) {
      const plan = planQuickToFullConvergence(FULL_PAID, { ...QUICK_RECORD, status, cancelAtPeriodEnd: false });
      assert.deepEqual(plan, { action: "skip", reason: "already_canceled" }, `status ${status}`);
    }
  });

  // =========================================================================
  // EXECUTOR — real orchestration against fake ports
  // =========================================================================

  // SCENARIO 1 — Full success converges Quick immediately with proration.
  await check("scenario 1: Full success cancels Quick immediately with proration", async () => {
    const f = makeFakes({ quickRecord: QUICK_RECORD });
    const res = await executeQuickToFullConvergence({ full: FULL_PAID, eventId: "evt_1", ports: f.ports });

    assert.deepEqual(res, { ok: true, outcome: "completed", quickSubscriptionId: "sub_quick_old" });
    assert.equal(f.cancelCalls.length, 1, "exactly one cancellation");
    assert.equal(f.cancelCalls[0]!.subscriptionId, "sub_quick_old", "cancelled the QUICK sub, not the Full one");
    assert.equal(f.cancelCalls[0]!.prorate, true, "unused paid time is credited, not forfeited");

    const outcomes = f.audit.map((a) => a.outcome);
    assert.ok(outcomes.includes("attempted"), "audit records the attempt before mutating");
    assert.ok(outcomes.includes("completed"), "audit records completion");
  });

  // SCENARIO 2 — failed/abandoned Full checkout preserves Quick, touching nothing.
  await check("scenario 2: unpaid Full never touches Stripe or the ledger", async () => {
    const f = makeFakes({ quickRecord: QUICK_RECORD });
    const res = await executeQuickToFullConvergence({
      full: { ...FULL_PAID, paid: false },
      eventId: "evt_2",
      ports: f.ports,
    });
    assert.equal(res.ok, true);
    assert.equal(res.outcome, "skipped");
    assert.equal(f.cancelCalls.length, 0, "Quick must survive an abandoned Full checkout");
    assert.equal(f.retrieveCalls.length, 0, "no Stripe call at all for an unpaid Full");
    assert.ok(!f.audit.some((a) => a.outcome === "attempted"), "an unpaid Full is not even an attempt");
  });

  // SCENARIO 3 — duplicate webhook is harmless.
  await check("scenario 3: duplicate webhook does not double-cancel", async () => {
    // Second delivery sees the subscription already cancelled in Stripe.
    const f = makeFakes({
      quickRecord: QUICK_RECORD,
      subscriptionState: { status: "canceled", cancelAtPeriodEnd: false, customerId: "cus_quick" },
    });
    const res = await executeQuickToFullConvergence({ full: FULL_PAID, eventId: "evt_1", ports: f.ports });
    assert.equal(res.ok, true);
    assert.equal(res.outcome, "skipped");
    assert.equal((res as { reason: string }).reason, "already_canceled");
    assert.equal(f.cancelCalls.length, 0, "no second cancellation");
  });

  await check("scenario 3b: retry of the same event reuses one Stripe idempotency key", async () => {
    const a = convergenceIdempotencyKey("evt_1", "sub_quick_old");
    const b = convergenceIdempotencyKey("evt_1", "sub_quick_old");
    const other = convergenceIdempotencyKey("evt_2", "sub_quick_old");
    assert.equal(a, b, "same event + same subscription must produce a stable key so Stripe dedups");
    assert.notEqual(a, other, "a different event must not collide");
    assert.ok(a.length <= 255, "Stripe idempotency keys are capped at 255 chars");
  });

  // SCENARIO 4 — no Quick subscription: safe no-op.
  await check("scenario 4: missing Quick subscription is a safe no-op", async () => {
    const f = makeFakes({ quickRecord: null });
    const res = await executeQuickToFullConvergence({ full: FULL_PAID, eventId: "evt_4", ports: f.ports });
    assert.equal(res.ok, true);
    assert.equal(res.outcome, "skipped");
    assert.equal((res as { reason: string }).reason, "no_quick_subscription");
    assert.equal(f.cancelCalls.length, 0);
    assert.equal(f.retrieveCalls.length, 0, "nothing to retrieve when the ledger has no Quick row");
  });

  // SCENARIO 5 — Stripe failure is auditable and retryable.
  await check("scenario 5: Stripe cancel failure is auditable AND retryable", async () => {
    const f = makeFakes({ quickRecord: QUICK_RECORD, cancelError: "card_declined_or_api_down" });
    const res = await executeQuickToFullConvergence({ full: FULL_PAID, eventId: "evt_5", ports: f.ports });
    assert.equal(res.ok, false);
    assert.equal(res.outcome, "failed");
    assert.equal((res as { retryable: boolean }).retryable, true, "a Stripe outage must stay retryable");
    const failed = f.audit.find((a) => a.outcome === "failed");
    assert.ok(failed, "a failure must be written to the audit trail, never silently swallowed");
    assert.equal(failed!.error, "card_declined_or_api_down", "the underlying error is preserved for the operator");
    assert.equal(failed!.quickSubscriptionId, "sub_quick_old");
  });

  await check("scenario 5b: Stripe retrieve failure is retryable and does not cancel", async () => {
    const f = makeFakes({ quickRecord: QUICK_RECORD, retrieveError: "api_connection_error" });
    const res = await executeQuickToFullConvergence({ full: FULL_PAID, eventId: "evt_5b", ports: f.ports });
    assert.equal(res.outcome, "failed");
    assert.equal((res as { retryable: boolean }).retryable, true);
    assert.equal(f.cancelCalls.length, 0, "never cancel on unverified state");
  });

  await check("scenario 5c: ledger failure is retryable and does not cancel", async () => {
    const f = makeFakes({ ledgerError: "db_unreachable" });
    const res = await executeQuickToFullConvergence({ full: FULL_PAID, eventId: "evt_5c", ports: f.ports });
    assert.equal(res.outcome, "failed");
    assert.equal((res as { retryable: boolean }).retryable, true);
    assert.equal(f.cancelCalls.length, 0);
  });

  // SCENARIO 6 — unrelated subscriptions are never modified.
  await check("scenario 6: a mismatched customer is refused, not cancelled", async () => {
    const f = makeFakes({
      quickRecord: { ...QUICK_RECORD, stripeCustomerId: "cus_SOMEONE_ELSE" },
      subscriptionState: { status: "active", cancelAtPeriodEnd: false, customerId: "cus_SOMEONE_ELSE" },
    });
    const res = await executeQuickToFullConvergence({ full: FULL_PAID, eventId: "evt_6", ports: f.ports });
    assert.equal(res.ok, false);
    assert.equal(res.outcome, "refused");
    assert.equal((res as { reason: string }).reason, "customer_mismatch");
    assert.equal((res as { retryable: boolean }).retryable, false, "a refusal must NOT be retried — the data is wrong");
    assert.equal(f.cancelCalls.length, 0, "another customer's subscription must never be cancelled");
  });

  await check("scenario 6b: a non-Full purchase converges nothing", async () => {
    const f = makeFakes({ quickRecord: QUICK_RECORD });
    const res = await executeQuickToFullConvergence({
      full: { ...FULL_PAID, packageKey: "servicios_quick_monthly" },
      eventId: "evt_6b",
      ports: f.ports,
    });
    assert.equal(res.outcome, "skipped");
    assert.equal(f.cancelCalls.length, 0, "buying Quick again must not cancel Quick");
  });

  // SCENARIO 7 — correct selection across categories.
  await check("scenario 7: each category selects its own Quick package key", async () => {
    // REAL keys, spelled out on purpose (an earlier version of this test used invented Autos/BR keys
    // that matched the planner's stale prefix list, which masked the bug where the real
    // `autos_dealer_monthly` / `br_agent_monthly` never converged).
    const cases: Array<{ category: string; fullKey: string; quickKey: string }> = [
      { category: "servicios", fullKey: "servicios_base_monthly", quickKey: "servicios_quick_monthly" },
      { category: "restaurantes", fullKey: "restaurantes_base_monthly", quickKey: "restaurantes_quick_monthly" },
      { category: "autos", fullKey: "autos_dealer_monthly", quickKey: "autos_dealer_quick_monthly" },
      { category: "bienes-raices", fullKey: "br_agent_monthly", quickKey: "br_agent_quick_monthly" },
    ];
    for (const c of cases) {
      const record: LedgerRecord = {
        ownerUserId: "user_1",
        category: c.category,
        packageKey: c.quickKey,
        listingId: "lst_1",
        stripeSubscriptionId: `sub_quick_${c.category}`,
        stripeCustomerId: "cus_x",
      };
      const f = makeFakes({
        quickRecord: record,
        subscriptionState: { status: "active", cancelAtPeriodEnd: false, customerId: "cus_x" },
      });
      const res = await executeQuickToFullConvergence({
        full: {
          ownerUserId: "user_1",
          category: c.category,
          packageKey: c.fullKey,
          listingId: "lst_1",
          paid: true,
          stripeCustomerId: "cus_x",
          stripeSubscriptionId: "sub_full",
        },
        eventId: `evt_${c.category}`,
        ports: f.ports,
      });
      assert.equal(res.outcome, "completed", `${c.category} should converge`);
      assert.equal(f.cancelCalls[0]!.subscriptionId, `sub_quick_${c.category}`, `${c.category} cancelled the right sub`);
    }
  });

  // =========================================================================
  // WAVE 3 — Quick->Full safe upgrade repairs
  // =========================================================================

  // (a) Single source of truth for the pair keys.
  await check("keys: Full/Quick classification derives from BUSINESS_CATEGORY_PACKAGE_PAIR", () => {
    for (const [category, pair] of Object.entries(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
      assert.equal(isFullBasePackageKey(pair.full), true, `${pair.full} must be a Full key`);
      assert.equal(isFullBasePackageKey(pair.simple), false, `${pair.simple} must not be a Full key`);
      assert.equal(quickPackageKeyForCategory(category), pair.simple, `${category} quick key`);
    }
    assert.equal(isFullBasePackageKey("autos_dealer_monthly"), true, "real Autos Full key");
    assert.equal(isFullBasePackageKey("br_agent_monthly"), true, "real BR Full key");
    assert.equal(isFullBasePackageKey("autos_dealer_base_monthly"), false, "invented key must not classify");
    assert.equal(isFullBasePackageKey("br_agent_base_monthly"), false, "invented key must not classify");
    assert.equal(isFullBasePackageKey(""), false);
  });

  await check("keys: Autos and BR Full payments actually plan a cancellation (was: not_full_base_package)", () => {
    for (const [category, pair] of Object.entries(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
      const plan = planQuickToFullConvergence(
        { ownerUserId: "u", category, packageKey: pair.full, listingId: "l", paid: true, stripeCustomerId: "cus_a", stripeSubscriptionId: "sub_f" },
        { ownerUserId: "u", category, packageKey: pair.simple, listingId: "l", stripeSubscriptionId: "sub_q", stripeCustomerId: "cus_a", status: "active", cancelAtPeriodEnd: false },
      );
      assert.equal(plan.action, "cancel_quick_immediately", `${category} must converge`);
    }
  });

  // (b) Listing scope.
  await check("listing scope: two Quick listings for one owner; only the upgraded one is cancelled", async () => {
    const quickA: LedgerRecord = { ...QUICK_RECORD, listingId: "lst_A", stripeSubscriptionId: "sub_quick_A", stripeCustomerId: "cus_quick" };
    const quickB: LedgerRecord = { ...QUICK_RECORD, listingId: "lst_B", stripeSubscriptionId: "sub_quick_B", stripeCustomerId: "cus_quick" };
    // B is the NEWER Quick payment; an owner-wide "newest paid" lookup would have picked it.
    const f = makeFakes({ ledgerRecords: [quickB, quickA] });
    const res = await executeQuickToFullConvergence({
      full: { ...FULL_PAID, listingId: "lst_A" },
      eventId: "evt_scope",
      ports: f.ports,
    });
    assert.equal(res.outcome, "completed");
    assert.deepEqual(f.cancelCalls.map((c) => c.subscriptionId), ["sub_quick_A"], "only listing A's Quick subscription is cancelled");
    assert.equal(f.ledgerQueries[0]!.listingId, "lst_A", "the ledger query is scoped to the upgraded listing");
    assert.ok(f.audit.every((a) => a.listingId === "lst_A"), "audit entries carry the listing");
  });

  await check("listing scope: a Quick sub on ANOTHER listing only is never cancelled", async () => {
    const f = makeFakes({ ledgerRecords: [{ ...QUICK_RECORD, listingId: "lst_B", stripeSubscriptionId: "sub_quick_B" }] });
    const res = await executeQuickToFullConvergence({ full: { ...FULL_PAID, listingId: "lst_A" }, eventId: "evt_scope2", ports: f.ports });
    assert.equal(res.outcome, "skipped");
    assert.equal((res as { reason: string }).reason, "no_quick_subscription");
    assert.equal(f.cancelCalls.length, 0);
  });

  await check("listing scope: Full payment with no listing fails closed before any lookup", async () => {
    for (const listingId of [null, "", "   "]) {
      const f = makeFakes({ quickRecord: QUICK_RECORD });
      const res = await executeQuickToFullConvergence({ full: { ...FULL_PAID, listingId }, eventId: "evt_nolisting", ports: f.ports });
      assert.equal(res.ok, false);
      assert.equal(res.outcome, "refused");
      assert.equal((res as { reason: string }).reason, "listing_unverified");
      assert.equal((res as { retryable: boolean }).retryable, false);
      assert.equal(f.ledgerQueries.length, 0, "no ledger read without a listing");
      assert.equal(f.cancelCalls.length, 0);
    }
  });

  await check("listing scope: planner refuses a Quick snapshot from a different or unknown listing", () => {
    const base: QuickSubscriptionSnapshot = { ...QUICK_RECORD, status: "active", cancelAtPeriodEnd: false };
    assert.deepEqual(planQuickToFullConvergence(FULL_PAID, { ...base, listingId: "lst_OTHER" }), { action: "refuse", reason: "listing_mismatch" });
    assert.deepEqual(planQuickToFullConvergence(FULL_PAID, { ...base, listingId: null }), { action: "refuse", reason: "listing_unverified" });
  });

  // (c) Customer identity: reuse works when tied, refuses when not.
  await check("customer: upgrade on the REUSED customer converges; a different customer is refused", async () => {
    const tied = makeFakes({
      quickRecord: QUICK_RECORD,
      subscriptionState: { status: "active", cancelAtPeriodEnd: false, customerId: "cus_quick" },
    });
    const ok = await executeQuickToFullConvergence({ full: { ...FULL_PAID, stripeCustomerId: "cus_quick" }, eventId: "evt_c1", ports: tied.ports });
    assert.equal(ok.outcome, "completed", "checkout reused the Quick customer, so the identity guard passes");

    const untied = makeFakes({
      quickRecord: QUICK_RECORD,
      subscriptionState: { status: "active", cancelAtPeriodEnd: false, customerId: "cus_quick" },
    });
    const refused = await executeQuickToFullConvergence({ full: { ...FULL_PAID, stripeCustomerId: "cus_NEW_EMAIL_CUSTOMER" }, eventId: "evt_c2", ports: untied.ports });
    assert.equal(refused.outcome, "refused");
    assert.equal((refused as { reason: string }).reason, "customer_mismatch");
    assert.equal(untied.cancelCalls.length, 0, "an untied customer is never cancelled");
  });

  await check("customer: checkout reuse is wired server-side (never from the request body) and never sends customer + customer_email", async () => {
    const { readFileSync } = await import("node:fs");
    const stripeSrc = readFileSync("app/lib/listingPlans/revenueStripe.ts", "utf8");
    const route = readFileSync("app/api/revenue-os/checkout/route.ts", "utf8");
    const offer = readFileSync("app/lib/listingPlans/businessBasePlanOffer.ts", "utf8");
    assert.ok(/existingCustomerId\s*\?\s*\{\s*customer:\s*existingCustomerId\s*\}\s*:\s*emailCustomerPart/.test(stripeSrc), "session uses `customer` XOR `customer_email`");
    assert.ok(route.includes("resolveQuickUpgradeStripeCustomerId"), "route resolves the customer server-side");
    assert.ok(/businessUpgradeInPlace\s*&&\s*bearerUserId/.test(route), "only for an authenticated upgrade-in-place");
    assert.ok(!/existingStripeCustomerId:\s*body\./.test(route), "never taken from the request body");
    assert.ok(/\.eq\("listing_id", listingId\)/.test(offer) && /\.eq\("owner_user_id", ownerUserId\)/.test(offer), "ledger tie is owner + listing");
  });

  // (d) subscription.deleted safety.
  await check("subscription.deleted: Quick deleted while a live Full holds the listing does NOT suspend", () => {
    const rows = [{ packageKey: "servicios_base_monthly", status: "active", endsAt: new Date(Date.now() + 86_400_000).toISOString() }];
    const liveFull = hasLiveFullBaseEntitlement({ category: "servicios", rows, nowMs: Date.now() });
    assert.equal(liveFull, true);
    const superseded = isSupersededQuickSubscriptionDeletion({
      category: "servicios",
      packageKey: "servicios_quick_monthly",
      subscriptionMetadata: {},
      liveFullOnSameListing: liveFull,
    });
    assert.equal(superseded, true);
    const t = decideSubscriptionTransition("active", "subscription_deleted", { endedReason: "superseded_by_full_upgrade", supersededByFull: superseded });
    assert.equal(t.next, "canceled");
    assert.ok(!t.effects.includes("suspend_visibility"), "Full stays authoritative: no suspension");
    assert.ok(t.effects.includes("record_cancellation"));
  });

  await check("subscription.deleted: convergence marker alone also prevents suspension", () => {
    assert.equal(
      isSupersededQuickSubscriptionDeletion({
        category: "autos",
        packageKey: "autos_dealer_quick_monthly",
        subscriptionMetadata: { leonix_convergence_reason: "quick_to_full_upgrade" },
        liveFullOnSameListing: false,
      }),
      true,
    );
  });

  await check("subscription.deleted: genuine payment-failure-final with NO live Full still suspends", () => {
    const noFull = hasLiveFullBaseEntitlement({ category: "servicios", rows: [{ packageKey: "servicios_quick_monthly", status: "active", endsAt: null }], nowMs: Date.now() });
    assert.equal(noFull, false, "a live Quick row is not a live Full row");
    const superseded = isSupersededQuickSubscriptionDeletion({
      category: "servicios",
      packageKey: "servicios_quick_monthly",
      subscriptionMetadata: {},
      liveFullOnSameListing: noFull,
    });
    assert.equal(superseded, false);
    const t = decideSubscriptionTransition("active", "subscription_deleted", { endedReason: "payment_failure_final", supersededByFull: superseded });
    assert.ok(t.effects.includes("suspend_visibility"), "normal lifecycle is not weakened");
    // Default ctx (no supersededByFull) is unchanged too.
    assert.ok(decideSubscriptionTransition("active", "subscription_deleted", { endedReason: "payment_failure_final" }).effects.includes("suspend_visibility"));
  });

  await check("subscription.deleted: expired/scheduled-past Full rows and other packages never count as live Full", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    assert.equal(hasLiveFullBaseEntitlement({ category: "restaurantes", rows: [{ packageKey: "restaurantes_base_monthly", status: "active", endsAt: past }], nowMs: Date.now() }), false);
    assert.equal(hasLiveFullBaseEntitlement({ category: "restaurantes", rows: [{ packageKey: "restaurantes_base_monthly", status: "revoked", endsAt: null }], nowMs: Date.now() }), false);
    assert.equal(hasLiveFullBaseEntitlement({ category: "restaurantes", rows: [{ packageKey: "servicios_base_monthly", status: "active", endsAt: null }], nowMs: Date.now() }), false);
    // A Full or non-business subscription deletion is never treated as a superseded Quick.
    assert.equal(isSupersededQuickSubscriptionDeletion({ category: "servicios", packageKey: "servicios_base_monthly", subscriptionMetadata: { leonix_convergence_reason: "quick_to_full_upgrade" }, liveFullOnSameListing: true }), false);
    assert.equal(isSupersededQuickSubscriptionDeletion({ category: "rentas", packageKey: "rentas_30d", liveFullOnSameListing: true }), false);
    assert.equal(isQuickBaseSubscription("bienes-raices", "br_agent_quick_monthly"), true);
    assert.equal(isQuickBaseSubscription("bienes-raices", "br_agent_monthly"), false);
  });

  await check("subscription.deleted: the webhook handler is wired to the safe decision and fails retryably when unknown", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("app/lib/listingPlans/revenueSubscriptionEvents.ts", "utf8");
    const start = src.indexOf("export async function handleSubscriptionDeleted");
    const body = src.slice(start, src.indexOf("The payment record a Stripe charge", start));
    assert.ok(body.includes("isSupersededQuickSubscriptionDeletion"), "handler consults the superseded-Quick decision");
    assert.ok(body.includes("supersededByFull"), "handler passes supersededByFull into the transition");
    assert.ok(body.includes("listingHasLiveFullBase"), "handler reads the listing's live Full");
    assert.ok(body.includes("failed_retryable"), "an unreadable Full state is retried, not guessed");
    assert.ok(body.includes("applyPaymentSuspension"), "normal suspension path is still present");
  });

  // Regression guard: the executor must never reach for cancel_at_period_end.
  await check("regression: no code path sets cancel_at_period_end as the converged state", async () => {
    const { readFileSync } = await import("node:fs");
    const core = readFileSync("app/lib/listingPlans/quickToFullConvergenceCore.ts", "utf8");
    const adapter = readFileSync("app/lib/listingPlans/quickToFullConvergence.ts", "utf8");
    assert.ok(
      !/cancel_at_period_end:\s*true/.test(core) && !/cancel_at_period_end:\s*true/.test(adapter),
      "convergence must never SET cancel_at_period_end — that is the double-billing bug this gate fixed",
    );
    assert.ok(adapter.includes("subscriptions.cancel("), "the adapter performs an immediate cancellation");
  });

  if (failures.length) {
    console.error(`verify-quick-convergence-behavior-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  console.log(`verify-quick-convergence-behavior-01: OK (${checks} behavioral checks, no live Stripe, no DB)`);
}

void main();

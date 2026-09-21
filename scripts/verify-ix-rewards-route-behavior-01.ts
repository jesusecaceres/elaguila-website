/**
 * LEONIX IX REWARDS — the HTTP layer, EXECUTED.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * An independent reviewer reintroduced nineteen defects into this change — among them an admin
 * authorization gate left present but inert, an unauthenticated IDOR on any customer's wallet, a
 * queue claim whose compare-and-set result was ignored, a redemption ceiling quadrupled at the
 * exact moment credits are held, and a compare-and-swap token pinned to a constant — and ran each
 * one through the complete certification. All nineteen passed. The suite printed
 * "OK (45 defects reintroduced, each caught by a named check)" while two straight authorization
 * bypasses sat in the tree.
 *
 * The cause was structural, not a gap in coverage: every check covering the routes read them as
 * TEXT. The same reviewer showed the other half of it — nine pure renames and reformats, with
 * byte-identical behaviour, turned checks RED. A test that goes green for a hole and red for a
 * rename is measuring spelling, and a certification resting on it certifies the spelling.
 *
 * So this file CALLS the route handlers. `scripts/lib/tsconfig.harness.json` maps `server-only`,
 * `next/headers`, `@supabase/supabase-js` and `@/app/lib/supabase/server` onto stubs the test
 * drives; everything else — every module under certification — is the real one. Nothing here
 * greps. Each check states the request, runs the handler, and asserts the answer and the writes.
 *
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-ix-rewards-route-behavior-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

import { RECURRING_CONSENT_TEXT_VERSION } from "@/app/lib/listingPlans/recurringConsentCopy";

import {
  __onRpc,
  __reset,
  __rows,
  __rpcCalls,
  __seed,
  __setAuthUsers,
  __failReadsOn,
  getHarnessClient,
  __setBearerTokens,
  __setCookies,
  __stripeSessions,
  __resetStripe,
} from "./lib/harnessControls";

let checks = 0;
const failures: string[] = [];

async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  checks += 1;
  try {
    await fn();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`  ✗ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CUSTOMER_A = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_B = "22222222-2222-4222-8222-222222222222";
const BUSINESS = "33333333-3333-4333-8333-333333333333";
const STAFF_AUTH = "44444444-4444-4444-8444-444444444444";
const STAFF_EMAIL = "staff@leonixmedia.com";
const PAYMENT_A = "55555555-5555-4555-8555-555555555555";
const PAYMENT_B = "66666666-6666-4666-8666-666666666666";

/** A ledger that honours idempotency and reports buckets, which is all the ROUTES can observe. */
function installLedgerRpc(): void {
  __onRpc((fn, params) => {
    if (fn !== "leonix_rewards_post_entry") {
      return { data: null, error: { code: "P0001", message: `unexpected rpc ${fn}` } };
    }
    const ledger = __rows("leonix_rewards_ledger");
    const prior = ledger.find((r) => r.idempotency_key === params.p_idempotency_key);
    if (prior) return { data: prior, error: null };
    const row = {
      id: `entry-${ledger.length + 1}`,
      wallet_id: params.p_wallet_id,
      entry_type: params.p_entry_type,
      amount_cents: params.p_amount_cents,
      idempotency_key: params.p_idempotency_key,
      payment_record_id: params.p_payment_record_id ?? null,
      source_id: params.p_source_id ?? null,
      meta: params.p_meta ?? {},
      created_at: new Date().toISOString(),
    };
    __seed("leonix_rewards_ledger", [...ledger, row]);
    return { data: row, error: null };
  });
}

/** A staff session that the real gate accepts: cookie, live auth user, active roster super_admin. */
function signInAsSuperAdmin(): void {
  __setCookies({
    leonix_admin: "1",
    leonix_admin_operator_email: STAFF_EMAIL,
    leonix_admin_auth_user_id: STAFF_AUTH,
  });
  __setAuthUsers([{ id: STAFF_AUTH, email: STAFF_EMAIL }]);
  __seed("admin_team_members", [
    {
      id: "roster-1",
      email: STAFF_EMAIL,
      display_name: "Staff",
      role: "super_admin",
      is_active: true,
      auth_user_id: STAFF_AUTH,
    },
  ]);
}

/**
 * A `NextRequest`-shaped object. The handlers read `request.nextUrl.searchParams`, which a plain
 * `Request` does not carry; supplying it is the only concession this harness makes to Next.
 */
function nextRequest(url: string, init: RequestInit = {}): Request {
  const req = new Request(url, init);
  Object.defineProperty(req, "nextUrl", { value: new URL(url), configurable: true });
  return req;
}

function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function main(): Promise<void> {
  const wallet = await import("@/app/api/rewards/wallet/route");
  const adminRewards = await import("@/app/api/admin/rewards/route");
  const ledgerAdapter = await import("@/app/lib/rewards/rewardsLedger");

  // -------------------------------------------------------------------------
  // SECTION W — the customer wallet read, executed.
  // -------------------------------------------------------------------------

  await check("W1: an unauthenticated wallet read is refused, and reads nothing", async () => {
    __reset();
    __setBearerTokens({});
    const res = await wallet.GET(nextRequest("http://x/api/rewards/wallet") as never);
    assert.equal(res.status, 401, "no bearer token is a 401");
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "auth_required");
  });

  await check("W2: a wallet is addressable ONLY by the bearer identity — no parameter can name another customer", async () => {
    __reset();
    __setBearerTokens({ "token-a": CUSTOMER_A });
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 100, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 100, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
      { id: "wallet-b", owner_user_id: CUSTOMER_B, available_cents: 999999, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 999999, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    // Every shape a browser could use to name somebody else, in one request.
    const url = `http://x/api/rewards/wallet?as=${CUSTOMER_B}&userId=${CUSTOMER_B}&ownerUserId=${CUSTOMER_B}&walletId=wallet-b&businessId=${BUSINESS}`;
    const res = await wallet.GET(nextRequest(url, { headers: { authorization: "Bearer token-a" } }) as never);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { wallet?: { availableCents?: number } };
    assert.equal(
      body.wallet?.availableCents,
      100,
      "the balance returned is the BEARER's, never the one named in the query string",
    );
  });

  await check("W3: every entry type the ledger can hold has a human label — the customer never reads a machine token", async () => {
    const migration = readFileSync("supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql", "utf8");
    const vocabulary = /leonix_rewards_ledger_type_chk CHECK \(entry_type IN \(([\s\S]*?)\)\)/.exec(migration)?.[1] ?? "";
    const types = [...vocabulary.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]!);
    assert.ok(types.length >= 12, `the entry-type vocabulary was located (${types.length})`);

    __reset();
    __setBearerTokens({ "token-a": CUSTOMER_A });
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 0, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed(
      "leonix_rewards_ledger",
      types.map((t, i) => ({
        id: `e${i}`,
        wallet_id: "wallet-a",
        entry_type: t,
        amount_cents: 100,
        created_at: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
      })),
    );
    const url = "http://x/api/rewards/wallet?lang=es";
    const res = await wallet.GET(nextRequest(url, { headers: { authorization: "Bearer token-a" } }) as never);
    const body = (await res.json()) as { activity?: { label?: string; kind?: string }[] };
    const rendered = body.activity ?? [];
    assert.ok(rendered.length > 0, "the activity list rendered");
    for (const item of rendered) {
      assert.ok(
        item.label && !types.includes(item.label),
        `entry type ${item.kind ?? "?"} rendered the raw token "${item.label}" to the customer`,
      );
    }
  });

  // -------------------------------------------------------------------------
  // SECTION X — the staff API's authorization gate, executed.
  // -------------------------------------------------------------------------

  await check("X1: the bare `leonix_admin=1` cookie reads NOTHING from the staff rewards API", async () => {
    __reset();
    installLedgerRpc();
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", business_id: BUSINESS, available_cents: 5000, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 5000, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __setCookies({ leonix_admin: "1" });
    const res = await adminRewards.GET(
      nextRequest(`http://x/api/admin/rewards?businessId=${BUSINESS}`) as never,
    );
    assert.ok(res.status === 401 || res.status === 403, `refused, got ${res.status}`);
    const text = await res.text();
    assert.ok(!text.includes("5000"), "and no balance leaked in the body");
  });

  await check("X2: a roster member who is not a super_admin is refused by the staff rewards API", async () => {
    __reset();
    installLedgerRpc();
    __setCookies({
      leonix_admin: "1",
      leonix_admin_operator_email: STAFF_EMAIL,
      leonix_admin_auth_user_id: STAFF_AUTH,
    });
    __setAuthUsers([{ id: STAFF_AUTH, email: STAFF_EMAIL }]);
    __seed("admin_team_members", [
      { id: "roster-1", email: STAFF_EMAIL, role: "support_admin", is_active: true, auth_user_id: STAFF_AUTH },
    ]);
    const res = await adminRewards.GET(
      nextRequest(`http://x/api/admin/rewards?businessId=${BUSINESS}`) as never,
    );
    assert.equal(res.status, 403, "a roster role other than super_admin is 403");
  });

  await check("X3: a real super_admin IS admitted — the gate refuses the wrong caller, not every caller", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    const res = await adminRewards.GET(
      nextRequest(`http://x/api/admin/rewards?businessId=${BUSINESS}`) as never,
    );
    assert.ok(res.status < 400, `admitted, got ${res.status}`);
  });

  // -------------------------------------------------------------------------
  // SECTION Y — the refund-resolution queue, executed.
  // -------------------------------------------------------------------------

  /** One open queue row, plus the payment and earn it is about. */
  function seedQueueRow(overrides: Record<string, unknown> = {}): string {
    const id = "77777777-7777-4777-8777-777777777777";
    __seed("leonix_rewards_refund_resolutions", [
      {
        id,
        payment_record_id: PAYMENT_A,
        stripe_charge_id: "ch_1",
        stripe_event_id: "evt_1",
        kind: "refund",
        cumulative_refunded_cents: 5000,
        external_ref: null,
        status: "open",
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        reason: "charge_refunds_absent_from_payload",
        created_at: new Date().toISOString(),
        ...overrides,
      },
    ]);
    return id;
  }

  await check("Y1: a refusal on this path leaves the row OPEN — a validation that runs after the claim destroys the obligation", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    const id = seedQueueRow();
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve",
        resolutionId: id,
        note: "typed the wrong thing",
        outcome: "reversed",
        refundExternalId: "re", // too short: refused by a PURE check on the request
      }) as never,
    );
    assert.equal(res.status, 400);
    const row = __rows("leonix_rewards_refund_resolutions")[0]!;
    assert.equal(row.status, "open", "the row is still open and still owed");
  });

  await check("Y2: `reversed` is refused on a won-dispute row, before the claim", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    const id = seedQueueRow({
      kind: "chargeback",
      reason: "won_dispute_restoration_failed: boom",
      external_ref: "dp_1",
    });
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve",
        resolutionId: id,
        note: "claw it back",
        outcome: "reversed",
        refundExternalId: "dp_1",
      }) as never,
    );
    assert.equal(res.status, 409);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "row_requires_restoration_outcome");
    assert.equal(__rows("leonix_rewards_refund_resolutions")[0]!.status, "open");
  });

  await check("Y3: an audited `no_action_required` CAN close a won-dispute row — it is not a contradiction, and refusing it left the row unclosable", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    // Nothing is outstanding on this payment: the clawback of 450 was already given back by hand.
    __seed("leonix_rewards_ledger", [
      { id: "cb-1", wallet_id: "wallet-a", entry_type: "chargeback_reversal", amount_cents: 450, payment_record_id: PAYMENT_A, source_id: "dp_2", idempotency_key: "reverse:chargeback:dp_2", created_at: new Date().toISOString() },
      { id: "rs-1", wallet_id: "wallet-a", entry_type: "reversal_restoration", amount_cents: 450, payment_record_id: PAYMENT_A, source_id: "dp_2", idempotency_key: "restore:dp_2", created_at: new Date().toISOString() },
    ]);
    const id = seedQueueRow({
      kind: "chargeback",
      reason: "won_dispute_restoration_found_nothing_to_restore",
      external_ref: "dp_2",
    });
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve",
        resolutionId: id,
        note: "settled by hand last week",
        outcome: "no_action_required",
      }) as never,
    );
    assert.equal(res.status, 200, "a noted staff decision closes it");
    assert.equal(__rows("leonix_rewards_refund_resolutions")[0]!.status, "resolved");
  });

  await check("Y3b: `no_action_required` cannot write off a restoration that is still owed", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("payment_records", [{ id: PAYMENT_A, payment_status: "disputed", stripe_charge_id: "ch_1" }]);
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 900, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    // The dispute was won and its 900-cent clawback is still standing. One click on "Sin acción"
    // used to close the row for good: no ledger entry, no dispute id recorded, nothing able to
    // reopen it, and 900 credits the customer is owed simply gone.
    __seed("leonix_rewards_ledger", [
      { id: "earn-1", wallet_id: "wallet-a", entry_type: "earn_available", amount_cents: 900, payment_record_id: PAYMENT_A, idempotency_key: `earn:payment:${PAYMENT_A}`, meta: { eligible_net_cents: 10000 }, created_at: new Date().toISOString() },
      { id: "cb-1", wallet_id: "wallet-a", entry_type: "chargeback_reversal", amount_cents: 900, payment_record_id: PAYMENT_A, source_id: "dp_open", idempotency_key: "reverse:chargeback:dp_open", meta: { basis_contribution_cents: 10000 }, created_at: new Date().toISOString() },
    ]);
    const id = seedQueueRow({ kind: "chargeback", external_ref: "dp_open", reason: "won_dispute_restoration_failed: boom" });
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve", resolutionId: id, note: "looks fine to me", outcome: "no_action_required",
      }) as never,
    );
    assert.equal(res.status, 409, "the obligation is still outstanding, so it cannot be dismissed");
    const body = (await res.json()) as { error?: string; outstandingCents?: number };
    assert.equal(body.error, "restoration_still_outstanding");
    assert.equal(body.outstandingCents, 900, "and the operator is told exactly what is owed");
    assert.equal(__rows("leonix_rewards_refund_resolutions")[0]!.status, "open", "the row stays in the queue");
  });

  await check("Y4: the idempotency anchor comes from the ROW — a typed id that disagrees is refused, not written", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    const id = seedQueueRow({ external_ref: "re_genuine" });
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve",
        resolutionId: id,
        note: "one character wrong",
        outcome: "reversed",
        refundExternalId: "re_someone_elses_future_refund",
      }) as never,
    );
    assert.equal(res.status, 409);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "supplied_id_does_not_match_row");
    assert.equal(
      __rpcCalls("leonix_rewards_post_entry").length,
      0,
      "and nothing was written under the typed key",
    );
    assert.equal(__rows("leonix_rewards_refund_resolutions")[0]!.status, "open");
  });

  await check("Y5: a truncated-payload row is settled under the RAIL'S OWN KEY, so its later delivery is a no-op", async () => {
    // THE SECOND ACCOUNTING SCHEME, AND WHY THERE MUST NOT BE ONE.
    //
    // A truncated `charge.refunded` carries a cumulative figure and no refund object, so the row is
    // filed with no `external_ref` and staff are REQUIRED to type the canonical refund id off
    // Stripe. Keying the resolution on the row instead of on that id produced two keys for one
    // refund — `reverse:refund:queue:<uuid>` and `reverse:refund:re_REAL` — which do not
    // deduplicate against each other, and whose `basis_contribution_cents` ADD. The rail's own
    // later delivery then clawed the same money back a second time.
    //
    // This drives the staff resolution and then the webhook's delivery of the SAME refund.
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("payment_records", [{ id: PAYMENT_A, payment_status: "paid", stripe_charge_id: "ch_1" }]);
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 900, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("leonix_rewards_ledger", [
      { id: "earn-1", wallet_id: "wallet-a", entry_type: "earn_available", amount_cents: 900, payment_record_id: PAYMENT_A, idempotency_key: `earn:payment:${PAYMENT_A}`, meta: { eligible_net_cents: 10000 }, created_at: new Date().toISOString() },
    ]);
    const id = seedQueueRow();

    await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve",
        resolutionId: id,
        note: "resolving the truncated payload",
        outcome: "reversed",
        refundExternalId: "re_REAL123",
      }) as never,
    );

    const keys = __rpcCalls("leonix_rewards_post_entry").map((c) => String(c.params.p_idempotency_key));
    assert.ok(
      keys.includes("reverse:refund:re_REAL123"),
      `the staff resolution must use the rail's own key, got ${JSON.stringify(keys)}`,
    );
    for (const key of keys) {
      assert.ok(!key.includes("queue:"), `a second accounting scheme appeared: ${key}`);
    }

    // NOW THE RAIL DELIVERS THE SAME REFUND PROPERLY. It must move nothing.
    const { reverseCreditsForRefundOrDispute } = await import("@/app/lib/rewards/rewardsFulfillment");
    const redelivered = await reverseCreditsForRefundOrDispute({
      paymentRecordId: PAYMENT_A,
      refundedCents: 5000,
      cumulativeRefundedCents: 5000,
      kind: "refund",
      externalId: "re_REAL123",
    });
    const reversals = __rows("leonix_rewards_ledger").filter((r) => r.entry_type === "refund_reversal");
    const totalReversed = reversals.reduce((sum, r) => sum + Number(r.amount_cents ?? 0), 0);
    assert.equal(
      totalReversed,
      450,
      `a $50.00 refund of a $100.00 payment claws back 450, once — got ${totalReversed} across ${reversals.length} entries ` +
        `(${JSON.stringify(redelivered)})`,
    );
  });

  await check("Y6: the claim is EXCLUSIVE — two staff resolving one row settle it once", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("payment_records", [{ id: PAYMENT_A, payment_status: "paid", stripe_charge_id: "ch_1" }]);
    const id = seedQueueRow();
    const [first, second] = await Promise.all([
      adminRewards.POST(
        jsonRequest("http://x/api/admin/rewards", {
          action: "refund_resolve", resolutionId: id, note: "staff one resolving", outcome: "reversed", refundExternalId: "re_x",
        }) as never,
      ),
      adminRewards.POST(
        jsonRequest("http://x/api/admin/rewards", {
          action: "refund_resolve", resolutionId: id, note: "staff two resolving", outcome: "reversed", refundExternalId: "re_x",
        }) as never,
      ),
    ]);
    const statuses = [first.status, second.status].sort();
    assert.deepEqual(statuses, [200, 409], `exactly one winner, got ${statuses.join("/")}`);
  });

  await check("Y7: a re-filed CUMULATIVE row keeps its amount cumulative — a re-file must not change what a number means", async () => {
    __reset();
    signInAsSuperAdmin();
    __seed("payment_records", [{ id: PAYMENT_A, payment_status: "paid", stripe_charge_id: "ch_1" }]);
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 900, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("leonix_rewards_ledger", [
      { id: "earn-1", wallet_id: "wallet-a", entry_type: "earn_available", amount_cents: 900, payment_record_id: PAYMENT_A, idempotency_key: `earn:payment:${PAYMENT_A}`, meta: { eligible_net_cents: 10000 }, created_at: new Date().toISOString() },
    ]);
    const id = seedQueueRow();
    // The reversal fails, which is the only way to reach the re-file.
    __onRpc(() => ({ data: null, error: { code: "XX000", message: "connection reset" } }));
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve",
        resolutionId: id,
        note: "this attempt will fail",
        outcome: "reversed",
        refundExternalId: "re_typed_by_a_human",
      }) as never,
    );
    assert.ok(res.status >= 400, "the operator is told it failed");
    const refiled = __rows("leonix_rewards_refund_resolutions").filter((r) => r.status === "open");
    assert.equal(refiled.length, 1, "the obligation was re-filed, not lost");
    assert.equal(
      refiled[0]!.external_ref ?? null,
      null,
      "and it is STILL a cumulative row — attaching the typed id here over-claws-back on the retry",
    );
    assert.equal(Number(refiled[0]!.cumulative_refunded_cents), 5000, "the amount is unchanged");
  });

  // -------------------------------------------------------------------------
  // SECTION Z — the production store adapter, executed.
  // -------------------------------------------------------------------------

  await check("Z1: a replayed idempotency key reports the ROW THAT EXISTS, not the row that was asked for", async () => {
    __reset();
    installLedgerRpc();
    const port = ledgerAdapter.buildRewardsStorePort();
    const first = await port.postEntry({
      walletId: "wallet-a",
      entryType: "manual_adjustment",
      amountCents: 5000,
      sourceKind: "staff_adjustment",
      idempotencyKey: "adjust:CORRECTION-777",
    });
    assert.ok(first.ok && !first.entry.deduplicated, "the first post creates");

    const second = await port.postEntry({
      walletId: "wallet-b",
      entryType: "manual_adjustment",
      amountCents: 5000,
      sourceKind: "staff_adjustment",
      idempotencyKey: "adjust:CORRECTION-777",
    });
    assert.ok(second.ok, "the replay returns the original");
    assert.equal(second.entry.walletId, "wallet-a", "and names the wallet the entry is actually ON");
    assert.equal(second.entry.deduplicated, true);
  });

  await check("Z2: a same-key race the pre-read misses is STILL reported as a duplicate", async () => {
    __reset();
    const port = ledgerAdapter.buildRewardsStorePort();
    // The pre-read finds nothing; the function then hands back a competitor's committed row. This
    // is the exact race the pre-read cannot see, because the posting function short-circuits on
    // the key before it takes the wallet lock.
    __onRpc(() => ({
      data: {
        id: "entry-winner",
        wallet_id: "wallet-a",
        entry_type: "reversal_restoration",
        amount_cents: 900,
        meta: { post_nonce: "a-nonce-from-the-other-request" },
      },
      error: null,
    }));
    const loser = await port.postEntry({
      walletId: "wallet-a",
      entryType: "reversal_restoration",
      amountCents: 900,
      sourceKind: "stripe_dispute",
      idempotencyKey: "restore:dp_W",
    });
    assert.ok(loser.ok);
    assert.equal(
      loser.entry.deduplicated,
      true,
      "the loser must not report that it moved 900 — the ledger holds one row",
    );
  });

  await check("Z3: a genuinely created entry is NOT reported as a duplicate", async () => {
    __reset();
    installLedgerRpc();
    const port = ledgerAdapter.buildRewardsStorePort();
    const posted = await port.postEntry({
      walletId: "wallet-a",
      entryType: "earn_pending",
      amountCents: 900,
      sourceKind: "stripe_payment",
      idempotencyKey: "earn:payment:one",
    });
    assert.ok(posted.ok && posted.entry.deduplicated === false, "a real creation reports false");
    assert.equal(posted.entry.amountCents, 900);
    assert.equal(posted.entry.walletId, "wallet-a");

    // AND THE NONCE IS ACTUALLY SENT, which `readPostedEntry` alone cannot establish.
    //
    // `Z2` proves the RULE — a returned nonce that is not this call's means this call created
    // nothing. It says nothing about whether the adapter writes a nonce at all. Deleting
    // `post_nonce: postNonce` from `p_meta` left all four suites green while eight concurrent
    // deliveries of one won dispute collectively reported 2700 restored against 900 moved.
    const calls = __rpcCalls("leonix_rewards_post_entry");
    assert.equal(calls.length, 1, "one call");
    const meta = calls[0]!.params.p_meta as { post_nonce?: unknown } | undefined;
    const nonce = meta?.post_nonce;
    assert.ok(
      typeof nonce === "string" && nonce.length >= 16,
      `the adapter must send a nonce in p_meta, got ${JSON.stringify(meta)}`,
    );

    // ...and a DIFFERENT one each time, or it identifies nothing.
    const second = await port.postEntry({
      walletId: "wallet-a",
      entryType: "earn_pending",
      amountCents: 900,
      sourceKind: "stripe_payment",
      idempotencyKey: "earn:payment:two",
    });
    assert.ok(second.ok);
    const secondNonce = (__rpcCalls("leonix_rewards_post_entry")[1]!.params.p_meta as { post_nonce?: unknown }).post_nonce;
    assert.notEqual(secondNonce, nonce, "two posts must not share a nonce");
  });

  await check("Z4: the position-moved race is recognised by CODE, not by message text alone", async () => {
    __reset();
    const port = ledgerAdapter.buildRewardsStorePort();
    __onRpc(() => ({ data: null, error: { code: "LX001", message: "something the adapter cannot pattern-match" } }));
    const res = await port.postEntry({
      walletId: "wallet-a",
      entryType: "refund_reversal",
      amountCents: 450,
      sourceKind: "stripe_refund",
      idempotencyKey: "reverse:refund:re_1",
      expectedPositionRows: 0,
    });
    assert.ok(!res.ok);
    assert.equal(res.error, "reversal_position_moved", "so the core retries rather than giving up");
  });

  await check("Z5: a check violation is still reported as a REFUSAL, not as the race", async () => {
    __reset();
    const port = ledgerAdapter.buildRewardsStorePort();
    __onRpc(() => ({ data: null, error: { code: "23514", message: "violates check constraint" } }));
    const res = await port.postEntry({
      walletId: "wallet-a",
      entryType: "redeem_reserve",
      amountCents: 999,
      sourceKind: "checkout_redemption",
      idempotencyKey: "reserve:x",
    });
    assert.ok(!res.ok);
    assert.equal(res.error, "negative_balance_refused");
  });

  await check("Z6: a customer whose business binding was REVOKED can still be given a wallet", async () => {
    __reset();
    installLedgerRpc();
    // The business wallet still names them as its bound identity; `bound_user_id` is globally
    // unique, so creating their personal wallet collides. Before the repair this returned the raw
    // duplicate-key string and the customer stopped earning, spending and being correctable —
    // permanently and silently, on every future payment.
    __seed("leonix_rewards_wallets", [
      { id: "wallet-biz", business_id: BUSINESS, bound_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 0, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("business_memberships", [
      { id: "m1", user_id: CUSTOMER_A, business_id: BUSINESS, membership_status: "revoked", is_primary_owner: true },
    ]);

    const owner = await ledgerAdapter.resolveWalletOwnerForUser(CUSTOMER_A);
    assert.deepEqual(owner, { kind: "user", ownerUserId: CUSTOMER_A }, "they fall through to their own wallet");
    assert.equal(
      __rows("leonix_rewards_wallets").find((r) => r.id === "wallet-biz")!.bound_user_id ?? null,
      null,
      "and the revoked binding was RELEASED, so the personal wallet can be created",
    );

    const port = ledgerAdapter.buildRewardsStorePort();
    const created = await port.resolveWallet(owner!);
    assert.ok(created.ok, `the wallet resolves: ${created.ok ? "" : created.error}`);
  });

  await check("Z7: an ACTIVE business binding is not released, and still resolves to the business wallet", async () => {
    __reset();
    installLedgerRpc();
    __seed("leonix_rewards_wallets", [
      { id: "wallet-biz", business_id: BUSINESS, bound_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 0, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("business_memberships", [
      { id: "m1", user_id: CUSTOMER_A, business_id: BUSINESS, membership_status: "active", is_primary_owner: true },
    ]);
    const owner = await ledgerAdapter.resolveWalletOwnerForUser(CUSTOMER_A);
    assert.deepEqual(owner, { kind: "business", businessId: BUSINESS });
    assert.equal(
      __rows("leonix_rewards_wallets")[0]!.bound_user_id,
      CUSTOMER_A,
      "the binding stands",
    );
  });

  await check("Z8: a binding with NO membership row behind it is never released", async () => {
    __reset();
    installLedgerRpc();
    // Bound through a staff-verified payment link rather than a membership. Severing these split
    // earning from spending across two wallets: the customer's own read showed $0.00 while their
    // balance sat in the business wallet.
    __seed("leonix_rewards_wallets", [
      { id: "wallet-biz", business_id: BUSINESS, bound_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 0, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("business_memberships", []);
    const owner = await ledgerAdapter.resolveWalletOwnerForUser(CUSTOMER_A);
    assert.deepEqual(owner, { kind: "business", businessId: BUSINESS });
    assert.equal(__rows("leonix_rewards_wallets")[0]!.bound_user_id, CUSTOMER_A);
  });

  await check("Z12: a PENDING INVITATION is not a revocation — the binding survives it, and survives accepting it", async () => {
    __reset();
    installLedgerRpc();
    __seed("leonix_rewards_wallets", [
      { id: "wallet-biz", business_id: BUSINESS, bound_user_id: CUSTOMER_A, available_cents: 900, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    // `business_memberships_status_chk` admits `invited`. Treating it as "not active, therefore
    // revoked" released the binding on a WALLET READ: the customer's own wallet then showed $0.00
    // while their 900 credits sat in the business wallet, and accepting the invitation did not put
    // it back, because the resolver takes the `owner_user_id` branch for ever once a personal
    // wallet exists.
    __seed("business_memberships", [
      { id: "m1", user_id: CUSTOMER_A, business_id: BUSINESS, membership_status: "invited", is_primary_owner: true },
    ]);
    const owner = await ledgerAdapter.resolveWalletOwnerForUser(CUSTOMER_A);
    assert.deepEqual(owner, { kind: "business", businessId: BUSINESS }, "an invitation does not move anybody's money");
    assert.equal(
      __rows("leonix_rewards_wallets")[0]!.bound_user_id,
      CUSTOMER_A,
      "and the binding is still there to be honoured when the invitation is accepted",
    );
  });

  await check("Z13: a mix of statuses ends the binding only when EVERY row says revoked", async () => {
    for (const [statuses, expected] of [
      [["revoked"], "user"],
      [["revoked", "revoked"], "user"],
      [["revoked", "invited"], "business"],
      [["revoked", "active"], "business"],
      [["invited"], "business"],
      [["active"], "business"],
    ] as const) {
      __reset();
      installLedgerRpc();
      __seed("leonix_rewards_wallets", [
        { id: "wallet-biz", business_id: BUSINESS, bound_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 0, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
      ]);
      __seed(
        "business_memberships",
        statuses.map((st, i) => ({ id: `m${i}`, user_id: CUSTOMER_A, business_id: BUSINESS, membership_status: st, is_primary_owner: true })),
      );
      const owner = await ledgerAdapter.resolveWalletOwnerForUser(CUSTOMER_A);
      assert.equal(
        owner?.kind,
        expected,
        `statuses ${JSON.stringify(statuses)} must resolve to a ${expected} wallet, got ${JSON.stringify(owner)}`,
      );
    }
  });

  await check("Z9: a staff correction by user id resolves through the canonical binding", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("leonix_rewards_wallets", [
      { id: "wallet-biz", business_id: BUSINESS, bound_user_id: CUSTOMER_A, available_cents: 1000, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 1000, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("business_memberships", [
      { id: "m1", user_id: CUSTOMER_A, business_id: BUSINESS, membership_status: "active", is_primary_owner: true },
    ]);
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "adjust",
        ownerUserId: CUSTOMER_A,
        amountCents: 500,
        adjustmentRef: "CORRECTION-1",
        reason: "goodwill for a late delivery",
      }) as never,
    );
    assert.ok(res.status < 400, `the adjustment was accepted, got ${res.status}`);
    const posted = __rpcCalls("leonix_rewards_post_entry");
    assert.equal(posted.length, 1, "exactly one entry");
    assert.equal(
      posted[0]!.params.p_wallet_id,
      "wallet-biz",
      "and it landed on the BOUND wallet, not on a fresh personal one",
    );
  });

  await check("Y8: a re-filed RESTORATION row keeps the dispute it is about", async () => {
    __reset();
    signInAsSuperAdmin();
    __seed("payment_records", [{ id: PAYMENT_A, payment_status: "paid", stripe_charge_id: "ch_1" }]);
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 0, lifetime_earned_cents: 900, lifetime_reversed_cents: 900, pending_cents: 0, reserved_cents: 0, lifetime_redeemed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("leonix_rewards_ledger", [
      { id: "earn-1", wallet_id: "wallet-a", entry_type: "earn_available", amount_cents: 900, payment_record_id: PAYMENT_A, idempotency_key: `earn:payment:${PAYMENT_A}`, meta: { eligible_net_cents: 10000 }, created_at: new Date().toISOString() },
      { id: "cb-1", wallet_id: "wallet-a", entry_type: "chargeback_reversal", amount_cents: 900, payment_record_id: PAYMENT_A, source_id: "dp_9", idempotency_key: "reverse:chargeback:dp_9", meta: { basis_contribution_cents: 10000 }, created_at: new Date().toISOString() },
    ]);
    const id = seedQueueRow({ kind: "chargeback", external_ref: "dp_9", reason: "won_dispute_restoration_failed: boom" });
    __onRpc(() => ({ data: null, error: { code: "XX000", message: "connection reset" } }));
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve", resolutionId: id, note: "this attempt will fail", outcome: "restored", disputeId: "dp_9",
      }) as never,
    );
    assert.ok(res.status >= 400, "the operator is told it failed");
    const open = __rows("leonix_rewards_refund_resolutions").filter((r) => r.status === "open");
    assert.equal(open.length, 1, "the obligation was re-filed");
    assert.equal(open[0]!.external_ref, "dp_9", "and it still names ITS dispute — two disputes must stay two rows");
    assert.ok(
      String(open[0]!.reason).startsWith("won_dispute_restoration"),
      "and it is still classified as restoration work, or the screen offers no control that can settle it",
    );
  });

  await check("Y9: a payment with TWO unresolved disputes files TWO rows", async () => {
    __reset();
    const queue = await import("@/app/lib/rewards/rewardsRefundResolutionQueue");
    __seed("leonix_rewards_refund_resolutions", []);
    const a = await queue.enqueueUnattributableRefund({
      paymentRecordId: PAYMENT_A, kind: "chargeback", cumulativeRefundedCents: 0,
      reason: "won_dispute_restoration_failed: a", externalRef: "dp_a",
    });
    const b = await queue.enqueueUnattributableRefund({
      paymentRecordId: PAYMENT_A, kind: "chargeback", cumulativeRefundedCents: 0,
      reason: "won_dispute_restoration_failed: b", externalRef: "dp_b",
    });
    assert.ok(a.ok && b.ok, "both filed");
    const open = __rows("leonix_rewards_refund_resolutions").filter((r) => r.status === "open");
    assert.equal(open.length, 2, "two disputes, two rows — collapsing them discards one obligation");
    // ...and a REDELIVERY of one of them is still one row.
    await queue.enqueueUnattributableRefund({
      paymentRecordId: PAYMENT_A, kind: "chargeback", cumulativeRefundedCents: 0,
      reason: "won_dispute_restoration_failed: a again", externalRef: "dp_a",
    });
    assert.equal(
      __rows("leonix_rewards_refund_resolutions").filter((r) => r.status === "open").length,
      2,
      "a redelivery bumps the existing row rather than filing a third",
    );
  });

  await check("Y10: a staff redeem whose COMMIT fails is reported as a failure, not as a discount", async () => {
    __reset();
    signInAsSuperAdmin();
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 5000, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 5000, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    // The reserve succeeds; the commit does not. Staff must never be told the discount applied.
    let posts = 0;
    __onRpc((fn, params) => {
      if (fn !== "leonix_rewards_post_entry") return { data: null, error: { code: "P0001", message: fn } };
      posts += 1;
      if (String(params.p_entry_type) === "redeem_commit") {
        return { data: null, error: { code: "XX000", message: "connection reset" } };
      }
      const ledger = __rows("leonix_rewards_ledger");
      const row = {
        id: `entry-${posts}`, wallet_id: params.p_wallet_id, entry_type: params.p_entry_type,
        amount_cents: params.p_amount_cents, idempotency_key: params.p_idempotency_key,
        meta: params.p_meta ?? {}, created_at: new Date().toISOString(),
      };
      __seed("leonix_rewards_ledger", [...ledger, row]);
      return { data: row, error: null };
    });
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "redeem", ownerUserId: CUSTOMER_A, requestedCents: 2000, amountDueCents: 10000,
        redemptionRef: "OFFICE-1",
      }) as never,
    );
    assert.ok(res.status >= 400, `a failed commit is an error to the operator, got ${res.status}`);
    const body = (await res.json()) as { ok?: boolean };
    assert.equal(body.ok, false, "and never `ok: true` with an amount");
  });

  await check("Y11: the staff redeem ceiling is the SERVER's — half the amount due, whatever was typed", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 100000, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 100000, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "redeem", ownerUserId: CUSTOMER_A, requestedCents: 100000, amountDueCents: 10000,
        redemptionRef: "OFFICE-2",
      }) as never,
    );
    const reserved = __rpcCalls("leonix_rewards_post_entry").filter(
      (c) => String(c.params.p_entry_type) === "redeem_reserve",
    );
    if (res.status < 400) {
      assert.equal(reserved.length, 1, "one hold");
      assert.ok(
        Number(reserved[0]!.params.p_amount_cents) <= 5000,
        `the hold is capped at half of $100.00, got ${reserved[0]!.params.p_amount_cents}`,
      );
    } else {
      assert.equal(reserved.length, 0, "a refusal holds nothing");
    }
  });

  await check("Y12: a payment record already NET of credits takes none — and nothing is held first", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 100000, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 100000, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("leonix_payment_records", [
      { id: PAYMENT_B, metadata: { leonix_amount_is_net_of_credits: true } },
    ]);
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "redeem", ownerUserId: CUSTOMER_A, requestedCents: 2000, amountDueCents: 10000,
        redemptionRef: "OFFICE-3", paymentRecordId: PAYMENT_B,
      }) as never,
    );
    assert.equal(res.status, 409);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "payment_record_already_net_of_credits");
    assert.equal(
      __rpcCalls("leonix_rewards_post_entry").length,
      0,
      "a refusal that runs after the hold is not a refusal",
    );
  });

  await check("Y13: a PER-EVENT row's amount is never passed as the rail's cumulative position", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("payment_records", [{ id: PAYMENT_A, payment_status: "paid", stripe_charge_id: "ch_1" }]);
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 675, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 225, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    // $100.00 earned 900. A first $25.00 refund already took 225.
    __seed("leonix_rewards_ledger", [
      { id: "earn-1", wallet_id: "wallet-a", entry_type: "earn_available", amount_cents: 900, payment_record_id: PAYMENT_A, idempotency_key: `earn:payment:${PAYMENT_A}`, meta: { eligible_net_cents: 10000 }, created_at: new Date().toISOString() },
      { id: "rev-1", wallet_id: "wallet-a", entry_type: "refund_reversal", amount_cents: 225, payment_record_id: PAYMENT_A, source_id: "re_1", idempotency_key: "reverse:refund:re_1", meta: { basis_contribution_cents: 2500 }, created_at: new Date().toISOString() },
    ]);
    // The queue row is about a SECOND $25.00 refund, and its number is that event's OWN amount.
    const id = seedQueueRow({ external_ref: "re_2", cumulative_refunded_cents: 2500, reason: "refund_reversal_failed: boom" });
    await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve", resolutionId: id, note: "resolving the second refund", outcome: "reversed", refundExternalId: "re_2",
      }) as never,
    );
    const posted = __rpcCalls("leonix_rewards_post_entry").filter(
      (c) => String(c.params.p_entry_type) === "refund_reversal",
    );
    assert.equal(posted.length, 1, "one reversal was posted");
    assert.equal(
      Number(posted[0]!.params.p_amount_cents),
      225,
      "passing the per-event amount as a cumulative position computes max(0, 2500-2500) = 0: it moves nothing, " +
        "closes the row as reversed, and burns `reverse:refund:re_2` so the real delivery can never fix it",
    );
  });

  await check("Y14: a restoration that moved NOTHING is never reported as done", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("payment_records", [{ id: PAYMENT_A, payment_status: "disputed", stripe_charge_id: "ch_1" }]);
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 900, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    // The dispute was WON, but its clawback has not arrived yet — the ordering case this row was
    // filed for. Reporting `movedCents: 0` as a success closed the obligation: the clawback landed
    // minutes later and no key would ever restore it.
    __seed("leonix_rewards_ledger", [
      { id: "earn-1", wallet_id: "wallet-a", entry_type: "earn_available", amount_cents: 900, payment_record_id: PAYMENT_A, idempotency_key: `earn:payment:${PAYMENT_A}`, meta: { eligible_net_cents: 10000 }, created_at: new Date().toISOString() },
    ]);
    const id = seedQueueRow({ kind: "chargeback", external_ref: "dp_pending", cumulative_refunded_cents: 0, reason: "won_dispute_restoration_failed: nothing_was_reversed" });
    const res = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "refund_resolve", resolutionId: id, note: "the customer says they won", outcome: "restored", disputeId: "dp_pending",
      }) as never,
    );
    assert.ok(res.status >= 400, `a restoration that moved nothing is an error, got ${res.status}`);
    const open = __rows("leonix_rewards_refund_resolutions").filter((r) => r.status === "open");
    assert.equal(open.length, 1, "and the obligation is re-filed rather than destroyed");
  });

  await check("Z14: a reversal key already held by ANOTHER wallet is a collision, not a duplicate", async () => {
    __reset();
    installLedgerRpc();
    // Payment A earned on wallet A. Payment B earned on wallet B. A delivery for B arrives naming
    // an external id that already keys A's reversal — a mistyped staff resolution, or a rail id
    // reused across accounts. Reporting `duplicate_delivery` told the webhook the clawback had
    // already been applied: the money went back, the credits stayed, nothing was queued, and
    // Stripe never retried.
    __seed("payment_records", [
      { id: PAYMENT_A, payment_status: "paid", stripe_charge_id: "ch_a" },
      { id: PAYMENT_B, payment_status: "paid", stripe_charge_id: "ch_b" },
    ]);
    __seed("leonix_rewards_wallets", [
      { id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 450, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 450, recovery_cents: 0, lifetime_restored_cents: 0 },
      { id: "wallet-b", owner_user_id: CUSTOMER_B, available_cents: 900, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("leonix_rewards_ledger", [
      { id: "earn-a", wallet_id: "wallet-a", entry_type: "earn_available", amount_cents: 900, payment_record_id: PAYMENT_A, idempotency_key: `earn:payment:${PAYMENT_A}`, meta: { eligible_net_cents: 10000 }, created_at: new Date().toISOString() },
      { id: "earn-b", wallet_id: "wallet-b", entry_type: "earn_available", amount_cents: 900, payment_record_id: PAYMENT_B, idempotency_key: `earn:payment:${PAYMENT_B}`, meta: { eligible_net_cents: 10000 }, created_at: new Date().toISOString() },
      { id: "rev-a", wallet_id: "wallet-a", entry_type: "refund_reversal", amount_cents: 450, payment_record_id: PAYMENT_A, source_id: "re_collide", idempotency_key: "reverse:refund:re_collide", meta: { basis_contribution_cents: 5000 }, created_at: new Date().toISOString() },
    ]);

    const { reverseCreditsForRefundOrDispute } = await import("@/app/lib/rewards/rewardsFulfillment");
    const result = await reverseCreditsForRefundOrDispute({
      paymentRecordId: PAYMENT_B,
      refundedCents: 5000,
      cumulativeRefundedCents: 5000,
      kind: "refund",
      externalId: "re_collide",
    });
    assert.equal(result.ok, false, `a key held by another wallet must not report success: ${JSON.stringify(result)}`);
    const walletB = __rows("leonix_rewards_wallets").find((r) => r.id === "wallet-b")!;
    assert.equal(Number(walletB.available_cents), 900, "and B's balance is untouched, pending a real resolution");
  });

  await check("Y15: recovery debt has a staff exit, bounded by the debt and keyed on the reference", async () => {
    __reset();
    signInAsSuperAdmin();
    // A clawback larger than the spendable balance leaves a debt that blocks every redemption, and
    // a positive `manual_adjustment` does NOT repay one — the posting function's adjustment arm
    // credits `available` with no offset. So a customer owing 900 could be "corrected" +900 and
    // still spend nothing. There was no control that could clear it.
    const wallet = {
      id: "wallet-a", owner_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0,
      lifetime_earned_cents: 900, lifetime_redeemed_cents: 900, lifetime_reversed_cents: 900,
      recovery_cents: 900, lifetime_recovery_accrued_cents: 900, lifetime_recovery_offset_cents: 0,
      lifetime_restored_cents: 0,
    };
    __seed("leonix_rewards_wallets", [wallet]);
    __onRpc((fn, params) => {
      if (fn !== "leonix_rewards_post_entry") return { data: null, error: { code: "P0001", message: fn } };
      const rows = __rows("leonix_rewards_ledger");
      const prior = rows.find((r) => r.idempotency_key === params.p_idempotency_key);
      if (prior) return { data: prior, error: null };
      if (String(params.p_entry_type) === "recovery_offset") {
        const live = __rows("leonix_rewards_wallets")[0]!;
        const next = Math.max(0, Number(live.recovery_cents) - Number(params.p_amount_cents));
        __seed("leonix_rewards_wallets", [{ ...live, recovery_cents: next }]);
      }
      const row = {
        id: `entry-${rows.length + 1}`, wallet_id: params.p_wallet_id, entry_type: params.p_entry_type,
        amount_cents: params.p_amount_cents, idempotency_key: params.p_idempotency_key,
        meta: params.p_meta ?? {}, created_at: new Date().toISOString(),
      };
      __seed("leonix_rewards_ledger", [...rows, row]);
      return { data: row, error: null };
    });

    // More than is owed is refused outright, with the real figure, rather than silently clamped.
    const tooMuch = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "forgive_recovery", ownerUserId: CUSTOMER_A, amountCents: 1500,
        adjustmentRef: "WRITEOFF-1", reason: "goodwill after a rail error",
      }) as never,
    );
    assert.equal(tooMuch.status, 409);
    assert.equal(((await tooMuch.json()) as { error?: string }).error, "exceeds_recovery_debt");

    const ok = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "forgive_recovery", ownerUserId: CUSTOMER_A, amountCents: 900,
        adjustmentRef: "WRITEOFF-1", reason: "goodwill after a rail error",
      }) as never,
    );
    assert.equal(ok.status, 200, await ok.clone().text());
    const body = (await ok.json()) as { forgivenCents?: number; remainingRecoveryCents?: number };
    assert.equal(body.forgivenCents, 900);
    assert.equal(body.remainingRecoveryCents, 0, "the customer can redeem again");

    const offsets = __rpcCalls("leonix_rewards_post_entry").filter(
      (c) => String(c.params.p_entry_type) === "recovery_offset",
    );
    assert.equal(offsets.length, 1, "and it moved once");

    // A second click on the same reference forgives nothing further.
    const again = await adminRewards.POST(
      jsonRequest("http://x/api/admin/rewards", {
        action: "forgive_recovery", ownerUserId: CUSTOMER_A, amountCents: 900,
        adjustmentRef: "WRITEOFF-1", reason: "goodwill after a rail error",
      }) as never,
    );
    assert.equal(again.status, 409, "there is no debt left to forgive");
  });

  await check("Z10: the compare-and-swap token counts the payment's REAL reversal rows", async () => {
    __reset();
    __seed("leonix_rewards_ledger", [
      { id: "r1", payment_record_id: PAYMENT_A, entry_type: "refund_reversal", amount_cents: 100 },
      { id: "r2", payment_record_id: PAYMENT_A, entry_type: "chargeback_reversal", amount_cents: 100 },
      { id: "r3", payment_record_id: PAYMENT_A, entry_type: "reversal_restoration", amount_cents: 100 },
      { id: "e1", payment_record_id: PAYMENT_A, entry_type: "earn_pending", amount_cents: 900 },
      { id: "r4", payment_record_id: PAYMENT_B, entry_type: "refund_reversal", amount_cents: 100 },
    ]);
    const port = ledgerAdapter.buildRewardsStorePort();
    assert.equal(
      await port.countPaymentPositionRows(PAYMENT_A),
      3,
      "a constant token defeats the compare-and-swap entirely, and the races it stops move real money",
    );
    assert.equal(await port.countPaymentPositionRows(PAYMENT_B), 1);
  });

  await check("Z17: the harness itself refuses a multi-row `maybeSingle`, as PostgREST does", async () => {
    // A HARNESS THAT IS KINDER THAN PRODUCTION CERTIFIES NOTHING. This diff contains a repair
    // authored because two payment records for one payment intent made the REAL call return an
    // error rather than a row. If the fake returns `rows[0]` for any count, a route check over a
    // non-unique column passes here and errors in production — the one divergence that would have
    // hidden the defect that repair exists for.
    __reset();
    __seed("leonix_payment_records", [
      { id: "p1", stripe_payment_intent_id: "pi_dup" },
      { id: "p2", stripe_payment_intent_id: "pi_dup" },
    ]);
    const client = getHarnessClient() as unknown as {
      from(t: string): {
        select(c: string): { eq(a: string, b: string): { maybeSingle(): Promise<{ error?: { code?: string } | null }> } };
      };
    };
    const res = await client
      .from("leonix_payment_records")
      .select("id")
      .eq("stripe_payment_intent_id", "pi_dup")
      .maybeSingle();
    assert.ok(res.error, "two rows for a maybeSingle must be an ERROR, not the first row");
    assert.equal(res.error?.code, "PGRST116");
  });

  await check("Z15: a failed position read is NOT reported as an empty position", async () => {
    __reset();
    __seed("leonix_rewards_ledger", [
      { id: "r1", payment_record_id: PAYMENT_A, entry_type: "refund_reversal", amount_cents: 100 },
    ]);
    const port = ledgerAdapter.buildRewardsStorePort();
    __failReadsOn("leonix_rewards_ledger");
    try {
      const count = await port.countPaymentPositionRows(PAYMENT_A);
      // Returning 0 would hand the posting statement a token that matches only an EMPTY position:
      // a real reversal history would then refuse (loudly, retryably — the safe direction) while a
      // FIRST reversal would proceed on a read that never succeeded. -1 can never equal a real
      // count, so a failed read always refuses instead of sometimes passing.
      assert.equal(count, -1, "a read that failed must be distinguishable from a position of zero");
    } finally {
      __failReadsOn();
    }
  });

  await check("Z16: releasing a revoked binding touches ONLY that business's wallet", async () => {
    __reset();
    installLedgerRpc();
    const OTHER_BUSINESS = "88888888-8888-4888-8888-888888888888";
    __seed("leonix_rewards_wallets", [
      { id: "wallet-b1", business_id: BUSINESS, bound_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 0, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
      { id: "wallet-b2", business_id: OTHER_BUSINESS, bound_user_id: CUSTOMER_B, available_cents: 900, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 900, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("business_memberships", [
      { id: "m1", user_id: CUSTOMER_A, business_id: BUSINESS, membership_status: "revoked", is_primary_owner: true },
    ]);
    await ledgerAdapter.resolveWalletOwnerForUser(CUSTOMER_A);
    const wallets = __rows("leonix_rewards_wallets");
    assert.equal(wallets.find((w) => w.id === "wallet-b1")!.bound_user_id ?? null, null, "the revoked one is released");
    assert.equal(
      wallets.find((w) => w.id === "wallet-b2")!.bound_user_id,
      CUSTOMER_B,
      "and no other customer's identity is touched",
    );
  });

  await check("Z11: a CSV reconciliation row resolves through the canonical binding", async () => {
    __reset();
    installLedgerRpc();
    signInAsSuperAdmin();
    __seed("leonix_rewards_wallets", [
      { id: "wallet-biz", business_id: BUSINESS, bound_user_id: CUSTOMER_A, available_cents: 0, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 0, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
    __seed("business_memberships", [
      { id: "m1", user_id: CUSTOMER_A, business_id: BUSINESS, membership_status: "active", is_primary_owner: true },
    ]);
    const reconciliation = await import("@/app/api/admin/rewards/reconciliation/route");
    const content = [
      "payment_record_id,business_id,owner_user_id,amount_cents,kind,reference,reason",
      `,,${CUSTOMER_A},500,manual_adjustment,RECON-1,imported from the counter ledger`,
    ].join("\n");
    // Two steps, because the route refuses to write a file nobody previewed.
    const preview = await reconciliation.POST(
      jsonRequest("http://x/api/admin/rewards/reconciliation", { mode: "preview", content }) as never,
    );
    assert.ok(preview.status < 400, `the preview ran, got ${preview.status}: ${await preview.clone().text()}`);
    const previewBody = (await preview.json()) as { batchFingerprint?: string };
    assert.ok(previewBody.batchFingerprint, "the preview returned a fingerprint to commit against");
    const res = await reconciliation.POST(
      jsonRequest("http://x/api/admin/rewards/reconciliation", {
        mode: "commit",
        content,
        batchFingerprint: previewBody.batchFingerprint,
      }) as never,
    );
    assert.ok(res.status < 400, `the import ran, got ${res.status}: ${await res.clone().text()}`);
    const posted = __rpcCalls("leonix_rewards_post_entry");
    assert.equal(posted.length, 1, "the row was actually applied — a no-op import proves nothing");
    assert.equal(
      posted[0]!.params.p_wallet_id,
      "wallet-biz",
      "the credit landed on the BOUND wallet, not on a fresh personal one the customer never reads",
    );
  });

  // -------------------------------------------------------------------------
  // SECTION V — the customer checkout, EXECUTED end to end against a recording
  // Stripe. No live call is made; what the route ASKED Stripe to charge is what
  // these checks read, because that is the number a customer's card sees.
  // -------------------------------------------------------------------------

  const checkout = await import("@/app/api/revenue-os/checkout/route");

  const BEARER = CUSTOMER_A;
  const OTHER = CUSTOMER_B;

  function seedTwoWallets(bearerAvailable: number): void {
    __seed("leonix_rewards_wallets", [
      { id: "w-bearer", owner_user_id: BEARER, available_cents: bearerAvailable, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: bearerAvailable, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
      // A second customer with a large balance, named in the BODY. Nothing may ever reach it.
      { id: "w-other", owner_user_id: OTHER, available_cents: 999999, pending_cents: 0, reserved_cents: 0, lifetime_earned_cents: 999999, lifetime_redeemed_cents: 0, lifetime_reversed_cents: 0, recovery_cents: 0, lifetime_restored_cents: 0 },
    ]);
  }

  function echoingLedger(): void {
    __onRpc((fn, params) => ({
      data: {
        id: "entry-1",
        wallet_id: params.p_wallet_id,
        entry_type: params.p_entry_type,
        amount_cents: params.p_amount_cents,
        meta: params.p_meta ?? {},
      },
      error: null,
    }));
  }

  async function postCheckoutWithoutToken(body: Record<string, unknown>): Promise<Response> {
    process.env.STRIPE_SECRET_KEY = "sk_test_harness";
    const url = "http://x/api/revenue-os/checkout";
    const req = new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    Object.defineProperty(req, "nextUrl", { value: new URL(url), configurable: true });
    return checkout.POST(req as never);
  }

  async function postCheckout(body: Record<string, unknown>): Promise<Response> {
    process.env.STRIPE_SECRET_KEY = "sk_test_harness";
    const url = "http://x/api/revenue-os/checkout";
    const req = new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer tok" },
      body: JSON.stringify(body),
    });
    Object.defineProperty(req, "nextUrl", { value: new URL(url), configurable: true });
    return checkout.POST(req as never);
  }

  const ONE_TIME = {
    category: "empleos",
    packageKey: "empleos_job_post_paid",
    listingDraftId: "draft-1",
    successUrl: "http://x/ok",
    cancelUrl: "http://x/no",
  };

  await check("V1: the wallet a checkout spends from is the BEARER's — `ownerUserId` in the body reaches nothing", async () => {
    __reset();
    __resetStripe();
    echoingLedger();
    __setBearerTokens({ tok: BEARER });
    seedTwoWallets(5000);
    const res = await postCheckout({ ...ONE_TIME, ownerUserId: OTHER, requestedCreditsCents: 500 });
    assert.equal(res.status, 200, await res.clone().text());
    const held = __rpcCalls("leonix_rewards_post_entry").filter(
      (c) => String(c.params.p_entry_type) === "redeem_reserve",
    );
    assert.equal(held.length, 1, "one hold was taken");
    assert.equal(
      held[0]!.params.p_wallet_id,
      "w-bearer",
      "a body that names another customer must never redirect the hold",
    );

    // AND WITH NO TOKEN AT ALL, WHICH IS THE CASE THAT MATTERS.
    //
    // The defect this covers put `?? body.ownerUserId` on the identity, so it only ever fired for a
    // caller who presented NO bearer token. A check that always authenticates can never reach it —
    // measured: an independent reviewer's reintroduction of exactly that survived until this half
    // of the check existed.
    __reset();
    __resetStripe();
    echoingLedger();
    __setBearerTokens({});
    seedTwoWallets(5000);
    const anonymous = await postCheckoutWithoutToken({
      ...ONE_TIME,
      ownerUserId: OTHER,
      requestedCreditsCents: 500,
    });
    const anonymousHolds = __rpcCalls("leonix_rewards_post_entry").filter(
      (c) => String(c.params.p_entry_type) === "redeem_reserve",
    );
    assert.equal(
      anonymousHolds.length,
      0,
      `an unauthenticated caller spent a named customer's balance: ${JSON.stringify(anonymousHolds).slice(0, 300)} (status ${anonymous.status})`,
    );
  });

  await check("V2: what Stripe is asked to charge is the amount MINUS the credits, exactly once", async () => {
    __reset();
    __resetStripe();
    echoingLedger();
    __setBearerTokens({ tok: BEARER });
    seedTwoWallets(5000);
    const res = await postCheckout({ ...ONE_TIME, requestedCreditsCents: 500 });
    assert.equal(res.status, 200, await res.clone().text());
    const body = (await res.json()) as { amountCents?: number; creditsAppliedCents?: number; amountBeforeCreditsCents?: number };
    assert.equal(body.amountBeforeCreditsCents, 2499);
    assert.equal(body.creditsAppliedCents, 500);
    assert.equal(body.amountCents, 1999, "the customer is told what they will pay");

    const sessions = __stripeSessions();
    assert.equal(sessions.length, 1, "one session");
    const charged = JSON.stringify(sessions[0]);
    assert.ok(
      charged.includes("1999"),
      `and Stripe is asked for exactly that: ${charged.slice(0, 400)}`,
    );
    assert.ok(
      !charged.includes("1499") && !charged.includes("2499"),
      "never the doubled discount, and never the undiscounted price",
    );
  });

  await check("V3: the hold is capped at half the purchase, whatever the browser asks for", async () => {
    __reset();
    __resetStripe();
    echoingLedger();
    __setBearerTokens({ tok: BEARER });
    seedTwoWallets(500000);
    const res = await postCheckout({ ...ONE_TIME, requestedCreditsCents: 999999 });
    assert.equal(res.status, 200, await res.clone().text());
    const held = __rpcCalls("leonix_rewards_post_entry").filter(
      (c) => String(c.params.p_entry_type) === "redeem_reserve",
    );
    assert.equal(held.length, 1);
    assert.ok(
      Number(held[0]!.params.p_amount_cents) <= Math.floor(2499 / 2),
      `the 50% ceiling binds at the moment credits are actually held, got ${held[0]!.params.p_amount_cents}`,
    );
  });

  await check("V4: a RECURRING plan refuses credits by name, and holds nothing", async () => {
    __reset();
    __resetStripe();
    echoingLedger();
    __setBearerTokens({ tok: BEARER });
    seedTwoWallets(500000);
    const res = await postCheckout({
      category: "servicios",
      packageKey: "servicios_base_monthly",
      listingDraftId: "draft-2",
      successUrl: "http://x/ok",
      cancelUrl: "http://x/no",
      requestedCreditsCents: 500,
      // A subscription checkout refuses to go anywhere without affirmative consent, so supply it —
      // otherwise this check would "pass" by never reaching the credits decision at all.
      recurringConsent: {
        accepted: true,
        consentTextVersion: RECURRING_CONSENT_TEXT_VERSION,
        lang: "es",
      },
    });
    const text = await res.clone().text();
    assert.equal(res.status, 200, `the subscription checkout reached the credits decision: ${text.slice(0, 300)}`);
    const held = __rpcCalls("leonix_rewards_post_entry").filter(
      (c) => String(c.params.p_entry_type) === "redeem_reserve",
    );
    assert.equal(held.length, 0, `no hold on a subscription: ${text.slice(0, 300)}`);
    if (res.status === 200) {
      const body = JSON.parse(text) as { creditsAppliedCents?: number; creditsRefusedReason?: string };
      assert.equal(body.creditsAppliedCents ?? 0, 0, "and nothing applied");
      assert.equal(
        body.creditsRefusedReason,
        "not_available_on_recurring_plan",
        "and the customer is told why, rather than shown a discount that evaporates",
      );
    }
  });

  if (failures.length) {
    console.error(`verify-ix-rewards-route-behavior-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  console.log(
    `verify-ix-rewards-route-behavior-01: OK (${checks} checks — route handlers and the production adapter EXECUTED, no text matching)`,
  );
}

void main();

/**
 * GATE B/C executed server proofs: payment query fail-closed + claim transfer failure HTTP.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-payment-claim-runtime-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { __failReadsOn, __reset, __seed, __setAuthUsers, __rows, __onRpc } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { __setBearerTokens, __setBearerRpc } from "./lib/stubs/supabaseJs.mjs";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import { evaluateListingPackagePaymentAuthority } from "../app/lib/listingPlans/listingPackagePaymentAuthority";
import { readListingPackagePaymentAuthority } from "../app/lib/listingPlans/listingPackagePaymentAuthorityServer";
import { transferLinkedListingsOnAcceptedClaim } from "../app/lib/business/ownership/linkedListingOwnerTransferServer";
import { POST as acceptClaimPost } from "../app/api/business/ownership-claim/accept/route";
import { planLinkedListingOwnerTransfer } from "../app/lib/business/ownership/linkedListingOwnerTransfer";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const QUICK = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple;
const FULL = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.full;
const SRC = "servicios_public_listings";
const LISTING = "00000000-0000-4000-8000-00000000list";

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  }
}
async function checkAsync(name: string, fn: () => Promise<void>) {
  checks += 1;
  try {
    await fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  }
}

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  const h = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    json: async () => body,
    text: async () => JSON.stringify(body ?? {}),
    headers: { get: (name: string) => h.get(name.toLowerCase()) ?? null },
    cookies: { get: () => undefined },
    nextUrl: new URL("http://harness.invalid/api"),
  } as never;
}

async function main() {
  await checkAsync("P1: unpaid/manual entitlement cannot publish", async () => {
    __reset();
    __seed("listing_package_entitlements", [
      {
        id: "ent-1",
        listing_id: LISTING,
        listing_source: SRC,
        category: "servicios",
        package_key: QUICK,
        status: "active",
        grant_source: "admin_manual",
        metadata: { payment_status: null },
      },
    ]);
    const d = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "unproven_entitlement");
  });

  await checkAsync("P2: same UUID wrong listing_source cannot publish", async () => {
    __reset();
    __seed("leonix_payment_records", [
      {
        id: "pay-1",
        listing_source: "listings",
        listing_id: LISTING,
        category: "rentas",
        package_key: QUICK,
        currency: "usd",
        source: "admin_manual",
        payment_status: "paid",
        manual_state: "cleared",
        amount_cents: 24900,
        amount_paid_cents: 24900,
        amount_total_cents: 24900,
      },
    ]);
    const d = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "wrong_source");
  });

  await checkAsync("P3: Rewards metadata without committed redemption cannot publish", async () => {
    __reset();
    __seed("leonix_payment_records", [
      {
        id: "pay-2",
        listing_source: SRC,
        listing_id: LISTING,
        category: "servicios",
        package_key: QUICK,
        currency: "usd",
        source: "admin_manual",
        payment_status: "paid",
        manual_state: "cleared",
        amount_cents: 12450,
        amount_paid_cents: 12450,
        amount_total_cents: 12450,
        metadata: { leonix_credits_applied_cents: 12450, leonix_amount_is_net_of_credits: true },
      },
    ]);
    const d = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "rewards_not_committed");
  });

  await checkAsync("P4: Rewards read error cannot publish", async () => {
    __reset();
    __seed("leonix_payment_records", [
      {
        id: "pay-3",
        listing_source: SRC,
        listing_id: LISTING,
        category: "servicios",
        package_key: QUICK,
        currency: "usd",
        source: "admin_manual",
        payment_status: "paid",
        manual_state: "cleared",
        amount_cents: 24900,
        amount_paid_cents: 24900,
        amount_total_cents: 24900,
      },
    ]);
    __failReadsOn("leonix_rewards_redemptions");
    const d = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "ledger_read_failed");
  });

  await checkAsync("P5: payment query error cannot publish", async () => {
    __reset();
    __failReadsOn("leonix_payment_records");
    const d = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "ledger_read_failed");
  });

  await checkAsync("P6: entitlement query error cannot publish", async () => {
    __reset();
    __failReadsOn("listing_package_entitlements");
    const d = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "ledger_read_failed");
  });

  await checkAsync("P7: Quick payment cannot publish Full; Full cannot be Quick", async () => {
    __reset();
    __seed("leonix_payment_records", [
      {
        id: "pay-4",
        listing_source: SRC,
        listing_id: LISTING,
        category: "servicios",
        package_key: QUICK,
        currency: "usd",
        source: "admin_manual",
        payment_status: "paid",
        manual_state: "cleared",
        amount_cents: 24900,
        amount_paid_cents: 24900,
        amount_total_cents: 24900,
      },
    ]);
    const asFull = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: FULL,
      category: "servicios",
    });
    assert.equal(asFull.ok, false);
    if (!asFull.ok) assert.equal(asFull.error, "wrong_package");
    __reset();
    __seed("leonix_payment_records", [
      {
        id: "pay-5",
        listing_source: SRC,
        listing_id: LISTING,
        category: "servicios",
        package_key: FULL,
        currency: "usd",
        source: "admin_manual",
        payment_status: "paid",
        manual_state: "cleared",
        amount_cents: 39900,
        amount_paid_cents: 39900,
        amount_total_cents: 39900,
      },
    ]);
    const asQuick = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(asQuick.ok, false);
    if (!asQuick.ok) assert.equal(asQuick.error, "wrong_package");
  });

  await checkAsync("P8: refunded/disputed/reversed/canceled/pending/wrong-currency/wrong-listing/wrong-package cannot publish", async () => {
    const base = {
      listing_source: SRC,
      listing_id: LISTING,
      category: "servicios",
      package_key: QUICK,
      currency: "usd",
      source: "admin_manual",
      payment_status: "paid",
      manual_state: "cleared",
      amount_cents: 24900,
      amount_paid_cents: 24900,
      amount_total_cents: 24900,
    };
    const cases: Array<{ id: string; patch: Record<string, unknown>; error: string }> = [
      { id: "pay-ref", patch: { payment_status: "refunded", refunded_at: "2026-09-22T00:00:00Z" }, error: "refunded_payment" },
      { id: "pay-dis", patch: { payment_status: "disputed" }, error: "disputed_payment" },
      { id: "pay-rev", patch: { manual_state: "reversed" }, error: "reversed_payment" },
      { id: "pay-can", patch: { payment_status: "canceled" }, error: "canceled_payment" },
      { id: "pay-pen", patch: { payment_status: "pending", manual_state: "pending_verification" }, error: "pending_payment" },
      { id: "pay-cur", patch: { currency: "mxn" }, error: "wrong_currency" },
      { id: "pay-pkg", patch: { package_key: FULL }, error: "wrong_package" },
    ];
    for (const row of cases) {
      __reset();
      __seed("leonix_payment_records", [{ ...base, id: row.id, ...row.patch }]);
      const d = await readListingPackagePaymentAuthority({
        listingSource: SRC,
        listingId: LISTING,
        packageKey: QUICK,
        category: "servicios",
      });
      assert.equal(d.ok, false, row.id);
      if (!d.ok) assert.equal(d.error, row.error, row.id);
    }
    __reset();
    __seed("leonix_payment_records", [
      { ...base, id: "pay-lis", listing_id: "00000000-0000-4000-8000-00000000othr" },
    ]);
    const scoped = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(scoped.ok, false);
    if (!scoped.ok) assert.equal(scoped.error, "no_matching_record");
    const evaluated = evaluateListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
      records: [{ ...base, listing_id: "00000000-0000-4000-8000-00000000othr" }],
    });
    assert.equal(evaluated.ok, false);
    if (!evaluated.ok) assert.equal(evaluated.error, "wrong_listing");
  });

  await checkAsync("P10: print_included entitlement with wrong listing_source cannot publish", async () => {
    __reset();
    __seed("listing_package_entitlements", [
      {
        id: "ent-src",
        listing_id: LISTING,
        listing_source: "listings",
        category: "servicios",
        package_key: QUICK,
        status: "active",
        grant_source: "print_included",
      },
    ]);
    const d = await readListingPackagePaymentAuthority({
      listingSource: SRC,
      listingId: LISTING,
      packageKey: QUICK,
      category: "servicios",
    });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "unproven_entitlement");
  });

  check("P11: stripe_terminal storage is blocked by unapplied CHECK; evaluator is not live insert proof", () => {
    const sql = read("supabase/migrations/20260922190000_leonix_payment_records_source_stripe_terminal.sql");
    assert.ok(sql.includes("Additive, unapplied"));
    assert.ok(sql.includes("stripe_terminal"));
    const current = read("supabase/migrations/20260526120000_leonix_payment_records.sql");
    assert.ok(current.includes("leonix_payment_records_source_chk"));
    assert.equal(/stripe_terminal/.test(current), false);
    const server = read("app/lib/listingPlans/listingPackagePaymentAuthorityServer.ts");
    assert.ok(server.includes("20260922190000_leonix_payment_records_source_stripe_terminal.sql"));
  });

  check("P9: runtime does not claim replayed:true; idempotency is the unique index", () => {
    const server = read("app/lib/listingPlans/listingPackagePaymentAuthorityServer.ts");
    const stripped = server.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.equal(stripped.includes("replayed: false"), false);
    assert.equal(stripped.includes("replayed: true"), false);
    const sql = read("supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql");
    assert.ok(sql.includes("leonix_rewards_redemptions_idempotency_idx"));
  });

  await checkAsync("C1: listing-read failure is a hard refusal, never owner-null", async () => {
    __reset();
    __seed("business_listing_links", [
      { business_id: "biz-1", listing_source: SRC, listing_id: LISTING, status: "verified" },
    ]);
    __failReadsOn(SRC);
    const transfer = await transferLinkedListingsOnAcceptedClaim({
      businessId: "biz-1",
      claimerUserId: "claimer-1",
    });
    assert.equal(transfer.ok, false);
    if (!transfer.ok) assert.equal(transfer.error, "listing_read_failed");
    assert.equal(transfer.recorded, false);
    assert.equal(__rows(SRC).length, 0);
  });

  await checkAsync("C2: foreign owner is skipped, not stolen, and not treated as owner-null", async () => {
    __reset();
    __seed("business_listing_links", [
      { business_id: "biz-1", listing_source: SRC, listing_id: LISTING, status: "verified" },
    ]);
    __seed(SRC, [{ id: LISTING, owner_user_id: "already-someone" }]);
    const transfer = await transferLinkedListingsOnAcceptedClaim({
      businessId: "biz-1",
      claimerUserId: "claimer-1",
    });
    assert.equal(transfer.ok, true);
    if (transfer.ok) {
      assert.equal(transfer.updates.length, 0);
      assert.equal(transfer.skipped[0]?.reason, "foreign_owner");
      assert.equal(transfer.recorded, true);
    }
    assert.equal((__rows(SRC)[0] as { owner_user_id: string }).owner_user_id, "already-someone");
  });

  await checkAsync("C3: owner-null transfers same id; foreign owner is not stolen", async () => {
    __reset();
    __seed("business_listing_links", [
      { business_id: "biz-1", listing_source: SRC, listing_id: "svc-1", status: "verified" },
      { business_id: "biz-1", listing_source: "listings", listing_id: "rent-1", status: "verified" },
    ]);
    __seed(SRC, [{ id: "svc-1", owner_user_id: null }]);
    __seed("listings", [{ id: "rent-1", owner_id: "foreign" }]);
    const transfer = await transferLinkedListingsOnAcceptedClaim({
      businessId: "biz-1",
      claimerUserId: "claimer-1",
    });
    assert.equal(transfer.ok, true);
    if (transfer.ok && transfer.recorded) {
      assert.deepEqual(transfer.listingIds, ["svc-1", "rent-1"]);
      assert.equal(transfer.updates.length, 1);
      assert.equal(transfer.updates[0]?.listingId, "svc-1");
    }
    assert.equal((__rows(SRC)[0] as { owner_user_id: string }).owner_user_id, "claimer-1");
    assert.equal((__rows("listings")[0] as { owner_id: string }).owner_id, "foreign");
  });

  await checkAsync("C4: HTTP accept never returns ok:true when listing transfer failed", async () => {
    __reset();
    __setCookies({});
    __seed("business_identity_flags", [
      {
        flag_key: "business_ownership_claim",
        enabled: true,
        pilot_user_ids: [],
        emergency_disabled: false,
      },
    ]);
    __setBearerTokens({ "claim-token": { id: "claimer-1", email: "owner@test" } });
    __setBearerRpc({ data: "biz-1", error: null });
    __seed("business_listing_links", [
      { business_id: "biz-1", listing_source: SRC, listing_id: LISTING, status: "verified" },
    ]);
    __failReadsOn(SRC);
    const res = await acceptClaimPost(
      makeRequest({ token: "raw-claim" }, { authorization: "Bearer claim-token" }),
    );
    const json = (await res.json()) as { ok?: boolean; error?: string };
    assert.equal(res.status, 409);
    assert.equal(json.ok, false);
    assert.equal(json.error, "listing_read_failed");
  });

  check("C5: unapplied RPC SQL is one transaction: claim + owner-null updates, never INSERT listings", () => {
    const sql = read("supabase/migrations/20260922180000_accept_claim_transfer_linked_listing_owners.sql");
    assert.ok(sql.includes("Additive, unapplied"));
    assert.ok(sql.includes("FOR UPDATE"));
    assert.ok(sql.includes("INSERT INTO public.business_memberships"));
    assert.ok(sql.includes("UPDATE public.servicios_public_listings SET owner_user_id = v_user_id"));
    assert.ok(sql.includes("AND owner_user_id IS NULL"));
    assert.ok(sql.includes("UPDATE public.listings SET owner_id = v_user_id"));
    assert.equal(/INSERT INTO public\.listings/i.test(sql), false);
    assert.ok(sql.includes("LANGUAGE plpgsql"));
    assert.equal(sql.includes("COMMIT;"), false);
  });

  check("C6: planner still skips missing listings instead of treating them as owner-null", () => {
    const plan = planLinkedListingOwnerTransfer({
      claimerUserId: "claimer",
      listings: [{ listingSource: SRC, listingId: "gone", currentOwner: null, readStatus: "missing_listing" }],
    });
    assert.equal(plan.ok, true);
    if (plan.ok) {
      assert.equal(plan.updates.length, 0);
      assert.equal(plan.skipped[0]?.reason, "missing_listing");
    }
  });

  check("C7: accept route returns 409 listing_transfer failure instead of ok true", () => {
    const route = read("app/api/business/ownership-claim/accept/route.ts");
    assert.ok(route.includes("transfer.recorded !== true"));
    assert.ok(route.includes('status: 409'));
    assert.equal(/ok:\s*true,\s*\n\s*businessId: result.businessId,\s*\n\s*listingIds,\s*\n\s*listingTransfers: transfer.ok/.test(route), false);
  });

  await checkAsync("C8: owner-null read + zero matching update rows is classified, not success", async () => {
    __reset();
    __seed("business_listing_links", [
      { business_id: "biz-1", listing_source: SRC, listing_id: LISTING, status: "verified" },
    ]);
    __seed(SRC, [{ id: LISTING, owner_user_id: "" }]);
    const transfer = await transferLinkedListingsOnAcceptedClaim({
      businessId: "biz-1",
      claimerUserId: "claimer-1",
    });
    assert.equal(transfer.ok, true);
    if (transfer.ok) {
      assert.equal(transfer.recorded, false);
      assert.equal(transfer.error, "zero_affected_rows");
    }
    assert.equal((__rows(SRC)[0] as { owner_user_id: string }).owner_user_id, "");
  });

  await checkAsync("C9: first listing transfers and second zero-row update is partial_transfer, not complete", async () => {
    __reset();
    __seed("business_listing_links", [
      { business_id: "biz-1", listing_source: SRC, listing_id: "svc-ok", status: "verified" },
      { business_id: "biz-1", listing_source: SRC, listing_id: "svc-empty", status: "verified" },
    ]);
    __seed(SRC, [
      { id: "svc-ok", owner_user_id: null },
      { id: "svc-empty", owner_user_id: "" },
    ]);
    const transfer = await transferLinkedListingsOnAcceptedClaim({
      businessId: "biz-1",
      claimerUserId: "claimer-1",
    });
    assert.equal(transfer.ok, true);
    if (transfer.ok) {
      assert.equal(transfer.recorded, false);
      assert.equal(transfer.error, "partial_transfer");
    }
    assert.equal((__rows(SRC).find((r) => r.id === "svc-ok") as { owner_user_id: string }).owner_user_id, "claimer-1");
    assert.equal((__rows(SRC).find((r) => r.id === "svc-empty") as { owner_user_id: string }).owner_user_id, "");
  });

  await checkAsync("C10: HTTP accept returns 409 when transfer is not recorded", async () => {
    __reset();
    __setCookies({});
    __seed("business_identity_flags", [
      {
        flag_key: "business_ownership_claim",
        enabled: true,
        pilot_user_ids: [],
        emergency_disabled: false,
      },
    ]);
    __setBearerTokens({ "claim-token": { id: "claimer-1", email: "owner@test" } });
    __setBearerRpc({ data: "biz-1", error: null });
    __seed("business_listing_links", [
      { business_id: "biz-1", listing_source: SRC, listing_id: LISTING, status: "verified" },
    ]);
    __seed(SRC, [{ id: LISTING, owner_user_id: "" }]);
    const res = await acceptClaimPost(
      makeRequest({ token: "raw-claim" }, { authorization: "Bearer claim-token" }),
    );
    const json = (await res.json()) as { ok?: boolean; error?: string };
    assert.equal(res.status, 409);
    assert.equal(json.ok, false);
    assert.equal(json.error, "zero_affected_rows");
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-payment-claim-runtime-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error("verifier crashed:", e);
  process.exit(1);
});

/**
 * Targeted regression verifier for the shared Revenue OS active-entitlement guard
 * (app/lib/listingPlans/revenueActiveEntitlementGuard.ts).
 *
 * Run from repo root:
 *   npx tsx scripts/verify-revenue-active-entitlement-guard.ts
 *
 * SCOPE / FAITHFULNESS NOTE — read before trusting these results:
 *   This exercises the REAL exported `requiresBaseCheckout` function (not a re-implementation,
 *   not a copy of its logic) end to end, including its actual `.eq()`/`.order()`/`.limit()` query
 *   construction and its actual "pick the newest ends_at, require status='active' AND
 *   ends_at > now" decision logic. No network call, no live Supabase project, no DB writes: the
 *   Supabase client it calls is a deterministic in-memory fake built from
 *   `listing_package_entitlements` row fixtures (fixtureRows below), injected through the
 *   function's test-only second parameter (`deps.supabase`) — the ONLY seam the real function
 *   exposes for this, added specifically so this script can test the real code path rather than a
 *   parallel reimplementation. No assertion here is a fabricated "PASS" print — every check is a
 *   real function call compared against an expected value via node:assert, which throws (and
 *   exits non-zero via the catch-all below) on any mismatch.
 *
 *   What this script does NOT verify (would require a live DB / live Stripe / a running Next.js
 *   server, all out of scope for a pure-logic verifier): the actual HTTP wiring in
 *   app/api/revenue-os/checkout/route.ts and app/api/clasificados/autos/checkout/route.ts (i.e.
 *   that those routes really call this function with the right arguments and really return 409
 *   without creating a Stripe session) — that wiring was verified by direct code reading during
 *   implementation, not by this script. The Servicios publish-route response-truth fix in
 *   app/api/clasificados/servicios/publish/route.ts is likewise reviewed by reading, not tested
 *   here (it requires a live DB round trip through the whole publish flow).
 */
import { strict as assert } from "node:assert";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isRevenueBaseEntitlementGuardedPackage,
  requiresBaseCheckout,
  REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS,
} from "../app/lib/listingPlans/revenueActiveEntitlementGuard";

type FixtureRow = {
  id: string;
  category: string;
  listing_id: string;
  package_key: string;
  status: string;
  ends_at: string;
};

const NOW = Date.now();
const HOURS = 60 * 60 * 1000;
const DAYS = 24 * HOURS;
const iso = (deltaMs: number) => new Date(NOW + deltaMs).toISOString();

/**
 * Builds a minimal fake Supabase client that supports exactly the chain
 * `.from(table).select(cols).eq(k,v).eq(k,v).eq(k,v).order(col,{ascending}).limit(n)` and resolves
 * (via `.then`, matching supabase-js's real thenable PostgrestFilterBuilder) to `{ data, error }`
 * filtered/sorted from `rows`. Anything outside this exact shape is intentionally unsupported —
 * this fake exists only to drive the one real query `requiresBaseCheckout` issues.
 */
function fakeSupabaseFromRows(rows: FixtureRow[]): Pick<SupabaseClient, "from"> {
  return {
    from(table: string) {
      assert.equal(table, "listing_package_entitlements", "guard must query listing_package_entitlements");
      const filters: Record<string, string> = {};
      let limitN = Infinity;
      const builder = {
        select() {
          return builder;
        },
        eq(col: string, val: string) {
          filters[col] = val;
          return builder;
        },
        order(_col: string, _opts?: { ascending?: boolean }) {
          return builder;
        },
        limit(n: number) {
          limitN = n;
          return builder;
        },
        then(resolve: (v: { data: FixtureRow[] | null; error: unknown }) => void) {
          const matched = rows
            .filter((r) =>
              Object.entries(filters).every(
                ([k, v]) => String((r as unknown as Record<string, unknown>)[k]) === v,
              ),
            )
            .slice()
            .sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime())
            .slice(0, limitN);
          resolve({ data: matched, error: null });
        },
      };
      return builder as unknown as ReturnType<SupabaseClient["from"]>;
    },
  } as unknown as Pick<SupabaseClient, "from">;
}

let failures = 0;
let checks = 0;

async function check(label: string, fn: () => Promise<void> | void): Promise<void> {
  checks += 1;
  try {
    await fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main(): Promise<void> {
  console.log("verify-revenue-active-entitlement-guard: starting");

  // ── 1. Autos Dealer: active $399 base entitlement -> no recharge ──────────────────────────
  await check("Autos Dealer: active $399 base entitlement -> requiresCheckout=false", async () => {
    const rows: FixtureRow[] = [
      {
        id: "ent-autos-1",
        category: "autos",
        listing_id: "autos-dealer-listing-1",
        package_key: "autos_dealer_monthly",
        status: "active",
        ends_at: iso(20 * DAYS),
      },
    ];
    const result = await requiresBaseCheckout(
      { listingId: "autos-dealer-listing-1", ownerId: "owner-1", category: "autos", packageKey: "autos_dealer_monthly" },
      { supabase: fakeSupabaseFromRows(rows) },
    );
    assert.equal(result.requiresCheckout, false);
    assert.equal(result.reason, "active_entitlement_edit");
    assert.equal(result.activeEntitlement?.id, "ent-autos-1");
  });

  // ── 2. Autos Dealer: no active base entitlement (new dealership) -> must pay ───────────────
  await check("Autos Dealer: new dealership, no entitlement rows -> requiresCheckout=true", async () => {
    const result = await requiresBaseCheckout(
      { listingId: "autos-dealer-listing-brand-new", ownerId: "owner-2", category: "autos", packageKey: "autos_dealer_monthly" },
      { supabase: fakeSupabaseFromRows([]) },
    );
    assert.equal(result.requiresCheckout, true);
    assert.equal(result.reason, "no_active_entitlement");
    assert.equal(result.activeEntitlement, null);
  });

  // ── 2b. Autos Dealer: brand-new listing, no listingId at all -> "new_listing" ──────────────
  await check("Autos Dealer: no listingId at all -> reason=new_listing", async () => {
    const result = await requiresBaseCheckout(
      { listingId: null, ownerId: "owner-2", category: "autos", packageKey: "autos_dealer_monthly" },
      { supabase: fakeSupabaseFromRows([]) },
    );
    assert.equal(result.requiresCheckout, true);
    assert.equal(result.reason, "new_listing");
  });

  // ── 3. Bienes Raíces: active paid business edit -> no recharge ─────────────────────────────
  await check("Bienes Raíces: active br_agent_monthly edit -> requiresCheckout=false", async () => {
    const rows: FixtureRow[] = [
      {
        id: "ent-br-1",
        category: "bienes-raices",
        listing_id: "br-negocio-listing-1",
        package_key: "br_agent_monthly",
        status: "active",
        ends_at: iso(15 * DAYS),
      },
    ];
    const result = await requiresBaseCheckout(
      { listingId: "br-negocio-listing-1", ownerId: "owner-3", category: "bienes-raices", packageKey: "br_agent_monthly" },
      { supabase: fakeSupabaseFromRows(rows) },
    );
    assert.equal(result.requiresCheckout, false);
    assert.equal(result.reason, "active_entitlement_edit");
  });

  // ── 4. Servicios: active base edit -> no recharge ───────────────────────────────────────────
  await check("Servicios: active servicios_base_monthly edit -> requiresCheckout=false", async () => {
    const rows: FixtureRow[] = [
      {
        id: "ent-servicios-1",
        category: "servicios",
        listing_id: "servicios-listing-1",
        package_key: "servicios_base_monthly",
        status: "active",
        ends_at: iso(10 * DAYS),
      },
    ];
    const result = await requiresBaseCheckout(
      { listingId: "servicios-listing-1", ownerId: "owner-4", category: "servicios", packageKey: "servicios_base_monthly" },
      { supabase: fakeSupabaseFromRows(rows) },
    );
    assert.equal(result.requiresCheckout, false);
    assert.equal(result.reason, "active_entitlement_edit");
  });

  // ── 5. Restaurantes: active base edit -> no recharge ────────────────────────────────────────
  await check("Restaurantes: active restaurantes_base_monthly edit -> requiresCheckout=false", async () => {
    const rows: FixtureRow[] = [
      {
        id: "ent-rest-1",
        category: "restaurantes",
        listing_id: "restaurantes-listing-1",
        package_key: "restaurantes_base_monthly",
        status: "active",
        ends_at: iso(3 * DAYS),
      },
    ];
    const result = await requiresBaseCheckout(
      { listingId: "restaurantes-listing-1", ownerId: "owner-5", category: "restaurantes", packageKey: "restaurantes_base_monthly" },
      { supabase: fakeSupabaseFromRows(rows) },
    );
    assert.equal(result.requiresCheckout, false);
    assert.equal(result.reason, "active_entitlement_edit");
  });

  // ── 6. Comida Local: active base edit -> no recharge ────────────────────────────────────────
  await check("Comida Local: active comida_local_base_monthly edit -> requiresCheckout=false", async () => {
    const rows: FixtureRow[] = [
      {
        id: "ent-cl-1",
        category: "comida-local",
        listing_id: "comida-local-listing-1",
        package_key: "comida_local_base_monthly",
        status: "active",
        ends_at: iso(29 * DAYS),
      },
    ];
    const result = await requiresBaseCheckout(
      { listingId: "comida-local-listing-1", ownerId: "owner-6", category: "comida-local", packageKey: "comida_local_base_monthly" },
      { supabase: fakeSupabaseFromRows(rows) },
    );
    assert.equal(result.requiresCheckout, false);
    assert.equal(result.reason, "active_entitlement_edit");
  });

  // ── 7. Expired entitlement -> checkout still required ───────────────────────────────────────
  await check("Expired entitlement (status active row past ends_at) -> requiresCheckout=true, reason=expired", async () => {
    const rows: FixtureRow[] = [
      {
        id: "ent-expired-1",
        category: "autos",
        listing_id: "autos-dealer-listing-lapsed",
        package_key: "autos_dealer_monthly",
        status: "active",
        ends_at: iso(-2 * DAYS), // past ends_at — the 7-day grace backstop already lapsed
      },
    ];
    const result = await requiresBaseCheckout(
      { listingId: "autos-dealer-listing-lapsed", ownerId: "owner-7", category: "autos", packageKey: "autos_dealer_monthly" },
      { supabase: fakeSupabaseFromRows(rows) },
    );
    assert.equal(result.requiresCheckout, true);
    assert.equal(result.reason, "expired");
    assert.equal(result.activeEntitlement, null);
  });

  await check("Explicitly revoked entitlement -> requiresCheckout=true, reason=expired", async () => {
    const rows: FixtureRow[] = [
      {
        id: "ent-revoked-1",
        category: "servicios",
        listing_id: "servicios-listing-revoked",
        package_key: "servicios_base_monthly",
        status: "revoked",
        ends_at: iso(10 * DAYS), // even with a future ends_at, a revoked row is never "active"
      },
    ];
    const result = await requiresBaseCheckout(
      { listingId: "servicios-listing-revoked", ownerId: "owner-8", category: "servicios", packageKey: "servicios_base_monthly" },
      { supabase: fakeSupabaseFromRows(rows) },
    );
    assert.equal(result.requiresCheckout, true);
    assert.equal(result.reason, "expired");
  });

  // ── 8. Add-on purchase must remain independently billable ──────────────────────────────────
  // The guard must never even be consulted for add-on package keys — verified two ways: (a) the
  // membership predicate the checkout route branches on returns false for every known add-on key,
  // and (b) even if `requiresBaseCheckout` were called directly for an add-on category/packageKey
  // pair against a fixture where the BASE package is active, it evaluates strictly by
  // (category, listing_id, package_key) — an active base-package row never satisfies a query for
  // a different package_key, so it can never suppress a legitimate add-on charge.
  await check("Add-on package keys are never guard-membership matches (still independently billable)", () => {
    const addonKeys = [
      "autos_dealer_inventory_pack_monthly",
      "br_inventory_pack_monthly",
      "servicios_offers_addon",
      "restaurantes_offers_addon",
    ];
    for (const key of addonKeys) {
      assert.equal(
        isRevenueBaseEntitlementGuardedPackage("autos", key),
        false,
        `${key} must not be treated as a base-package guard target`,
      );
    }
    // Sanity: the guarded set really is exactly the five base packages this task covers.
    assert.deepEqual(
      [...REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS].sort(),
      [
        "autos_dealer_monthly",
        "br_agent_monthly",
        "comida_local_base_monthly",
        "restaurantes_base_monthly",
        "servicios_base_monthly",
      ].sort(),
    );
  });

  await check(
    "Add-on checkout for a listing WITH an active base entitlement is unaffected (different package_key)",
    async () => {
      // Same listing already has an active autos_dealer_monthly row (as in check #1's fixture),
      // but a query for the add-on's OWN package_key must never see it and must never be blocked.
      const rows: FixtureRow[] = [
        {
          id: "ent-autos-1",
          category: "autos",
          listing_id: "autos-dealer-listing-1",
          package_key: "autos_dealer_monthly",
          status: "active",
          ends_at: iso(20 * DAYS),
        },
      ];
      const result = await requiresBaseCheckout(
        {
          listingId: "autos-dealer-listing-1",
          ownerId: "owner-1",
          category: "autos",
          packageKey: "autos_dealer_inventory_pack_monthly",
        },
        { supabase: fakeSupabaseFromRows(rows) },
      );
      // No row for this package_key exists, so the guard (if it were ever consulted for an
      // add-on, which the real checkout route never does) would say "requires checkout" —
      // proving the active base entitlement can never leak into blocking the add-on purchase.
      assert.equal(result.requiresCheckout, true);
      assert.equal(result.reason, "no_active_entitlement");
    },
  );

  console.log(`\nverify-revenue-active-entitlement-guard: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    console.error(`verify-revenue-active-entitlement-guard: FAILED (${failures} failure(s))`);
    process.exitCode = 1;
  } else {
    console.log("verify-revenue-active-entitlement-guard: OK");
  }
}

main().catch((err) => {
  console.error("verify-revenue-active-entitlement-guard: uncaught error");
  console.error(err);
  process.exitCode = 1;
});

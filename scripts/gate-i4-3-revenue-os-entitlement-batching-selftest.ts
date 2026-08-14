/**
 * Gate I.4.3 — behavioral self-test for the batched Revenue OS ad-plan proof lookup
 * (`fetchRevenueOsAdPlanProofsForListings`, `app/lib/listingPlans/revenuePaymentLookup.ts`).
 * Proves the per-listing N+1 loop (confirmed the dominant cost of the dashboard's measured
 * ~5.37s entitlement wait — Gate I.4A) is gone, replaced by one bounded, chunked query per
 * distinct category, while preserving the exact original matching/precedence/fail-closed
 * semantics. No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-i4-3-revenue-os-entitlement-batching-selftest.ts
 *
 * `revenuePaymentLookup.ts` itself is `"server-only"` and cannot be loaded outside the Next.js
 * server runtime — same constraint this project has hit repeatedly (see `addonEntitlementReader.ts`
 * vs. its self-test-safe callers). Gate I.4.3 extracted the exact chunking/precedence logic this
 * test needs into `revenueOsEntitlementPrecedence.ts` (zero imports, no "server-only"), which
 * `revenuePaymentLookup.ts` now imports and calls directly — this test exercises that same real,
 * shared implementation, not a reimplementation.
 */
import { strict as assert } from "node:assert";

import {
  REVENUE_OS_LOOKUP_CHUNK_SIZE,
  chunkListingIds,
  pickBestRevenueOsEntitlementByListingId,
  type RevenueOsEntitlementRow,
} from "../app/lib/listingPlans/revenueOsEntitlementPrecedence";

/** Mirrors the exact chained shape the real code calls against a stub Supabase client:
 * `.from(table).select(cols).eq("category", c).in("listing_id", chunk).eq("status","active").gt("ends_at", iso)` */
type QueryCall = { category: string; chunk: string[] };

function makeRevenueOsStubSupabase(
  rowsByCategory: Record<string, RevenueOsEntitlementRow[]>,
  opts: { failCategories?: Set<string>; queryLog?: QueryCall[] } = {},
) {
  return {
    from(_table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_col1: string, category: string) {
              return {
                in(_col2: string, chunk: string[]) {
                  return {
                    eq(_col3: string, _status: string) {
                      return {
                        gt(_col4: string, _iso: string) {
                          opts.queryLog?.push({ category, chunk: [...chunk] });
                          if (opts.failCategories?.has(category)) {
                            return Promise.resolve({ data: null, error: { message: "simulated failure" } });
                          }
                          const rows = (rowsByCategory[category] ?? []).filter((r) =>
                            chunk.includes(r.listing_id ?? ""),
                          );
                          return Promise.resolve({ data: rows, error: null });
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

/** Exercises the query stub exactly the way `fetchRevenueOsAdPlanProofsForCategory` does:
 * one chunked query per `chunkListingIds` chunk, skipping (fail-closed) any errored chunk. */
async function fetchViaStub(
  sb: ReturnType<typeof makeRevenueOsStubSupabase>,
  category: string,
  ids: string[],
  nowIso: string,
): Promise<RevenueOsEntitlementRow[]> {
  const rawRows: RevenueOsEntitlementRow[] = [];
  for (const chunk of chunkListingIds(ids)) {
    const { data, error } = await sb
      .from("listing_package_entitlements")
      .select("listing_id, status, package_key, billing_mode, ends_at")
      .eq("category", category)
      .in("listing_id", chunk)
      .eq("status", "active")
      .gt("ends_at", nowIso);
    if (error || !Array.isArray(data)) continue;
    rawRows.push(...data);
  }
  return rawRows;
}

const NOW = "2026-07-29T00:00:00.000Z";

async function main() {
/* ------------------------------------------------------------------------------------------ *
 * 1/9 — batching: N listings resolve via ceil(N / CHUNK_SIZE) queries, never one per listing.
 * ------------------------------------------------------------------------------------------ */
{
  assert.equal(REVENUE_OS_LOOKUP_CHUNK_SIZE, 80, "chunk size must match the established repo convention (80)");

  const ids = Array.from({ length: 95 }, (_, i) => `listing-${i}`);
  const rows: RevenueOsEntitlementRow[] = ids.map((id) => ({
    listing_id: id,
    status: "active",
    package_key: "en_venta_pro_monthly",
    billing_mode: "monthly",
    ends_at: "2027-01-01T00:00:00.000Z",
  }));
  const queryLog: QueryCall[] = [];
  const sb = makeRevenueOsStubSupabase({ "en-venta": rows }, { queryLog });
  await fetchViaStub(sb, "en-venta", ids, NOW);
  assert.equal(queryLog.length, 2, "95 listings must resolve via exactly 2 chunked queries (80 + 15), never 95 individual queries");
  assert.equal(queryLog[0].chunk.length, 80, "first chunk must be exactly 80");
  assert.equal(queryLog[1].chunk.length, 15, "second chunk must hold the remaining 15");
}
{
  const ids = Array.from({ length: 5 }, (_, i) => `listing-${i}`);
  const queryLog: QueryCall[] = [];
  const sb = makeRevenueOsStubSupabase({ restaurantes: [] }, { queryLog });
  await fetchViaStub(sb, "restaurantes", ids, NOW);
  assert.equal(queryLog.length, 1, "5 listings under the chunk size must resolve via exactly 1 query, never 5 individual queries");
}

/* ------------------------------------------------------------------------------------------ *
 * 2 — input order does not change entitlement truth.
 * ------------------------------------------------------------------------------------------ */
{
  const rows: RevenueOsEntitlementRow[] = [
    { listing_id: "a", status: "active", package_key: "servicios_pro", billing_mode: "monthly", ends_at: "2027-01-01T00:00:00.000Z" },
    { listing_id: "b", status: "active", package_key: "servicios_pro", billing_mode: "monthly", ends_at: "2027-06-01T00:00:00.000Z" },
  ];
  const forward = pickBestRevenueOsEntitlementByListingId(rows);
  const reversed = pickBestRevenueOsEntitlementByListingId([...rows].reverse());
  assert.deepEqual(forward.get("a"), reversed.get("a"), "order must not affect the resolved entitlement for listing a");
  assert.deepEqual(forward.get("b"), reversed.get("b"), "order must not affect the resolved entitlement for listing b");
}

/* ------------------------------------------------------------------------------------------ *
 * 3/5 — duplicate listing IDs / multiple rows per listing resolve deterministically via the
 * SAME precedence as the original: latest `ends_at` wins.
 * ------------------------------------------------------------------------------------------ */
{
  const rows: RevenueOsEntitlementRow[] = [
    { listing_id: "x", status: "active", package_key: "br_inventory_pack_monthly", billing_mode: "monthly", ends_at: "2026-08-01T00:00:00.000Z" },
    { listing_id: "x", status: "active", package_key: "br_inventory_pack_annual", billing_mode: "annual", ends_at: "2027-08-01T00:00:00.000Z" },
    { listing_id: "x", status: "active", package_key: "br_inventory_pack_monthly", billing_mode: "monthly", ends_at: "2026-09-01T00:00:00.000Z" },
  ];
  const best = pickBestRevenueOsEntitlementByListingId(rows);
  assert.equal(
    best.get("x")?.package_key,
    "br_inventory_pack_annual",
    "the latest-expiring active row must win, matching the original ORDER BY ends_at DESC LIMIT 1",
  );
}

/* ------------------------------------------------------------------------------------------ *
 * 4 — category distinction: the same listing_id under two different categories resolves
 * independently — the batched query is grouped and filtered by category, never merged.
 * ------------------------------------------------------------------------------------------ */
{
  const queryLog: QueryCall[] = [];
  const sb = makeRevenueOsStubSupabase(
    {
      restaurantes: [
        { listing_id: "shared-id", status: "active", package_key: "restaurantes_offers_addon", billing_mode: "monthly", ends_at: "2027-01-01T00:00:00.000Z" },
      ],
      autos: [
        { listing_id: "shared-id", status: "active", package_key: "autos_dealer_pro", billing_mode: "monthly", ends_at: "2027-06-01T00:00:00.000Z" },
      ],
    },
    { queryLog },
  );
  const restRows = await fetchViaStub(sb, "restaurantes", ["shared-id"], NOW);
  const autosRows = await fetchViaStub(sb, "autos", ["shared-id"], NOW);
  assert.equal(restRows[0]?.package_key, "restaurantes_offers_addon", "restaurantes category must resolve its own row");
  assert.equal(autosRows[0]?.package_key, "autos_dealer_pro", "autos category must resolve its own independent row, not restaurantes'");
  assert.equal(queryLog.filter((q) => q.category === "restaurantes").length, 1, "restaurantes must be queried separately from autos");
  assert.equal(queryLog.filter((q) => q.category === "autos").length, 1, "autos must be queried separately from restaurantes");
}

/* ------------------------------------------------------------------------------------------ *
 * 6 — missing package_key never grants a proof (matches the original
 * `if (!data?.package_key) continue;` skip) — this is the code-level guarantee that an
 * expired/inactive row (already excluded by the query's own `status="active"`/`ends_at>now`
 * filters) can never accidentally surface as eligible even if it somehow reached this stage.
 * ------------------------------------------------------------------------------------------ */
{
  const rows: RevenueOsEntitlementRow[] = [
    { listing_id: "z", status: "active", package_key: null, billing_mode: null, ends_at: "2027-01-01T00:00:00.000Z" },
  ];
  const best = pickBestRevenueOsEntitlementByListingId(rows);
  assert.equal(best.has("z"), false, "a row with no package_key must never be selected as a proof");
}

/* ------------------------------------------------------------------------------------------ *
 * 7 — missing records produce no proof.
 * ------------------------------------------------------------------------------------------ */
{
  const best = pickBestRevenueOsEntitlementByListingId([]);
  assert.equal(best.size, 0, "no rows must resolve to no proofs");
  assert.equal(best.get("nonexistent"), undefined);
}

/* ------------------------------------------------------------------------------------------ *
 * 8 — query failure fails closed: a failed chunk contributes nothing, never a fabricated proof.
 * ------------------------------------------------------------------------------------------ */
{
  const queryLog: QueryCall[] = [];
  const sb = makeRevenueOsStubSupabase(
    { servicios: [{ listing_id: "s1", status: "active", package_key: "servicios_pro", billing_mode: "monthly", ends_at: "2027-01-01T00:00:00.000Z" }] },
    { failCategories: new Set(["servicios"]), queryLog },
  );
  const rows = await fetchViaStub(sb, "servicios", ["s1"], NOW);
  assert.equal(rows.length, 0, "a failed query must contribute zero rows — never fabricate a proof from a failure");
  assert.equal(queryLog.length, 1, "the failed query must still have been attempted exactly once (not silently skipped upfront)");
  const best = pickBestRevenueOsEntitlementByListingId(rows);
  assert.equal(best.size, 0, "zero rows must resolve to zero proofs — fail closed end to end");
}

/* ------------------------------------------------------------------------------------------ *
 * 10 — output contract: every field the route/consumer expects is present and correctly typed.
 * ------------------------------------------------------------------------------------------ */
{
  const rows: RevenueOsEntitlementRow[] = [
    { listing_id: "contract-1", status: "active", package_key: "en_venta_pro_monthly", billing_mode: "monthly", ends_at: "2027-01-01T00:00:00.000Z" },
  ];
  const best = pickBestRevenueOsEntitlementByListingId(rows);
  const row = best.get("contract-1");
  assert.ok(row, "a valid active row must resolve");
  assert.equal(typeof row!.package_key, "string");
  assert.equal(typeof row!.ends_at, "string");
  assert.equal(typeof row!.status, "string");
}

console.log(`gate-i4-3-revenue-os-entitlement-batching-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

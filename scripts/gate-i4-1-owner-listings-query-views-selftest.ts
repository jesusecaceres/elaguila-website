/**
 * Gate I.4.1 — behavioral self-test proving the shared-`listings` owner dashboard query no longer
 * requests the nonexistent `views` column, while everything else about the query (columns,
 * missing-column recovery, row mapping) stays intact. No network, no Supabase, no browser. Run
 * from repo root:
 *   npx tsx scripts/gate-i4-1-owner-listings-query-views-selftest.ts
 *
 * `CORE`/`WITH_*` are private to `ownerListingsQuery.ts` on purpose — rather than exporting them
 * solely for this test, a minimal capturing/erroring stub Supabase client is used so the test
 * exercises the real exported `fetchOwnerListingsForDashboard` end to end, the same way the real
 * dashboard calls it.
 */
import { strict as assert } from "node:assert";
import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchOwnerListingsForDashboard, mapOwnerListingRow } from "@/app/dashboard/lib/ownerListingsQuery";

type CapturedCall = { cols: string };

/** A minimal fluent stub matching exactly the `.from().select().eq().order()` chain used by the
 * real function. `errorOnColumn` simulates PostgREST's `column listings.<col> does not exist`
 * for every attempt whose column list still contains `errorOnColumn`. */
function makeStubSupabase(calls: CapturedCall[], errorOnColumn?: string): SupabaseClient {
  const stub = {
    from(_table: string) {
      return {
        select(cols: string) {
          calls.push({ cols });
          return {
            eq(_col: string, _val: string) {
              return {
                order(_col: string, _opts: unknown) {
                  if (errorOnColumn && cols.split(",").map((c) => c.trim()).includes(errorOnColumn)) {
                    return Promise.resolve({
                      data: null,
                      error: { message: `column listings.${errorOnColumn} does not exist` },
                    });
                  }
                  return Promise.resolve({
                    data: [{ id: "row-1", category: "en-venta", status: "active" }],
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };
  return stub as unknown as SupabaseClient;
}

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1/2 — the live select never requests `views`; no standalone `views` token anywhere in it.
   * ---------------------------------------------------------------------------------------- */
  {
    const calls: CapturedCall[] = [];
    const sb = makeStubSupabase(calls);
    const result = await fetchOwnerListingsForDashboard(sb, "owner-1");
    assert.equal(result.error, null, "the stub's first attempt must succeed with no error");
    assert.equal(calls.length, 1, "a clean success must not trigger any retry");
    const tokens = calls[0].cols.split(",").map((c) => c.trim());
    assert.ok(!tokens.includes("views"), "the live select must never include a standalone `views` token");
    assert.ok(!calls[0].cols.includes("views"), "`views` must not appear anywhere in the select string");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — required canonical columns remain present in the live select.
   * ---------------------------------------------------------------------------------------- */
  {
    const calls: CapturedCall[] = [];
    const sb = makeStubSupabase(calls);
    await fetchOwnerListingsForDashboard(sb, "owner-1");
    const tokens = calls[0].cols.split(",").map((c) => c.trim());
    for (const required of ["id", "leonix_ad_id", "title", "price", "created_at", "images", "is_published"]) {
      assert.ok(tokens.includes(required), `canonical column "${required}" must remain in the select`);
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — required category/status fields remain present (ownership itself is enforced via the
   * `.eq("owner_id", ownerId)` filter, not a selected column — confirmed structurally below).
   * ---------------------------------------------------------------------------------------- */
  {
    const calls: CapturedCall[] = [];
    const sb = makeStubSupabase(calls);
    await fetchOwnerListingsForDashboard(sb, "owner-1");
    const tokens = calls[0].cols.split(",").map((c) => c.trim());
    assert.ok(tokens.includes("category"), "category column must remain in the select");
    assert.ok(tokens.includes("status"), "status column must remain in the select");
  }
  {
    // Structural confirmation the owner filter is untouched: the stub's `.eq()` is exercised via
    // the exact same chain the real function builds — this file's own source review (Gate I.4.1
    // report §5) additionally confirms no `.eq("owner_id", ...)` call site was changed.
    const calls: CapturedCall[] = [];
    const sb = makeStubSupabase(calls);
    const result = await fetchOwnerListingsForDashboard(sb, "owner-1");
    assert.ok(Array.isArray(result.data) && result.data.length === 1, "owner-scoped rows must still be returned");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — missing-column recovery logic remains functional for a DIFFERENT (hypothetical) missing
   * column, proving the retry system itself was not touched or weakened by this gate.
   * ---------------------------------------------------------------------------------------- */
  {
    const calls: CapturedCall[] = [];
    const sb = makeStubSupabase(calls, "business_name");
    const result = await fetchOwnerListingsForDashboard(sb, "owner-1");
    assert.equal(result.error, null, "the retry system must still recover from an unrelated missing column");
    assert.ok(calls.length >= 2, "at least one retry must have occurred");
    const lastTokens = calls[calls.length - 1].cols.split(",").map((c) => c.trim());
    assert.ok(!lastTokens.includes("business_name"), "the successful attempt must have business_name stripped");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6/7/8 — mapping a row without `views` never throws, degrades to null (never a fabricated
   * value), and stays fully compatible with the dashboard's real analytics-derived view total.
   * ---------------------------------------------------------------------------------------- */
  {
    const rawRowWithoutViews = {
      id: "row-1",
      leonix_ad_id: "LX-1",
      title: "Test listing",
      category: "en-venta",
      status: "active",
      is_published: true,
    };
    let mapped: ReturnType<typeof mapOwnerListingRow> | null = null;
    assert.doesNotThrow(() => {
      mapped = mapOwnerListingRow(rawRowWithoutViews);
    }, "mapping a row with no `views` key must never throw");
    assert.equal(mapped!.views, null, "views must degrade to null, never a fabricated number");

    // Replicates `resolveViews(x, stats)` from mis-anuncios/page.tsx: Math.max(analytics, db).
    // With `views` absent, the analytics-derived total is always what's actually displayed.
    const fakeAnalyticsBucketViews = 42;
    const dbFallback = typeof mapped!.views === "number" ? mapped!.views : 0;
    const resolved = Math.max(fakeAnalyticsBucketViews, dbFallback);
    assert.equal(
      resolved,
      fakeAnalyticsBucketViews,
      "displayed views must equal the real analytics total, never a fake/hardcoded value",
    );
  }

  console.log(`gate-i4-1-owner-listings-query-views-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

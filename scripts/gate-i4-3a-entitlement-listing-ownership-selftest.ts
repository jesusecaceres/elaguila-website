/**
 * Gate I.4.3A — behavioral self-test for the entitlement endpoint's server-side owner
 * authorization (`app/lib/listingPlans/listingEntitlementOwnership.ts`). Proves an authenticated
 * user can never receive entitlement data for a listing they don't own, across every currently
 * real category source, while the ownership check itself stays batched (never one query per
 * listing). No network, no real Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-i4-3a-entitlement-listing-ownership-selftest.ts
 */
import { strict as assert } from "node:assert";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  resolveListingSourceOwnershipContract,
  resolveOwnedListingIdentityKeys,
} from "../app/lib/listingPlans/listingEntitlementOwnership";

type StubRow = Record<string, string | null>;
type QueryCall = { source: string; column: string; ownerId: string; chunk: string[] };

/** Mirrors the exact chain the real code calls:
 * `.from(source).select(col).eq(ownerColumn, ownerId).in(col, chunk)` */
function makeOwnershipStubSupabase(
  rowsBySource: Record<string, StubRow[]>,
  opts: { failOn?: (source: string, column: string) => boolean; queryLog?: QueryCall[] } = {},
): SupabaseClient {
  const stub = {
    from(source: string) {
      return {
        select(column: string) {
          return {
            eq(_ownerCol: string, ownerId: string) {
              return {
                in(inCol: string, chunk: string[]) {
                  opts.queryLog?.push({ source, column, ownerId, chunk: [...chunk] });
                  if (opts.failOn?.(source, column)) {
                    return Promise.resolve({ data: null, error: { message: "simulated failure" } });
                  }
                  const rows = (rowsBySource[source] ?? []).filter(
                    (r) => r.__owner === ownerId && chunk.includes(r[inCol] ?? ""),
                  );
                  const projected = rows.map((r) => ({ [inCol]: r[inCol] }));
                  return Promise.resolve({ data: projected, error: null });
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
   * 1/2/3 — fixtures across every real category source: valid owner listing resolves, foreign
   * listing never does, in the same batch (mixed-owner batch never leaks foreign data).
   * ---------------------------------------------------------------------------------------- */
  {
    const sb = makeOwnershipStubSupabase({
      restaurantes_public_listings: [
        { id: "r-owned", __owner: "owner-1" },
        { id: "r-foreign", __owner: "owner-2" },
      ],
      servicios_public_listings: [
        { id: "s-owned", slug: "my-shop", __owner: "owner-1" },
      ],
      autos_classifieds_listings: [
        { id: "a-owned", __owner: "owner-1" },
        { id: "a-foreign", __owner: "owner-2" },
      ],
      listings: [
        { id: "l-owned", __owner: "owner-1" },
        { id: "l-foreign", __owner: "owner-2" },
      ],
    });

    const restOwned = await resolveOwnedListingIdentityKeys(sb, "restaurantes_public_listings", ["r-owned", "r-foreign", "r-nonexistent"], "owner-1");
    assert.deepEqual([...restOwned].sort(), ["r-owned"], "restaurantes: only the caller's own listing resolves as owned");

    const autosOwned = await resolveOwnedListingIdentityKeys(sb, "autos_classifieds_listings", ["a-owned", "a-foreign"], "owner-1");
    assert.deepEqual([...autosOwned].sort(), ["a-owned"], "autos dealers: foreign listing never resolves as owned");

    const listingsOwned = await resolveOwnedListingIdentityKeys(sb, "listings", ["l-owned", "l-foreign"], "owner-1");
    assert.deepEqual([...listingsOwned].sort(), ["l-owned"], "shared listings (BR/Rentas/En Venta): foreign listing never resolves as owned");

    // Servicios: identity supplied as a slug (Gate I.4.2's own fallback for a null raw `id`)
    // must still resolve correctly — the ownership contract includes "slug" for this source only.
    const serviciosOwnedBySlug = await resolveOwnedListingIdentityKeys(sb, "servicios_public_listings", ["my-shop"], "owner-1");
    assert.deepEqual([...serviciosOwnedBySlug], ["my-shop"], "servicios: a slug-identified row the owner actually owns must still resolve");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — unknown/unsupported source fails closed without even attempting a query.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(resolveListingSourceOwnershipContract("empleos_public_listings"), null, "a source never wired to this endpoint must have no ownership contract");
    assert.equal(resolveListingSourceOwnershipContract("some_made_up_table"), null, "a completely unknown source must have no ownership contract");

    const queryLog: QueryCall[] = [];
    const sb = makeOwnershipStubSupabase({}, { queryLog });
    const owned = await resolveOwnedListingIdentityKeys(sb, "empleos_public_listings", ["e1"], "owner-1");
    assert.equal(owned.size, 0, "an unsupported source must resolve zero owned identities");
    assert.equal(queryLog.length, 0, "an unsupported source must never even attempt a query");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — nonexistent listing (real source, but no matching row anywhere) fails closed.
   * ---------------------------------------------------------------------------------------- */
  {
    const sb = makeOwnershipStubSupabase({ restaurantes_public_listings: [{ id: "real-1", __owner: "owner-1" }] });
    const owned = await resolveOwnedListingIdentityKeys(sb, "restaurantes_public_listings", ["does-not-exist"], "owner-1");
    assert.equal(owned.size, 0, "a listing id with no matching row anywhere must never resolve as owned");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6 — malformed identity (empty/whitespace-only) is filtered out before ever querying.
   * ---------------------------------------------------------------------------------------- */
  {
    const queryLog: QueryCall[] = [];
    const sb = makeOwnershipStubSupabase({ restaurantes_public_listings: [{ id: "real-1", __owner: "owner-1" }] }, { queryLog });
    const owned = await resolveOwnedListingIdentityKeys(sb, "restaurantes_public_listings", ["", "   ", "real-1"], "owner-1");
    assert.deepEqual([...owned], ["real-1"], "only the real, well-formed identity must resolve");
    assert.ok(
      queryLog.every((q) => !q.chunk.includes("") && !q.chunk.includes("   ")),
      "empty/whitespace-only identities must never be sent to a query at all",
    );
  }
  {
    // A missing/empty ownerId must never resolve anything, regardless of what listings exist.
    const sb = makeOwnershipStubSupabase({ restaurantes_public_listings: [{ id: "real-1", __owner: "owner-1" }] });
    const owned = await resolveOwnedListingIdentityKeys(sb, "restaurantes_public_listings", ["real-1"], "");
    assert.equal(owned.size, 0, "an empty/missing ownerId must never resolve any listing as owned");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 7/8 — owner id comes only from the caller-supplied (bearer-verified) parameter; nothing
   * resembling a client-provided owner field on the request item itself is ever consulted. The
   * function signature only ever accepts `ownerId` as an explicit argument — a malicious extra
   * field on an item object physically cannot influence the result.
   * ---------------------------------------------------------------------------------------- */
  {
    const sb = makeOwnershipStubSupabase({ restaurantes_public_listings: [{ id: "r-owned", __owner: "owner-1" }] });
    // Simulates a client attempting to smuggle a spoofed owner via the request payload — this
    // function has no parameter that could ever read such a field; verified by re-running with
    // the *real*, bearer-verified owner id and confirming the spoofed value is irrelevant.
    const legitOwned = await resolveOwnedListingIdentityKeys(sb, "restaurantes_public_listings", ["r-owned"], "owner-1");
    const spoofedOwned = await resolveOwnedListingIdentityKeys(sb, "restaurantes_public_listings", ["r-owned"], "owner-2-attempting-spoof");
    assert.deepEqual([...legitOwned], ["r-owned"], "the real bearer-verified owner must resolve their own listing");
    assert.equal(spoofedOwned.size, 0, "a different owner id must never resolve someone else's listing, however it was supplied");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 9 — ownership lookup is batched: N identities resolve via ceil(N / chunkSize) queries, never
   * one query per listing.
   * ---------------------------------------------------------------------------------------- */
  {
    const ids = Array.from({ length: 95 }, (_, i) => `listing-${i}`);
    const rows: StubRow[] = ids.map((id) => ({ id, __owner: "owner-1" }));
    const queryLog: QueryCall[] = [];
    const sb = makeOwnershipStubSupabase({ autos_classifieds_listings: rows }, { queryLog });
    const owned = await resolveOwnedListingIdentityKeys(sb, "autos_classifieds_listings", ids, "owner-1");
    assert.equal(owned.size, 95, "all 95 owned listings must resolve");
    assert.equal(queryLog.length, 2, "95 identities must resolve via exactly 2 chunked queries (80 + 15), never 95 individual queries");
  }

  /* ---------------------------------------------------------------------------------------- *
   * Failure isolation — a failed chunk fails closed (contributes nothing), never fabricates
   * ownership.
   * ---------------------------------------------------------------------------------------- */
  {
    const sb = makeOwnershipStubSupabase(
      { restaurantes_public_listings: [{ id: "r1", __owner: "owner-1" }] },
      { failOn: () => true },
    );
    const owned = await resolveOwnedListingIdentityKeys(sb, "restaurantes_public_listings", ["r1"], "owner-1");
    assert.equal(owned.size, 0, "a failed ownership query must never fabricate an owned result");
  }

  /* ---------------------------------------------------------------------------------------- *
   * Mixed batch, end to end — one owned, one foreign, one nonexistent, one malformed, one
   * unsupported source, combined exactly as the route would group and filter them.
   * ---------------------------------------------------------------------------------------- */
  {
    type RequestItemLike = { category: string; listingSource: string; listingId?: string | null };
    const items: RequestItemLike[] = [
      { category: "restaurantes", listingSource: "restaurantes_public_listings", listingId: "r-owned" },
      { category: "restaurantes", listingSource: "restaurantes_public_listings", listingId: "r-foreign" },
      { category: "restaurantes", listingSource: "restaurantes_public_listings", listingId: "r-nonexistent" },
      { category: "restaurantes", listingSource: "restaurantes_public_listings", listingId: "   " },
      { category: "empleos", listingSource: "empleos_public_listings", listingId: "e-unsupported" },
    ];
    const sb = makeOwnershipStubSupabase({
      restaurantes_public_listings: [
        { id: "r-owned", __owner: "owner-1" },
        { id: "r-foreign", __owner: "owner-2" },
      ],
    });

    const bySource = new Map<string, RequestItemLike[]>();
    for (const item of items) {
      const list = bySource.get(item.listingSource) ?? [];
      list.push(item);
      bySource.set(item.listingSource, list);
    }
    const authorized: RequestItemLike[] = [];
    for (const [source, group] of bySource) {
      const keys = group.map((g) => String(g.listingId ?? "").trim()).filter(Boolean);
      const owned = await resolveOwnedListingIdentityKeys(sb, source, keys, "owner-1");
      for (const g of group) {
        const key = String(g.listingId ?? "").trim();
        if (key && owned.has(key)) authorized.push(g);
      }
    }

    assert.deepEqual(
      authorized.map((a) => a.listingId),
      ["r-owned"],
      "of the 5-item mixed batch, only the genuinely owned listing must survive authorization",
    );
  }

  console.log(`gate-i4-3a-entitlement-listing-ownership-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

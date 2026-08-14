/**
 * Gate G.2.3.4 — behavioral self-test for the pure BR public child/parent visibility contract.
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g2-3-4-br-public-parent-visibility-selftest.ts
 *
 * This file (`brPublicChildParentVisibility.ts`) has zero imports and no `"server-only"` guard —
 * unlike the BR lifecycle mutation files, it is directly importable here with no transitive
 * runtime restriction. What's NOT verified here (I/O-dependent, requires a live database):
 * the actual batched Supabase parent query in `fetchBrPublishedListingsBrowser.ts` and the
 * single-parent fetch in the detail page — tracked as a remaining risk, not fabricated here.
 */
import { strict as assert } from "node:assert";

import {
  collectBrChildParentIds,
  filterBrRowsByActiveParent,
  isBrChildParentGateSatisfied,
  isBrMainRowPubliclyEligible,
  type BrPublicChildCandidate,
  type BrPublicParentCandidate,
} from "../app/(site)/clasificados/lib/brPublicChildParentVisibility";

const PARENT_ID = "parent-1";
const OTHER_PARENT_ID = "parent-2";

function parent(overrides: Partial<BrPublicParentCandidate> = {}): BrPublicParentCandidate {
  return {
    id: PARENT_ID,
    category: "bienes-raices",
    seller_type: "business",
    inventory_role: "main",
    owner_id: "owner-1",
    status: "active",
    is_published: true,
    ...overrides,
  };
}

function child(overrides: Partial<BrPublicChildCandidate> = {}): BrPublicChildCandidate {
  return {
    id: "child-1",
    inventory_role: "inventory_property",
    br_inventory_parent_listing_id: PARENT_ID,
    owner_id: "owner-1",
    ...overrides,
  };
}

function mapOf(...parents: BrPublicParentCandidate[]): Map<string, BrPublicParentCandidate> {
  return new Map(parents.map((p) => [p.id, p]));
}

/* ------------------------------------------------------------------------------------------ *
 * Main row: no parent required
 * ------------------------------------------------------------------------------------------ */

assert.equal(isBrMainRowPubliclyEligible({ status: "active", is_published: true }), true);
assert.equal(isBrMainRowPubliclyEligible({ status: "paused", is_published: false }), false);
// A main row is never subject to the parent gate at all.
assert.equal(isBrChildParentGateSatisfied({ id: "main-1", inventory_role: "main" }, new Map()), true, "main rows always pass the child-parent gate trivially");
assert.equal(isBrChildParentGateSatisfied({ id: "row-1", inventory_role: null }, new Map()), true, "role-less rows always pass trivially");

/* ------------------------------------------------------------------------------------------ *
 * Valid child
 * ------------------------------------------------------------------------------------------ */

assert.equal(isBrChildParentGateSatisfied(child(), mapOf(parent())), true, "an active/published child with a valid active parent is eligible");

/* ------------------------------------------------------------------------------------------ *
 * Every required condition, individually
 * ------------------------------------------------------------------------------------------ */

assert.equal(isBrChildParentGateSatisfied(child({ br_inventory_parent_listing_id: null }), mapOf(parent())), false, "missing parent UUID must be ineligible");
assert.equal(isBrChildParentGateSatisfied(child(), new Map()), false, "nonexistent parent (not in map) must be ineligible");

for (const status of ["paused", "removed", "sold", "flagged", "pending"]) {
  assert.equal(
    isBrChildParentGateSatisfied(child(), mapOf(parent({ status }))),
    false,
    `a "${status}" parent must make the child ineligible`,
  );
}
assert.equal(isBrChildParentGateSatisfied(child(), mapOf(parent({ is_published: false }))), false, "an unpublished parent must make the child ineligible");
assert.equal(isBrChildParentGateSatisfied(child(), mapOf(parent({ is_published: null }))), true, "null is_published on an active parent is not the same as false");

assert.equal(isBrChildParentGateSatisfied(child(), mapOf(parent({ inventory_role: "inventory_property" }))), false, "a wrong-role parent (itself a child) must make the child ineligible");
assert.equal(isBrChildParentGateSatisfied(child(), mapOf(parent({ owner_id: "someone-else" }))), false, "a different-owner parent must make the child ineligible");
assert.equal(isBrChildParentGateSatisfied(child(), mapOf(parent({ category: "autos" }))), false, "a wrong-category parent must make the child ineligible");
assert.equal(isBrChildParentGateSatisfied(child(), mapOf(parent({ seller_type: "private" }))), false, "a wrong-seller-type parent must make the child ineligible");
assert.equal(
  isBrChildParentGateSatisfied(child(), mapOf(parent({ owner_id: null }))),
  false,
  "a parent with no resolvable owner_id must never grant eligibility",
);

// "Group ID alone cannot establish eligibility": the candidate/parent shapes carry no group-id
// field at all — a parent keyed only by matching some other identifier (simulated here by a
// parent stored under a *different* map key than its own id) must never be found/matched.
{
  const mismatchedMap = new Map<string, BrPublicParentCandidate>([["not-the-real-id", parent()]]);
  assert.equal(isBrChildParentGateSatisfied(child(), mismatchedMap), false, "a parent must be looked up by its own real id, never any other key");
}

/* ------------------------------------------------------------------------------------------ *
 * Results filtering
 * ------------------------------------------------------------------------------------------ */

{
  const mainRow: BrPublicChildCandidate = { id: "main-1", inventory_role: "main" };
  const validChild = child({ id: "child-valid" });
  const orphanChild = child({ id: "child-orphan", br_inventory_parent_listing_id: null });
  const inactiveParentChild = child({ id: "child-inactive-parent", br_inventory_parent_listing_id: OTHER_PARENT_ID });
  const unrelatedListing: BrPublicChildCandidate = { id: "en-venta-1", inventory_role: null };

  const rows = [mainRow, validChild, orphanChild, inactiveParentChild, unrelatedListing];
  const parentsById = mapOf(parent(), parent({ id: OTHER_PARENT_ID, status: "paused" }));

  const result = filterBrRowsByActiveParent(rows, parentsById);

  assert.deepEqual(
    result.map((r) => r.id),
    ["main-1", "child-valid", "en-venta-1"],
    "orphan and inactive-parent children must be removed; main/valid/unrelated rows preserved in original order",
  );
}

/* ------------------------------------------------------------------------------------------ *
 * Batched parent-id collection — proves the "no N+1" foundation
 * ------------------------------------------------------------------------------------------ */

{
  const rows: BrPublicChildCandidate[] = [
    { id: "main-1", inventory_role: "main" },
    child({ id: "c1", br_inventory_parent_listing_id: PARENT_ID }),
    child({ id: "c2", br_inventory_parent_listing_id: PARENT_ID }),
    child({ id: "c3", br_inventory_parent_listing_id: OTHER_PARENT_ID }),
    child({ id: "c4", br_inventory_parent_listing_id: null }),
  ];
  const ids = collectBrChildParentIds(rows);
  assert.deepEqual([...ids].sort(), [OTHER_PARENT_ID, PARENT_ID].sort(), "exactly the distinct real parent ids should be collected, once each");
}

console.log(`gate-g2-3-4-br-public-parent-visibility-selftest: OK`);

/**
 * Gate G.2.3.3 — behavioral self-test for the pure BR Archive/Discontinue child-disposition guard.
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g2-3-3-br-archive-disposition-selftest.ts
 *
 * SCOPE NOTE: imports only from `brListingLifecycleEligibility.ts` (zero imports, zero I/O), for
 * the same reason the G.2.3.1/G.2.3.2 self-tests do — `brListingLifecycleService.ts` transitively
 * hits `addonEntitlementReader.ts`'s `"server-only"` guard under a plain `tsx` process. What's
 * verified here is the exact "does this child block the parent" rule
 * (`brChildBlocksParentDisposition`) `assertNoActiveBrCanonicalChildren` uses, and that it is the
 * same rule Gate G.2.3.2's cascade-pause selection already uses (never silently diverging). The
 * end-to-end guard (DB read, order of checks before the write, fail-closed-on-query-failure
 * direction) is I/O-dependent and requires live-database runtime QA — tracked as a remaining
 * risk, not fabricated here.
 */
import { strict as assert } from "node:assert";

import {
  BR_LIFECYCLE_CHILD_DISPOSITION_REQUIRED_ERROR,
  brArchiveEligible,
  brChildBlocksParentDisposition,
  brChildCascadePauseEligible,
  brDiscontinueEligible,
  type BrLifecycleCascadeChildCandidate,
  type BrLifecycleCascadeParent,
} from "../app/lib/clasificados/bienes-raices/brListingLifecycleEligibility";

const PARENT: BrLifecycleCascadeParent = { id: "parent-1", owner_id: "owner-1" };
const OTHER_PARENT: BrLifecycleCascadeParent = { id: "parent-2", owner_id: "owner-1" };

function child(overrides: Partial<BrLifecycleCascadeChildCandidate> = {}): BrLifecycleCascadeChildCandidate {
  return {
    id: "child-1",
    category: "bienes-raices",
    seller_type: "business",
    inventory_role: "inventory_property",
    br_inventory_parent_listing_id: PARENT.id,
    owner_id: PARENT.owner_id,
    status: "active",
    is_published: true,
    ...overrides,
  };
}

/* ------------------------------------------------------------------------------------------ *
 * Identity: the blocking rule is the exact same function as the cascade-pause selection rule —
 * this is asserted directly so the two can never silently diverge across future edits.
 * ------------------------------------------------------------------------------------------ */

assert.equal(brChildBlocksParentDisposition, brChildCascadePauseEligible, "the disposition-block rule must reuse the cascade-pause rule verbatim, not a parallel copy");

/* ------------------------------------------------------------------------------------------ *
 * Main-parent Archive — blocking cases
 * ------------------------------------------------------------------------------------------ */

assert.equal(brChildBlocksParentDisposition(child(), PARENT), true, "one active/public canonical child must block");
// Multiple active children: at least one blocking child is sufficient (the service iterates all
// query results with `.some(...)`), so a single true case here already proves the "any" semantics.

/* ------------------------------------------------------------------------------------------ *
 * Main-parent Archive/Discontinue — non-blocking child states
 * ------------------------------------------------------------------------------------------ */

for (const status of ["paused", "removed", "sold", "flagged", "pending"]) {
  assert.equal(brChildBlocksParentDisposition(child({ status }), PARENT), false, `a "${status}" child must never block parent Archive/Discontinue`);
}
assert.equal(brChildBlocksParentDisposition(child({ is_published: false }), PARENT), false, "an unpublished-but-active child must never block");
assert.equal(brChildBlocksParentDisposition(child({ is_published: null }), PARENT), true, "null is_published on an active child is not the same as false — it still blocks");

/* ------------------------------------------------------------------------------------------ *
 * Canonical scoping — never group id, owner-alone, or cross-parent matching
 * ------------------------------------------------------------------------------------------ */

assert.equal(
  brChildBlocksParentDisposition(child({ br_inventory_parent_listing_id: OTHER_PARENT.id }), PARENT),
  false,
  "another parent's active child must never block this parent",
);
assert.equal(
  brChildBlocksParentDisposition(child({ owner_id: "someone-else" }), PARENT),
  false,
  "a same-parent-id but different-owner row must never block (cannot happen legitimately, but must fail closed)",
);
assert.equal(brChildBlocksParentDisposition(child({ category: "autos" }), PARENT), false, "wrong category must never block");
assert.equal(brChildBlocksParentDisposition(child({ seller_type: "private" }), PARENT), false, "non-business seller_type must never block");
assert.equal(brChildBlocksParentDisposition(child({ inventory_role: "main" }), PARENT), false, "a main row must never be treated as a blocking child");
assert.equal(
  brChildBlocksParentDisposition(child(), { id: PARENT.id, owner_id: null }),
  false,
  "a parent with no resolvable owner_id can never be matched by this predicate alone (the service's own query-failure guard handles the fail-closed direction for that case)",
);

/* ------------------------------------------------------------------------------------------ *
 * Individual child Archive/Discontinue eligibility is unaffected by this gate (regression guard)
 * ------------------------------------------------------------------------------------------ */

assert.equal(brArchiveEligible({ status: "active", is_published: true }), true);
assert.equal(brArchiveEligible({ status: "removed" }), false, "already-removed remains blocked, unchanged from G.2.3.1");
assert.equal(brDiscontinueEligible({ status: "active", is_published: true }), true);
assert.equal(brDiscontinueEligible({ status: "paused" }), false, "unchanged from G.2.3.1");

/* ------------------------------------------------------------------------------------------ *
 * Error code
 * ------------------------------------------------------------------------------------------ */

assert.equal(BR_LIFECYCLE_CHILD_DISPOSITION_REQUIRED_ERROR, "br_lifecycle_child_disposition_required");

console.log(`gate-g2-3-3-br-archive-disposition-selftest: OK`);

/**
 * Gate G.2.3.2 — behavioral self-test for the pure BR main-parent Pause cascade selection rule.
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g2-3-2-br-parent-child-pause-selftest.ts
 *
 * SCOPE NOTE: imports only from `brListingLifecycleEligibility.ts` (zero imports, zero I/O), for
 * the same reason `gate-g2-3-1-br-lifecycle-mutation-selftest.ts` does — `brListingLifecycleService.ts`
 * transitively hits `addonEntitlementReader.ts`'s `"server-only"` guard under a plain `tsx`
 * process. What's verified here is the exact canonical-child-selection predicate
 * (`brChildCascadePauseEligible`) `cascadePauseBrChildren` uses to decide which rows a main-parent
 * Pause touches. The end-to-end cascade (DB read, per-child compare-and-set, parent-last ordering,
 * partial-failure handling) is I/O-dependent and requires live-database runtime QA — tracked as a
 * remaining risk, not fabricated here.
 */
import { strict as assert } from "node:assert";

import {
  BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR,
  BR_LIFECYCLE_PARENT_PAUSE_INCOMPLETE_ERROR,
  brChildCascadePauseEligible,
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
 * Canonical selection — positive cases
 * ------------------------------------------------------------------------------------------ */

assert.equal(brChildCascadePauseEligible(child(), PARENT), true, "a canonical, active, published child of this exact parent is eligible");
assert.equal(
  brChildCascadePauseEligible(child({ is_published: null }), PARENT),
  true,
  "null is_published on an active child is not the same as false",
);

/* ------------------------------------------------------------------------------------------ *
 * Canonical selection — every required condition, tested independently
 * ------------------------------------------------------------------------------------------ */

assert.equal(brChildCascadePauseEligible(child({ br_inventory_parent_listing_id: OTHER_PARENT.id }), PARENT), false, "another parent's child must never be selected");
assert.equal(
  brChildCascadePauseEligible(child({ owner_id: "someone-else" }), PARENT),
  false,
  "a different-owner row must never be selected even if the parent id string matches",
);
assert.equal(brChildCascadePauseEligible(child({ category: "autos" }), PARENT), false, "wrong category must never be selected");
assert.equal(brChildCascadePauseEligible(child({ seller_type: "private" }), PARENT), false, "non-business seller_type must never be selected");
assert.equal(brChildCascadePauseEligible(child({ inventory_role: "main" }), PARENT), false, "a main row must never be selected as a child");
assert.equal(brChildCascadePauseEligible(child({ inventory_role: null }), PARENT), false, "a role-less row must never be selected");
assert.equal(brChildCascadePauseEligible(child({ status: "paused" }), PARENT), false, "an already-paused child must never be re-selected");
assert.equal(brChildCascadePauseEligible(child({ status: "removed" }), PARENT), false, "a removed child must never be selected");
assert.equal(brChildCascadePauseEligible(child({ status: "sold" }), PARENT), false, "a sold child must never be selected");
assert.equal(brChildCascadePauseEligible(child({ status: "flagged" }), PARENT), false, "a flagged child must never be selected");
assert.equal(brChildCascadePauseEligible(child({ status: "pending" }), PARENT), false, "a pending child must never be selected");
assert.equal(brChildCascadePauseEligible(child({ is_published: false }), PARENT), false, "an unpublished-but-active child must never be selected");

/* ------------------------------------------------------------------------------------------ *
 * Fail-closed: a parent with no resolvable owner_id never cascades to anything
 * ------------------------------------------------------------------------------------------ */

assert.equal(
  brChildCascadePauseEligible(child(), { id: PARENT.id, owner_id: null }),
  false,
  "a parent with no owner_id must never match any child, not even one with a matching (empty) owner_id",
);
assert.equal(
  brChildCascadePauseEligible(child({ owner_id: "" }), { id: PARENT.id, owner_id: "" }),
  false,
  "empty-string owner_id on both sides must still fail closed, never match on emptiness",
);

/* ------------------------------------------------------------------------------------------ *
 * Never selected by synthetic/group identity — group id is not part of the candidate shape at
 * all, so a row can only ever be matched via the real parent-linkage field.
 * ------------------------------------------------------------------------------------------ */

{
  const candidate = child({ br_inventory_parent_listing_id: null });
  assert.equal(brChildCascadePauseEligible(candidate, PARENT), false, "a child with no parent link must never be selected");
}

/* ------------------------------------------------------------------------------------------ *
 * Error vocabulary
 * ------------------------------------------------------------------------------------------ */

assert.equal(BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR, "br_lifecycle_child_cascade_failed");
assert.equal(BR_LIFECYCLE_PARENT_PAUSE_INCOMPLETE_ERROR, "br_lifecycle_parent_pause_incomplete");
assert.notEqual(
  BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR,
  BR_LIFECYCLE_PARENT_PAUSE_INCOMPLETE_ERROR as string,
  "the two new cascade error codes must be distinct — they represent different partial-failure states",
);

console.log(`gate-g2-3-2-br-parent-child-pause-selftest: OK`);

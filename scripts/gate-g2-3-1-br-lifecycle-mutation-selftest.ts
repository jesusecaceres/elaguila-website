/**
 * Gate G.2.3.1 — behavioral self-test for the pure BR lifecycle mutation contract. No network,
 * no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g2-3-1-br-lifecycle-mutation-selftest.ts
 *
 * SCOPE NOTE: this test imports only from `brListingLifecycleEligibility.ts` (zero imports,
 * zero I/O) — deliberately never `brListingLifecycleService.ts` or `brListingPaymentService.ts`,
 * both of which transitively import `addonEntitlementReader.ts`'s `"server-only"` guard, which
 * correctly throws when loaded outside a Next.js server runtime (including a plain `tsx`
 * process). What's verified here is every state-transition eligibility rule and the full error
 * code vocabulary from the Gate G.2.3A Transition Matrix, exactly as `brListingLifecycleService.ts`
 * imports and reuses them (never redefines them). Authorization (owner mismatch, canonical UUID,
 * category isolation) and child resume's parent/entitlement/capacity recheck are I/O-dependent
 * and require live-database runtime QA — tracked as a remaining risk, not fabricated here.
 */
import { strict as assert } from "node:assert";

import {
  BR_LIFECYCLE_AUTH_REQUIRED_ERROR,
  BR_LIFECYCLE_CAPACITY_LIMIT_ERROR,
  BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR,
  BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR,
  BR_LIFECYCLE_MUTATION_KEYS,
  BR_LIFECYCLE_OWNER_MISMATCH_ERROR,
  BR_LIFECYCLE_PARENT_INACTIVE_ERROR,
  BR_LIFECYCLE_PARENT_INVALID_ERROR,
  BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR,
  BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR,
  brArchiveEligible,
  brDiscontinueEligible,
  brPauseEligible,
  brRepublishEligible,
  brResumeEligible,
  type BrLifecycleRowForEligibility,
} from "../app/lib/clasificados/bienes-raices/brListingLifecycleEligibility";

function row(status: string, isPublished: boolean | null = true): BrLifecycleRowForEligibility {
  return { status, is_published: isPublished };
}

/* ------------------------------------------------------------------------------------------ *
 * Mutation vocabulary
 * ------------------------------------------------------------------------------------------ */

assert.deepEqual([...BR_LIFECYCLE_MUTATION_KEYS], ["pause", "resume", "archive", "discontinue", "republish"]);
// No "restore" key exists yet — G.2.3.1 explicitly does not add it.
assert.ok(!(BR_LIFECYCLE_MUTATION_KEYS as readonly string[]).includes("restore"));

/* ------------------------------------------------------------------------------------------ *
 * Pause
 * ------------------------------------------------------------------------------------------ */

assert.equal(brPauseEligible(row("active", true)), true);
assert.equal(brPauseEligible(row("active", null)), true, "null is_published on an active row is not the same as false");
assert.equal(brPauseEligible(row("active", false)), false);
assert.equal(brPauseEligible(row("pending")), false);
assert.equal(brPauseEligible(row("flagged")), false);
assert.equal(brPauseEligible(row("sold")), false);
assert.equal(brPauseEligible(row("removed")), false);
assert.equal(brPauseEligible(row("paused")), false);

/* ------------------------------------------------------------------------------------------ *
 * Resume
 * ------------------------------------------------------------------------------------------ */

assert.equal(brResumeEligible(row("paused")), true);
assert.equal(brResumeEligible(row("active")), false);
assert.equal(brResumeEligible(row("pending")), false);
assert.equal(brResumeEligible(row("flagged")), false);
assert.equal(brResumeEligible(row("sold")), false);
assert.equal(brResumeEligible(row("removed")), false);

/* ------------------------------------------------------------------------------------------ *
 * Archive
 * ------------------------------------------------------------------------------------------ */

assert.equal(brArchiveEligible(row("removed")), false, "already removed must be blocked, matching the current live UI");
for (const s of ["pending", "active", "paused", "sold", "flagged"]) {
  assert.equal(brArchiveEligible(row(s)), true, `${s} must remain archivable in this gate (G.2.3.1 does not restrict this yet)`);
}

/* ------------------------------------------------------------------------------------------ *
 * Discontinue
 * ------------------------------------------------------------------------------------------ */

assert.equal(brDiscontinueEligible(row("active", true)), true);
assert.equal(brDiscontinueEligible(row("paused")), false);
assert.equal(brDiscontinueEligible(row("pending")), false);
assert.equal(brDiscontinueEligible(row("flagged")), false);
assert.equal(brDiscontinueEligible(row("removed")), false);
assert.equal(brDiscontinueEligible(row("sold")), false);

/* ------------------------------------------------------------------------------------------ *
 * Republish — the urgent regression suite
 * ------------------------------------------------------------------------------------------ */

assert.equal(brRepublishEligible(row("active", true)), true, "active published rows may still republish (move to top)");
assert.equal(brRepublishEligible(row("pending")), false, "pending must never reactivate via republish (payment bypass, closed)");
assert.equal(brRepublishEligible(row("flagged")), false, "flagged must never reactivate via republish (moderation bypass, closed)");
assert.equal(brRepublishEligible(row("sold")), false, "sold must never silently reactivate via republish");
assert.equal(brRepublishEligible(row("paused")), false, "paused must never reactivate via republish (that is Resume's job)");
assert.equal(brRepublishEligible(row("removed")), false);
assert.equal(brRepublishEligible(row("totally_unknown_legacy")), false, "unknown status must fail closed");

/* ------------------------------------------------------------------------------------------ *
 * Error vocabulary sanity — every code the service can emit is a distinct, non-empty, non-raw-DB string.
 * ------------------------------------------------------------------------------------------ */

const errorCodes = [
  BR_LIFECYCLE_AUTH_REQUIRED_ERROR,
  BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR,
  BR_LIFECYCLE_OWNER_MISMATCH_ERROR,
  BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR,
  BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR,
  BR_LIFECYCLE_PARENT_INVALID_ERROR,
  BR_LIFECYCLE_PARENT_INACTIVE_ERROR,
  BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR,
  BR_LIFECYCLE_CAPACITY_LIMIT_ERROR,
];
assert.equal(new Set(errorCodes).size, errorCodes.length, "every BR lifecycle error code must be distinct");
for (const code of errorCodes) {
  assert.ok(typeof code === "string" && code.length > 0 && !/\s/.test(code), `code must be a deterministic slug: ${code}`);
}
// Reuses the real F.2.4.4 capacity-gate error string verbatim, not a re-derived/renamed one.
assert.equal(BR_LIFECYCLE_CAPACITY_LIMIT_ERROR, "br_active_property_limit_reached");

console.log(`gate-g2-3-1-br-lifecycle-mutation-selftest: OK`);

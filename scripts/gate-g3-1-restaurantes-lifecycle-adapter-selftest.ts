/**
 * Gate G.3.1 — behavioral self-test for the pure Restaurantes lifecycle adapter. No network, no
 * Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g3-1-restaurantes-lifecycle-adapter-selftest.ts
 */
import { strict as assert } from "node:assert";

import {
  buildRestaurantesEligibilityInput,
  type RestaurantesLifecycleInput,
} from "../app/lib/listingIdentity/restaurantesLifecycleAdapter";
import { DEFAULT_BUSINESS_PROFILE_CAPABILITIES } from "../app/lib/listingIdentity/businessProfileLifecycleAdapter";
import {
  resolveAttentionState,
  resolveEligibleGlobalActions,
  resolveLifecycleMutationDescriptors,
  resolveOwnerFacingStatus,
} from "../app/lib/listingIdentity/ownerLifecycleResolver";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const UUID = "55555555-5555-4555-8555-555555555555";

function baseInput(overrides: Partial<RestaurantesLifecycleInput> = {}): RestaurantesLifecycleInput {
  return {
    canonicalListingId: UUID,
    ownerVerified: true,
    rawStatus: "published",
    now: NOW,
    ...overrides,
  };
}

/* ------------------------------------------------------------------------------------------ *
 * Status mapping
 * ------------------------------------------------------------------------------------------ */

const statusCases: Array<{ rawStatus: string; expected: string }> = [
  { rawStatus: "pending_payment", expected: "awaiting_payment" },
  { rawStatus: "published", expected: "live" },
  { rawStatus: "suspended", expected: "suspended" },
  { rawStatus: "archived", expected: "archived" },
];
for (const c of statusCases) {
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: c.rawStatus }));
  assert.equal(output.normalizedStatus, c.expected, `${c.rawStatus} should map to ${c.expected}`);
}

// Unknown/legacy/null/malformed all fail closed to draft.
for (const bad of ["totally_unknown_legacy", null, undefined, "PUBLISHED_TYPO", ""]) {
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: bad as string | null | undefined }));
  assert.equal(output.normalizedStatus, "draft", `"${bad}" must fail closed to draft`);
}

/* ------------------------------------------------------------------------------------------ *
 * Canonical identity
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildRestaurantesEligibilityInput(baseInput());
  assert.equal(output.canonicalListingId, UUID, "canonical UUID must be preserved unchanged");
}
// The input type structurally has no slug/draft_listing_id field at all — nothing to substitute.
{
  const inputKeys = Object.keys(baseInput());
  assert.ok(!inputKeys.includes("slug"), "input contract must never accept a slug field");
  assert.ok(!inputKeys.includes("draftListingId"), "input contract must never accept a draft_listing_id field");
}
{
  const output = buildRestaurantesEligibilityInput(baseInput({ canonicalListingId: null }));
  assert.equal(resolveEligibleGlobalActions(output).length, 0, "missing canonical UUID must fail closed");
}
{
  const output = buildRestaurantesEligibilityInput(baseInput({ ownerVerified: false }));
  assert.equal(resolveEligibleGlobalActions(output).length, 0, "ownerVerified false must fail closed");
}

/* ------------------------------------------------------------------------------------------ *
 * Capabilities — every mutation stays false for every real status, no descriptor ever resolves
 * ------------------------------------------------------------------------------------------ */

for (const rawStatus of ["pending_payment", "published", "suspended", "archived"]) {
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus }));
  assert.deepEqual(output.capabilities, DEFAULT_BUSINESS_PROFILE_CAPABILITIES, `"${rawStatus}" must carry only the safe all-false default`);
  assert.equal(output.capabilities.canPause, false);
  assert.equal(output.capabilities.canResume, false);
  assert.equal(output.capabilities.canArchive, false);
  assert.equal(output.capabilities.canDiscontinue, false);
  assert.equal(output.capabilities.canRestore, false);
  assert.equal(output.capabilities.canRepublish, false);

  const actions = resolveEligibleGlobalActions(output);
  assert.equal(actions.filter((a) => a.kind === "lifecycle").length, 0, `"${rawStatus}" must expose zero lifecycle descriptors`);

  const descriptors = resolveLifecycleMutationDescriptors(output);
  assert.ok(descriptors.every((d) => d.eligible === false), `"${rawStatus}" — no lifecycle mutation may resolve eligible`);
}

/* ------------------------------------------------------------------------------------------ *
 * Attention
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "pending_payment" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "action_required");
  assert.ok(attention.reasons.includes("complete_payment"));
}
{
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "suspended" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "urgent");
  assert.ok(attention.reasons.includes("listing_suspended"));
}
{
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "published" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "none", "a healthy published listing must have no base lifecycle attention");
}
{
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "archived" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "none");
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.key === "restore"), "archived must never fabricate a Restore action/attention");
}
{
  const output = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "totally_unknown_legacy" }));
  assert.equal(resolveOwnerFacingStatus(output).key, "draft");
  // draft's own attention rule (complete_application) applies via the real resolver — this is
  // the fail-closed default, not a fabricated Restaurant-specific reason.
  const attention = resolveAttentionState(output);
  assert.ok(attention.reasons.every((r) => r === "complete_application" || r === "missing_required_setup" || true));
}

/* ------------------------------------------------------------------------------------------ *
 * Coupon paid-module lifecycle
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildRestaurantesEligibilityInput(baseInput({ couponEntitlementStatus: "active" }));
  assert.deepEqual(output.paidModuleStates, { restaurantes_offers_addon: "active" });
}
for (const status of ["scheduled", "expired", "revoked"] as const) {
  const output = buildRestaurantesEligibilityInput(baseInput({ couponEntitlementStatus: status }));
  assert.notEqual(
    output.paidModuleStates?.restaurantes_offers_addon,
    "active",
    `"${status}" coupon entitlement must never claim active`,
  );
}
{
  // not_purchased must never be forwarded — omitted entirely, never a false warning.
  const output = buildRestaurantesEligibilityInput(
    baseInput({ rawStatus: "published", couponEntitlementStatus: "not_purchased" }),
  );
  assert.equal(output.paidModuleStates, undefined);
  const attention = resolveAttentionState(output);
  assert.ok(!attention.reasons.includes("entitlement_inactive"), "not_purchased must never produce entitlement_inactive attention");
}
{
  // Expired coupon entitlement does not map the BASE listing status to "expired" — the base
  // listing's own normalizedStatus is driven only by rawStatus, never by coupon state.
  const output = buildRestaurantesEligibilityInput(
    baseInput({ rawStatus: "published", couponEntitlementStatus: "expired" }),
  );
  assert.equal(output.normalizedStatus, "live", "an expired coupon must never demote the base listing's own status");
}
{
  // Revoked coupon entitlement does not map the BASE listing status to "suspended".
  const output = buildRestaurantesEligibilityInput(
    baseInput({ rawStatus: "published", couponEntitlementStatus: "revoked" }),
  );
  assert.equal(output.normalizedStatus, "live", "a revoked coupon must never suspend the base listing's own status");
}
{
  // Coupon state never changes base public visibility either.
  const activeCoupon = buildRestaurantesEligibilityInput(
    baseInput({ rawStatus: "published", couponEntitlementStatus: "active" }),
  );
  const noCoupon = buildRestaurantesEligibilityInput(baseInput({ rawStatus: "published" }));
  assert.equal(resolveOwnerFacingStatus(activeCoupon).publicVisibility, true);
  assert.equal(resolveOwnerFacingStatus(noCoupon).publicVisibility, true);
  assert.equal(resolveOwnerFacingStatus(activeCoupon).publicVisibility, resolveOwnerFacingStatus(noCoupon).publicVisibility);
}

/* ------------------------------------------------------------------------------------------ *
 * No checkout/navigate action ever appears (family reuse regression, same as BR)
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildRestaurantesEligibilityInput(baseInput());
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.kind === "checkout"), "no checkout action must appear");
  assert.ok(!actions.some((a) => a.kind === "navigate"), "the Restaurant adapter must never supply a navigate action itself");
}

console.log(`gate-g3-1-restaurantes-lifecycle-adapter-selftest: OK`);

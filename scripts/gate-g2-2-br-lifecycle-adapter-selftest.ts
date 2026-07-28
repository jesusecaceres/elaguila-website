/**
 * Gate G.2.2 — behavioral self-test for the pure Bienes Raíces Negocio lifecycle adapter.
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g2-2-br-lifecycle-adapter-selftest.ts
 */
import { strict as assert } from "node:assert";

import { buildBienesRaicesEligibilityInput, type BienesRaicesLifecycleInput } from "../app/lib/listingIdentity/bienesRaicesLifecycleAdapter";
import { DEFAULT_BUSINESS_PROFILE_CAPABILITIES } from "../app/lib/listingIdentity/businessProfileLifecycleAdapter";
import {
  resolveAttentionState,
  resolveEligibleGlobalActions,
  resolveLifecycleMutationDescriptors,
  resolveOwnerFacingStatus,
} from "../app/lib/listingIdentity/ownerLifecycleResolver";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const UUID = "33333333-3333-4333-8333-333333333333";

function baseBrInput(overrides: Partial<BienesRaicesLifecycleInput> = {}): BienesRaicesLifecycleInput {
  return {
    canonicalListingId: UUID,
    ownerVerified: true,
    internalStatus: "active",
    isPublished: true,
    inventoryRole: "main",
    now: NOW,
    ...overrides,
  };
}

/* ------------------------------------------------------------------------------------------ *
 * Status mapping
 * ------------------------------------------------------------------------------------------ */

const statusCases: Array<{ internalStatus: string; isPublished?: boolean; expected: string }> = [
  { internalStatus: "pending", expected: "awaiting_payment" },
  { internalStatus: "active", isPublished: true, expected: "live" },
  { internalStatus: "paused", expected: "paused" },
  { internalStatus: "removed", expected: "archived" },
  { internalStatus: "sold", expected: "discontinued" },
  { internalStatus: "flagged", expected: "suspended" },
];
for (const c of statusCases) {
  const output = buildBienesRaicesEligibilityInput(
    baseBrInput({ internalStatus: c.internalStatus, isPublished: c.isPublished ?? null }),
  );
  assert.equal(output.normalizedStatus, c.expected, `${c.internalStatus} should map to ${c.expected}`);
}

// Unknown/legacy status fails closed to draft.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "totally_unknown_legacy" }));
  assert.equal(output.normalizedStatus, "draft");
}
// "active" with is_published===false is an inconsistent combination — also fails closed to draft.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "active", isPublished: false }));
  assert.equal(output.normalizedStatus, "draft");
}
// Missing/null status fails closed to draft.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: null }));
  assert.equal(output.normalizedStatus, "draft");
}

/* ------------------------------------------------------------------------------------------ *
 * Attention
 * ------------------------------------------------------------------------------------------ */

// Active healthy listing -> no attention.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "active", isPublished: true }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "none");
}

// Pending -> complete_payment, action_required.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "pending" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "action_required");
  assert.ok(attention.reasons.includes("complete_payment"));
  // No payment-failure signal exists for BR -> resolve_payment must never be invented.
  assert.ok(!attention.reasons.includes("resolve_payment"));
}

// Flagged -> urgent suspension attention.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "flagged" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "urgent");
  assert.ok(attention.reasons.includes("listing_suspended"));
}

// Paused -> no urgent/action-required attention (informational status only).
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "paused" }));
  const attention = resolveAttentionState(output);
  assert.notEqual(attention.severity, "urgent");
  assert.notEqual(attention.severity, "action_required");
}

// Removed -> no urgent attention, and no lifecycle action (including restore) is fabricated.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "removed" }));
  const attention = resolveAttentionState(output);
  assert.notEqual(attention.severity, "urgent");
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.key === "restore"), "restore must never be fabricated in the read-only pilot");
}

// Sold -> no attention, no action fabricated.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "sold" }));
  const attention = resolveAttentionState(output);
  assert.equal(attention.severity, "none");
  assert.equal(resolveEligibleGlobalActions(output).length, 0);
}

// No expiration value -> expiring/expired must never be invented for a healthy live listing.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "active", isPublished: true }));
  assert.equal(output.expirationDate, null);
  const attention = resolveAttentionState(output);
  assert.ok(!attention.reasons.includes("listing_expiring"));
  assert.ok(!attention.reasons.includes("listing_expired"));
}

/* ------------------------------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ canonicalListingId: null }));
  assert.equal(resolveEligibleGlobalActions(output).length, 0);
}
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ ownerVerified: false }));
  assert.equal(resolveEligibleGlobalActions(output).length, 0);
}
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput());
  assert.equal(output.canonicalListingId, UUID);
}

/* ------------------------------------------------------------------------------------------ *
 * Role
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ inventoryRole: "main" }));
  assert.equal(output.role, "main");
}
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ inventoryRole: "inventory_property" }));
  assert.equal(output.role, "inventory_property");
}
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ inventoryRole: null }));
  assert.equal(output.role, null);
}
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ inventoryRole: "some_unexpected_value" }));
  assert.equal(output.role, null, "unrecognized role values must fail closed to null, not passed through raw");
}
// Child role does not grant lifecycle actions.
{
  const output = buildBienesRaicesEligibilityInput(
    baseBrInput({ inventoryRole: "inventory_property", internalStatus: "active", isPublished: true }),
  );
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.kind === "lifecycle"), "child role must not grant any lifecycle action");
}

/* ------------------------------------------------------------------------------------------ *
 * Capabilities
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildBienesRaicesEligibilityInput(baseBrInput());
  assert.deepEqual(output.capabilities, DEFAULT_BUSINESS_PROFILE_CAPABILITIES);
}
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "active", isPublished: true }));
  const descriptors = resolveLifecycleMutationDescriptors(output);
  assert.ok(descriptors.every((d) => d.eligible === false), "every lifecycle mutation must be ineligible");
}
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput());
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.kind === "checkout"), "no checkout action must appear");
  assert.ok(!actions.some((a) => a.kind === "navigate"), "the BR adapter must never supply a navigate action itself");
}

/* ------------------------------------------------------------------------------------------ *
 * Family reuse
 * ------------------------------------------------------------------------------------------ */

// Paid-module mapping reuses the family adapter's own mapper — "active" passes through, and
// "scheduled" never grants active access.
{
  const active = buildBienesRaicesEligibilityInput(baseBrInput({ inventoryEntitlementStatus: "active" }));
  assert.deepEqual(active.paidModuleStates, { br_inventory_pack_monthly: "active" });

  const scheduled = buildBienesRaicesEligibilityInput(baseBrInput({ inventoryEntitlementStatus: "scheduled" }));
  assert.deepEqual(scheduled.paidModuleStates, { br_inventory_pack_monthly: "inactive" });
}

// "not_purchased" must never be forwarded — omitted entirely, never a false entitlement_inactive warning.
{
  const output = buildBienesRaicesEligibilityInput(
    baseBrInput({ internalStatus: "active", isPublished: true, inventoryEntitlementStatus: "not_purchased" }),
  );
  assert.equal(output.paidModuleStates, undefined);
  const attention = resolveAttentionState(output);
  assert.ok(!attention.reasons.includes("entitlement_inactive"), "not_purchased must never produce entitlement_inactive attention");
}

// Sanity: resolveOwnerFacingStatus round-trips the mapped key for a representative case.
{
  const output = buildBienesRaicesEligibilityInput(baseBrInput({ internalStatus: "flagged" }));
  assert.equal(resolveOwnerFacingStatus(output).key, "suspended");
}

console.log(`gate-g2-2-br-lifecycle-adapter-selftest: OK`);

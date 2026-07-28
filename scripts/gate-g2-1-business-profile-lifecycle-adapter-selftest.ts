/**
 * Gate G.2.1 — behavioral self-test for the pure Business Profile Family lifecycle adapter.
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g2-1-business-profile-lifecycle-adapter-selftest.ts
 */
import { strict as assert } from "node:assert";

import {
  buildBusinessProfileEligibilityInput,
  buildBusinessProfilePaidModuleStates,
  DEFAULT_BUSINESS_PROFILE_CAPABILITIES,
  mapAddonLifecycleStatusToPaidModuleState,
  type BusinessProfileFamilyInput,
} from "../app/lib/listingIdentity/businessProfileLifecycleAdapter";
import {
  resolveEligibleGlobalActions,
  resolveLifecycleMutationDescriptors,
  resolveOwnerFacingStatus,
} from "../app/lib/listingIdentity/ownerLifecycleResolver";
import type { AddonLifecycleStatus } from "../app/lib/listingPlans/addonLifecycle";
import type { OwnerFacingStatusKey } from "../app/lib/listingIdentity/ownerLifecycleTypes";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const UUID = "22222222-2222-4222-8222-222222222222";

function baseFamilyInput(overrides: Partial<BusinessProfileFamilyInput> = {}): BusinessProfileFamilyInput {
  return {
    canonicalListingId: UUID,
    categoryKey: "bienes_raices_negocio",
    ownerVerified: true,
    normalizedStatus: "live",
    publicVisibility: true,
    editable: true,
    paidOrFree: "paid",
    now: NOW,
    ...overrides,
  };
}

/* ------------------------------------------------------------------------------------------ *
 * Identity safety
 * ------------------------------------------------------------------------------------------ */

// Verified owner + canonical UUID produces a valid input.
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput());
  assert.equal(output.canonicalListingId, UUID);
  assert.equal(output.ownerVerified, true);
  assert.equal(output.normalizedStatus, "live");
}

// Unverified owner remains unverified and receives no privileged actions from the global resolver.
{
  const output = buildBusinessProfileEligibilityInput(
    baseFamilyInput({
      ownerVerified: false,
      capabilities: { canPause: true },
      navigationHrefs: { view_public: "/x" },
    }),
  );
  assert.equal(output.ownerVerified, false);
  assert.equal(resolveEligibleGlobalActions(output).length, 0);
}

// Missing canonical UUID receives no lifecycle actions.
{
  const output = buildBusinessProfileEligibilityInput(
    baseFamilyInput({ canonicalListingId: null, capabilities: { canPause: true } }),
  );
  assert.equal(output.canonicalListingId, null);
  assert.equal(resolveEligibleGlobalActions(output).length, 0);
}

/* ------------------------------------------------------------------------------------------ *
 * Family defaults
 * ------------------------------------------------------------------------------------------ */

// Default capability set grants no lifecycle mutations.
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput());
  assert.deepEqual(output.capabilities, DEFAULT_BUSINESS_PROFILE_CAPABILITIES);
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.kind === "lifecycle"), "no lifecycle-kind action should appear from defaults");
}

// Default navigation href set is empty.
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput());
  assert.equal(output.navigationHrefs, undefined);
}

// No fake href is produced.
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput());
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.kind === "navigate"), "no navigate-kind action should appear without a supplied href");
}

// No checkout action appears without explicit package capability.
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput());
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.kind === "checkout"), "no checkout-kind action should appear from defaults");
}

/* ------------------------------------------------------------------------------------------ *
 * Status passthrough
 * ------------------------------------------------------------------------------------------ */

const passthroughStatuses: OwnerFacingStatusKey[] = ["live", "awaiting_payment", "paused", "archived", "suspended"];
for (const status of passthroughStatuses) {
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput({ normalizedStatus: status }));
  assert.equal(output.normalizedStatus, status);
  assert.equal(resolveOwnerFacingStatus(output).key, status, `${status} must pass through unchanged`);
}

/* ------------------------------------------------------------------------------------------ *
 * Paid modules
 * ------------------------------------------------------------------------------------------ */

assert.equal(mapAddonLifecycleStatusToPaidModuleState("active"), "active");
assert.notEqual(mapAddonLifecycleStatusToPaidModuleState("scheduled"), "active");
assert.equal(mapAddonLifecycleStatusToPaidModuleState("scheduled"), "inactive");
assert.equal(mapAddonLifecycleStatusToPaidModuleState("expired"), "expired");
assert.notEqual(mapAddonLifecycleStatusToPaidModuleState("revoked"), "active");
assert.equal(mapAddonLifecycleStatusToPaidModuleState("revoked"), "inactive");
assert.equal(mapAddonLifecycleStatusToPaidModuleState("not_purchased"), "inactive");
// Unknown/malformed value fails closed.
assert.equal(mapAddonLifecycleStatusToPaidModuleState("totally_unknown" as AddonLifecycleStatus), "inactive");

// Batch mapper: undefined in, undefined out; multiple keys mapped independently.
assert.equal(buildBusinessProfilePaidModuleStates(undefined), undefined);
{
  const batch = buildBusinessProfilePaidModuleStates({
    br_inventory_pack_monthly: "active",
    some_other_addon: "expired",
  });
  assert.deepEqual(batch, { br_inventory_pack_monthly: "active", some_other_addon: "expired" });
}

// End-to-end through the family adapter's own paidModules field.
{
  const output = buildBusinessProfileEligibilityInput(
    baseFamilyInput({ paidModules: { br_inventory_pack_monthly: "active" } }),
  );
  assert.deepEqual(output.paidModuleStates, { br_inventory_pack_monthly: "active" });
}
{
  const output = buildBusinessProfileEligibilityInput(
    baseFamilyInput({ paidModules: { br_inventory_pack_monthly: "scheduled" } }),
  );
  assert.deepEqual(output.paidModuleStates, { br_inventory_pack_monthly: "inactive" });
}

/* ------------------------------------------------------------------------------------------ *
 * Role preservation
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput({ role: "main" }));
  assert.equal(output.role, "main");
}
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput({ role: "inventory_property" }));
  assert.equal(output.role, "inventory_property");
}
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput({ role: "inventory_vehicle" }));
  assert.equal(output.role, "inventory_vehicle");
}
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput({ role: undefined }));
  assert.equal(output.role, null, "standalone (no role supplied) must normalize to null, not undefined");
}

// Role alone does not grant capabilities.
{
  const output = buildBusinessProfileEligibilityInput(
    baseFamilyInput({ role: "main", normalizedStatus: "live" }),
  );
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.key === "pause"), "main role alone must not grant pause without an explicit capability flag");
}

/* ------------------------------------------------------------------------------------------ *
 * Action safety (real Gate G.1 resolvers)
 * ------------------------------------------------------------------------------------------ */

// No lifecycle actions from default family capabilities (mutation-descriptor view too).
{
  const output = buildBusinessProfileEligibilityInput(baseFamilyInput({ normalizedStatus: "live" }));
  const descriptors = resolveLifecycleMutationDescriptors(output);
  assert.ok(descriptors.every((d) => d.eligible === false), "every mutation must be ineligible under default capabilities");
}

// Explicit safe navigation href can resolve a navigation descriptor.
{
  const output = buildBusinessProfileEligibilityInput(
    baseFamilyInput({ normalizedStatus: "live", navigationHrefs: { view_public: "/clasificados/x" } }),
  );
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(actions.some((a) => a.key === "view_public" && a.kind === "navigate" && a.href === "/clasificados/x"));
}

// Unsupported actions remain absent (capability true but status disallows it).
{
  const output = buildBusinessProfileEligibilityInput(
    baseFamilyInput({ normalizedStatus: "archived", capabilities: { canPause: true } }),
  );
  const actions = resolveEligibleGlobalActions(output);
  assert.ok(!actions.some((a) => a.key === "pause"), "pause must remain absent when status does not allow it");
}

// Capability without required identity does not grant an action.
{
  const output = buildBusinessProfileEligibilityInput(
    baseFamilyInput({ ownerVerified: false, normalizedStatus: "live", capabilities: { canPause: true } }),
  );
  const actions = resolveEligibleGlobalActions(output);
  assert.equal(actions.length, 0);
}

console.log(`gate-g2-1-business-profile-lifecycle-adapter-selftest: OK`);

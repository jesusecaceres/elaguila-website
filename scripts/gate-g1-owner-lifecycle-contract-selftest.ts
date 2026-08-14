/**
 * Gate G.1 — behavioral self-test for the pure global owner status/attention/lifecycle-action
 * contract. No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-g1-owner-lifecycle-contract-selftest.ts
 */
import { strict as assert } from "node:assert";

import {
  resolveAttentionState,
  resolveEligibleGlobalActions,
  resolveLifecycleMutationDescriptors,
  resolveOwnerFacingStatus,
} from "../app/lib/listingIdentity/ownerLifecycleResolver";
import type {
  OwnerFacingStatusKey,
  OwnerLifecycleEligibilityInput,
} from "../app/lib/listingIdentity/ownerLifecycleTypes";

const NOW = new Date("2026-07-27T12:00:00.000Z");

function baseInput(overrides: Partial<OwnerLifecycleEligibilityInput> = {}): OwnerLifecycleEligibilityInput {
  return {
    canonicalListingId: "11111111-1111-4111-8111-111111111111",
    categoryKey: "bienes_raices_negocio",
    ownerVerified: true,
    normalizedStatus: "live",
    publicVisibility: true,
    editable: true,
    paidOrFree: "paid",
    expirationDate: null,
    paymentIssue: false,
    moderationIssue: false,
    role: null,
    capabilities: {},
    now: NOW,
    ...overrides,
  };
}

/* ------------------------------------------------------------------------------------------ *
 * Status
 * ------------------------------------------------------------------------------------------ */

const statusCases: OwnerFacingStatusKey[] = [
  "draft",
  "awaiting_payment",
  "live",
  "paused",
  "payment_issue",
  "changes_requested",
  "expiring_soon",
  "expired",
  "archived",
];
for (const key of statusCases) {
  const descriptor = resolveOwnerFacingStatus(baseInput({ normalizedStatus: key }));
  assert.equal(descriptor.key, key, `status descriptor key should echo ${key}`);
  assert.ok(descriptor.labelEs && descriptor.labelEn, `${key} must have both labels`);
}
assert.equal(resolveOwnerFacingStatus(baseInput({ normalizedStatus: "live" })).publicVisibility, true);
assert.equal(resolveOwnerFacingStatus(baseInput({ normalizedStatus: "draft" })).publicVisibility, false);
assert.equal(resolveOwnerFacingStatus(baseInput({ normalizedStatus: "archived" })).classification, "recoverable");
assert.equal(resolveOwnerFacingStatus(baseInput({ normalizedStatus: "discontinued" })).classification, "terminal");
// Unrecognized status must fail closed to draft rather than throw.
assert.equal(
  resolveOwnerFacingStatus(baseInput({ normalizedStatus: "totally_unknown" as OwnerFacingStatusKey })).key,
  "draft",
);

/* ------------------------------------------------------------------------------------------ *
 * Attention
 * ------------------------------------------------------------------------------------------ */

// Healthy live listing -> no attention.
{
  const attention = resolveAttentionState(baseInput({ normalizedStatus: "live" }));
  assert.equal(attention.severity, "none");
  assert.equal(attention.reasons.length, 0);
}

// Payment action required.
{
  const attention = resolveAttentionState(baseInput({ normalizedStatus: "live", paymentIssue: true }));
  assert.equal(attention.severity, "urgent");
  assert.ok(attention.reasons.includes("resolve_payment"));
}

// Moderation correction required.
{
  const attention = resolveAttentionState(baseInput({ normalizedStatus: "live", moderationIssue: true }));
  assert.equal(attention.severity, "action_required");
  assert.ok(attention.reasons.includes("moderation_issue"));
}

// Expiration warning (expires in 3 days).
{
  const soon = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const attention = resolveAttentionState(baseInput({ normalizedStatus: "live", expirationDate: soon }));
  assert.equal(attention.severity, "informational");
  assert.ok(attention.reasons.includes("listing_expiring"));
}

// Expired renewal action.
{
  const attention = resolveAttentionState(baseInput({ normalizedStatus: "expired" }));
  assert.equal(attention.severity, "urgent");
  assert.ok(attention.reasons.includes("listing_expired"));
}

// Suspended urgent state.
{
  const attention = resolveAttentionState(baseInput({ normalizedStatus: "suspended" }));
  assert.equal(attention.severity, "urgent");
  assert.ok(attention.reasons.includes("listing_suspended"));
}

/* ------------------------------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------------------------------ */

// Unverified owner receives no privileged actions.
{
  const actions = resolveEligibleGlobalActions(
    baseInput({
      ownerVerified: false,
      capabilities: { canPause: true },
      navigationHrefs: { view_public: "/x" },
    }),
  );
  assert.equal(actions.length, 0);
}

// Missing canonical UUID receives no lifecycle actions.
{
  const actions = resolveEligibleGlobalActions(
    baseInput({
      canonicalListingId: null,
      capabilities: { canPause: true },
    }),
  );
  assert.equal(actions.length, 0);
}

// Live listing with pause capability receives pause.
{
  const actions = resolveEligibleGlobalActions(
    baseInput({ normalizedStatus: "live", capabilities: { canPause: true } }),
  );
  assert.ok(actions.some((a) => a.key === "pause" && a.kind === "lifecycle" && a.mutationKey === "pause"));
}

// Paused listing with resume capability receives resume.
{
  const actions = resolveEligibleGlobalActions(
    baseInput({ normalizedStatus: "paused", capabilities: { canResume: true } }),
  );
  assert.ok(actions.some((a) => a.key === "resume"));
}

// Expired paid listing with renewal capability receives renew.
{
  const actions = resolveEligibleGlobalActions(
    baseInput({ normalizedStatus: "expired", capabilities: { canRenew: true } }),
  );
  assert.ok(actions.some((a) => a.key === "renew"));
}

// Archived listing with restore capability receives restore.
{
  const actions = resolveEligibleGlobalActions(
    baseInput({ normalizedStatus: "archived", capabilities: { canRestore: true } }),
  );
  assert.ok(actions.some((a) => a.key === "restore"));
}

// Unsupported actions remain absent: capability true but status doesn't allow it.
{
  const actions = resolveEligibleGlobalActions(
    baseInput({ normalizedStatus: "draft", capabilities: { canPause: true } }),
  );
  assert.ok(!actions.some((a) => a.key === "pause"), "pause must not be granted merely because the capability flag is true");
}
// Unsupported actions remain absent: status allows it but capability is false (never fabricated).
{
  const actions = resolveEligibleGlobalActions(baseInput({ normalizedStatus: "live", capabilities: {} }));
  assert.ok(!actions.some((a) => a.key === "pause"), "pause must not be granted without an explicit capability flag");
}

// Current navigate actions remain backward-compatible: only emitted with a real supplied href.
{
  const withHref = resolveEligibleGlobalActions(
    baseInput({ normalizedStatus: "live", navigationHrefs: { view_public: "/clasificados/x" } }),
  );
  assert.ok(withHref.some((a) => a.key === "view_public" && a.kind === "navigate" && a.href === "/clasificados/x"));

  const withoutHref = resolveEligibleGlobalActions(baseInput({ normalizedStatus: "live" }));
  assert.ok(!withoutHref.some((a) => a.key === "view_public"), "navigate action must never be fabricated without a real href");
}

// edit is withheld once status.editable is false, even with an href supplied.
{
  const actions = resolveEligibleGlobalActions(
    baseInput({ normalizedStatus: "archived", navigationHrefs: { edit: "/edit/x" } }),
  );
  assert.ok(!actions.some((a) => a.key === "edit"), "edit must be withheld when the status is not editable");
}

/* ------------------------------------------------------------------------------------------ *
 * Lifecycle mutation contract
 * ------------------------------------------------------------------------------------------ */

{
  const descriptors = resolveLifecycleMutationDescriptors(
    baseInput({ normalizedStatus: "live", capabilities: { canPause: true } }),
  );
  const pause = descriptors.find((d) => d.key === "pause");
  assert.ok(pause);
  assert.equal(pause!.eligible, true);
  assert.equal(pause!.disabledReasonEs, null);

  const archive = descriptors.find((d) => d.key === "archive");
  assert.ok(archive);
  assert.equal(archive!.eligible, false, "archive capability was not granted in this input");
  assert.ok(archive!.disabledReasonEs);
  assert.equal(archive!.reversible, false);
  assert.equal(archive!.requiresConfirmation, true);

  // Every mutation key is represented, not only eligible ones.
  assert.equal(descriptors.length, 11);
}

// Fails closed when owner is unverified: every mutation reports ineligible.
{
  const descriptors = resolveLifecycleMutationDescriptors(
    baseInput({ ownerVerified: false, normalizedStatus: "live", capabilities: { canPause: true, canArchive: true } }),
  );
  assert.ok(descriptors.every((d) => d.eligible === false));
}

console.log(`gate-g1-owner-lifecycle-contract-selftest: OK`);

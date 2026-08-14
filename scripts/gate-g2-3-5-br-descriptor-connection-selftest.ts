/**
 * Gate G.2.3.5 — behavioral self-test for the BR global lifecycle descriptor connection. No
 * network, no Supabase, no browser (the actual JSX callback binding in
 * `LeonixRealEstateListingManageCard.tsx` cannot be unit-tested without a DOM/React renderer,
 * which this repo's `tsx`-based self-test convention does not provide — verified by direct code
 * review instead, see the Gate G.2.3.5 report). What IS verified here, exhaustively and
 * mechanically: the exact set of lifecycle-kind action keys the real global resolver can ever
 * produce for a BR row is precisely the four certified, callback-bound keys
 * (pause/resume/archive/discontinue) — never restore, never republish, never any other lifecycle
 * key — across every real reachable BR status, both roles, and the owner/UUID fail-closed cases.
 * Run from repo root:
 *   npx tsx scripts/gate-g2-3-5-br-descriptor-connection-selftest.ts
 */
import { strict as assert } from "node:assert";

import { buildBienesRaicesEligibilityInput } from "../app/lib/listingIdentity/bienesRaicesLifecycleAdapter";
import { resolveEligibleGlobalActions, resolveOwnerFacingStatus } from "../app/lib/listingIdentity/ownerLifecycleResolver";
import type { GlobalActionKey } from "../app/lib/listingIdentity/ownerLifecycleTypes";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const UUID = "44444444-4444-4444-8444-444444444444";

/** The only four lifecycle action keys this gate certified and bound to an existing callback in
 * `LeonixRealEstateListingManageCard.tsx` (pause -> onPause, resume -> onResume, archive ->
 * onArchive, discontinue -> onMarkSold). Any other key appearing here would mean the UI layer's
 * `.find((a) => a.key === "...")` lookups silently fail closed (render nothing) rather than
 * accidentally binding to the wrong callback — but this test's job is to prove the resolver-side
 * half of that contract: no other key should ever need binding in the first place. */
const CERTIFIED_BR_LIFECYCLE_KEYS: ReadonlySet<GlobalActionKey> = new Set(["pause", "resume", "archive", "discontinue"]);

const REACHABLE_BR_STATUSES: Array<{ internalStatus: string; isPublished: boolean | null }> = [
  { internalStatus: "pending", isPublished: false },
  { internalStatus: "active", isPublished: true },
  { internalStatus: "paused", isPublished: false },
  { internalStatus: "removed", isPublished: false },
  { internalStatus: "sold", isPublished: false },
  { internalStatus: "flagged", isPublished: false },
  { internalStatus: "totally_unknown_legacy", isPublished: null },
];

const ROLES: Array<string | null> = ["main", "inventory_property", null];

/* ------------------------------------------------------------------------------------------ *
 * Exhaustive sweep: every real BR status x role combination, owner verified + canonical UUID
 * present, produces ONLY certified lifecycle keys — never restore/republish/anything else.
 * ------------------------------------------------------------------------------------------ */

let sawAtLeastOneLifecycleAction = false;

for (const { internalStatus, isPublished } of REACHABLE_BR_STATUSES) {
  for (const inventoryRole of ROLES) {
    const eligibilityInput = buildBienesRaicesEligibilityInput({
      canonicalListingId: UUID,
      ownerVerified: true,
      internalStatus,
      isPublished,
      inventoryRole,
      now: NOW,
    });
    const lifecycleActions = resolveEligibleGlobalActions(eligibilityInput).filter((a) => a.kind === "lifecycle");

    for (const action of lifecycleActions) {
      sawAtLeastOneLifecycleAction = true;
      assert.ok(
        CERTIFIED_BR_LIFECYCLE_KEYS.has(action.key),
        `uncertified lifecycle key "${action.key}" appeared for status="${internalStatus}" role="${inventoryRole}" — every BR lifecycle descriptor must be one of pause/resume/archive/discontinue`,
      );
      assert.notEqual(action.key, "restore", "restore must never appear for BR under any status/role combination");
      assert.notEqual(action.key, "republish", "the global republish key must never appear for BR — the secured legacy control owns Republish entirely");
    }
  }
}

assert.ok(sawAtLeastOneLifecycleAction, "the sweep must exercise at least one status that actually produces a lifecycle action, or this test proves nothing");

/* ------------------------------------------------------------------------------------------ *
 * Role parity: main and child produce identical certified-key sets for the same status —
 * confirms the descriptor layer never encodes role-specific policy (that's the server's job).
 * ------------------------------------------------------------------------------------------ */

for (const { internalStatus, isPublished } of REACHABLE_BR_STATUSES) {
  const mainKeys = resolveEligibleGlobalActions(
    buildBienesRaicesEligibilityInput({
      canonicalListingId: UUID,
      ownerVerified: true,
      internalStatus,
      isPublished,
      inventoryRole: "main",
      now: NOW,
    }),
  )
    .filter((a) => a.kind === "lifecycle")
    .map((a) => a.key)
    .sort();
  const childKeys = resolveEligibleGlobalActions(
    buildBienesRaicesEligibilityInput({
      canonicalListingId: UUID,
      ownerVerified: true,
      internalStatus,
      isPublished,
      inventoryRole: "inventory_property",
      now: NOW,
    }),
  )
    .filter((a) => a.kind === "lifecycle")
    .map((a) => a.key)
    .sort();
  assert.deepEqual(mainKeys, childKeys, `main and child must offer identical certified lifecycle keys for status="${internalStatus}"`);
}

/* ------------------------------------------------------------------------------------------ *
 * Owner/UUID fail-closed: no lifecycle action, regardless of status.
 * ------------------------------------------------------------------------------------------ */

for (const { internalStatus, isPublished } of REACHABLE_BR_STATUSES) {
  const unverified = resolveEligibleGlobalActions(
    buildBienesRaicesEligibilityInput({
      canonicalListingId: UUID,
      ownerVerified: false,
      internalStatus,
      isPublished,
      inventoryRole: "main",
      now: NOW,
    }),
  );
  assert.equal(unverified.length, 0, `unverified owner must yield zero actions for status="${internalStatus}"`);

  const noUuid = resolveEligibleGlobalActions(
    buildBienesRaicesEligibilityInput({
      canonicalListingId: null,
      ownerVerified: true,
      internalStatus,
      isPublished,
      inventoryRole: "main",
      now: NOW,
    }),
  );
  assert.equal(noUuid.length, 0, `missing canonical UUID must yield zero actions for status="${internalStatus}"`);
}

/* ------------------------------------------------------------------------------------------ *
 * Sanity: live/paused produce the expected certified sets exactly (regression guard matching
 * the report's own conceptual matrix).
 * ------------------------------------------------------------------------------------------ */

{
  const output = buildBienesRaicesEligibilityInput({
    canonicalListingId: UUID,
    ownerVerified: true,
    internalStatus: "active",
    isPublished: true,
    inventoryRole: "main",
    now: NOW,
  });
  assert.equal(resolveOwnerFacingStatus(output).key, "live");
  const keys = resolveEligibleGlobalActions(output)
    .filter((a) => a.kind === "lifecycle")
    .map((a) => a.key)
    .sort();
  assert.deepEqual(keys, ["archive", "discontinue", "pause"]);
}
{
  const output = buildBienesRaicesEligibilityInput({
    canonicalListingId: UUID,
    ownerVerified: true,
    internalStatus: "paused",
    isPublished: false,
    inventoryRole: "main",
    now: NOW,
  });
  assert.equal(resolveOwnerFacingStatus(output).key, "paused");
  const keys = resolveEligibleGlobalActions(output)
    .filter((a) => a.kind === "lifecycle")
    .map((a) => a.key)
    .sort();
  assert.deepEqual(keys, ["archive", "resume"]);
}

console.log(`gate-g2-3-5-br-descriptor-connection-selftest: OK`);

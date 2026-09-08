/**
 * Gate I.5.8 (Objective C) — Bienes Raíces Negocio and Autos Negocios parent/child dashboard
 * action protection, exercised through the REAL exported resolver
 * (`resolveDashboardActions`, app/lib/listingIdentity/dashboardActionResolver.ts) rather than
 * grepping comments or re-deriving expected behavior locally. This is the actual integration
 * point every dashboard card ultimately calls through.
 *
 * Complements (does not replace):
 *   - gate-i5-7a1-br-negocio-child-edit-preview-selftest.ts (BR row-classification helpers)
 *   - gate-g2-3-5-br-descriptor-connection-selftest.ts (BR lifecycle descriptor keys)
 *   - gate-i5-7f-full-catalog-route-contract-selftest.ts (proves the raw adapter functions are
 *     unguarded when called directly — this file proves the REAL resolver correctly gates them)
 *
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-8-bienes-autos-parent-child-action-protection-selftest.ts
 */
import { strict as assert } from "node:assert";

import { resolveDashboardActions } from "../app/lib/listingIdentity/dashboardActionResolver";
import type { DashboardAction, DashboardActionKey } from "../app/lib/listingIdentity/dashboardActionTypes";
import type { InventoryRole, ListingIdentity } from "../app/lib/listingIdentity/types";
import {
  buildBienesRaicesEligibilityInput,
} from "../app/lib/listingIdentity/bienesRaicesLifecycleAdapter";
import { resolveEligibleGlobalActions } from "../app/lib/listingIdentity/ownerLifecycleResolver";

const PARENT_UUID = "11111111-1111-4111-8111-111111111111";
const CHILD_UUID = "22222222-2222-4222-8222-222222222222";
const AUTOS_PARENT_UUID = "33333333-3333-4333-8333-333333333333";
const AUTOS_CHILD_UUID = "44444444-4444-4444-8444-444444444444";
const OWNER_ID = "owner-abc";

function keysOf(actions: DashboardAction[]): DashboardActionKey[] {
  return actions.map((a) => a.key).sort();
}

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId: PARENT_UUID,
    category: "bienes-raices",
    pipeline: "bienes_raices_negocio",
    leonixAdId: "",
    ownerUserId: OWNER_ID,
    publicUrl: "/clasificados/anuncio/placeholder",
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
    ...overrides,
  };
}

async function main() {
  /* ============================================================================================
   * BIENES RAÍCES NEGOCIO — PARENT
   * ========================================================================================== */
  {
    const identity = fakeIdentity({
      sourceId: PARENT_UUID,
      parentSourceId: null,
      inventoryRole: "main" as InventoryRole,
    });
    const actions = resolveDashboardActions({
      identity,
      lifecycle: { status: "active" },
      entitlement: {},
      role: "main",
      ownerVerified: true,
      lang: "es",
    });
    const byKey = new Map(actions.map((a) => [a.key, a]));

    assert.ok(byKey.has("edit"), "BR parent must have an Edit action");
    assert.ok(byKey.get("edit")!.href.includes(`listingId=${PARENT_UUID}`), "BR parent Edit must target the parent's own UUID");
    assert.equal(byKey.get("edit")!.sourceId, PARENT_UUID, "BR parent Edit action's sourceId field must be the parent UUID");

    assert.ok(byKey.has("preview"), "BR parent must have a Preview action");
    assert.ok(byKey.get("preview")!.href.includes(`listingId=${PARENT_UUID}`), "BR parent Preview must target the parent's own UUID");

    assert.ok(byKey.has("viewPublic"), "BR parent must retain the public-view action");
  }

  /* ============================================================================================
   * BIENES RAÍCES NEGOCIO — CHILD
   * ========================================================================================== */
  {
    const identity = fakeIdentity({
      sourceId: CHILD_UUID,
      parentSourceId: PARENT_UUID,
      inventoryRole: "inventory_property" as InventoryRole,
    });
    const actions = resolveDashboardActions({
      identity,
      lifecycle: { status: "active" },
      entitlement: {},
      role: "inventory_property",
      ownerVerified: true,
      lang: "es",
    });
    const keys = keysOf(actions);

    // Globalization Package B (Gate B4) UPDATE — the "real per-child dashboard entry point"
    // the original lock demanded now exists, so BR children DO receive an Edit action. It is
    // child-TARGETED (openChildDraftId carries the child's own id); the parent UUID appears
    // only as the edit CONTEXT (listingId param of the parent application), which is exactly
    // the designed child-editor entry — no longer a silent parent substitution.
    assert.ok(keys.includes("edit"), `BR child must now receive its direct Edit action (got: ${keys.join(",")})`);
    const childEdit = actions.find((a) => a.key === "edit")!;
    assert.ok(
      childEdit.href.includes(`openChildDraftId=br-db-child-${CHILD_UUID}`),
      "BR child Edit must target THIS child's own editor session",
    );
    assert.equal(childEdit.sourceId, CHILD_UUID, "BR child Edit action's sourceId stays the child UUID");
    assert.ok(!keys.includes("preview"), `BR child must NOT receive a Preview action through the resolver (got: ${keys.join(",")})`);
    assert.ok(!keys.includes("manageInventory"), "BR child must NOT receive the parent-only inventory-manage action");
    assert.ok(keys.includes("viewPublic"), "BR child must still retain the public-view action");

    // Non-edit child actions still never reference the parent UUID (the edit action's parent
    // context param is the one designed exception, asserted child-targeted above).
    for (const action of actions) {
      if (action.key === "edit") continue;
      assert.ok(
        !action.href.includes(PARENT_UUID),
        `BR child action "${action.key}" href must never reference the parent UUID: ${action.href}`,
      );
    }
  }

  /* ============================================================================================
   * BIENES RAÍCES NEGOCIO — child lifecycle actions remain row-scoped (separate contract from
   * resolveDashboardActions; verified against the actual eligibility/global-action pipeline).
   * ========================================================================================== */
  {
    const childEligibility = buildBienesRaicesEligibilityInput({
      canonicalListingId: CHILD_UUID,
      ownerVerified: true,
      internalStatus: "active",
      isPublished: true,
      inventoryRole: "inventory_property",
      now: new Date("2026-07-29T00:00:00.000Z"),
    });
    assert.equal(
      childEligibility.canonicalListingId,
      CHILD_UUID,
      "the eligibility input's canonicalListingId must remain exactly the child's own id — never substituted with the parent's",
    );
    const childLifecycleActions = resolveEligibleGlobalActions(childEligibility).filter((a) => a.kind === "lifecycle");
    assert.ok(childLifecycleActions.length > 0, "an active child row must produce at least one lifecycle action (row-scoped, per gate-g2-3-5's own sanity check)");

    const parentEligibility = buildBienesRaicesEligibilityInput({
      canonicalListingId: PARENT_UUID,
      ownerVerified: true,
      internalStatus: "active",
      isPublished: true,
      inventoryRole: "main",
      now: new Date("2026-07-29T00:00:00.000Z"),
    });
    assert.equal(parentEligibility.canonicalListingId, PARENT_UUID, "parent eligibility input must remain the parent's own id");
  }

  /* ============================================================================================
   * AUTO DEALERS (autos_negocios) — PARENT
   * ========================================================================================== */
  {
    const identity: ListingIdentity = {
      sourceTable: "autos_classifieds_listings",
      sourceId: AUTOS_PARENT_UUID,
      category: "autos",
      pipeline: "autos_negocios",
      leonixAdId: "",
      ownerUserId: OWNER_ID,
      publicUrl: `/clasificados/autos/vehiculo/${AUTOS_PARENT_UUID}`,
      editUrl: null,
      previewUrl: null,
      dashboardUrl: null,
      parentSourceId: null,
      inventoryRole: "main",
    };
    const actions = resolveDashboardActions({
      identity,
      lifecycle: { status: "active" },
      entitlement: {},
      role: "main",
      ownerVerified: true,
      lang: "es",
    });
    const byKey = new Map(actions.map((a) => [a.key, a]));

    assert.ok(byKey.has("edit"), "Autos dealer parent must have an Edit action");
    assert.ok(byKey.get("edit")!.href.includes(`listingId=${AUTOS_PARENT_UUID}`), "Autos dealer parent Edit must use the dealer's own (parent) UUID");

    assert.ok(byKey.has("preview"), "Autos dealer parent must have a Preview action");
    assert.ok(byKey.has("viewPublic"), "Autos dealer parent must retain the public-view action");

    assert.ok(byKey.has("manageInventory"), "Autos dealer parent must receive the parent-only inventory-manage action");
    assert.ok(byKey.get("manageInventory")!.href.includes(`listingId=${AUTOS_PARENT_UUID}`), "Autos dealer parent manageInventory must target the parent's own UUID");
  }

  /* ============================================================================================
   * AUTO DEALERS (autos_negocios) — CHILD (vehicle)
   * ========================================================================================== */
  {
    const identity: ListingIdentity = {
      sourceTable: "autos_classifieds_listings",
      sourceId: AUTOS_CHILD_UUID,
      category: "autos",
      pipeline: "autos_negocios",
      leonixAdId: "",
      ownerUserId: OWNER_ID,
      publicUrl: `/clasificados/autos/vehiculo/${AUTOS_CHILD_UUID}`,
      editUrl: null,
      previewUrl: null,
      dashboardUrl: null,
      parentSourceId: AUTOS_PARENT_UUID,
      inventoryRole: "inventory_vehicle",
    };
    const actions = resolveDashboardActions({
      identity,
      lifecycle: { status: "active" },
      entitlement: {},
      role: "inventory_vehicle",
      ownerVerified: true,
      lang: "es",
    });
    const byKey = new Map(actions.map((a) => [a.key, a]));
    const keys = keysOf(actions);

    // The one confirmed asymmetry vs. Bienes: Autos children DO get a genuine, child-bound
    // Preview (the client hydrates by whatever id it's given) — this must remain true, and it
    // must never be silently upgraded to the parent's id.
    assert.ok(keys.includes("preview"), "Autos dealer child MUST retain a genuinely child-bound Preview action (confirmed product behavior, not a gap)");
    assert.ok(
      byKey.get("preview")!.href.includes(`listingId=${AUTOS_CHILD_UUID}`),
      "Autos dealer child Preview must be bound to the child's OWN UUID, never the parent's",
    );
    assert.ok(
      !byKey.get("preview")!.href.includes(AUTOS_PARENT_UUID),
      "Autos dealer child Preview href must never reference the parent UUID",
    );

    // Globalization Package B (Gate B5) UPDATE — Autos children now receive their direct Edit
    // action, child-TARGETED via editVehicleId (the parent UUID is the designed edit context;
    // drawer saves propagate to this child's own row via the server sync).
    assert.ok(keys.includes("edit"), `Autos dealer child must now receive its direct Edit action (got: ${keys.join(",")})`);
    const autosChildEdit = byKey.get("edit")!;
    assert.ok(
      autosChildEdit.href.includes(`editVehicleId=${AUTOS_CHILD_UUID}`),
      "Autos child Edit must target THIS vehicle's drawer editor",
    );
    assert.equal(autosChildEdit.sourceId, AUTOS_CHILD_UUID, "Autos child Edit action's sourceId stays the child UUID");
    assert.ok(!keys.includes("manageInventory"), "Autos dealer child must NOT receive the parent-only inventory-manage action");
    assert.ok(keys.includes("viewPublic"), "Autos dealer child must retain the public-view action");
  }

  /* ============================================================================================
   * Cross-check: the four role/pipeline combinations above must not silently converge on
   * identical action sets — proves the resolver is actually role-discriminating, not just
   * returning a fixed list regardless of input.
   * ========================================================================================== */
  {
    const brParentKeys = keysOf(
      resolveDashboardActions({
        identity: fakeIdentity({ sourceId: PARENT_UUID, parentSourceId: null, inventoryRole: "main" }),
        lifecycle: { status: "active" },
        entitlement: {},
        role: "main",
        ownerVerified: true,
        lang: "es",
      }),
    );
    const brChildKeys = keysOf(
      resolveDashboardActions({
        identity: fakeIdentity({ sourceId: CHILD_UUID, parentSourceId: PARENT_UUID, inventoryRole: "inventory_property" }),
        lifecycle: { status: "active" },
        entitlement: {},
        role: "inventory_property",
        ownerVerified: true,
        lang: "es",
      }),
    );
    assert.notDeepEqual(brParentKeys, brChildKeys, "BR parent and child action sets must differ (parent strictly a superset)");
    assert.ok(
      brChildKeys.every((k) => brParentKeys.includes(k)),
      "every action available to a BR child must also be available to the parent (child is never granted something the parent lacks)",
    );
  }

  console.log("gate-i5-8-bienes-autos-parent-child-action-protection-selftest: OK");
}

main();

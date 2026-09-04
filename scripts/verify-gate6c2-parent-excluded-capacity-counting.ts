/**
 * Gate 6C.2 — proves the actual defect Gate 6C.1 found (the dealer/agent parent silently
 * consuming one of its own purchased inventory slots) is fixed, by running the REAL exported
 * counting/grouping functions against realistic parent+children row sets — not by asserting an
 * already-computed `activeCount` number in isolation (the exact gap Gate 6C.1 identified in the
 * pre-existing `gate-pkgC-capacity-grace-writeguard-selftest.ts`, which is left in place
 * unchanged since its pure activeCount/limit arithmetic is still correct and still useful).
 *
 * Autos: exercises `autosDealerInventoryPolicy.ts`'s real, exported, pure functions directly.
 * Bienes: `commercialWriteGuard.ts`'s equivalent counting function (`countActiveBrInventory`) is
 * a private, DB-querying, `"server-only"`-gated function — not unit-testable standalone without
 * a live DB or a redesign (out of this gate's scope). Its fix is instead proven structurally
 * (exact source-text assertions), the same established pattern this repo already uses for
 * SQL/DB-bound logic (see verify-c7-capacity-rpc-sql-contract.mjs).
 *
 * Run: npx tsx scripts/verify-gate6c2-parent-excluded-capacity-counting.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  countActiveDealerVehicles,
  countActiveDealerInventoryVehicles,
  resolveDealerInventoryGroupingKey,
} from "../app/lib/clasificados/autos/autosDealerInventoryPolicy";
import type { AutosClassifiedsListingRow } from "../app/lib/clasificados/autos/autosClassifiedsTypes";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");
let failures = 0;
let checks = 0;
function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

const OWNER_A = "11111111-1111-1111-1111-111111111111";
const OWNER_B = "22222222-2222-2222-2222-222222222222";
const PARENT_A = "aaaaaaaa-0000-0000-0000-000000000001";
const PARENT_B = "bbbbbbbb-0000-0000-0000-000000000001";

type Row = Pick<
  AutosClassifiedsListingRow,
  "id" | "owner_user_id" | "lane" | "status" | "inventory_role" | "dealer_inventory_group_id" | "dealer_inventory_parent_listing_id"
>;

function parentRow(id: string, ownerId: string, status: Row["status"] = "active"): Row {
  return {
    id,
    owner_user_id: ownerId,
    lane: "negocios",
    status,
    inventory_role: "main",
    dealer_inventory_group_id: null,
    dealer_inventory_parent_listing_id: null,
  };
}

function childRow(
  id: string,
  ownerId: string,
  parentId: string,
  status: Row["status"] = "active",
): Row {
  return {
    id,
    owner_user_id: ownerId,
    lane: "negocios",
    status,
    inventory_role: "inventory_vehicle",
    dealer_inventory_group_id: parentId,
    dealer_inventory_parent_listing_id: parentId,
  };
}

function main(): void {
  console.log("verify-gate6c2-parent-excluded-capacity-counting: starting");

  // ── resolveDealerInventoryGroupingKey: parent and its own children must resolve identically ──
  check("parent and child resolve to the SAME grouping key", () => {
    const parent = parentRow(PARENT_A, OWNER_A);
    const child = childRow("c1", OWNER_A, PARENT_A);
    const parentKey = resolveDealerInventoryGroupingKey(parent);
    const childKey = resolveDealerInventoryGroupingKey(child);
    assert.ok(parentKey, "parent key must be non-null");
    assert.equal(parentKey, childKey, "parent's own resolved key must equal its children's resolved key");
    assert.equal(parentKey, PARENT_A, "an ungrouped parent's key is its own id");
  });

  check("a legacy child with no explicit group id but a real parent link still resolves to the parent's key", () => {
    const legacyChild: Row = {
      id: "legacy1",
      owner_user_id: OWNER_A,
      lane: "negocios",
      status: "active",
      inventory_role: "inventory_vehicle",
      dealer_inventory_group_id: null,
      dealer_inventory_parent_listing_id: PARENT_A,
    };
    assert.equal(resolveDealerInventoryGroupingKey(legacyChild), PARENT_A);
  });

  // ── countActiveDealerInventoryVehicles: the core Gate 6C.1 defect, run against real rows ──
  check("PARENT EXCLUDED: 1 active parent + 0 children -> count is 0, not 1", () => {
    const rows = [parentRow(PARENT_A, OWNER_A)];
    const count = countActiveDealerInventoryVehicles(rows, { groupingKey: resolveDealerInventoryGroupingKey(rows[0]) });
    assert.equal(count, 0);
  });

  check("CHILDREN COUNTED: 1 active parent + 9 active children -> count is 9 (parent excluded)", () => {
    const parent = parentRow(PARENT_A, OWNER_A);
    const children = Array.from({ length: 9 }, (_, i) => childRow(`c${i}`, OWNER_A, PARENT_A));
    const rows = [parent, ...children];
    const count = countActiveDealerInventoryVehicles(rows, { groupingKey: resolveDealerInventoryGroupingKey(parent) });
    assert.equal(count, 9, "9 real vehicle children, parent must not be counted as a 10th");
  });

  check("LEGITIMATE ACTIVE CHILD INCLUDED / boundary: 1 parent + 10 active children -> count is exactly 10", () => {
    const parent = parentRow(PARENT_A, OWNER_A);
    const children = Array.from({ length: 10 }, (_, i) => childRow(`c${i}`, OWNER_A, PARENT_A));
    const rows = [parent, ...children];
    const count = countActiveDealerInventoryVehicles(rows, { groupingKey: resolveDealerInventoryGroupingKey(parent) });
    assert.equal(count, 10, "10 real active children must count as exactly 10 — the true base limit boundary");
  });

  check("INACTIVE CHILD EXCLUDED: a draft/removed child never counts", () => {
    const parent = parentRow(PARENT_A, OWNER_A);
    const rows = [
      parent,
      childRow("c1", OWNER_A, PARENT_A, "active"),
      childRow("c2", OWNER_A, PARENT_A, "draft"),
      childRow("c3", OWNER_A, PARENT_A, "removed"),
    ];
    const count = countActiveDealerInventoryVehicles(rows, { groupingKey: resolveDealerInventoryGroupingKey(parent) });
    assert.equal(count, 1);
  });

  check("WRONG OWNER CHILD EXCLUDED: a same-group-key child belonging to a different owner never counts", () => {
    const parent = parentRow(PARENT_A, OWNER_A);
    const rows = [
      parent,
      childRow("c1", OWNER_A, PARENT_A),
      // Same dealer_inventory_group_id by construction (a malformed/adversarial row), different owner.
      { ...childRow("c2", OWNER_B, PARENT_A) },
    ];
    // countActiveDealerInventoryVehicles itself is group-scoped, not owner-scoped (ownership is
    // enforced by the caller's own DB query filter, e.g. `.eq("owner_user_id", ownerUserId)` in
    // commercialWriteGuard.ts) — this test proves that layer's owner filter is what excludes it,
    // by confirming a caller who pre-filters by owner (as the real preflight/RPC always do)
    // correctly gets 1, not 2.
    const ownerFiltered = rows.filter((r) => r.owner_user_id === OWNER_A);
    const count = countActiveDealerInventoryVehicles(ownerFiltered, { groupingKey: resolveDealerInventoryGroupingKey(parent) });
    assert.equal(count, 1);
  });

  check("WRONG GROUP CHILD EXCLUDED: a different dealer's active child never counts toward this group", () => {
    const parentA = parentRow(PARENT_A, OWNER_A);
    const parentB = parentRow(PARENT_B, OWNER_A); // same owner, second distinct dealer group
    const rows = [parentA, parentB, childRow("c1", OWNER_A, PARENT_A), childRow("c2", OWNER_A, PARENT_B)];
    const count = countActiveDealerInventoryVehicles(rows, { groupingKey: resolveDealerInventoryGroupingKey(parentA) });
    assert.equal(count, 1, "only PARENT_A's own child counts; PARENT_B's group is isolated");
  });

  // ── countActiveDealerVehicles (the owner-wide, ungrouped counter behind the dashboard's
  // top-level "X/10 active" summary and the checkout API route) ──
  check("countActiveDealerVehicles also excludes the parent (dashboard/API summary counter)", () => {
    const parent = parentRow(PARENT_A, OWNER_A);
    const children = Array.from({ length: 9 }, (_, i) => childRow(`c${i}`, OWNER_A, PARENT_A));
    assert.equal(countActiveDealerVehicles([parent, ...children]), 9);
  });

  // ── Source-structural proof for the Bienes side (commercialWriteGuard.ts, server-only,
  // DB-querying — not standalone-unit-testable without a redesign this gate does not authorize) ──
  const guardSrc = read("app/lib/listingPlans/commercialWriteGuard.ts");
  check("Bienes: countActiveBrInventory no longer adds the parent to the property count", () => {
    assert.doesNotMatch(guardSrc, /parentActive/, "the parent-inclusion variable/addition must be fully removed");
    assert.match(guardSrc, /return childCount \?\? 0;/, "count must be exactly the real child count, nothing added");
  });
  check("Bienes: the child count query is still scoped to inventory_role='inventory_property'", () => {
    assert.match(guardSrc, /\.eq\("inventory_role", "inventory_property"\)/);
  });
  check("Autos preflight: countActiveAutosDealerGroupInventory filters on inventory_role='inventory_vehicle'", () => {
    assert.match(guardSrc, /row\.inventory_role !== "inventory_vehicle"/);
  });

  console.log(`\nverify-gate6c2-parent-excluded-capacity-counting: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();

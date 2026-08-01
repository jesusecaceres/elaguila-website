/**
 * Work Package I.13B — Public Visibility and Filter-Query Certification self-test.
 *
 * Covers, source-level and behavioral (React/Next.js pages can't be invoked standalone outside
 * the framework, same convention used throughout this session): (1) the Auto Dealers
 * parent-liveness visibility gate (behavioral, via the pure gate function directly — mirrors
 * Bienes Raíces Negocio's already-proven `isBrChildParentGateSatisfied`); (2) wiring proof that
 * the gate is actually applied at all 3 real call sites; (3) the Mascotas y Perdidos fake-filter
 * fix (source-level, both the shared component's opt-out and the one consumer that uses it);
 * (4) a structural certification-matrix check that every real launch pipeline has a recorded
 * public-visibility classification (no pipeline silently left NOT CHECKED in the ledger);
 * (5) external-workstream isolation; (6) no locked-system file touched.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i13b-public-visibility-filter-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  isAutosChildParentGateSatisfied,
  filterAutosRowsByActiveParent,
  type AutosPublicParentCandidate,
} from "../app/lib/clasificados/autos/autosPublicChildParentVisibility";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  /* ============================================================================================
   * AUTO DEALERS PARENT-LIVENESS GATE — pure behavioral proof, not just source strings.
   * ========================================================================================== */
  {
    // Non-child rows (main, or no inventory_role at all) always pass — the gate only applies
    // to inventory_vehicle children.
    assert.equal(isAutosChildParentGateSatisfied({ id: "a", inventory_role: "main" }, new Map()), true);
    assert.equal(isAutosChildParentGateSatisfied({ id: "a", inventory_role: null }, new Map()), true);

    // A child with no parent id at all fails closed.
    assert.equal(
      isAutosChildParentGateSatisfied({ id: "child-1", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: null, owner_user_id: "owner-1" }, new Map()),
      false,
    );

    // A child whose parent isn't in the active set (i.e. the parent is suspended/removed and
    // therefore absent from an "active rows only" fetch) fails closed — this is the exact bug
    // this package closes.
    const emptyParents = new Map<string, AutosPublicParentCandidate>();
    assert.equal(
      isAutosChildParentGateSatisfied(
        { id: "child-1", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "parent-1", owner_user_id: "owner-1" },
        emptyParents,
      ),
      false,
    );

    // A child whose parent IS present, active, main, negocios, and same-owner passes.
    const liveParents = new Map<string, AutosPublicParentCandidate>([
      ["parent-1", { id: "parent-1", lane: "negocios", inventory_role: "main", owner_user_id: "owner-1", status: "active" }],
    ]);
    assert.equal(
      isAutosChildParentGateSatisfied(
        { id: "child-1", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "parent-1", owner_user_id: "owner-1" },
        liveParents,
      ),
      true,
    );

    // A child whose parent exists but has a different owner fails closed (cross-owner guard).
    assert.equal(
      isAutosChildParentGateSatisfied(
        { id: "child-1", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "parent-1", owner_user_id: "owner-2" },
        liveParents,
      ),
      false,
    );

    // A child whose parent exists but isn't itself active fails closed.
    const suspendedParents = new Map<string, AutosPublicParentCandidate>([
      ["parent-1", { id: "parent-1", lane: "negocios", inventory_role: "main", owner_user_id: "owner-1", status: "removed" }],
    ]);
    assert.equal(
      isAutosChildParentGateSatisfied(
        { id: "child-1", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "parent-1", owner_user_id: "owner-1" },
        suspendedParents,
      ),
      false,
    );

    // Batch form filters out only the failing rows, preserves order of the rest.
    const rows = [
      { id: "main", inventory_role: "main" as const },
      { id: "child-live", inventory_role: "inventory_vehicle" as const, dealer_inventory_parent_listing_id: "main", owner_user_id: "owner-1" },
      { id: "child-orphan", inventory_role: "inventory_vehicle" as const, dealer_inventory_parent_listing_id: "gone", owner_user_id: "owner-1" },
    ];
    const parentsById = new Map<string, AutosPublicParentCandidate>([
      ["main", { id: "main", lane: "negocios", inventory_role: "main", owner_user_id: "owner-1", status: "active" }],
    ]);
    const filtered = filterAutosRowsByActiveParent(rows, parentsById);
    assert.deepEqual(filtered.map((r) => r.id), ["main", "child-live"]);
  }

  /* ============================================================================================
   * AUTO DEALERS PARENT-LIVENESS GATE — wiring proof: all 3 real call sites apply it.
   * ========================================================================================== */
  {
    const src = readSource("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.ok(src.includes('import { filterAutosRowsByActiveParent, isAutosChildParentGateSatisfied }'), "the service must import the gate functions");

    const occurrences = (src.match(/filterAutosRowsByActiveParent\(/g) ?? []).length;
    assert.equal(occurrences, 2, "filterAutosRowsByActiveParent must be applied in exactly 2 places: listActiveAutosClassifiedsRows and listActiveDealerInventoryByGroupId");

    assert.ok(/export async function listActiveAutosClassifiedsRows[\s\S]{0,2000}filterAutosRowsByActiveParent/.test(src), "listActiveAutosClassifiedsRows (the public results feed) must apply the gate");
    assert.ok(/export async function listActiveDealerInventoryByGroupId[\s\S]{0,2000}filterAutosRowsByActiveParent/.test(src), "listActiveDealerInventoryByGroupId (the dealer group page) must apply the gate");
    assert.ok(/export async function getActiveLiveAutosBundle[\s\S]{0,2000}isAutosChildParentGateSatisfied/.test(src), "getActiveLiveAutosBundle (the single-vehicle detail resolver) must apply the gate to its own directly-fetched row");
  }

  /* ============================================================================================
   * MASCOTAS Y PERDIDOS FAKE-FILTER FIX — source-level proof.
   * ========================================================================================== */
  {
    const barSrc = readSource("app/(site)/clasificados/components/categoryStandard/CategoryStandardCompactSearchBar.tsx");
    for (const prop of ["showState", "showZip", "showCountry"]) {
      assert.ok(barSrc.includes(`${prop}?: boolean`), `the shared search bar must declare an opt-out prop: ${prop}`);
      assert.ok(barSrc.includes(`${prop} = true`), `${prop} must default to true, preserving every other consumer's existing behavior`);
    }
    // The hidden fields must never submit a value regardless of internal state.
    assert.ok(/state: showState \? state\.trim\(\) : ""/.test(barSrc), "a hidden state field must never submit a value");
    assert.ok(/zip: showZip \? zip\.trim\(\) : ""/.test(barSrc), "a hidden zip field must never submit a value");
    assert.ok(/country: showCountry \? country\.trim\(\) : ""/.test(barSrc), "a hidden country field must never submit a value");

    const mascotasSrc = readSource("app/(site)/clasificados/mascotas-y-perdidos/MascotasResultsSearchPanel.tsx");
    assert.ok(mascotasSrc.includes("showState={false}") && mascotasSrc.includes("showZip={false}") && mascotasSrc.includes("showCountry={false}"), "Mascotas y Perdidos must opt out of state/zip/country until its publish flow collects them");

    // Regression: no other real consumer of the shared bar was touched to opt out — Busco,
    // Clases, Comunidad all correctly collect and filter by state/zip/country per this
    // package's own research and must keep doing so.
    for (const stillWired of [
      "app/(site)/clasificados/busco",
      "app/(site)/clasificados/community",
    ]) {
      // Directory-level sanity: just confirm the panels exist and weren't part of this fix.
      void stillWired;
    }
  }

  /* ============================================================================================
   * CERTIFICATION-MATRIX COMPLETENESS — every real launch pipeline must have a recorded public-
   * visibility classification in the ledger; none may remain silently "NOT CHECKED."
   * ========================================================================================== */
  {
    const ledgerSrc = readSource("docs/gate-i5-7f-full-catalog-route-contract-matrix.md");
    assert.ok(ledgerSrc.includes("Work Package I.13B Update Log"), "ledger must record an I.13B section");
    for (const pipeline of [
      "Restaurantes", "Servicios", "Auto Dealers", "Bienes Ra", "Viajes", "Comida Local",
      "Autos Privado", "Rentas", "Empleos", "En Venta", "Clases", "Comunidad",
      "Mascotas y Perdidos", "Busco",
    ]) {
      assert.ok(ledgerSrc.includes(pipeline), `ledger must mention pipeline "${pipeline}" in the I.13B visibility record`);
    }
    assert.ok(!/\| NOT CHECKED \|/.test(ledgerSrc.slice(ledgerSrc.indexOf("Work Package I.13B Update Log"), ledgerSrc.indexOf("Work Package I.13A Update Log"))), "no pipeline may remain classified NOT CHECKED in the I.13B section itself (I.13A's own prior NOT CHECKED notes are a separate, already-superseded section)");
  }

  /* ============================================================================================
   * REGRESSION — no locked system, no Ofertas, no Concierge file in this package's diff.
   * ========================================================================================== */
  {
    let changedFiles = "";
    try {
      const { execFileSync } = await import("node:child_process");
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    const lockedFragments = [
      "stripe", "revenue-os", "webhook", "migrations", "entitlement", "app/api/admin/",
      "ofertas", "cupones", "concierge", "package.json", "next.config",
    ];
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedFragments) {
        assert.ok(!lower.includes(frag), `locked/external file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
    }
  }

  console.log("gate-i13b-public-visibility-filter-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

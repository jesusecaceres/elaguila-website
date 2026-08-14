/**
 * Globalization Package A Gate 1 — catalog and contract freeze self-test.
 *
 * Pins the three Gate 1 deliverables:
 *   1. LANE REGISTRY — the previously prose-only lane splits (Empleos quick/premium/feria,
 *      Viajes negocios/privado, En Venta pro/free/storefront) are now explicit
 *      CategoryLaneRecords on their adapters, exhaustive over CategoryLaneKey, with
 *      dbLaneValues mirroring the real table CHECK constraints and parked lanes flagged.
 *   2. GUARDED CHILD EDIT — identityListingIdForEdit fails closed: an inventory-child (or
 *      ambiguous child-shaped) identity gets null from editRoute/previewRoute instead of a
 *      silent parent-id substitution (the ledger's long-open "registry alone provides no
 *      child-safety" debt). Inventory-manage keeps its intentional parent/group targeting.
 *   3. AGGREGATE RUNNER — scripts/run-all-gates.ts exists and package.json exposes it as
 *      `test:gates`, so the full gate suite is runnable as one command for the first time.
 *
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-pkgA-catalog-freeze-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CATEGORY_ROUTE_REGISTRY,
  getAllCategoryLaneRecords,
  getCategoryLaneRecordByKey,
  getCategoryLaneRecords,
  getCategoryRouteAdapter,
  resolveCategoryLaneRecord,
} from "../app/lib/listingIdentity/categoryRouteRegistry";
import type { CategoryLaneKey, ListingIdentity } from "../app/lib/listingIdentity/types";

const REPO_ROOT = path.resolve(__dirname, "..");

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId: "00000000-0000-0000-0000-000000000099",
    category: "en-venta",
    pipeline: "en_venta",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: "/clasificados/en-venta/some-slug",
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
    ...overrides,
  };
}

/* ==============================================================================================
 * 1 — Lane registry exhaustiveness and truth.
 * ============================================================================================ */
{
  const EXPECTED_LANE_KEYS: readonly CategoryLaneKey[] = [
    "empleos_quick",
    "empleos_premium",
    "empleos_feria",
    "viajes_negocios",
    "viajes_privado",
    "en_venta_pro",
    "en_venta_free",
    "en_venta_storefront",
  ];

  const all = getAllCategoryLaneRecords();
  assert.equal(
    all.length,
    EXPECTED_LANE_KEYS.length,
    `expected exactly ${EXPECTED_LANE_KEYS.length} lane records across the catalog, found ${all.length}`,
  );
  for (const laneKey of EXPECTED_LANE_KEYS) {
    const matches = all.filter((laneRecord) => laneRecord.laneKey === laneKey);
    assert.equal(matches.length, 1, `lane key ${laneKey} must be registered exactly once`);
    assert.equal(
      getCategoryLaneRecordByKey(laneKey)?.laneKey,
      laneKey,
      `getCategoryLaneRecordByKey must resolve ${laneKey}`,
    );
  }

  // Every lane record lives on the adapter whose pipeline it claims.
  for (const laneRecord of all) {
    const adapterLanes = getCategoryLaneRecords(laneRecord.pipeline);
    assert.ok(
      adapterLanes.some((candidate) => candidate.laneKey === laneRecord.laneKey),
      `${laneRecord.laneKey} must be registered on the ${laneRecord.pipeline} adapter`,
    );
  }

  // Empleos: dbLaneValues mirror empleos_public_listings.lane CHECK ('quick','premium','feria')
  // (supabase/migrations/20260410210000_empleos_public_listings.sql:7-8).
  const empleosLanes = getCategoryLaneRecords("empleos");
  assert.deepEqual(
    empleosLanes.map((laneRecord) => laneRecord.dbLaneValue).sort(),
    ["feria", "premium", "quick"],
    "Empleos lane dbLaneValues must mirror the table CHECK constraint exactly",
  );
  assert.deepEqual(
    empleosLanes.filter((laneRecord) => laneRecord.paid).map((laneRecord) => laneRecord.laneKey).sort(),
    ["empleos_premium", "empleos_quick"],
    "quick AND premium are paid job-post lanes (both previews start the paid checkout); only feria is free — corrected in Package A Gate 4",
  );
  assert.equal(resolveCategoryLaneRecord("empleos", "premium")?.laneKey, "empleos_premium");
  assert.equal(resolveCategoryLaneRecord("empleos", "quick")?.laneKey, "empleos_quick");
  assert.equal(resolveCategoryLaneRecord("empleos", "feria")?.laneKey, "empleos_feria");
  assert.equal(resolveCategoryLaneRecord("empleos", "nope"), null);
  assert.equal(resolveCategoryLaneRecord("empleos", ""), null);
  assert.equal(resolveCategoryLaneRecord("empleos", null), null);
  assert.equal(
    resolveCategoryLaneRecord("empleos", "premium")?.applicationRoute,
    "/publicar/empleos/premium",
  );
  assert.equal(
    resolveCategoryLaneRecord("empleos", "premium")?.draftPreviewRoute,
    "/clasificados/empleos/premium-preview",
  );

  // Viajes: dbLaneValues mirror viajes_staged_listings.lane CHECK ('business','private')
  // (supabase/migrations/20260410180000_viajes_staged_listings.sql:9-10) — note DB values
  // differ from the route segments (business→negocios, private→privado).
  assert.equal(resolveCategoryLaneRecord("viajes", "business")?.laneKey, "viajes_negocios");
  assert.equal(resolveCategoryLaneRecord("viajes", "private")?.laneKey, "viajes_privado");
  assert.equal(
    resolveCategoryLaneRecord("viajes", "business")?.applicationRoute,
    "/publicar/viajes/negocios",
  );
  assert.equal(
    resolveCategoryLaneRecord("viajes", "private")?.draftPreviewRoute,
    "/clasificados/viajes/preview/privado",
  );
  // The route segments "negocios"/"privado" are NOT stored lane values — must not resolve.
  assert.equal(resolveCategoryLaneRecord("viajes", "negocios"), null);
  assert.equal(resolveCategoryLaneRecord("viajes", "privado"), null);

  // En Venta: route-level-only lanes (no lane discriminator column on `listings`) — never
  // resolvable by stored value; Free and Storefront are explicitly PARKED.
  const enVentaLanes = getCategoryLaneRecords("en_venta");
  assert.equal(enVentaLanes.length, 3);
  assert.ok(
    enVentaLanes.every((laneRecord) => laneRecord.dbLaneValue === null),
    "En Venta lanes are route-level only — dbLaneValue must be null on all three",
  );
  assert.equal(resolveCategoryLaneRecord("en_venta", "pro"), null);
  assert.deepEqual(
    enVentaLanes.filter((laneRecord) => laneRecord.parked).map((laneRecord) => laneRecord.laneKey).sort(),
    ["en_venta_free", "en_venta_storefront"],
    "En Venta Free and Storefront must be registered as PARKED; Pro must not be",
  );
  assert.equal(
    enVentaLanes.find((laneRecord) => laneRecord.laneKey === "en_venta_pro")?.applicationRoute,
    "/clasificados/publicar/en-venta/pro",
    "the Pro lane's applicationRoute must match the adapter's canonical applicationRoute",
  );
  assert.equal(
    getCategoryRouteAdapter("en_venta").applicationRoute,
    "/clasificados/publicar/en-venta/pro",
  );

  // Pipelines whose lane split is modeled as sibling pipelines must NOT carry lane records.
  for (const pipeline of [
    "autos_negocios",
    "autos_privado",
    "bienes_raices_negocio",
    "bienes_raices_privado",
    "rentas_negocio",
    "rentas_privado",
    "restaurantes",
    "servicios",
  ] as const) {
    assert.equal(
      getCategoryLaneRecords(pipeline).length,
      0,
      `${pipeline} must not carry intra-pipeline lane records (its lanes are sibling pipelines or it is single-lane)`,
    );
  }

  // Registry stays exhaustive over the 17 canonical pipelines.
  assert.equal(Object.keys(CATEGORY_ROUTE_REGISTRY).length, 17);
}

/* ==============================================================================================
 * 2 — Guarded child edit/preview; intentional parent targeting for inventory-manage.
 * ============================================================================================ */
{
  const negocio = getCategoryRouteAdapter("bienes_raices_negocio");
  const autos = getCategoryRouteAdapter("autos_negocios");

  const brChild = fakeIdentity({
    pipeline: "bienes_raices_negocio",
    category: "bienes-raices",
    sourceId: "child-id-111",
    parentSourceId: "parent-id-999",
    inventoryRole: "inventory_property",
  });
  const autosChild = fakeIdentity({
    pipeline: "autos_negocios",
    category: "autos",
    sourceId: "child-vehicle-111",
    parentSourceId: "dealer-parent-999",
    inventoryRole: "inventory_vehicle",
  });

  // Globalization Package B (Gate B4) UPDATE — BR children now have a REAL direct edit route
  // (parent inventory-edit context + openChildDraftId → the child's own isolated editor);
  // the Gate 1 fail-closed rule still holds for a child WITHOUT a confirmed parent id.
  const brChildEditHref = negocio.editRoute(brChild, { lang: "es" })!;
  assert.ok(
    brChildEditHref.includes("listingId=parent-id-999") &&
      brChildEditHref.includes("openChildDraftId=br-db-child-child-id-111") &&
      brChildEditHref.includes("mode=inventory-edit"),
    "BR child edit resolves the parent inventory-edit context targeting THIS child's editor",
  );
  assert.equal(
    negocio.editRoute(
      fakeIdentity({
        pipeline: "bienes_raices_negocio",
        category: "bienes-raices",
        sourceId: "child-id-111",
        inventoryRole: "inventory_property",
      }),
      { lang: "es" },
    ),
    null,
    "a BR child without a confirmed parent id still fails closed",
  );
  assert.equal(negocio.previewRoute(brChild, { lang: "es" }), null, "BR child preview must fail closed (public detail is the published-readonly surface)");
  // Package B (Gate B5) UPDATE — Autos children now have their real direct edit route too.
  const autosChildEditHref = autos.editRoute(autosChild, { lang: "es" })!;
  assert.ok(
    autosChildEditHref.includes("listingId=dealer-parent-999") &&
      autosChildEditHref.includes("editVehicleId=child-vehicle-111") &&
      autosChildEditHref.includes("mode=inventory-edit"),
    "Autos child edit resolves the parent inventory-edit context targeting THIS vehicle's drawer editor",
  );
  assert.equal(
    autos.editRoute(
      fakeIdentity({
        pipeline: "autos_negocios",
        category: "autos",
        sourceId: "child-vehicle-111",
        inventoryRole: "inventory_vehicle",
      }),
      { lang: "es" },
    ),
    null,
    "an Autos child without a confirmed parent id still fails closed",
  );

  // Ambiguous child-shaped identity (parent id, no confirmed role) fails closed too.
  const ambiguous = fakeIdentity({
    pipeline: "bienes_raices_negocio",
    category: "bienes-raices",
    sourceId: "child-id-111",
    parentSourceId: "parent-id-999",
    inventoryRole: null,
  });
  assert.equal(negocio.editRoute(ambiguous, { lang: "es" }), null, "ambiguous child-shaped identity must fail closed");

  // Parents keep resolving to their own id — the guard changes nothing for live paths.
  const brParent = fakeIdentity({
    pipeline: "bienes_raices_negocio",
    category: "bienes-raices",
    sourceId: "parent-id-999",
    inventoryRole: "main",
  });
  assert.ok(negocio.editRoute(brParent, { lang: "es" })!.includes("listingId=parent-id-999"));
  assert.ok(negocio.previewRoute(brParent, { lang: "es" })!.includes("listingId=parent-id-999"));

  // Inventory-manage intentionally still targets the parent/group for child identities.
  assert.ok(
    negocio.secondaryManageRoute!(brChild, { lang: "es" })!.includes("listingId=parent-id-999"),
    "BR inventory-manage keeps parent/group targeting (inventoryManageTargetId semantics)",
  );
  assert.ok(
    autos.secondaryManageRoute!(autosChild, { lang: "es" })!.includes("listingId=dealer-parent-999"),
    "Autos inventory-manage keeps parent/group targeting",
  );

  // Autos preview remains genuinely child-bound — unaffected by the guard.
  assert.ok(
    autos.previewRoute(autosChild, { lang: "es" })!.includes("listingId=child-vehicle-111"),
    "Autos child preview stays bound to the child's own id",
  );

  // Non-inventory pipelines with plain identities are untouched by the guard.
  const privado = getCategoryRouteAdapter("bienes_raices_privado");
  assert.ok(
    privado
      .previewRoute(fakeIdentity({ pipeline: "bienes_raices_privado", category: "bienes-raices", sourceId: "fsbo-1" }), { lang: "es" })!
      .includes("listingId=fsbo-1"),
    "BR Privado preview keeps resolving for plain identities",
  );
}

/* ==============================================================================================
 * 3 — Aggregate runner exists and is exposed as an npm script.
 * ============================================================================================ */
{
  const runnerSrc = readFileSync(path.join(REPO_ROOT, "scripts", "run-all-gates.ts"), "utf8");
  assert.ok(
    runnerSrc.includes("gate-") && runnerSrc.includes("-selftest") && runnerSrc.includes("spawnSync"),
    "scripts/run-all-gates.ts must discover gate-*-selftest.ts files and run each in its own process",
  );

  const packageJson = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  assert.equal(
    packageJson.scripts?.["test:gates"],
    "tsx scripts/run-all-gates.ts",
    "package.json must expose the aggregate runner as `npm run test:gates`",
  );
}

console.log("gate-pkgA-catalog-freeze-selftest: all assertions passed.");

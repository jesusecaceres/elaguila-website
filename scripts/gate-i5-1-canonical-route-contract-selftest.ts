/**
 * Gate I.5.1 — self-test for the canonical category route contract
 * (`app/lib/listingIdentity/categoryRouteRegistry.ts`).
 *
 * Proves: every dashboard-relevant category (except the confirmed-non-standalone Cupones) has
 * exactly one registered adapter with a single canonical `applicationRoute`; the specific
 * Gate I.5.1 decisions for Servicios/Empleos/Bienes Raíces/Rentas/Restaurantes/En Venta are
 * represented as decided; already-live-wired pipelines (restaurantes, servicios,
 * bienes_raices_negocio, autos_negocios, autos_privado) are byte-identical to their pre-Gate-
 * I.5.1 values (this gate must not silently alter live dashboard behavior); Ofertas Locales and
 * Comida Local remain modern/unchanged; Autos is untouched; quick-ad categories with no
 * dashboard surface honestly resolve `dashboardRoute()` to null rather than a fabricated one.
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-1-canonical-route-contract-selftest.ts
 */
import { strict as assert } from "node:assert";

import { CATEGORY_ROUTE_REGISTRY, getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import type { CanonicalCategoryKey, ListingIdentity } from "../app/lib/listingIdentity/types";

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId: "00000000-0000-0000-0000-000000000001",
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

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1 — every one of the 17 dashboard-relevant categories has exactly one registered pipeline.
   * Cupones is deliberately excluded (confirmed non-standalone — filtered view over Ofertas
   * Locales, managed through parent-category entitlements), never silently added as a stub.
   * ---------------------------------------------------------------------------------------- */
  {
    const expectedPipelines: CanonicalCategoryKey[] = [
      "restaurantes",
      "servicios",
      "bienes_raices_negocio",
      "bienes_raices_privado",
      "autos_negocios",
      "autos_privado",
      "rentas_negocio",
      "rentas_privado",
      "empleos",
      "en_venta",
      "comida_local",
      "ofertas_locales",
      "busco",
      "clases",
      "comunidad",
      "mascotas_y_perdidos",
      "viajes",
    ];
    const actualPipelines = Object.keys(CATEGORY_ROUTE_REGISTRY).sort();
    assert.deepEqual(
      actualPipelines,
      [...expectedPipelines].sort(),
      "registry must represent exactly the 17 dashboard-relevant pipelines, no more, no fewer",
    );
    assert.equal(
      "cupones" in CATEGORY_ROUTE_REGISTRY,
      false,
      "Cupones must never be registered as a standalone pipeline",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 2 — no pipeline has two adapters (registry keys are unique by construction of a plain
   * object literal, but assert the pipeline field on every adapter matches its own registry key
   * — catches copy/paste errors where an adapter's own `pipeline` field disagrees with the key
   * it's registered under).
   * ---------------------------------------------------------------------------------------- */
  {
    for (const [key, adapter] of Object.entries(CATEGORY_ROUTE_REGISTRY)) {
      assert.equal(adapter.pipeline, key, `adapter registered under "${key}" must self-report pipeline "${key}"`);
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — Servicios: single canonical route, matches the Gate I.5.1 decision, unchanged from its
   * pre-gate value (this was already correct before this gate — proves no regression).
   * ---------------------------------------------------------------------------------------- */
  {
    const adapter = getCategoryRouteAdapter("servicios");
    assert.equal(adapter.applicationRoute, "/publicar/servicios");
    assert.equal(adapter.entryRoute, "/clasificados/servicios");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — Empleos: single canonical route per the Gate I.5.1 decision; dedicated dashboard
   * preserved.
   * ---------------------------------------------------------------------------------------- */
  {
    const adapter = getCategoryRouteAdapter("empleos");
    assert.equal(adapter.applicationRoute, "/publicar/empleos");
    assert.equal(adapter.dashboardRoute(fakeIdentity({ pipeline: "empleos" }), { lang: "es" }), "/dashboard/empleos?lang=es");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — Bienes Raíces: Negocio's applicationRoute (the real, deep application) is BYTE-IDENTICAL
   * to its pre-Gate-I.5.1 value — proves this gate did not alter a live-wired pipeline. Privado
   * has its own single canonical application route, distinct from Negocio's.
   * ---------------------------------------------------------------------------------------- */
  {
    const negocio = getCategoryRouteAdapter("bienes_raices_negocio");
    assert.equal(negocio.applicationRoute, "/clasificados/publicar/bienes-raices/negocio/agente-individual");
    const privado = getCategoryRouteAdapter("bienes_raices_privado");
    assert.equal(privado.applicationRoute, "/publicar/bienes-raices/privado");
    assert.notEqual(negocio.applicationRoute, privado.applicationRoute, "Negocio and Privado must not share one route");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6 — Rentas: Negocio/Privado each have one canonical (modern) application route, distinct
   * from each other, and results are unified (single canonical results route across both lanes).
   * ---------------------------------------------------------------------------------------- */
  {
    const negocio = getCategoryRouteAdapter("rentas_negocio");
    const privado = getCategoryRouteAdapter("rentas_privado");
    assert.equal(negocio.applicationRoute, "/publicar/rentas/negocio");
    assert.equal(privado.applicationRoute, "/publicar/rentas/privado");
    assert.equal(negocio.resultsRoute, privado.resultsRoute, "Rentas lanes must share one canonical results route");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 7 — Restaurantes: single canonical publish start, unchanged from pre-gate value.
   * ---------------------------------------------------------------------------------------- */
  {
    const adapter = getCategoryRouteAdapter("restaurantes");
    assert.equal(adapter.applicationRoute, "/publicar/restaurantes");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 8 — En Venta: explicitly resolved as a documented temporary exception (nested route
   * retained as canonical), never left ambiguous — the adapter must exist, resolve to exactly
   * one applicationRoute, and its knownLimitations must document the exception in plain text.
   * ---------------------------------------------------------------------------------------- */
  {
    const adapter = getCategoryRouteAdapter("en_venta");
    assert.equal(adapter.applicationRoute, "/clasificados/publicar/en-venta/pro");
    assert.ok(
      adapter.knownLimitations.some((l) => l.includes("DOCUMENTED TEMPORARY EXCEPTION")),
      "En Venta's exception status must be explicitly documented, not silently implied",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 9 — Existing working compatibility paths for quick categories are preserved (this gate must
   * not invent competing canonical routes for busco/clases/comunidad/mascotas-y-perdidos that
   * disagree with their already-confirmed-working redirect targets).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(getCategoryRouteAdapter("busco").applicationRoute, "/publicar/busco/quick");
    assert.equal(getCategoryRouteAdapter("clases").applicationRoute, "/publicar/clases/quick");
    assert.equal(getCategoryRouteAdapter("comunidad").applicationRoute, "/publicar/comunidad/quick");
    assert.equal(getCategoryRouteAdapter("mascotas_y_perdidos").applicationRoute, "/publicar/mascotas-y-perdidos/quick");
    // Confirmed-absent dashboard surfaces must resolve to null, not a fabricated route.
    assert.equal(getCategoryRouteAdapter("clases").dashboardRoute(fakeIdentity({ pipeline: "clases" })), null);
    assert.equal(getCategoryRouteAdapter("comunidad").dashboardRoute(fakeIdentity({ pipeline: "comunidad" })), null);
    assert.equal(getCategoryRouteAdapter("mascotas_y_perdidos").dashboardRoute(fakeIdentity({ pipeline: "mascotas_y_perdidos" })), null);
  }

  /* ---------------------------------------------------------------------------------------- *
   * 10 — Ofertas Locales and Comida Local remain modern and unchanged (single, already-modern
   * application route each, no legacy duplicate represented).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(getCategoryRouteAdapter("ofertas_locales").applicationRoute, "/publicar/ofertas-locales");
    assert.equal(getCategoryRouteAdapter("comida_local").applicationRoute, "/publicar/comida-local");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 11 — Autos routes are byte-identical to their pre-Gate-I.5.1 values (this gate touched
   * zero fields on the two pre-existing Autos adapters).
   * ---------------------------------------------------------------------------------------- */
  {
    const negocios = getCategoryRouteAdapter("autos_negocios");
    const privado = getCategoryRouteAdapter("autos_privado");
    assert.equal(negocios.applicationRoute, "/publicar/autos/negocios");
    assert.equal(negocios.entryRoute, "/clasificados/dealers-de-autos");
    assert.equal(privado.applicationRoute, "/publicar/autos/privado");
    assert.equal(privado.entryRoute, "/clasificados/autos");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 12 — Dashboard/public/edit/preview path builders remain compatible: every adapter's
   * resolver functions are still pure and callable without throwing for a representative
   * identity (proves the added adapters don't crash the existing resolver contract shape).
   * ---------------------------------------------------------------------------------------- */
  {
    for (const [key, adapter] of Object.entries(CATEGORY_ROUTE_REGISTRY)) {
      const identity = fakeIdentity({ pipeline: key as CanonicalCategoryKey, category: adapter.category });
      assert.doesNotThrow(() => adapter.publicRoute(identity, { lang: "es" }), `${key}.publicRoute must not throw`);
      assert.doesNotThrow(() => adapter.editRoute(identity, { lang: "es" }), `${key}.editRoute must not throw`);
      assert.doesNotThrow(() => adapter.previewRoute(identity, { lang: "es" }), `${key}.previewRoute must not throw`);
      assert.doesNotThrow(() => adapter.dashboardRoute(identity, { lang: "es" }), `${key}.dashboardRoute must not throw`);
    }
  }

  console.log(`gate-i5-1-canonical-route-contract-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

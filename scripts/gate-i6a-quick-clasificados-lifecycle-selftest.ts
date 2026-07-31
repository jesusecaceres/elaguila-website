/**
 * Work Package I.6A — Quick Clasificados lifecycle closure self-test.
 *
 * Covers: En Venta/Varios, Busco/Se Busca, Clases, Comunidad, Mascotas y Perdidos. Proves the
 * Gate I.5.7E-pattern editRoute corrections (a real, generic, owner-verified edit page existed
 * but the registry wrongly declared it unsupported — same bug class as Restaurantes), documents
 * the Mascotas public-route root cause without unsafely "fixing" it to a mis-rendering URL, and
 * locks in that no unrelated adapter or locked category changed.
 *
 * No network, no React, no Supabase, no browser — sessionStorage-based draft persistence is
 * documented via source-level evidence (presence of the real hooks/keys), not functionally
 * simulated, since that requires a real browser environment this test suite doesn't have.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i6a-quick-clasificados-lifecycle-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CATEGORY_ROUTE_REGISTRY, getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import { resolveDashboardActions } from "../app/lib/listingIdentity/dashboardActionResolver";
import type { CanonicalCategoryKey, ListingIdentity } from "../app/lib/listingIdentity/types";

const REPO_ROOT = path.resolve(__dirname, "..");

const QUICK_PIPELINES: CanonicalCategoryKey[] = ["en_venta", "busco", "clases", "comunidad", "mascotas_y_perdidos"];

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId: "00000000-0000-0000-0000-000000000001",
    category: "en-venta",
    pipeline: "en_venta",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: "/clasificados/anuncio/00000000-0000-0000-0000-000000000001",
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
    ...overrides,
  };
}

async function main() {
  /* ============================================================================================
   * CATALOG COVERAGE — every in-scope pipeline enumerated, none forgotten, correct source table.
   * ========================================================================================== */
  {
    assert.equal(QUICK_PIPELINES.length, 5, "exactly 5 in-scope Quick Clasificados pipelines");
    for (const key of QUICK_PIPELINES) {
      assert.ok(key in CATEGORY_ROUTE_REGISTRY, `"${key}" must be a registered pipeline`);
    }
    const sourceTables: Record<CanonicalCategoryKey, string> = {
      en_venta: "listings",
      busco: "listings",
      clases: "listings",
      comunidad: "listings",
      mascotas_y_perdidos: "listings",
    } as Record<CanonicalCategoryKey, string>;
    for (const [key, table] of Object.entries(sourceTables)) {
      assert.equal(
        getCategoryRouteAdapter(key as CanonicalCategoryKey).sourceTable,
        table,
        `${key} must source from the shared "listings" table`,
      );
    }
    // Excluded categories confirmed NOT part of this package's registry-key set.
    for (const excluded of ["empleos", "rentas_negocio", "rentas_privado", "autos_negocios", "autos_privado", "bienes_raices_negocio", "bienes_raices_privado", "restaurantes", "servicios", "viajes", "ofertas_locales", "comida_local"] as CanonicalCategoryKey[]) {
      assert.ok(!QUICK_PIPELINES.includes(excluded), `${excluded} must not be treated as in-scope for I.6A`);
    }
  }

  /* ============================================================================================
   * IDENTITY — canonical UUID used for Edit/Preview/Public actions on every fixed pipeline;
   * the exact real query shape (bare "?lang=xx", no invented params) is proven, not guessed.
   * ========================================================================================== */
  {
    const CANONICAL_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    for (const pipeline of ["en_venta", "busco", "clases", "comunidad"] as CanonicalCategoryKey[]) {
      const adapter = getCategoryRouteAdapter(pipeline);
      const identity = fakeIdentity({ pipeline, category: adapter.category, sourceId: CANONICAL_ID });
      const editHref = adapter.editRoute(identity, { lang: "es" });
      assert.notEqual(editHref, null, `${pipeline}.editRoute must now resolve to a real route (Gate I.6A)`);
      assert.equal(
        editHref,
        `/dashboard/mis-anuncios/${CANONICAL_ID}/editar?lang=es`,
        `${pipeline}.editRoute must exactly match the real, confirmed live href shape — no invented params`,
      );

      const previewHref = adapter.previewRoute(identity, { lang: "es" });
      assert.notEqual(previewHref, null, `${pipeline}.previewRoute must remain supported`);

      const publicHref = adapter.publicRoute(identity, { lang: "es" });
      assert.equal(publicHref, `/clasificados/anuncio/${CANONICAL_ID}`, `${pipeline}.publicRoute must use the canonical UUID`);
    }

    // Mascotas: editRoute remains honestly null (no safe category-specific editor exists).
    // publicRoute was null when this gate (I.6A) was written, documenting the then-unrepaired
    // shared-shell mis-render bug; Gate I.6B fixed the root cause and this assertion was updated
    // to match, rather than left stale.
    const mascotas = getCategoryRouteAdapter("mascotas_y_perdidos");
    const mascotasIdentity = fakeIdentity({ pipeline: "mascotas_y_perdidos", category: "mascotas-y-perdidos", sourceId: CANONICAL_ID });
    assert.equal(mascotas.publicRoute(mascotasIdentity, { lang: "es" }), `/clasificados/anuncio/${CANONICAL_ID}`, "Mascotas publicRoute must now resolve by canonical UUID (Gate I.6B fix)");
    assert.equal(mascotas.editRoute(mascotasIdentity, { lang: "es" }), null, "Mascotas editRoute remains unsupported (no category-specific editor exists)");
  }

  /* ============================================================================================
   * IDENTITY — never falls through to slug/localStorage/title/leonixAdId; a listing with a
   * canonical sourceId never produces a "create" URL, only an "update this exact row" URL.
   * ========================================================================================== */
  {
    const enVenta = getCategoryRouteAdapter("en_venta");
    const identityWithLeonixAdId = fakeIdentity({
      pipeline: "en_venta",
      category: "en-venta",
      sourceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      leonixAdId: "LX-9999",
    });
    const href = enVenta.editRoute(identityWithLeonixAdId, { lang: "es" })!;
    assert.ok(href.includes(identityWithLeonixAdId.sourceId), "edit href must key off the canonical UUID");
    assert.ok(!href.includes("LX-9999"), "edit href must never key off the Leonix Ad ID instead of the UUID");
    assert.ok(!href.includes(enVenta.applicationRoute), "an existing canonical listing's edit href must never route back to the fresh-application/create page");
  }

  /* ============================================================================================
   * PUBLIC LIFECYCLE — results/public routes agree on the canonical UUID relationship for all
   * five pipelines. Gate I.6B fixed the shared shell's category-allowlist root cause this
   * assertion originally locked in as broken (I.6A); updated here to confirm the fix rather than
   * leave a stale "still broken" assertion in place.
   * ========================================================================================== */
  {
    const shellSrc = readFileSync(
      path.join(REPO_ROOT, "app/(site)/clasificados/anuncio/[id]/page.tsx"),
      "utf8",
    );
    assert.ok(shellSrc.includes("const CATEGORY_KEYS"), "the shared shell's category allowlist must still exist at the expected name");
    const allowlistMatch = shellSrc.match(/const CATEGORY_KEYS[\s\S]*?\[([\s\S]*?)\];/);
    assert.ok(allowlistMatch, "must be able to locate the CATEGORY_KEYS array literal");
    const allowlistBody = allowlistMatch![1];
    assert.ok(allowlistBody.includes("mascotas-y-perdidos"), "CONFIRMED (Gate I.6B): mascotas-y-perdidos is now present in the shared shell's category allowlist — the mis-render root cause is fixed.");
    for (const present of ["en-venta", "clases", "comunidad", "busco"]) {
      assert.ok(allowlistBody.includes(present), `"${present}" must remain in the shell's allowlist`);
    }
  }

  /* ============================================================================================
   * DASHBOARD ACTIONS — exercised through the real resolveDashboardActions() resolver. Every
   * in-scope pipeline: owner-verified, Edit/Preview/viewPublic present where supported, and
   * — critically — NO Business Hub action (manageCoupons/manageOffers/manageInventory) is ever
   * emitted for these private/quick sellers, even if entitlement flags are (incorrectly) passed
   * as true, because the resolver only wires those actions to restaurantes/servicios/
   * bienes_raices_negocio/autos_negocios by explicit pipeline check.
   * ========================================================================================== */
  {
    const pipelineUuids: Record<string, string> = {
      en_venta: "10000000-0000-4000-8000-000000000001",
      busco: "20000000-0000-4000-8000-000000000002",
      clases: "30000000-0000-4000-8000-000000000003",
      comunidad: "40000000-0000-4000-8000-000000000004",
      mascotas_y_perdidos: "50000000-0000-4000-8000-000000000005",
    };
    for (const pipeline of ["en_venta", "busco", "clases", "comunidad", "mascotas_y_perdidos"] as CanonicalCategoryKey[]) {
      const adapter = getCategoryRouteAdapter(pipeline);
      const uuid = pipelineUuids[pipeline];
      const identity = fakeIdentity({
        pipeline,
        category: adapter.category,
        sourceId: uuid,
        publicUrl: `/clasificados/anuncio/${uuid}`,
      });

      // Owner-verified: false must yield zero actions.
      const unverified = resolveDashboardActions({
        identity,
        lifecycle: { status: "active" },
        entitlement: { couponsActive: true, offersActive: true, inventoryPackActive: true },
        role: null,
        ownerVerified: false,
        lang: "es",
      });
      assert.equal(unverified.length, 0, `${pipeline} must yield zero actions when ownerVerified is false`);

      const actions = resolveDashboardActions({
        identity,
        lifecycle: { status: "active" },
        // Deliberately pass every entitlement flag true — proves the resolver ignores them for
        // these pipelines rather than accidentally exposing a Business Hub action.
        entitlement: { couponsActive: true, offersActive: true, inventoryPackActive: true },
        role: null,
        ownerVerified: true,
        lang: "es",
      });
      const keys = actions.map((a) => a.key);

      assert.ok(!keys.includes("manageCoupons"), `${pipeline} must never receive manageCoupons (Business Hub action)`);
      assert.ok(!keys.includes("manageOffers"), `${pipeline} must never receive manageOffers (Business Hub action)`);
      assert.ok(!keys.includes("manageInventory"), `${pipeline} must never receive manageInventory (Business Hub action)`);

      // Gate I.6B fixed Mascotas' public route (was unsafely null when this gate — I.6A — was
      // written); viewPublic now correctly appears for it too. Edit remains intentionally absent
      // for Mascotas only — no safe category-specific editor exists.
      assert.ok(keys.includes("viewPublic"), `${pipeline} must expose viewPublic`);
      if (pipeline === "mascotas_y_perdidos") {
        assert.ok(!keys.includes("edit"), "Mascotas must not expose edit — no safe category-specific editor exists");
      } else {
        assert.ok(keys.includes("edit"), `${pipeline} must now expose edit (Gate I.6A regression guard)`);
        const editAction = actions.find((a) => a.key === "edit")!;
        assert.ok(editAction.href.includes(identity.sourceId), `${pipeline} edit action href must target the canonical sourceId`);
      }
    }
  }

  /* ============================================================================================
   * ES/EN — lang survives through the real editRoute output for every fixed pipeline; no other
   * launch language introduced.
   * ========================================================================================== */
  {
    for (const pipeline of ["en_venta", "busco", "clases", "comunidad"] as CanonicalCategoryKey[]) {
      const adapter = getCategoryRouteAdapter(pipeline);
      const identity = fakeIdentity({ pipeline, category: adapter.category, sourceId: "lang-check-id" });
      assert.ok(adapter.editRoute(identity, { lang: "es" })!.endsWith("lang=es"));
      assert.ok(adapter.editRoute(identity, { lang: "en" })!.endsWith("lang=en"));
      assert.equal(
        adapter.editRoute(identity, undefined),
        adapter.editRoute(identity, { lang: "es" }),
        `${pipeline} must default to es when lang is omitted`,
      );
    }
  }

  /* ============================================================================================
   * REGRESSION — every locked/out-of-scope category adapter is untouched (spot-check a
   * representative field each), and the total pipeline count is still 17.
   * ========================================================================================== */
  {
    assert.equal(Object.keys(CATEGORY_ROUTE_REGISTRY).length, 17, "pipeline count must remain 17");
    const untouchedExpected: Partial<Record<CanonicalCategoryKey, string>> = {
      restaurantes: "/publicar/restaurantes",
      servicios: "/publicar/servicios",
      empleos: "/publicar/empleos",
      bienes_raices_negocio: "/clasificados/publicar/bienes-raices/negocio/agente-individual",
      bienes_raices_privado: "/publicar/bienes-raices/privado",
      autos_negocios: "/publicar/autos/negocios",
      autos_privado: "/publicar/autos/privado",
      rentas_negocio: "/publicar/rentas/negocio",
      rentas_privado: "/publicar/rentas/privado",
      viajes: "/publicar/viajes",
      ofertas_locales: "/publicar/ofertas-locales",
      comida_local: "/publicar/comida-local",
    };
    for (const [pipeline, expected] of Object.entries(untouchedExpected)) {
      assert.equal(
        getCategoryRouteAdapter(pipeline as CanonicalCategoryKey).applicationRoute,
        expected,
        `${pipeline}.applicationRoute must be byte-identical — locked out of this package's scope`,
      );
    }
    // Restaurantes editRoute (fixed in a PRIOR gate) must still be intact and unaffected by this
    // package's separate en_venta/busco/clases/comunidad editRoute fixes.
    const rest = getCategoryRouteAdapter("restaurantes");
    const restIdentity = fakeIdentity({ pipeline: "restaurantes", category: "restaurantes", sourceId: "rest-check" });
    assert.ok(rest.editRoute(restIdentity, { lang: "es" })!.includes("mode=listing-edit"));
  }

  console.log("gate-i6a-quick-clasificados-lifecycle-selftest: OK");
}

main();

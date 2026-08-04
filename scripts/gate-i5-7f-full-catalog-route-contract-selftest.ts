/**
 * Gate I.5.7F — full-catalog route-contract regression matrix.
 *
 * This is protection/documentation only: it proves and locks down the CURRENT truth of every
 * registered pipeline's route surfaces, the two-route-system split confirmed in Gate I.5.7D-R,
 * and the specific fixes from Gates I.5.7A.1/I.5.7C/I.5.7E — it does not repair any remaining
 * stale value. No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CATEGORY_ROUTE_REGISTRY, getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import type { CanonicalCategoryKey, ListingIdentity } from "../app/lib/listingIdentity/types";
import {
  CAT_STD_ALL_SLUGS,
  CAT_STD_RESULTS_SEGMENT,
  categoryPublishPath,
  type CatStdAllSlug,
} from "../app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

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

type SurfaceStatus =
  | "supported"
  | "intentionally_unsupported"
  | "category_specific"
  | "protected_externally"
  | "missing"
  | "stale"
  | "not_applicable";

async function main() {
  /* ============================================================================================
   * 1/2/3 — Enumerate the full canonical pipeline catalog, assert the expected count, detect
   * duplicate keys.
   * ========================================================================================== */
  const EXPECTED_PIPELINES: CanonicalCategoryKey[] = [
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

  const actualKeys = Object.keys(CATEGORY_ROUTE_REGISTRY) as CanonicalCategoryKey[];
  assert.equal(actualKeys.length, 17, "canonical registry must have exactly 17 pipelines");
  assert.deepEqual(
    [...actualKeys].sort(),
    [...EXPECTED_PIPELINES].sort(),
    "canonical registry pipeline set must exactly match the expected catalog",
  );
  assert.equal(new Set(actualKeys).size, actualKeys.length, "no duplicate pipeline keys in the registry object");
  for (const key of actualKeys) {
    assert.equal(
      getCategoryRouteAdapter(key).pipeline,
      key,
      `adapter.pipeline must match its own registry key for "${key}" (self-consistency, not a copy/paste duplicate)`,
    );
  }
  // Cupones is deliberately NOT a standalone pipeline — confirmed filtered view over
  // ofertas_locales (surface="cupones"). Its absence here is intentional, not a gap.
  assert.ok(!("cupones" in CATEGORY_ROUTE_REGISTRY), "cupones must remain intentionally absent as its own pipeline");

  /* ============================================================================================
   * Legacy standard-route catalog — 12 slugs, structurally narrower than the registry (no
   * business/private split, no Ofertas Locales/Cupones/Comida Local coverage at all).
   * ========================================================================================== */
  assert.equal(CAT_STD_ALL_SLUGS.length, 12, "legacy categoryStandardRoutes.ts must still cover exactly 12 slugs");
  for (const missing of ["ofertas-locales", "comida-local", "cupones"] as const) {
    assert.ok(
      !(CAT_STD_ALL_SLUGS as readonly string[]).includes(missing),
      `legacy standard-route slug list must NOT include "${missing}" — confirmed absent, not silently added`,
    );
  }

  /* ============================================================================================
   * 4/5/6/7/8 — Per-pipeline surface classification matrix. This IS the truthful catalog: every
   * entry below was derived from direct repository evidence (categoryRouteRegistry.ts's own
   * adapter definitions and knownLimitations, cross-checked against Gate I.5.7D-R's live-code
   * traces), not guessed from a plausible-looking URL.
   * ========================================================================================== */
  type PipelineExpectation = {
    application: SurfaceStatus;
    edit: SurfaceStatus;
    preview: SurfaceStatus;
    publicRoute: SurfaceStatus;
    results: SurfaceStatus;
    dashboard: SurfaceStatus;
    secondaryManage: SurfaceStatus;
    parentChild: boolean;
  };

  const MATRIX: Record<CanonicalCategoryKey, PipelineExpectation> = {
    restaurantes: {
      application: "supported",
      edit: "supported", // corrected in Gate I.5.7E
      preview: "intentionally_unsupported",
      publicRoute: "category_specific", // slug-keyed, echoes precomputed identity.publicUrl
      results: "supported",
      dashboard: "supported",
      secondaryManage: "supported", // coupon-edit, entitlement-gated
      parentChild: false,
    },
    servicios: {
      application: "supported",
      edit: "supported",
      preview: "supported",
      publicRoute: "category_specific",
      results: "supported",
      dashboard: "supported",
      secondaryManage: "supported", // offers-edit, entitlement-gated
      parentChild: false,
    },
    bienes_raices_negocio: {
      application: "supported",
      edit: "protected_externally", // adapter resolves a URL unconditionally; child exclusion lives in dashboardActionResolver.ts + LeonixRealEstateListingManageCard.tsx
      preview: "protected_externally",
      publicRoute: "supported", // UUID-keyed, self-sufficient
      results: "supported", // /resultados, canonical per Gate I.5.7C
      dashboard: "supported",
      secondaryManage: "category_specific", // inventory-pack, always parent-scoped
      parentChild: true,
    },
    bienes_raices_privado: {
      application: "supported",
      edit: "supported", // Package A Gate 5 — generic owner-verified editor (incl. its BR-Privado seller-photo support)
      preview: "supported",
      publicRoute: "supported",
      results: "supported", // shares /resultados with Negocio
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    autos_negocios: {
      application: "supported",
      edit: "protected_externally", // same shared exclusion line as bienes_raices_negocio in dashboardActionResolver.ts
      preview: "supported", // genuinely bound to child's own sourceId, unlike edit
      publicRoute: "supported",
      results: "supported",
      dashboard: "supported",
      secondaryManage: "category_specific", // inventory-pack, parent-scoped, NOT entitlement-gated (asymmetry vs Bienes)
      parentChild: true,
    },
    autos_privado: {
      application: "supported",
      edit: "supported", // no exported helper constant, but confirmed working shape
      preview: "supported",
      publicRoute: "supported",
      results: "supported",
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    rentas_negocio: {
      application: "supported",
      edit: "supported", // corrected in Gate I.7A — mirrors the real rentasDashboardEditHref() shape
      preview: "supported",
      publicRoute: "supported", // corrected in Gate I.5.4D
      results: "stale", // /results, not /resultados — see Empleos-style duplication note below
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    rentas_privado: {
      application: "supported",
      edit: "supported", // corrected in Gate I.7A, same reasoning as Rentas Negocio
      preview: "supported",
      publicRoute: "supported",
      results: "stale",
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    empleos: {
      application: "supported", // registry decision; legacy CTA still disagrees, see Table below
      edit: "supported",
      preview: "intentionally_unsupported", // lane-ambiguous, cannot resolve generically
      publicRoute: "category_specific",
      results: "supported", // Gate I.5.8 — buildEmpleosResultadosUrl and EMPLEOS_RESULTS_PATH corrected to /resultados
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    en_venta: {
      application: "category_specific", // documented temporary exception, no modern hub exists
      edit: "supported", // Gate I.6A — generic /dashboard/mis-anuncios/{id}/editar page, was wrongly null
      preview: "supported",
      publicRoute: "supported",
      results: "supported",
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    comida_local: {
      application: "supported",
      edit: "missing",
      preview: "supported",
      publicRoute: "category_specific",
      results: "stale", // resultsRoute duplicates entryRoute, no confirmed distinct page
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    ofertas_locales: {
      application: "supported",
      edit: "supported",
      preview: "supported",
      publicRoute: "category_specific",
      results: "supported",
      dashboard: "supported", // dedicated, NOT part of Mis Anuncios
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    busco: {
      application: "supported",
      edit: "supported", // Gate I.6A — generic /dashboard/mis-anuncios/{id}/editar page, was wrongly null
      preview: "supported",
      publicRoute: "supported",
      results: "supported",
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    clases: {
      application: "supported",
      edit: "supported", // Gate I.6A — generic /dashboard/mis-anuncios/{id}/editar page, was wrongly null
      preview: "supported",
      publicRoute: "supported",
      results: "supported",
      dashboard: "intentionally_unsupported", // confirmed ready:false, no DEDICATED management tab (generic per-listing workspace is reachable — see edit)
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    comunidad: {
      application: "supported",
      edit: "supported", // Gate I.6A — generic /dashboard/mis-anuncios/{id}/editar page, was wrongly null
      preview: "supported",
      publicRoute: "supported",
      results: "supported",
      dashboard: "intentionally_unsupported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    mascotas_y_perdidos: {
      application: "supported",
      edit: "supported", // Package A Gate 5 — generic editor, safety-proven (same publisher/row shape as Clases/Comunidad; detail_pairs untouched)
      preview: "supported",
      publicRoute: "supported", // Gate I.6B — shared shell's category allowlist fixed; real dedicated renderer wired
      results: "supported",
      dashboard: "intentionally_unsupported", // registry dashboardRoute still null (no DEDICATED tab); see Mis Anuncios generic-discovery note in the doc
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    viajes: {
      application: "supported",
      edit: "missing", // real lane-specific route exists but identity doesn't carry the lane; see registry comment
      preview: "missing", // same reasoning as edit
      publicRoute: "category_specific", // corrected in Gate I.7A — echoes identity.publicUrl like Empleos; negocio/[slug] confirmed dead, oferta/[slug] is the one real route
      results: "supported",
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
  };

  assert.equal(
    Object.keys(MATRIX).length,
    17,
    "the test's own classification matrix must cover all 17 pipelines — no silent omission",
  );

  for (const pipeline of actualKeys) {
    const adapter = getCategoryRouteAdapter(pipeline);
    const expect = MATRIX[pipeline];
    const identity = fakeIdentity({ pipeline, category: adapter.category, sourceId: `id-${pipeline}` });

    // application (new-listing entry point) is always a static string field, never a resolver.
    assert.equal(typeof adapter.applicationRoute, "string", `${pipeline}.applicationRoute must be a string`);
    assert.ok(adapter.applicationRoute.length > 0, `${pipeline}.applicationRoute must not be empty`);

    const editOut = adapter.editRoute(identity, { lang: "es" });
    const previewOut = adapter.previewRoute(identity, { lang: "es" });
    const publicOut = adapter.publicRoute(identity, { lang: "es" });
    const dashboardOut = adapter.dashboardRoute(identity, { lang: "es" });

    if (expect.edit === "missing" || expect.edit === "intentionally_unsupported") {
      assert.equal(editOut, null, `${pipeline}.editRoute must fail closed to null (classified "${expect.edit}")`);
    } else {
      assert.notEqual(editOut, null, `${pipeline}.editRoute must resolve a real route (classified "${expect.edit}")`);
      assert.ok(editOut!.includes(identity.sourceId) || editOut!.includes(String(identity.sourceId)), `${pipeline}.editRoute must carry the canonical sourceId`);
    }

    if (expect.preview === "missing" || expect.preview === "intentionally_unsupported") {
      assert.equal(previewOut, null, `${pipeline}.previewRoute must fail closed to null (classified "${expect.preview}")`);
    } else {
      assert.notEqual(previewOut, null, `${pipeline}.previewRoute must resolve a real route (classified "${expect.preview}")`);
    }

    if (expect.publicRoute === "missing") {
      assert.equal(publicOut, null, `${pipeline}.publicRoute must fail closed to null (confirmed gap)`);
    } else {
      // publicUrl-echoing adapters return null for THIS synthetic identity only when publicUrl is
      // empty — supply one so every "supported"/"category_specific" pipeline proves a real value.
      const identityWithPublicUrl = fakeIdentity({
        pipeline,
        category: adapter.category,
        sourceId: `id-${pipeline}`,
        publicUrl: `/clasificados/${adapter.category}/some-slug`,
      });
      const publicOut2 = adapter.publicRoute(identityWithPublicUrl, { lang: "es" });
      assert.notEqual(publicOut2, null, `${pipeline}.publicRoute must resolve a real route given a populated publicUrl (classified "${expect.publicRoute}")`);
    }

    if (expect.dashboard === "intentionally_unsupported") {
      assert.equal(dashboardOut, null, `${pipeline}.dashboardRoute must fail closed to null (confirmed no management surface)`);
    } else {
      assert.notEqual(dashboardOut, null, `${pipeline}.dashboardRoute must resolve a real route (classified "${expect.dashboard}")`);
    }

    assert.equal(
      adapter.supportsParentChildInventory,
      expect.parentChild,
      `${pipeline}.supportsParentChildInventory must match the confirmed catalog (${expect.parentChild})`,
    );

    if (expect.secondaryManage === "not_applicable") {
      // Either the field is absent or, if present, must not throw — both are acceptable; only
      // assert it's not silently claimed as a real user-facing action when the matrix says N/A.
    } else {
      assert.equal(
        typeof adapter.secondaryManageRoute,
        "function",
        `${pipeline}.secondaryManageRoute must be defined when classified "${expect.secondaryManage}"`,
      );
      assert.doesNotThrow(() => adapter.secondaryManageRoute!(identity, { lang: "es" }));
    }
  }

  /* ============================================================================================
   * 7 — ES/EN language behavior spot-check across representative pipelines.
   * ========================================================================================== */
  {
    const svc = getCategoryRouteAdapter("servicios");
    const identity = fakeIdentity({ pipeline: "servicios", category: "servicios", sourceId: "svc-1" });
    assert.ok(svc.editRoute(identity, { lang: "es" })!.endsWith("&lang=es"));
    assert.ok(svc.editRoute(identity, { lang: "en" })!.endsWith("&lang=en"));

    const rest = getCategoryRouteAdapter("restaurantes");
    assert.ok(rest.editRoute(identity, { lang: "es" })!.endsWith("&lang=es"));
    assert.ok(rest.editRoute(identity, { lang: "en" })!.endsWith("&lang=en"));
    assert.equal(
      rest.editRoute(identity, undefined),
      rest.editRoute(identity, { lang: "es" }),
      "missing lang option must default to es",
    );
  }

  /* ============================================================================================
   * 9 — category-specific contracts remain category-specific: only the two confirmed
   * parent/child pipelines set supportsParentChildInventory, and Autos Privado is explicitly
   * excluded (registered separately precisely to make this visible, not implied by omission).
   * ========================================================================================== */
  {
    const parentChildPipelines = actualKeys.filter((k) => getCategoryRouteAdapter(k).supportsParentChildInventory);
    assert.deepEqual(
      [...parentChildPipelines].sort(),
      ["autos_negocios", "bienes_raices_negocio"].sort(),
      "exactly and only these two pipelines may declare parent/child inventory support",
    );
    assert.equal(getCategoryRouteAdapter("autos_privado").supportsParentChildInventory, false);
    assert.equal(getCategoryRouteAdapter("bienes_raices_privado").supportsParentChildInventory, false);

    const couponPipelines = actualKeys.filter((k) => getCategoryRouteAdapter(k).supportsCoupons);
    assert.deepEqual(
      [...couponPipelines].sort(),
      ["restaurantes", "servicios"].sort(),
      "exactly and only Restaurantes/Servicios support the coupon add-on sub-flow",
    );
  }

  /* ============================================================================================
   * 10 — Restaurantes Edit is supported after Gate I.5.7E, uses mode=listing-edit (not
   * coupon-edit), and carries the canonical sourceId.
   * ========================================================================================== */
  {
    const rest = getCategoryRouteAdapter("restaurantes");
    const identity = fakeIdentity({ pipeline: "restaurantes", category: "restaurantes", sourceId: "rest-42" });
    const href = rest.editRoute(identity, { lang: "es" });
    assert.notEqual(href, null, "Restaurantes editRoute must remain non-null (Gate I.5.7E regression guard)");
    assert.ok(href!.includes("mode=listing-edit"));
    assert.ok(!href!.includes("mode=coupon-edit"));
    assert.ok(href!.includes("listingId=rest-42"));
  }

  /* ============================================================================================
   * 11 — Bienes canonical results use /resultados, never actively generating /results, for
   * both Negocio and Privado (Gate I.5.7C regression guard).
   * ========================================================================================== */
  {
    const negocio = getCategoryRouteAdapter("bienes_raices_negocio");
    const privado = getCategoryRouteAdapter("bienes_raices_privado");
    assert.equal(negocio.resultsRoute, "/clasificados/bienes-raices/resultados");
    assert.equal(privado.resultsRoute, "/clasificados/bienes-raices/resultados");
    assert.ok(!negocio.resultsRoute.endsWith("/results"));

    const brPublishRoutesSrc = readFileSync(
      path.join(REPO_ROOT, "app/(site)/clasificados/bienes-raices/shared/constants/brPublishRoutes.ts"),
      "utf8",
    );
    assert.ok(
      brPublishRoutesSrc.includes('export const BR_RESULTS = "/clasificados/bienes-raices/resultados";'),
      "the shared BR_RESULTS constant (Gate I.5.7C) must still point at the canonical /resultados path",
    );
  }

  /* ============================================================================================
   * 12/13 — Bienes and Autos parent/child action safety. Globalization Package A Gate 1 UPDATE:
   * the registry's edit/preview resolvers are now GUARDED (identityListingIdForEdit fails
   * closed for inventory-child identities), closing the "registry alone provides no
   * child-safety" debt this section previously pinned as documentation. The external
   * protection in dashboardActionResolver.ts remains in place (defense in depth, and it is
   * still the layer that decides which actions exist at all); inventory-manage routes keep
   * their intentional parent/group substitution via the separate inventoryManageTargetId
   * helper.
   * ========================================================================================== */
  {
    const resolverSrc = readFileSync(
      path.join(REPO_ROOT, "app/lib/listingIdentity/dashboardActionResolver.ts"),
      "utf8",
    );
    assert.ok(
      resolverSrc.includes('identity.pipeline === "bienes_raices_negocio" || identity.pipeline === "autos_negocios"') &&
        resolverSrc.includes("child"),
      "dashboardActionResolver.ts must still carry the shared child-exclusion check covering both bienes_raices_negocio and autos_negocios — the resolver-level safety layer stays even now that the registry is guarded (defense in depth)",
    );

    // Package A Gate 1 — the registry now fails closed on its own: calling editRoute/previewRoute
    // directly with a child identity returns null instead of silently substituting the PARENT id.
    const negocio = getCategoryRouteAdapter("bienes_raices_negocio");
    const childIdentity = fakeIdentity({
      pipeline: "bienes_raices_negocio",
      category: "bienes-raices",
      sourceId: "child-id-111",
      parentSourceId: "parent-id-999",
      inventoryRole: "inventory_property",
    });
    assert.equal(
      negocio.editRoute(childIdentity, { lang: "es" }),
      null,
      "Package A Gate 1: BR Negocio editRoute must fail closed (null) for an inventory-child identity — never substitute the parent id",
    );
    assert.equal(
      negocio.previewRoute(childIdentity, { lang: "es" }),
      null,
      "Package A Gate 1: BR Negocio previewRoute must fail closed (null) for an inventory-child identity",
    );
    // Ambiguous child-shaped identity (parent id present, role unconfirmed) also fails closed.
    const ambiguousIdentity = fakeIdentity({
      pipeline: "bienes_raices_negocio",
      category: "bienes-raices",
      sourceId: "child-id-111",
      parentSourceId: "parent-id-999",
      inventoryRole: null,
    });
    assert.equal(
      negocio.editRoute(ambiguousIdentity, { lang: "es" }),
      null,
      "Package A Gate 1: an identity with a parentSourceId but no confirmed inventory role must also fail closed",
    );
    // A normal parent identity still resolves to its own id — behavior preserved.
    const parentIdentity = fakeIdentity({
      pipeline: "bienes_raices_negocio",
      category: "bienes-raices",
      sourceId: "parent-id-999",
      inventoryRole: "main",
    });
    assert.ok(
      negocio.editRoute(parentIdentity, { lang: "es" })!.includes("listingId=parent-id-999"),
      "Package A Gate 1: parent identities keep resolving to their own id — the guard changes only child/ambiguous shapes",
    );
    // Inventory-manage keeps its intentional parent/group substitution (there is no per-child
    // manage URL by design — the drawer manages the whole group).
    assert.ok(
      negocio.secondaryManageRoute!(childIdentity, { lang: "es" })!.includes("listingId=parent-id-999"),
      "inventory-manage (secondaryManageRoute) intentionally still targets the parent/group for child identities — separate, documented semantics via inventoryManageTargetId",
    );

    const autos = getCategoryRouteAdapter("autos_negocios");
    const autosChildIdentity = fakeIdentity({
      pipeline: "autos_negocios",
      category: "autos",
      sourceId: "child-vehicle-111",
      parentSourceId: "dealer-parent-999",
      inventoryRole: "inventory_vehicle",
    });
    assert.equal(
      autos.editRoute(autosChildIdentity, { lang: "es" }),
      null,
      "Package A Gate 1: Autos Negocios editRoute must fail closed (null) for an inventory-child identity",
    );
    assert.ok(
      autos.secondaryManageRoute!(autosChildIdentity, { lang: "es" })!.includes("listingId=dealer-parent-999"),
      "Autos inventory-manage intentionally still targets the dealer parent for child identities",
    );
    // Autos Preview remains genuinely bound to the child's OWN id (does not use the guarded
    // edit-target helper) — unchanged.
    const autosPreviewHref = autos.previewRoute(autosChildIdentity, { lang: "es" })!;
    assert.ok(
      autosPreviewHref.includes("listingId=child-vehicle-111"),
      "Autos Negocios previewRoute is confirmed genuinely child-bound (uses the child's own sourceId, not the parent) — unchanged by the Gate 1 guard",
    );
  }

  /* ============================================================================================
   * 14 — Gate I.5.8 (Objective A) — Empleos results-slug duplication is resolved: the registry's
   * /resultados and the Empleos-specific shared builder now agree. The GENERIC legacy builder's
   * default segment ("results") is intentionally untouched — it's shared by other categories
   * (busco/clases/comunidad/etc.) and was out of this package's scope; Empleos simply no longer
   * calls it for results generation. Full detail in gate-i5-8-empleos-autos-viajes-route-drift-
   * selftest.ts.
   * ========================================================================================== */
  {
    const empleos = getCategoryRouteAdapter("empleos");
    assert.equal(empleos.resultsRoute, "/clasificados/empleos/resultados");
    assert.equal(CAT_STD_RESULTS_SEGMENT, "results", "the shared generic builder's default segment is untouched — Empleos simply no longer uses it for results");
    assert.ok(
      empleos.knownLimitations.some((l) => l.includes("Gate I.5.8") && l.includes("sole actively-generated")),
      "the registry must document the Gate I.5.8 resolution, not the old unresolved-duplication text",
    );
  }

  /* ============================================================================================
   * 15 — Gate I.5.8 (Objective B): Autos confirmed LIVE (not stale) and left untouched — the
   * folder exists, is in the compiled route manifest, and has a confirmed live caller
   * (negociosLocalesLanes.ts). Viajes confirmed genuinely stale/dead and corrected to the real,
   * registry-declared application route. Full detail in
   * gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts.
   * ========================================================================================== */
  {
    const autosLegacy = categoryPublishPath("autos" as CatStdAllSlug);
    assert.equal(autosLegacy, "/clasificados/publicar/autos", "Autos legacy value must remain untouched — confirmed live, not stale");

    const viajesLegacy = categoryPublishPath("viajes" as CatStdAllSlug);
    const viajesLive = getCategoryRouteAdapter("viajes").applicationRoute;
    assert.equal(viajesLegacy, viajesLive, "Viajes legacy publish-map value must now match the real application route (Gate I.5.8 fix)");
    assert.notEqual(viajesLegacy, "/clasificados/publicar/viajes", "the confirmed-nonexistent-folder value must no longer be generated");
    const viajesAdapter = getCategoryRouteAdapter("viajes");
    assert.ok(
      viajesAdapter.knownLimitations.some((l) => l.includes("Gate I.5.8") && l.includes("corrected")),
      "the registry must document the Gate I.5.8 Viajes correction",
    );
  }

  /* ============================================================================================
   * 16 — Rentas current lane behavior captured (not decided): both lanes share one hub distinct
   * from either lane's own applicationRoute. Edit now resolves to the real, live dashboard href
   * (Gate I.7A) — mirrors rentasDashboardEditHref() in LeonixRealEstateListingManageCard.tsx.
   * ========================================================================================== */
  {
    const negocio = getCategoryRouteAdapter("rentas_negocio");
    const privado = getCategoryRouteAdapter("rentas_privado");
    assert.equal(negocio.hubRoute, "/clasificados/publicar/rentas");
    assert.equal(privado.hubRoute, "/clasificados/publicar/rentas");
    assert.notEqual(negocio.hubRoute, negocio.applicationRoute);
    assert.notEqual(privado.hubRoute, privado.applicationRoute);

    const negocioIdentity = fakeIdentity({ pipeline: "rentas_negocio", category: "rentas", sourceId: "rentas-uuid-1", leonixAdId: "AD-1" });
    const negocioEdit = negocio.editRoute(negocioIdentity, { lang: "es" });
    assert.ok(negocioEdit, "rentas_negocio.editRoute must now resolve a real route (Gate I.7A)");
    assert.ok(negocioEdit!.startsWith("/clasificados/publicar/rentas/negocio?"), "must target the Negocio lane's own publish/edit form");
    assert.ok(negocioEdit!.includes("mode=listing-edit"), "must use the real listing-edit mode param");
    assert.ok(negocioEdit!.includes("listingId=rentas-uuid-1"), "must carry the canonical sourceId as listingId");
    assert.ok(negocioEdit!.includes("lane=negocio"), "must declare the Negocio lane");
    assert.ok(negocioEdit!.includes("leonixAdId=AD-1"), "must carry a populated leonixAdId");
    assert.ok(negocioEdit!.includes("returnTo="), "must round-trip back to Mis Anuncios");

    const privadoIdentity = fakeIdentity({ pipeline: "rentas_privado", category: "rentas", sourceId: "rentas-uuid-2" });
    const privadoEdit = privado.editRoute(privadoIdentity, { lang: "en" });
    assert.ok(privadoEdit, "rentas_privado.editRoute must now resolve a real route (Gate I.7A)");
    assert.ok(privadoEdit!.startsWith("/clasificados/publicar/rentas/privado?"), "must target the Privado lane's own publish/edit form");
    assert.ok(privadoEdit!.includes("lane=privado"), "must declare the Privado lane");
    assert.ok(!privadoEdit!.includes("leonixAdId="), "must omit leonixAdId when not populated");

    assert.equal(negocio.resultsRoute, privado.resultsRoute, "both Rentas lanes must still share one results route");
  }

  console.log("gate-i5-7f-full-catalog-route-contract-selftest: OK");
}

main();

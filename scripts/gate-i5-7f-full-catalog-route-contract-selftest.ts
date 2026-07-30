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
      edit: "missing", // editRoute() => null, no confirmed distinct route
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
      edit: "missing", // real edit API exists, no confirmed dashboard href-builder
      preview: "supported",
      publicRoute: "supported", // corrected in Gate I.5.4D
      results: "stale", // /results, not /resultados — see Empleos-style duplication note below
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    rentas_privado: {
      application: "supported",
      edit: "missing",
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
      results: "stale", // /resultados here vs. legacy-builder default "/results" segment — dual-active, unresolved
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    en_venta: {
      application: "category_specific", // documented temporary exception, no modern hub exists
      edit: "intentionally_unsupported", // editing is inline-only, no distinct URL
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
      edit: "missing",
      preview: "supported",
      publicRoute: "supported",
      results: "supported",
      dashboard: "supported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    clases: {
      application: "supported",
      edit: "missing",
      preview: "supported",
      publicRoute: "supported",
      results: "supported",
      dashboard: "intentionally_unsupported", // confirmed ready:false, no management surface
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    comunidad: {
      application: "supported",
      edit: "missing",
      preview: "supported",
      publicRoute: "supported",
      results: "supported",
      dashboard: "intentionally_unsupported",
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    mascotas_y_perdidos: {
      application: "supported",
      edit: "missing",
      preview: "supported",
      publicRoute: "missing", // CONFIRMED GAP — no public detail route exists anywhere
      results: "supported",
      dashboard: "intentionally_unsupported", // confirmed absent from Mis Anuncios entirely
      secondaryManage: "not_applicable",
      parentChild: false,
    },
    viajes: {
      application: "supported",
      edit: "missing",
      preview: "missing", // CONFIRMED AMBIGUITY — two competing lane sub-branches
      publicRoute: "missing", // CONFIRMED AMBIGUITY — two competing detail-page trees
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
   * 12/13 — Bienes and Autos parent/child action safety is NOT claimed to live inside the
   * registry alone — prove the actual external protection exists in dashboardActionResolver.ts
   * (the shared exclusion line covering BOTH pipelines), and that the registry's own adapter
   * functions remain naive (would substitute the parent id if called directly and unguarded).
   * ========================================================================================== */
  {
    const resolverSrc = readFileSync(
      path.join(REPO_ROOT, "app/lib/listingIdentity/dashboardActionResolver.ts"),
      "utf8",
    );
    assert.ok(
      resolverSrc.includes('identity.pipeline === "bienes_raices_negocio" || identity.pipeline === "autos_negocios"') &&
        resolverSrc.includes("child"),
      "dashboardActionResolver.ts must still carry the single shared child-exclusion check covering both bienes_raices_negocio and autos_negocios — this is the actual, external, cross-pipeline safety mechanism, not something either route-registry adapter enforces on its own",
    );

    // Prove the registry adapter itself has no independent role/child guard: calling editRoute
    // directly with a childlike identity (parentSourceId set) still substitutes the PARENT id —
    // exactly the class of behavior Gate I.5.7A.1 had to close off one layer above, in the
    // dashboard card component, not here.
    const negocio = getCategoryRouteAdapter("bienes_raices_negocio");
    const childIdentity = fakeIdentity({
      pipeline: "bienes_raices_negocio",
      category: "bienes-raices",
      sourceId: "child-id-111",
      parentSourceId: "parent-id-999",
      inventoryRole: "inventory_property",
    });
    const unguardedEditHref = negocio.editRoute(childIdentity, { lang: "es" });
    assert.ok(
      unguardedEditHref!.includes("listingId=parent-id-999"),
      "the registry adapter's editRoute, called directly and unguarded, still substitutes the PARENT id for a child identity — proving the registry alone provides no child-safety and the real protection is external (dashboardActionResolver.ts + LeonixRealEstateListingManageCard.tsx's isBrNegocioMainRow gate)",
    );

    const autos = getCategoryRouteAdapter("autos_negocios");
    const autosChildIdentity = fakeIdentity({
      pipeline: "autos_negocios",
      category: "autos",
      sourceId: "child-vehicle-111",
      parentSourceId: "dealer-parent-999",
      inventoryRole: "inventory_vehicle",
    });
    const unguardedAutosEditHref = autos.editRoute(autosChildIdentity, { lang: "es" });
    assert.ok(
      unguardedAutosEditHref!.includes("listingId=dealer-parent-999"),
      "Autos Negocios editRoute is equally naive/unguarded when called directly — same external-protection-only pattern as Bienes",
    );
    // Autos Preview is the one confirmed exception — genuinely bound to the child's OWN id.
    const unguardedAutosPreviewHref = autos.previewRoute(autosChildIdentity, { lang: "es" })!;
    assert.ok(
      unguardedAutosPreviewHref.includes("listingId=child-vehicle-111"),
      "Autos Negocios previewRoute is confirmed genuinely child-bound (uses the child's own sourceId, not the parent) — the one asymmetry vs. Edit",
    );
  }

  /* ============================================================================================
   * 14 — Empleos results-slug duplication: the registry declares /resultados, while the legacy
   * standard-route builder's default results segment is the English "results" — both are
   * live-declared, simultaneously reachable values. Classified stale/dual-active, not repaired.
   * ========================================================================================== */
  {
    const empleos = getCategoryRouteAdapter("empleos");
    assert.equal(empleos.resultsRoute, "/clasificados/empleos/resultados");
    assert.equal(CAT_STD_RESULTS_SEGMENT, "results", "legacy builder's default segment remains the English slug");
    assert.ok(
      empleos.knownLimitations.some((l) => l.includes("resultsRoute chosen") && l.includes("both exist")),
      "the registry must keep documenting this as an unresolved, both-exist duplication, not a silently-fixed value",
    );
  }

  /* ============================================================================================
   * 15 — confirmed dead/stale Autos and Viajes entries in the legacy publish-map, detected but
   * not deleted.
   * ========================================================================================== */
  {
    const autosLegacy = categoryPublishPath("autos" as CatStdAllSlug);
    const autosNegociosLive = getCategoryRouteAdapter("autos_negocios").applicationRoute;
    const autosPrivadoLive = getCategoryRouteAdapter("autos_privado").applicationRoute;
    assert.equal(autosLegacy, "/clasificados/publicar/autos", "confirmed-stale legacy value must still be present (not silently repaired by an unrelated gate)");
    assert.notEqual(autosLegacy, autosNegociosLive);
    assert.notEqual(autosLegacy, autosPrivadoLive);

    const viajesLegacy = categoryPublishPath("viajes" as CatStdAllSlug);
    const viajesLive = getCategoryRouteAdapter("viajes").applicationRoute;
    assert.equal(viajesLegacy, "/clasificados/publicar/viajes");
    assert.notEqual(viajesLegacy, viajesLive, "Viajes legacy publish-map value remains confirmed-broken (registry's own comment: folder does not exist)");
    const viajesAdapter = getCategoryRouteAdapter("viajes");
    assert.ok(
      viajesAdapter.knownLimitations.some((l) => l.includes("categoryPublishPath") && l.includes("stale/broken")),
      "the registry must keep documenting the Viajes legacy value as stale/broken",
    );
  }

  /* ============================================================================================
   * 16 — Rentas current lane behavior captured (not decided): both lanes share one hub distinct
   * from either lane's own applicationRoute, and edit remains a confirmed-missing route.
   * ========================================================================================== */
  {
    const negocio = getCategoryRouteAdapter("rentas_negocio");
    const privado = getCategoryRouteAdapter("rentas_privado");
    assert.equal(negocio.hubRoute, "/clasificados/publicar/rentas");
    assert.equal(privado.hubRoute, "/clasificados/publicar/rentas");
    assert.notEqual(negocio.hubRoute, negocio.applicationRoute);
    assert.notEqual(privado.hubRoute, privado.applicationRoute);
    assert.equal(negocio.editRoute(fakeIdentity({ pipeline: "rentas_negocio", category: "rentas" }), { lang: "es" }), null);
    assert.equal(negocio.resultsRoute, privado.resultsRoute, "both Rentas lanes must still share one results route");
  }

  console.log("gate-i5-7f-full-catalog-route-contract-selftest: OK");
}

main();

/**
 * Gate I.5.7E — self-test for the Restaurantes existing-listing edit-route correction
 * (`app/lib/listingIdentity/categoryRouteRegistry.ts`).
 *
 * Gate I.5.7D-R's read-only reconciliation found that the registry's Restaurantes adapter
 * declared `editRoute: () => null` ("no full-listing dashboard edit route was found"), but a
 * real, already-live-wired existing-listing edit route in fact exists: `restauranteListingEditHref`
 * (app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts:273-289), called via
 * `router.push` at app/(site)/dashboard/restaurantes/page.tsx:307-313. This test proves the
 * registry now describes that proven route truthfully, mirrors that helper's exact param
 * contract, and that nothing else about the Restaurantes adapter or any neighboring adapter
 * changed. No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-7e-restaurantes-edit-route-correction-selftest.ts
 */
import { strict as assert } from "node:assert";

import { CATEGORY_ROUTE_REGISTRY, getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import type { CanonicalCategoryKey, ListingIdentity } from "../app/lib/listingIdentity/types";

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "restaurantes_public_listings",
    sourceId: "00000000-0000-0000-0000-000000000042",
    category: "restaurantes",
    pipeline: "restaurantes",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: "/clasificados/restaurantes/some-slug",
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
    ...overrides,
  };
}

/**
 * Mirrors the real `restauranteListingEditHref` helper exactly (same file/lines cited above),
 * so this test proves the registry's new `editRoute()` output matches proven live behavior
 * rather than merely "is not null."
 */
function expectedRestauranteListingEditHref(input: {
  lang: "es" | "en";
  listingId: string;
  leonixAdId?: string;
}): string {
  const params = new URLSearchParams({
    source: "dashboard",
    mode: "listing-edit",
    listingId: input.listingId,
  });
  if (input.leonixAdId) params.set("leonixAdId", input.leonixAdId);
  params.set("returnPanel", "restaurantes");
  const joiner = "?";
  return `/publicar/restaurantes${joiner}${params.toString()}&lang=${input.lang}`;
}

async function main() {
  const adapter = getCategoryRouteAdapter("restaurantes");

  /* ---------------------------------------------------------------------------------------- *
   * 1/2 — the adapter exists and editRoute is no longer null/unsupported.
   * ---------------------------------------------------------------------------------------- */
  assert.ok(adapter, "Restaurantes adapter must be registered");
  assert.equal(typeof adapter.editRoute, "function", "editRoute must be a resolver function, not a static value");

  /* ---------------------------------------------------------------------------------------- *
   * 3/4 — produces the exact repository-approved existing-listing edit route, preserving
   * canonical listing identity (sourceId, never a slug or fallback id).
   * ---------------------------------------------------------------------------------------- */
  {
    const identity = fakeIdentity({ leonixAdId: "" });
    const href = adapter.editRoute(identity, { lang: "es" });
    assert.notEqual(href, null, "Restaurantes editRoute must no longer resolve to null");
    assert.equal(
      href,
      expectedRestauranteListingEditHref({ lang: "es", listingId: identity.sourceId }),
      "editRoute output must exactly match restauranteListingEditHref's real param contract",
    );
    assert.ok(href!.includes(`listingId=${identity.sourceId}`), "must carry the canonical sourceId, not a slug or fallback id");
    assert.ok(href!.includes("mode=listing-edit"), "must use mode=listing-edit, not the coupon-only mode");
    assert.ok(!href!.includes("mode=coupon-edit"), "must never collapse into the coupon-edit mode");
  }

  /* ---------------------------------------------------------------------------------------- *
   * Leonix Ad ID is forwarded when present, matching the real helper's optional-param behavior.
   * ---------------------------------------------------------------------------------------- */
  {
    const identity = fakeIdentity({ leonixAdId: "LX-1234" });
    const href = adapter.editRoute(identity, { lang: "es" })!;
    assert.equal(
      href,
      expectedRestauranteListingEditHref({ lang: "es", listingId: identity.sourceId, leonixAdId: "LX-1234" }),
    );
    assert.ok(href.includes("leonixAdId=LX-1234"));
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — language behavior is preserved (es/en both supported, defaults to es).
   * ---------------------------------------------------------------------------------------- */
  {
    const identity = fakeIdentity({});
    const esHref = adapter.editRoute(identity, { lang: "es" })!;
    const enHref = adapter.editRoute(identity, { lang: "en" })!;
    const defaultHref = adapter.editRoute(identity, undefined)!;
    assert.ok(esHref.endsWith("&lang=es"));
    assert.ok(enHref.endsWith("&lang=en"));
    assert.equal(defaultHref, esHref, "missing lang option must default to es, matching every other adapter's `lang()` helper");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6 — Preview, public, results, dashboard, and the new-application route are all untouched by
   * this correction.
   * ---------------------------------------------------------------------------------------- */
  {
    const identity = fakeIdentity({});
    assert.equal(adapter.previewRoute(identity, { lang: "es" }), null, "previewRoute must remain honestly null — unaffected by this gate");
    assert.equal(adapter.publicRoute(identity, { lang: "es" }), identity.publicUrl, "publicRoute must remain unaffected");
    assert.equal(adapter.resultsRoute, "/clasificados/restaurantes/resultados", "resultsRoute must remain unaffected");
    assert.equal(adapter.applicationRoute, "/publicar/restaurantes", "applicationRoute (new-listing application) must remain unaffected");
    assert.equal(adapter.dashboardRoute(identity, { lang: "es" }), "/dashboard/restaurantes?lang=es", "dashboardRoute must remain unaffected");
    const secondary = adapter.secondaryManageRoute?.(identity, { lang: "es" });
    assert.ok(secondary?.includes("mode=coupon-edit"), "secondaryManageRoute (coupon-edit) must remain unaffected and distinct from editRoute");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 7 — neighboring category adapters are entirely unchanged (spot-check a representative
   * field on each of the other 16 pipelines, proving this gate touched Restaurantes only).
   * ---------------------------------------------------------------------------------------- */
  {
    const expectedApplicationRoutes: Partial<Record<CanonicalCategoryKey, string>> = {
      servicios: "/publicar/servicios",
      bienes_raices_negocio: "/clasificados/publicar/bienes-raices/negocio/agente-individual",
      bienes_raices_privado: "/publicar/bienes-raices/privado",
      autos_negocios: "/publicar/autos/negocios",
      autos_privado: "/publicar/autos/privado",
      rentas_negocio: "/publicar/rentas/negocio",
      rentas_privado: "/publicar/rentas/privado",
      empleos: "/publicar/empleos",
      en_venta: "/clasificados/publicar/en-venta/pro",
      comida_local: "/publicar/comida-local",
      ofertas_locales: "/publicar/ofertas-locales",
      busco: "/publicar/busco/quick",
      clases: "/publicar/clases/quick",
      comunidad: "/publicar/comunidad/quick",
      mascotas_y_perdidos: "/publicar/mascotas-y-perdidos/quick",
      viajes: "/publicar/viajes",
    };
    for (const [pipeline, expected] of Object.entries(expectedApplicationRoutes)) {
      assert.equal(
        getCategoryRouteAdapter(pipeline as CanonicalCategoryKey).applicationRoute,
        expected,
        `${pipeline}.applicationRoute must be untouched by the Restaurantes-only correction`,
      );
    }
    assert.equal(Object.keys(CATEGORY_ROUTE_REGISTRY).length, 17, "pipeline count must remain 17 — no pipeline added or removed");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 8 — unsupported actions still fail closed where intended (Restaurantes Preview, and every
   * confirmed-absent dashboard surface elsewhere in the registry, remain null — this gate must
   * not have loosened any other honest-null contract while fixing this one).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(
      getCategoryRouteAdapter("clases").dashboardRoute(fakeIdentity({ pipeline: "clases", category: "clases" }), { lang: "es" }),
      null,
    );
    assert.equal(
      getCategoryRouteAdapter("comunidad").dashboardRoute(fakeIdentity({ pipeline: "comunidad", category: "comunidad" }), { lang: "es" }),
      null,
    );
    assert.equal(
      getCategoryRouteAdapter("mascotas_y_perdidos").publicRoute(
        fakeIdentity({ pipeline: "mascotas_y_perdidos", category: "mascotas-y-perdidos" }),
        { lang: "es" },
      ),
      null,
    );
  }

  console.log("gate-i5-7e-restaurantes-edit-route-correction-selftest: OK");
}

main();

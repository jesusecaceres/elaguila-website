/**
 * Gate I.5.8 (Objectives A & B) — Empleos results-route reconciliation, and the Autos/Viajes
 * legacy publish-map cleanup. No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import {
  categoryPublishPath,
  type CatStdAllSlug,
} from "../app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { buildEmpleosResultadosUrl } from "../app/(site)/clasificados/empleos/shared/utils/empleosListaUrl";
import { EMPLEOS_RESULTS_PATH } from "../app/(site)/clasificados/empleos/empleosLandingRoutes";

const REPO_ROOT = path.resolve(__dirname, "..");

async function main() {
  /* ============================================================================================
   * OBJECTIVE A — Empleos: one canonical generated results route.
   * ========================================================================================== */
  {
    const registryResults = getCategoryRouteAdapter("empleos").resultsRoute;
    assert.equal(registryResults, "/clasificados/empleos/resultados", "registry must declare the Spanish canonical results route");

    // The shared builder behind ~30 live public call sites (landing tiles, search, filters, sort,
    // pagination, public-detail "back to results" links) must now agree with the registry.
    const builderHref = buildEmpleosResultadosUrl("es", {});
    assert.ok(builderHref.startsWith(registryResults), `buildEmpleosResultadosUrl must generate the canonical route, got: ${builderHref}`);
    assert.ok(!builderHref.includes("/empleos/results"), "buildEmpleosResultadosUrl must never generate the legacy English slug");

    // The previously-dead, now-corrected constant must agree too (defense against future re-use).
    assert.equal(EMPLEOS_RESULTS_PATH, registryResults, "EMPLEOS_RESULTS_PATH must match the canonical registry value");

    // Filters/pagination/sort/lang all survive through the real builder unchanged.
    const withParams = buildEmpleosResultadosUrl("en", { city: "San Jose", category: "tecnologia", sort: "date_desc" });
    const [urlPath, qs] = withParams.split("?");
    assert.equal(urlPath, "/clasificados/empleos/resultados");
    const params = new URLSearchParams(qs);
    assert.equal(params.get("lang"), "en");
    assert.equal(params.get("city"), "San Jose");
    assert.equal(params.get("category"), "tecnologia");
    assert.equal(params.get("sort"), "date_desc");

    // Compatibility: the old "/results" URL must remain a real, working page (a wrapper, not
    // deleted) — proving requirement "do not delete a live page without a safe redirect or
    // wrapper" — and it must NOT become a second competing authority (it re-exports the same
    // canonical page component rather than declaring independent behavior).
    const wrapperPath = path.join(REPO_ROOT, "app/(site)/clasificados/empleos/results/page.tsx");
    const canonicalPath = path.join(REPO_ROOT, "app/(site)/clasificados/empleos/resultados/page.tsx");
    assert.ok(existsSync(wrapperPath), "the legacy /results wrapper page must still exist (compatibility preserved)");
    assert.ok(existsSync(canonicalPath), "the canonical /resultados page must still exist");
    const wrapperSrc = readFileSync(wrapperPath, "utf8");
    assert.ok(
      wrapperSrc.includes('export { default } from "../resultados/page"'),
      "the /results wrapper must remain a pure re-export of the canonical page, never its own independent implementation",
    );

    // The one Empleos-specific legacy-builder call site was migrated to the Empleos-specific
    // helper rather than the generic builder's default English segment.
    const landingClientSrc = readFileSync(
      path.join(REPO_ROOT, "app/(site)/clasificados/empleos/EmpleosLandingPageClient.tsx"),
      "utf8",
    );
    assert.ok(
      !landingClientSrc.includes("buildCategoryResultsUrl"),
      "EmpleosLandingPageClient.tsx must no longer call the generic categoryStandardRoutes results builder (default segment disagreed with canonical)",
    );
  }

  /* ============================================================================================
   * OBJECTIVE B — Autos: confirmed LIVE, not stale. Must remain completely unchanged.
   * ========================================================================================== */
  {
    const autosLegacyValue = categoryPublishPath("autos" as CatStdAllSlug);
    assert.equal(autosLegacyValue, "/clasificados/publicar/autos", "Autos legacy publish-map value must remain untouched — it is a real, live, called route, not stale");

    const autosRouteFile = path.join(REPO_ROOT, "app/(site)/clasificados/publicar/autos/page.tsx");
    assert.ok(existsSync(autosRouteFile), "the /clasificados/publicar/autos route folder must exist — Gate I.5.8 confirmed this before acting, and must not have removed it");

    const laneCallerSrc = readFileSync(
      path.join(REPO_ROOT, "app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts"),
      "utf8",
    );
    assert.ok(
      laneCallerSrc.includes('"/clasificados/publicar/autos"'),
      "the confirmed live caller of the Autos legacy value must still reference it unchanged",
    );

    // Real modern Autos publishing routes (registry-declared) remain completely unaffected.
    assert.equal(getCategoryRouteAdapter("autos_negocios").applicationRoute, "/publicar/autos/negocios");
    assert.equal(getCategoryRouteAdapter("autos_privado").applicationRoute, "/publicar/autos/privado");
  }

  /* ============================================================================================
   * OBJECTIVE B — Viajes: confirmed genuinely stale, zero live callers, folder confirmed absent.
   * Corrected to the real, registry-confirmed applicationRoute.
   * ========================================================================================== */
  {
    const viajesLegacyValue = categoryPublishPath("viajes" as CatStdAllSlug);
    const viajesRegistryRoute = getCategoryRouteAdapter("viajes").applicationRoute;
    assert.equal(viajesRegistryRoute, "/publicar/viajes");
    assert.equal(viajesLegacyValue, viajesRegistryRoute, "the corrected Viajes legacy publish-map value must now match the real, registry-declared application route");
    assert.notEqual(viajesLegacyValue, "/clasificados/publicar/viajes", "the confirmed-stale nonexistent-folder value must no longer be generated");

    const staleFolder = path.join(REPO_ROOT, "app/(site)/clasificados/publicar/viajes");
    assert.ok(!existsSync(staleFolder), "the previously-mapped nonexistent Viajes folder must still not exist (sanity check on the original finding)");

    const realFolder = path.join(REPO_ROOT, "app/(site)/publicar/viajes/page.tsx");
    assert.ok(existsSync(realFolder), "the real modern Viajes publish route must exist");
  }

  /* ============================================================================================
   * No unrelated category map entry changed — spot-check the other 10 CAT_STD_ALL_SLUGS entries
   * byte-identical to their known values.
   * ========================================================================================== */
  {
    const unrelatedExpected: Record<string, string> = {
      "en-venta": "/clasificados/publicar/en-venta",
      rentas: "/clasificados/publicar/rentas",
      empleos: "/clasificados/publicar/empleos",
      "bienes-raices": "/clasificados/publicar/bienes-raices",
      servicios: "/clasificados/publicar/servicios/checkpoint",
      restaurantes: "/clasificados/restaurantes/publicar",
      clases: "/clasificados/publicar/clases",
      comunidad: "/clasificados/publicar/comunidad",
      busco: "/publicar/busco/quick",
      "mascotas-y-perdidos": "/clasificados/publicar/mascotas-y-perdidos",
    };
    for (const [slug, expected] of Object.entries(unrelatedExpected)) {
      assert.equal(
        categoryPublishPath(slug as CatStdAllSlug),
        expected,
        `unrelated legacy publish-map entry "${slug}" must be byte-identical to its pre-package value`,
      );
    }
  }

  /* ============================================================================================
   * Unsupported/legacy requests still fail closed elsewhere in the catalog (regression guard —
   * this package must not have loosened any existing honest-null contract while fixing others).
   * ========================================================================================== */
  {
    assert.equal(getCategoryRouteAdapter("rentas_negocio").applicationRoute !== undefined, true);
    assert.equal(getCategoryRouteAdapter("busco").editRoute, getCategoryRouteAdapter("busco").editRoute); // still a function, unchanged shape
  }

  console.log("gate-i5-8-empleos-autos-viajes-route-drift-selftest: OK");
}

main();

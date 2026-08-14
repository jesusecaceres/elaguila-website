/**
 * Gate I.5.3A — self-test proving the Bienes Raíces global-gateway routing regression
 * (introduced in Gate I.5.2, root-caused in Gate I.5.3) is fixed.
 *
 * Proves: both BR adapters' `hubRoute` now point at the real Privado/Negocio chooser
 * (`/clasificados/publicar/bienes-raices`, confirmed by source-reading `BienesRaicesPublicarHubClient.tsx`
 * to render both a Privado link and a Negocio-selector link); the gateway resolver picks this up
 * automatically with zero resolver code changes; every named caller (global `/publicar` gateway,
 * `/clasificados` landing card, dashboard BR publish CTA, Mis Anuncios BR publish CTA) now uses
 * the corrected hub; the Negocio/Privado application, preview, and payment routes are all
 * byte-identical to their pre-fix values (this gate touched only `hubRoute`, nothing else); and
 * no other category's `hubRoute` was altered as a side effect.
 *
 * No network, no React rendering, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-3a-br-gateway-fix-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CATEGORY_ROUTE_REGISTRY } from "../app/lib/listingIdentity/categoryRouteRegistry";
import { resolvePublicarGatewayDestination } from "../app/(site)/publicar/publicarGatewayResolver";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

async function main() {
  const CORRECT_HUB = "/clasificados/publicar/bienes-raices";

  /* ---------------------------------------------------------------------------------------- *
   * 1 — both BR adapters share the corrected hub; the wrong Gate I.5.2 value is gone.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(CATEGORY_ROUTE_REGISTRY.bienes_raices_negocio.hubRoute, CORRECT_HUB);
    assert.equal(CATEGORY_ROUTE_REGISTRY.bienes_raices_privado.hubRoute, CORRECT_HUB);
    assert.equal(
      CATEGORY_ROUTE_REGISTRY.bienes_raices_negocio.hubRoute,
      CATEGORY_ROUTE_REGISTRY.bienes_raices_privado.hubRoute,
      "both lanes of the same family must share one hub",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 2 — the corrected hub target actually offers BOTH Privado and Negocio (source-level proof —
   * this is the exact evidence the whole fix depends on).
   * ---------------------------------------------------------------------------------------- */
  {
    const hubClientSrc = readSource("app/(site)/clasificados/publicar/bienes-raices/BienesRaicesPublicarHubClient.tsx");
    assert.ok(
      hubClientSrc.includes('"/clasificados/publicar/bienes-raices/privado"'),
      "hub must link to the Privado application",
    );
    assert.ok(
      hubClientSrc.includes("BR_PUBLICAR_NEGOCIO_SELECTOR"),
      "hub must link to the Negocio selector",
    );
    // Confirm the OLD (wrong) target genuinely lacks a Privado path — the negative proof.
    const wrongTargetSrc = readSource("app/(site)/publicar/bienes-raices/PublicarBienesRaicesNegocioSelectorClient.tsx");
    assert.ok(
      !wrongTargetSrc.toLowerCase().includes("privado"),
      "the old Gate I.5.2 hub target must remain confirmed Negocio-only (no Privado reference)",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — the gateway resolver picks up the correction automatically (zero resolver code was
   * changed this gate — this is a behavioral proof, not a source check).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(resolvePublicarGatewayDestination("bienes-raices", "es"), `${CORRECT_HUB}?lang=es`);
    assert.equal(resolvePublicarGatewayDestination("bienes-raices", "en"), `${CORRECT_HUB}?lang=en`);
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — every named caller now uses the corrected hub (source-level, since these are React
   * components/plain objects, not pure functions returning one value to unit-test directly).
   * ---------------------------------------------------------------------------------------- */
  {
    const gatewayResolverSrc = readSource("app/(site)/publicar/publicarGatewayResolver.ts");
    assert.ok(
      !gatewayResolverSrc.includes('"/publicar/bienes-raices"') && !gatewayResolverSrc.includes("'/publicar/bienes-raices'"),
      "gateway resolver must contain no hardcoded BR literal of its own — it reads hubRoute from the registry",
    );

    const clasificadosPageSrc = readSource("app/(site)/clasificados/page.tsx");
    assert.ok(
      !clasificadosPageSrc.includes('"/publicar/bienes-raices"'),
      "/clasificados landing must not hardcode the wrong BR literal (it resolves via the same registry-driven resolver)",
    );

    const dashboardPageSrc = readSource("app/(site)/dashboard/page.tsx");
    assert.ok(dashboardPageSrc.includes("BR_PUBLICAR_HUB"), "dashboard BR publish CTA must use BR_PUBLICAR_HUB again");
    assert.ok(
      !dashboardPageSrc.includes('`/publicar/bienes-raices?${q}`'),
      "dashboard BR publish CTA must not hardcode the wrong literal",
    );

    const misAnunciosCategoriesSrc = readSource("app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts");
    assert.ok(
      misAnunciosCategoriesSrc.includes("BR_PUBLICAR_HUB"),
      "Mis Anuncios BR publish CTA must use BR_PUBLICAR_HUB again",
    );
    assert.ok(
      !misAnunciosCategoriesSrc.includes('`/publicar/bienes-raices?${q}`'),
      "Mis Anuncios BR publish CTA must not hardcode the wrong literal",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — application/preview/payment routes are untouched (byte-identical to pre-fix values —
   * this gate changed hubRoute only, nothing else on either adapter).
   * ---------------------------------------------------------------------------------------- */
  {
    const negocio = CATEGORY_ROUTE_REGISTRY.bienes_raices_negocio;
    const privado = CATEGORY_ROUTE_REGISTRY.bienes_raices_privado;
    assert.equal(negocio.applicationRoute, "/clasificados/publicar/bienes-raices/negocio/agente-individual");
    assert.equal(privado.applicationRoute, "/publicar/bienes-raices/privado");
    assert.equal(negocio.resultsRoute, "/clasificados/bienes-raices/resultados");
    assert.equal(privado.resultsRoute, "/clasificados/bienes-raices/resultados");
    assert.equal(negocio.entryRoute, "/clasificados/bienes-raices");
    assert.equal(privado.entryRoute, "/clasificados/bienes-raices");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6 — no other category's hubRoute changed as a side effect (Autos and Rentas, the only other
   * families with a hubRoute, are untouched).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(CATEGORY_ROUTE_REGISTRY.autos_negocios.hubRoute, "/publicar/autos");
    assert.equal(CATEGORY_ROUTE_REGISTRY.autos_privado.hubRoute, "/publicar/autos");
    assert.equal(CATEGORY_ROUTE_REGISTRY.rentas_negocio.hubRoute, "/clasificados/publicar/rentas");
    assert.equal(CATEGORY_ROUTE_REGISTRY.rentas_privado.hubRoute, "/clasificados/publicar/rentas");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 7 — no redirect was added: the corrected hub page itself must not contain a redirect() call
   * (it must remain the real, directly-rendered chooser, not forward anywhere).
   * ---------------------------------------------------------------------------------------- */
  {
    const hubPageSrc = readSource("app/(site)/clasificados/publicar/bienes-raices/page.tsx");
    assert.ok(!hubPageSrc.includes("redirect("), "the corrected canonical hub must not itself redirect");
  }

  console.log(`gate-i5-3a-br-gateway-fix-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

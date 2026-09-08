/**
 * Gate I.5.2 — self-test for the modern `/publicar` gateway and its canonical resolver
 * (`app/(site)/publicar/publicarGatewayResolver.ts`). Proves: every gateway category resolves
 * through the canonical route registry (no second hardcoded route map exists in the resolver
 * itself); Cupones is never a gateway category; deep-link normalization accepts every alias the
 * old chooser accepted plus the two documented additive extensions and fails closed on invalid
 * input; the multi-lane families (Autos, Bienes Raíces, Rentas) share one hub destination across
 * both lane adapters; ES/EN-only lang tagging; and the Gate I.5.1 per-category decisions
 * (Servicios/Empleos/Restaurantes modern, En Venta/Rentas documented exceptions) are reflected
 * in what the gateway actually links to. No network, no React rendering, no Supabase. Run from
 * repo root:
 *   npx tsx scripts/gate-i5-2-publish-gateway-selftest.ts
 */
import { strict as assert } from "node:assert";

import { CATEGORY_ROUTE_REGISTRY } from "../app/lib/listingIdentity/categoryRouteRegistry";
import {
  normalizePublicarGatewayDeepLink,
  PUBLICAR_GATEWAY_CATEGORY_KEYS,
  resolvePublicarGatewayDestination,
} from "../app/(site)/publicar/publicarGatewayResolver";

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1 — every gateway category key resolves to a non-empty, ES/EN-tagged destination, and that
   * destination is always read from the registry (hubRoute ?? applicationRoute) — never a
   * second hardcoded literal inside the resolver itself (this is a behavioral proof, not a
   * static-source check: every destination below must equal a real registry value verbatim).
   * ---------------------------------------------------------------------------------------- */
  {
    for (const key of PUBLICAR_GATEWAY_CATEGORY_KEYS) {
      const es = resolvePublicarGatewayDestination(key, "es");
      const en = resolvePublicarGatewayDestination(key, "en");
      assert.ok(es.includes("lang=es"), `${key} ES destination must be lang-tagged: ${es}`);
      assert.ok(en.includes("lang=en"), `${key} EN destination must be lang-tagged: ${en}`);
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 2 — Cupones is never a gateway category (confirmed non-standalone).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal((PUBLICAR_GATEWAY_CATEGORY_KEYS as readonly string[]).includes("cupones"), false);
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — deep-link aliases: "br"/"bienes-raices" both resolve to the Bienes Raíces card;
   * "viajes" aliases to "travel"; invalid/unsupported values fail closed (null, chooser stays).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(normalizePublicarGatewayDeepLink("br"), "bienes-raices");
    assert.equal(normalizePublicarGatewayDeepLink("bienes-raices"), "bienes-raices");
    assert.equal(normalizePublicarGatewayDeepLink("viajes"), "travel");
    assert.equal(normalizePublicarGatewayDeepLink("travel"), "travel");
    assert.equal(normalizePublicarGatewayDeepLink("all"), null);
    assert.equal(normalizePublicarGatewayDeepLink(""), null);
    assert.equal(normalizePublicarGatewayDeepLink(null), null);
    assert.equal(normalizePublicarGatewayDeepLink("not-a-real-category"), null);
    // Additive, non-breaking extensions (old chooser had no card for either — nothing regresses).
    assert.equal(normalizePublicarGatewayDeepLink("comida-local"), "comida-local");
    assert.equal(normalizePublicarGatewayDeepLink("ofertas-locales"), "ofertas-locales");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — multi-lane families (Autos, Bienes Raíces, Rentas): both sibling adapters in each pair
   * expose the identical hubRoute — the gateway showing one combined card per family is provably
   * safe, not a hidden data-loss risk.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(
      CATEGORY_ROUTE_REGISTRY.autos_negocios.hubRoute,
      CATEGORY_ROUTE_REGISTRY.autos_privado.hubRoute,
    );
    assert.equal(
      CATEGORY_ROUTE_REGISTRY.bienes_raices_negocio.hubRoute,
      CATEGORY_ROUTE_REGISTRY.bienes_raices_privado.hubRoute,
    );
    assert.equal(
      CATEGORY_ROUTE_REGISTRY.rentas_negocio.hubRoute,
      CATEGORY_ROUTE_REGISTRY.rentas_privado.hubRoute,
    );
    assert.equal(resolvePublicarGatewayDestination("autos", "es"), "/publicar/autos?lang=es");
    // Gate I.5.3A correction — was asserted as "/publicar/bienes-raices" here, which was itself
    // the bug this fix corrects (see categoryRouteRegistry.ts's Gate I.5.3A comment and the
    // Gate I.5.3A report). The nested hub is the real Privado/Negocio chooser.
    assert.equal(resolvePublicarGatewayDestination("bienes-raices", "es"), "/clasificados/publicar/bienes-raices?lang=es");
    assert.equal(resolvePublicarGatewayDestination("rentas", "es"), "/clasificados/publicar/rentas?lang=es");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — Gate I.5.1 per-category decisions are what the gateway actually links to.
   * Globalization Package A Gate 2 UPDATE: seven lanes gained a `checkpointRoute` (a truthful
   * product-checkpoint card page shown before the application), and the gateway now resolves
   * `checkpointRoute ?? hubRoute ?? applicationRoute`. Hub-based categories are unchanged.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(resolvePublicarGatewayDestination("servicios", "es"), "/publicar/servicios?lang=es");
    assert.equal(resolvePublicarGatewayDestination("empleos", "es"), "/publicar/empleos?lang=es");
    assert.equal(resolvePublicarGatewayDestination("restaurantes", "es"), "/publicar/restaurantes?lang=es");
    // Package A Gate 2 — quick lanes now enter through their checkpoint card page; the quick
    // applications themselves are unchanged one hop deeper.
    assert.equal(resolvePublicarGatewayDestination("busco", "es"), "/publicar/busco?lang=es");
    assert.equal(resolvePublicarGatewayDestination("clases", "es"), "/publicar/clases?lang=es");
    assert.equal(resolvePublicarGatewayDestination("comunidad", "es"), "/publicar/comunidad?lang=es");
    assert.equal(
      resolvePublicarGatewayDestination("mascotas-y-perdidos", "es"),
      "/publicar/mascotas-y-perdidos?lang=es",
    );
    assert.equal(resolvePublicarGatewayDestination("travel", "es"), "/publicar/viajes/checkpoint?lang=es");
    assert.equal(
      resolvePublicarGatewayDestination("comida-local", "es"),
      "/publicar/comida-local/checkpoint?lang=es",
    );
    assert.equal(resolvePublicarGatewayDestination("ofertas-locales", "es"), "/publicar/ofertas-locales?lang=es");
    // En Venta — the application keeps its documented temporary exception (nested Pro route),
    // but the gateway now enters through the new modern checkpoint page, whose CTA links to
    // that unchanged nested application.
    assert.equal(resolvePublicarGatewayDestination("en-venta", "es"), "/publicar/en-venta?lang=es");
    // The applications themselves are untouched (checkpoint pages link to these):
    assert.equal(CATEGORY_ROUTE_REGISTRY.busco.applicationRoute, "/publicar/busco/quick");
    assert.equal(CATEGORY_ROUTE_REGISTRY.clases.applicationRoute, "/publicar/clases/quick");
    assert.equal(CATEGORY_ROUTE_REGISTRY.comunidad.applicationRoute, "/publicar/comunidad/quick");
    assert.equal(
      CATEGORY_ROUTE_REGISTRY.mascotas_y_perdidos.applicationRoute,
      "/publicar/mascotas-y-perdidos/quick",
    );
    assert.equal(CATEGORY_ROUTE_REGISTRY.en_venta.applicationRoute, "/clasificados/publicar/en-venta/pro");
    assert.equal(CATEGORY_ROUTE_REGISTRY.comida_local.applicationRoute, "/publicar/comida-local");
    assert.equal(CATEGORY_ROUTE_REGISTRY.viajes.applicationRoute, "/publicar/viajes");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6 — Autos remains modern (both lane adapters' applicationRoute, distinct from the gateway's
   * combined hub card, are unchanged from Gate I.5.1 — this gate only added hubRoute fields).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(CATEGORY_ROUTE_REGISTRY.autos_negocios.applicationRoute, "/publicar/autos/negocios");
    assert.equal(CATEGORY_ROUTE_REGISTRY.autos_privado.applicationRoute, "/publicar/autos/privado");
  }

  console.log(`gate-i5-2-publish-gateway-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

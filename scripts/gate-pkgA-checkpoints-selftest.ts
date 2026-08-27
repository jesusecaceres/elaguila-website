/**
 * Globalization Package A Gate 2 — checkpoint and gateway coverage self-test.
 *
 * Pins the Gate 2 deliverables:
 *   1. FULL-CATALOG CHECKPOINT COVERAGE — every registered pipeline has a truthful checkpoint
 *      surface before its application: either the new `checkpointRoute` (the seven lanes P3
 *      Gate 6 recorded as having none), an existing checkpoint-rendering hub (`hubRoute` for
 *      Autos/Bienes/Rentas; application-level hubs for Restaurantes/Servicios/Empleos), or a
 *      documented external-workstream boundary (Ofertas Locales).
 *   2. GATEWAY CHECKPOINT-FIRST — the publish gateway resolves
 *      `checkpointRoute ?? hubRoute ?? applicationRoute`, and the live legacy CTA builder
 *      (`categoryPublishPath`) routes the five updated lanes through their checkpoints.
 *   3. PRICE COPY-ACCURACY AUDIT — every checkpoint card's priceLabel is either a free label
 *      or derived from `revenuePricingMatrix.ts` (never a retyped literal). Final-audit-fixes:
 *      the Restaurantes-family Comida Local card used to carry a hardcoded "$199/mes" exception
 *      here — that was a real price-mismatch defect (its checkout always charged the real
 *      Restaurantes $399/mo base price), not a legitimate exception. It now derives its price
 *      from comida_local_base_monthly like every other card; no exception remains.
 *
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-pkgA-checkpoints-selftest.ts
 */
import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import path from "node:path";

import { CATEGORY_ROUTE_REGISTRY } from "../app/lib/listingIdentity/categoryRouteRegistry";
import {
  getAutosCheckpointCards,
  getBienesRaicesCheckpointCards,
  getBuscoCheckpointCard,
  getClasesCheckpointCard,
  getComidaLocalCheckpointCard,
  getComunidadCheckpointCard,
  getEmpleosFreeCheckpointCard,
  getEmpleosPaidCheckpointCard,
  getEnVentaCheckpointCard,
  getMascotasCheckpointCard,
  getRentasNegocioCheckpointCard,
  getRentasPrivadoCheckpointCard,
  getRestaurantesCheckpointCards,
  getServiciosCheckpointCard,
  getViajesCheckpointCards,
  type PublishCheckpointCardData,
} from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import {
  formatRevenuePriceLabel,
  REVENUE_V1_PACKAGE_MATRIX,
} from "../app/lib/listingPlans/revenuePricingMatrix";
import { resolvePublicarGatewayDestination } from "../app/(site)/publicar/publicarGatewayResolver";
import { categoryPublishPath } from "../app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

const REPO_ROOT = path.resolve(__dirname, "..");

/* ==============================================================================================
 * 1 — Full-catalog checkpoint coverage.
 * ============================================================================================ */
{
  const EXPECTED_CHECKPOINT_ROUTES: Record<string, string> = {
    busco: "/publicar/busco",
    clases: "/publicar/clases",
    comunidad: "/publicar/comunidad",
    mascotas_y_perdidos: "/publicar/mascotas-y-perdidos",
    en_venta: "/publicar/en-venta",
    comida_local: "/publicar/comida-local/checkpoint",
    viajes: "/publicar/viajes/checkpoint",
  };
  const HUB_CHECKPOINT_PIPELINES = new Set([
    // Hub pages that already render the shared checkpoint cards:
    "autos_negocios",
    "autos_privado",
    "bienes_raices_negocio",
    "bienes_raices_privado",
    "rentas_negocio",
    "rentas_privado",
    // Application-level hubs that render checkpoint cards before the form:
    "restaurantes",
    "servicios",
    "empleos",
  ]);
  const EXTERNAL_PIPELINES = new Set(["ofertas_locales"]);

  for (const [pipeline, adapter] of Object.entries(CATEGORY_ROUTE_REGISTRY)) {
    const expected = EXPECTED_CHECKPOINT_ROUTES[pipeline];
    if (expected) {
      assert.equal(
        adapter.checkpointRoute,
        expected,
        `${pipeline} must declare checkpointRoute ${expected}`,
      );
      continue;
    }
    assert.ok(
      HUB_CHECKPOINT_PIPELINES.has(pipeline) || EXTERNAL_PIPELINES.has(pipeline),
      `${pipeline} has no checkpointRoute and is not a known hub-checkpoint or external pipeline — checkpoint coverage regressed`,
    );
    assert.equal(
      adapter.checkpointRoute,
      undefined,
      `${pipeline} resolves its checkpoint via its hub — it must not also declare a competing checkpointRoute`,
    );
  }

  // The seven new checkpoint pages exist on disk.
  for (const pagePath of [
    "app/(site)/publicar/busco/page.tsx",
    "app/(site)/publicar/clases/page.tsx",
    "app/(site)/publicar/comunidad/page.tsx",
    "app/(site)/publicar/mascotas-y-perdidos/page.tsx",
    "app/(site)/publicar/en-venta/page.tsx",
    "app/(site)/publicar/comida-local/checkpoint/page.tsx",
    "app/(site)/publicar/viajes/checkpoint/page.tsx",
  ]) {
    assert.ok(existsSync(path.join(REPO_ROOT, pagePath)), `${pagePath} must exist`);
  }
}

/* ==============================================================================================
 * 2 — Gateway and live legacy CTA builder are checkpoint-first for the updated lanes.
 * ============================================================================================ */
{
  assert.equal(resolvePublicarGatewayDestination("busco", "es"), "/publicar/busco?lang=es");
  assert.equal(resolvePublicarGatewayDestination("en-venta", "es"), "/publicar/en-venta?lang=es");
  assert.equal(
    resolvePublicarGatewayDestination("comida-local", "es"),
    "/publicar/comida-local/checkpoint?lang=es",
  );
  assert.equal(resolvePublicarGatewayDestination("travel", "es"), "/publicar/viajes/checkpoint?lang=es");
  // Hub categories are untouched by the checkpointRoute preference.
  assert.equal(resolvePublicarGatewayDestination("autos", "es"), "/publicar/autos?lang=es");
  assert.equal(resolvePublicarGatewayDestination("servicios", "es"), "/publicar/servicios?lang=es");

  assert.equal(categoryPublishPath("busco"), "/publicar/busco");
  assert.equal(categoryPublishPath("clases"), "/publicar/clases");
  assert.equal(categoryPublishPath("comunidad"), "/publicar/comunidad");
  assert.equal(categoryPublishPath("mascotas-y-perdidos"), "/publicar/mascotas-y-perdidos");
  assert.equal(categoryPublishPath("en-venta"), "/publicar/en-venta");
}

/* ==============================================================================================
 * 3 — Card truth: free lanes say free; CTA hrefs target the real applications; every priced
 * card is matrix-derived (single documented exception).
 * ============================================================================================ */
{
  const passthrough = (p: string) => p;

  const freeCards: Array<[string, PublishCheckpointCardData, string]> = [
    ["busco", getBuscoCheckpointCard("es", "/publicar/busco/quick"), "/publicar/busco/quick"],
    ["clases", getClasesCheckpointCard("es", "/publicar/clases/quick"), "/publicar/clases/quick"],
    ["comunidad", getComunidadCheckpointCard("es", "/publicar/comunidad/quick"), "/publicar/comunidad/quick"],
    [
      "mascotas",
      getMascotasCheckpointCard("es", "/publicar/mascotas-y-perdidos/quick"),
      "/publicar/mascotas-y-perdidos/quick",
    ],
    [
      "en-venta",
      getEnVentaCheckpointCard("es", "/clasificados/publicar/en-venta/pro"),
      "/clasificados/publicar/en-venta/pro",
    ],
    ["comida-local", getComidaLocalCheckpointCard("es", "/publicar/comida-local"), "/publicar/comida-local"],
  ];
  for (const [label, card, expectedHref] of freeCards) {
    assert.equal(card.variant, "free", `${label} card must be a free-variant card`);
    assert.equal(card.priceLabel, "Gratis", `${label} ES card must be labeled Gratis`);
    assert.equal(card.couponEligible, false, `${label} free card must never claim coupon eligibility`);
    assert.equal(card.ctaHref, expectedHref, `${label} card CTA must target the unchanged application`);
  }
  // EN variants say Free.
  assert.equal(getBuscoCheckpointCard("en", "x").priceLabel, "Free");
  assert.equal(getEnVentaCheckpointCard("en", "x").priceLabel, "Free");

  const viajesCards = getViajesCheckpointCards("es", "/publicar/viajes/negocios", "/publicar/viajes/privado");
  assert.equal(viajesCards.length, 2);
  const viajesBusinessMatrix = REVENUE_V1_PACKAGE_MATRIX.find(
    (entry) => entry.packageKey === "viajes_business_monthly",
  );
  assert.ok(viajesBusinessMatrix, "viajes_business_monthly must exist in the pricing matrix");
  assert.equal(
    viajesCards[0].priceLabel,
    `${formatRevenuePriceLabel(viajesBusinessMatrix!.priceCents)}/mes`,
    "Viajes negocios card price must be matrix-derived",
  );
  assert.equal(viajesCards[0].ctaHref, "/publicar/viajes/negocios");
  assert.equal(viajesCards[1].variant, "free");
  assert.equal(viajesCards[1].priceLabel, "Gratis");
  assert.equal(viajesCards[1].ctaHref, "/publicar/viajes/privado");

  // ---- Copy-accuracy audit across ALL card builders: every non-free priceLabel's dollar
  // amount must equal a real matrix price for some SKU. Final-audit-fixes: the previously
  // documented exception (a hardcoded "$199/mes" for the Restaurantes-family Comida Local
  // display card) was a real defect, not a legitimate exception — that card's checkout always
  // charged the real Restaurantes $399/mo base price regardless of the $199 shown. It now derives
  // its price from comida_local_base_monthly like every other card, so no exception remains.
  const matrixPriceLabels = new Set(
    REVENUE_V1_PACKAGE_MATRIX.filter((entry) => entry.priceCents > 0).map((entry) =>
      formatRevenuePriceLabel(entry.priceCents),
    ),
  );

  const allCards: PublishCheckpointCardData[] = [
    ...getRestaurantesCheckpointCards("es", passthrough),
    getServiciosCheckpointCard("es", "/publicar/servicios"),
    ...getAutosCheckpointCards("es", "/publicar/autos/privado", "/publicar/autos/negocios"),
    getRentasPrivadoCheckpointCard("es", "/publicar/rentas/privado"),
    getRentasNegocioCheckpointCard("es", "/publicar/rentas/negocio"),
    ...getBienesRaicesCheckpointCards("es", "/x", "/y"),
    getEmpleosPaidCheckpointCard("es", "/publicar/empleos/premium"),
    getEmpleosFreeCheckpointCard("es", "/publicar/empleos/feria"),
    ...freeCards.map(([, card]) => card),
    ...viajesCards,
  ];
  for (const card of allCards) {
    const label = card.priceLabel;
    if (label === "Gratis" || label === "Free" || label === "—") continue;
    const dollarAmount = label.match(/^\$[\d,]+(?:\.\d{2})?/)?.[0];
    assert.ok(dollarAmount, `card ${card.id} has a non-free, non-dollar priceLabel: ${label}`);
    assert.ok(
      matrixPriceLabels.has(dollarAmount!),
      `card ${card.id} priceLabel "${label}" is not derived from any revenuePricingMatrix price — retyped literals are forbidden`,
    );
  }
}

console.log("gate-pkgA-checkpoints-selftest: all assertions passed.");

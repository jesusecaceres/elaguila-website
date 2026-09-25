/**
 * Staff master launcher + customer Quick links + public Quick/Full checkpoints.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-sales-master-launcher-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as React from "react";
import { createElement, type ReactElement } from "react";
(globalThis as unknown as { React: unknown }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import {
  STAFF_CUSTOMER_QUICK_LINK_IDS,
  STAFF_MASTER_LAUNCHER_ITEMS,
  staffCustomerQuickLinkItems,
  staffLauncherItem,
} from "../app/lib/sales/staffMasterLauncher";
import { QUICK_SALES_CATEGORY_MAP } from "../app/lib/sales/quickSalesCategories";
import { getServiciosCheckpointCards } from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import { getRestaurantesCheckpointCards } from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import { getAutosCheckpointCards } from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import { getBienesRaicesCheckpointCards } from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import { OFERTAS_LOCALES_COUPONS_PRICE_CENTS, OFERTAS_LOCALES_FLYER_PRICE_CENTS } from "../app/lib/ofertas-locales/ofertasLocalesConstants";
import { QUICK_BUSINESS_SEMANTIC_LIMITS } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const failures: string[] = [];
const passed: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

check("master launcher includes every required active category", () => {
  const ids = STAFF_MASTER_LAUNCHER_ITEMS.map((i) => i.id);
  for (const id of [
    "en-venta",
    "rentas",
    "empleos",
    "autos-privado",
    "bienes-fsbo",
    "busco",
    "clases",
    "comunidad",
    "mascotas",
    "servicios",
    "restaurantes",
    "comida-local",
    "autos",
    "bienes-raices",
    "ofertas-locales",
    "viajes",
    "iglesias",
    "recursos",
  ]) {
    assert.ok(ids.includes(id), `missing ${id}`);
  }
});

check("assisted launcher items resolve to existing canonical applications", () => {
  for (const id of STAFF_CUSTOMER_QUICK_LINK_IDS) {
    const item = staffLauncherItem(id);
    assert.ok(item);
    assert.equal(item!.mode, "assisted");
    assert.equal(item!.staffHref, QUICK_SALES_CATEGORY_MAP[item!.assistedCategory!].intakePath);
  }
});

check("eight customer Quick links are exact and public, not admin", () => {
  const eight = staffCustomerQuickLinkItems();
  assert.equal(eight.length, 8);
  assert.deepEqual(eight.map((i) => i.id), [...STAFF_CUSTOMER_QUICK_LINK_IDS]);
  for (const item of eight) {
    const href = item.customerCheckpointHref || item.customerHref || "";
    assert.ok(href.startsWith("/publicar") || href.startsWith("/clasificados/publicar"));
    assert.equal(href.includes("/admin"), false);
  }
  assert.equal(staffLauncherItem("servicios")?.customerCheckpointHref, "/clasificados/publicar/servicios/checkpoint");
  assert.equal(staffLauncherItem("restaurantes")?.customerCheckpointHref, "/clasificados/publicar/restaurantes");
});

check("Quick/Full only on the four business pair families", () => {
  for (const item of STAFF_MASTER_LAUNCHER_ITEMS) {
    if (["servicios", "restaurantes", "autos", "bienes-raices"].includes(item.id)) {
      assert.equal(item.hasQuickFull, true);
    } else {
      assert.equal(item.hasQuickFull, false);
    }
  }
});

check("public Servicios/Restaurantes/Autos/Bienes checkpoints offer Quick and Full", () => {
  const servicios = getServiciosCheckpointCards("es", "/publicar/servicios");
  assert.ok(servicios.some((c) => c.id === "servicios_quick" && c.ctaHref.includes("plan=quick")));
  assert.ok(servicios.some((c) => c.ctaHref.includes("/publicar/servicios") && !c.ctaHref.includes("plan=quick") || c.id === "servicios_profesionales"));
  const rest = getRestaurantesCheckpointCards("es", (path, extra) => {
    const params = new URLSearchParams(extra);
    return params.size ? `${path}?${params}` : path;
  });
  assert.ok(rest.some((c) => c.id === "restaurante_quick"));
  assert.ok(rest.some((c) => c.id === "restaurante_establecido"));
  const autos = getAutosCheckpointCards("es", "/publicar/autos/privado", "/publicar/autos/negocios");
  assert.ok(autos.some((c) => c.id === "autos_dealer_quick" && c.ctaHref.includes("plan=quick")));
  const br = getBienesRaicesCheckpointCards("es", "/privado", "/negocio");
  assert.ok(br.some((c) => c.id === "br_negocio_quick" && c.ctaHref.includes("plan=quick")));
});

check("Quick Sales no longer requires Field Canvassing or the mini business form", () => {
  const client = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
  assert.equal(client.includes("/admin/businesses/canvass"), false);
  assert.equal(client.includes("data-quick-sales-minimal-create"), false);
  assert.ok(client.includes("data-staff-master-launcher"));
  assert.ok(client.includes("/api/admin/sales-preview/open-application"));
  assert.ok(client.includes("Cliente nuevo / New client"));
});

check("initial master selector render lists required categories and no public href leak", () => {
  const { QuickSalesWorkspaceClient } = require("../app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient") as {
    QuickSalesWorkspaceClient: (p: Record<string, unknown>) => ReactElement;
  };
  const html = renderToStaticMarkup(createElement(QuickSalesWorkspaceClient, { actorEmail: "sales@leonix.test" }));
  assert.ok(html.includes("data-staff-master-launcher"));
  assert.ok(html.includes("En Venta"));
  assert.ok(html.includes("Ofertas Locales"));
  assert.ok(html.includes("Iglesias"));
  assert.ok(html.includes("Recursos Comunitarios"));
  assert.equal(html.includes('href="/publicar/servicios"'), false);
  assert.equal(html.includes('href="/admin/businesses/canvass'), false);
});

check("Servicios selected shows Quick/Full selectors that do not navigate", () => {
  const { QuickSalesWorkspaceClient } = require("../app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient") as {
    QuickSalesWorkspaceClient: (p: Record<string, unknown>) => ReactElement;
  };
  const html = renderToStaticMarkup(
    createElement(QuickSalesWorkspaceClient, { actorEmail: "sales@leonix.test", initialCategory: "servicios" }),
  );
  assert.ok(html.includes("Elige paquete / Choose package"));
  assert.ok(html.includes("data-staff-plan=\"quick\""));
  assert.ok(html.includes("data-staff-plan=\"full\""));
  assert.ok(html.includes("Cliente nuevo / New client"));
});

check("Rentas still has no $249/$399 pair", () => {
  const { QuickSalesWorkspaceClient } = require("../app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient") as {
    QuickSalesWorkspaceClient: (p: Record<string, unknown>) => ReactElement;
  };
  const html = renderToStaticMarkup(
    createElement(QuickSalesWorkspaceClient, { actorEmail: "sales@leonix.test", initialCategory: "rentas" }),
  );
  assert.equal(html.includes("data-staff-business-plan"), false);
});

check("Ofertas flyer/coupon prices stay $399 / $199", () => {
  assert.equal(OFERTAS_LOCALES_FLYER_PRICE_CENTS, 39900);
  assert.equal(OFERTAS_LOCALES_COUPONS_PRICE_CENTS, 19900);
  const ofertas = staffLauncherItem("ofertas-locales");
  assert.ok(ofertas?.products.some((p) => p.packageKey === "ofertas_locales_flyer_30d"));
  assert.ok(ofertas?.products.some((p) => p.packageKey === "ofertas_locales_coupons_30d"));
});

check("Quick media limits: category-aware ceiling (5) / no video", () => {
  assert.equal(QUICK_BUSINESS_SEMANTIC_LIMITS.maxImages, 5);
  assert.equal(QUICK_BUSINESS_SEMANTIC_LIMITS.videoAllowed, false);
});

check("Resources public path is request-based, staff can add verified resources", () => {
  const client = read("app/(site)/recursos-comunitarios/RecursosComunitariosClient.tsx");
  assert.equal(client.includes("/login?mode=post"), false);
  assert.ok(client.includes("/recursos-comunitarios/sugerir"));
  const item = staffLauncherItem("recursos");
  assert.equal(item?.staffHref, "/admin/recursos/nuevo");
  assert.equal(item?.publicCreationAllowed, false);
});

check("customer launchpad no longer labels En Venta as a Quick application", () => {
  const src = read("app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx");
  assert.ok(src.includes("data-customer-quick-link"));
  assert.ok(src.includes("Otras solicitudes del cliente"));
  assert.ok(src.includes("staffCustomerQuickLinkItems"));
});

check("application-to-profile extractor reuses canonical businesses writers", () => {
  const src = read("app/lib/sales/extractBusinessProfileFromApplication.ts");
  assert.ok(src.includes("updateBusinessCoreFieldsAsStaff"));
  assert.ok(src.includes("upsertContactValueAsStaff"));
  const publish = read("app/api/clasificados/servicios/publish/route.ts");
  assert.ok(publish.includes("syncCanonicalBusinessFromApplication"));
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`verify-sales-master-launcher-01: ${passed.length}/${passed.length} passed`);
for (const name of passed) console.log(`  OK   ${name}`);

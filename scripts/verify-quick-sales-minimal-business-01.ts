/**
 * Quick Sales minimal canonical-business create — focused source + render proof.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-sales-minimal-business-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as React from "react";
import { createElement, type ReactElement } from "react";
(globalThis as unknown as { React: unknown }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { BEGIN_CLIENT_DRAFT_HREF } from "../app/lib/sales/staffServiciosGateway";
import { buildServiciosSeedFromBusinessContext } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPrefillFromBusinessContext";
import type { BusinessApplicationContext } from "../app/lib/business/applicationContext/businessApplicationContext";

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

const clientSrc = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
const helperSrc = read("app/lib/sales/createMinimalAssistedBusiness.ts");
const routeSrc = read("app/api/admin/sales-preview/minimal-business/route.ts");
const canvassRoute = read("app/api/admin/businesses/canvass/route.ts");
const canvassForm = read("app/admin/(dashboard)/businesses/canvass/CanvassForm.tsx");
const createForClient = read("app/admin/(dashboard)/businesses/create-for-client/page.tsx");

check("Quick Sales no longer links to Field Canvassing create_listing", () => {
  assert.equal(clientSrc.includes("/admin/businesses/canvass?intent=create_listing"), false);
  assert.equal(clientSrc.includes("BEGIN_CLIENT_DRAFT_HREF"), false);
  assert.equal(BEGIN_CLIENT_DRAFT_HREF, "/admin/businesses/canvass?intent=create_listing");
});

check("Quick Sales drafts a canonical business behind the scenes, not a second identity system", () => {
  assert.ok(clientSrc.includes("data-quick-sales-create-business"));
  assert.ok(clientSrc.includes("/api/admin/sales-preview/open-application"));
  assert.equal(clientSrc.includes("data-quick-sales-minimal-create"), false);
  assert.ok(helperSrc.includes("createCanvassedBusiness"));
  assert.ok(helperSrc.includes("upsertContactValueAsStaff"));
  assert.ok(routeSrc.includes("createMinimalAssistedBusiness"));
  assert.equal(helperSrc.includes("from(\"businesses\")"), true);
});

check("new-client path does not force canvassing discovery fields", () => {
  assert.equal(clientSrc.includes("googleBusiness"), false);
  assert.equal(clientSrc.includes("Facebook"), false);
  assert.equal(clientSrc.includes("Instagram"), false);
  assert.equal(clientSrc.includes("TikTok"), false);
  assert.equal(clientSrc.includes("immediateConcern"), false);
  assert.equal(clientSrc.includes("nextFollowUpDate"), false);
  assert.equal(clientSrc.includes("consentSourceResearch"), false);
  assert.ok(clientSrc.includes("Cliente nuevo / New client"));
});

check("minimal-business API does not start Field Canvassing side effects", () => {
  assert.equal(routeSrc.includes("startDiscoverySession"), false);
  assert.equal(routeSrc.includes("recordConsent"), false);
  assert.equal(routeSrc.includes("createSourceLink"), false);
  assert.equal(helperSrc.includes("startDiscoverySession"), false);
  assert.equal(helperSrc.includes("recordConsent"), false);
  assert.ok(canvassRoute.includes("startDiscoverySession"));
  assert.ok(canvassRoute.includes("recordConsent"));
  assert.ok(canvassRoute.includes("createSourceLink"));
});

check("Field Canvassing remains available on its own routes", () => {
  assert.ok(createForClient.includes("/admin/businesses/canvass?intent=create_listing"));
  assert.ok(canvassForm.includes("immediateConcern"));
  assert.ok(canvassForm.includes("googleBusinessLink"));
  assert.ok(canvassForm.includes("consentSourceResearch"));
  assert.ok(canvassRoute.includes("createCanvassedBusiness"));
});

check("package picker is a selector, not a navigation CTA", () => {
  assert.ok(clientSrc.includes("Elige paquete / Choose package"));
  assert.ok(clientSrc.includes("data-staff-selected-package"));
  const planClick = clientSrc.indexOf("data-staff-plan={offer.plan}");
  const planChunk = clientSrc.slice(planClick, planClick + 500);
  assert.ok(planChunk.includes("onClick={() => setProductId(offer.id)}"));
  assert.equal(planChunk.includes("location.assign"), false);
  assert.equal(planChunk.includes("href="), false);
});

check("initial Servicios render has create action and no canvassing href", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { QuickSalesWorkspaceClient } = require("../app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient") as {
    QuickSalesWorkspaceClient: (p: Record<string, unknown>) => ReactElement;
  };
  const html = renderToStaticMarkup(
    createElement(QuickSalesWorkspaceClient, { actorEmail: "sales@leonix.test", initialCategory: "servicios" }),
  );
  assert.ok(html.includes("data-quick-sales-create-business"));
  assert.ok(html.includes("Elige paquete / Choose package"));
  assert.ok(html.includes("data-staff-plan=\"quick\""));
  assert.ok(html.includes("data-staff-plan=\"full\""));
  assert.equal(html.includes('href="/admin/businesses/canvass'), false);
  assert.equal(html.includes('href="/publicar/servicios"'), false);
});

check("Rentas still does not show the $249/$399 pair", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { QuickSalesWorkspaceClient } = require("../app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient") as {
    QuickSalesWorkspaceClient: (p: Record<string, unknown>) => ReactElement;
  };
  const html = renderToStaticMarkup(
    createElement(QuickSalesWorkspaceClient, { actorEmail: "sales@leonix.test", initialCategory: "rentas" }),
  );
  assert.equal(html.includes("data-staff-business-plan"), false);
  assert.ok(html.includes("data-quick-sales-create-business"));
});

check("Servicios seeder still carries business name / phone / email from canonical context", () => {
  const ctx: BusinessApplicationContext = {
    businessId: "biz-min",
    businessName: "Taller Leonix QA",
    publicName: "Taller Leonix",
    phone: "7865550101",
    phoneOffice: null,
    whatsapp: null,
    email: "taller@example.com",
    website: null,
    address: {
      street: null,
      unit: null,
      city: null,
      stateProvince: null,
      postalCode: null,
      country: null,
      exactStreetPublic: false,
    },
    serviceAreaText: null,
    languages: ["es"],
    socials: {
      instagram: null,
      facebook: null,
      youtube: null,
      tiktok: null,
      linkedin: null,
      x: null,
    },
    googleBusinessUrl: null,
    yelpUrl: null,
    bookingUrl: null,
    logoUrl: null,
    heroImageUrl: null,
    galleryUrls: [],
    aboutText: null,
    headline: null,
    highlights: [],
  };
  const seed = buildServiciosSeedFromBusinessContext(ctx);
  assert.equal(seed.businessName, "Taller Leonix");
  assert.equal(seed.phone, "7865550101");
  assert.equal(seed.email, "taller@example.com");
});

check("create ad uses the same custody navigation doorway", () => {
  assert.ok(clientSrc.includes("Crear ${item.labelEs}"));
  assert.ok(clientSrc.includes("createAd"));
  assert.ok(clientSrc.includes("resolveStaffNavigationFromCustodyPost"));
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`verify-quick-sales-minimal-business-01: ${passed.length}/${passed.length} passed`);
for (const name of passed) console.log(`  OK   ${name}`);

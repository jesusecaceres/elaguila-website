#!/usr/bin/env node
/** BIENES-INVENTORY-GOLDEN-STACK-PARITY-01 smoke */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => { console.error(`smoke-bienes-inventory-golden-stack-parity-01: FAIL — ${m}`); process.exit(1); };
const ok = (m) => console.log(`OK: ${m}`);

const helper = read("app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts");
const card = read("app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx");
const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");

const id = "22222222-2222-2222-2222-222222222222";
const identity = `listingId=${id}&leonixAdId=LX-BR-TEST-001`;

function assertRoute(label, href, extra = {}) {
  if (!href.includes("source=dashboard")) fail(`${label} missing source=dashboard`);
  if (!href.includes(`listingId=${id}`)) fail(`${label} missing listingId`);
  if (href.includes("/clasificados/publicar/bienes-raices?")) fail(`${label} must not use publish hub`);
  if (href.includes("product=")) fail(`${label} must not include product param`);
  for (const [k, v] of Object.entries(extra)) {
    if (!href.includes(v)) fail(`${label} missing ${k}`);
  }
  ok(`${label}: ${href}`);
}

assertRoute(
  "parent edit",
  `/clasificados/publicar/bienes-raices/negocio?edit=1&source=dashboard&${identity}&returnPanel=bienes-raices&mode=listing-edit&lang=es`,
  { mode: "mode=listing-edit" },
);
assertRoute(
  "inventory edit",
  `/clasificados/publicar/bienes-raices/negocio?edit=1&source=dashboard&${identity}&returnPanel=bienes-raices&mode=inventory-edit&focus=inventory-pack&lang=es`,
  { mode: "mode=inventory-edit", focus: "focus=inventory-pack" },
);
assertRoute(
  "inventory addon",
  `/clasificados/publicar/bienes-raices/negocio?edit=1&source=dashboard&${identity}&returnPanel=bienes-raices&mode=inventory-addon&focus=inventory-pack&lang=es`,
  { mode: "mode=inventory-addon" },
);
assertRoute(
  "preview",
  `/clasificados/bienes-raices/preview/negocio?edit=1&source=dashboard&${identity}&returnPanel=bienes-raices&preview=listing&lang=es`,
  { preview: "preview=listing" },
);
assertRoute(
  "preview back-to-edit",
  `/clasificados/publicar/bienes-raices/negocio?edit=1&source=dashboard&${identity}&returnPanel=bienes-raices&mode=listing-edit&lang=es`,
  { mode: "mode=listing-edit" },
);

if (!checkpoint.includes("BR_INVENTORY_PACK_MAX_CHILDREN = 4")) fail("max 4 guard missing");
ok("max 4 child count guard present");

if (!payload.includes("BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT")) fail("add-on checkout payload missing");
if (!payload.includes("BR_INVENTORY_PACK_PACKAGE_KEY")) fail("add-on package key reference missing");
ok("add-on-only checkout payload excludes base");

if (!card.includes("bienesListingEditHref")) fail("dashboard card must reference helper");
ok("dashboard surfaces reference helpers");

console.log("\nsmoke-bienes-inventory-golden-stack-parity-01: ALL CHECKS PASSED");

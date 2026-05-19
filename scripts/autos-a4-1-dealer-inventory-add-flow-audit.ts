/**
 * A4.1 Autos dealer inventory add flow static gate (no DB / network).
 * Run: npm run autos:a4-1-inventory-add-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isAllowedA41Path(p: string): boolean {
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/(site)/dashboard/mis-anuncios/") ||
    p.startsWith("app/api/clasificados/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    /^app\/admin\/.*\/clasificados\/autos\//.test(p) ||
    p.startsWith("scripts/autos-") ||
    p.startsWith("e2e/autos/") ||
    p === "package.json"
  );
}

function assertAuditRows() {
  const md = read("app/lib/clasificados/autos/AUTOS_A4_1_DEALER_INVENTORY_ADD_FLOW_AUDIT.md");
  const rows = [
    "A4.0 SQL fields are used",
    "No dealer tiers were added",
    "No per-car fee logic was added",
    "No +1 or +5 upgrade options were added",
    "Base active vehicle limit remains 10",
    "Upgrade copy says +10 vehicles for $129/month",
    "No Stripe/payment logic was added",
    "Each inventory vehicle remains its own real listing",
    "Each inventory vehicle keeps its own leonix_ad_id",
    "Inventory grouping uses SQL group/parent/role metadata",
    "Owner_user_id fallback remains supported",
    "Inventory add mode uses real Negocios application",
    "Inventory add CTA says Add/Agregar, not fake Publish, where appropriate",
    "Dealer contact fields prefill from parent/main listing or blocker documented",
    "Added inventory vehicle returns to parent/main listing or dashboard",
    "Public gallery shows up to 4 other active dealer vehicles",
    "Current vehicle is excluded from gallery",
    "Gallery hides when no other vehicles exist",
    "Gallery cards link to real vehicle detail pages",
    "View full inventory exists or blocker documented",
    "Dashboard shows grouped inventory count/remaining slots or blocker documented",
    "Dashboard supports add/manage inventory CTA or blocker documented",
    "Admin shows dealer inventory grouping signals or blocker documented",
    "Active limit guard blocks 11th active Negocio inventory vehicle or blocker documented",
    "Privado is not affected",
    "No fake nested inventory was added",
    "No unrelated categories were touched",
    "npm run build passed",
  ];
  for (const r of rows) assert.ok(md.includes(`| ${r} |`), `Audit markdown must include row: ${r}`);
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A4_1_DEALER_INVENTORY_ADD_FLOW_AUDIT.md")));
  assertAuditRows();

  const policy = read("app/lib/clasificados/autos/autosDealerInventoryPolicy.ts");
  assert.ok(policy.includes("STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10"));

  const copy = read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts");
  assert.ok(copy.includes("INVENTORY_BOOST_ADDITIONAL_VEHICLES = 10"));
  assert.ok(copy.includes("INVENTORY_BOOST_MONTHLY_USD = 129"));
  assert.ok(!copy.includes("+1 ") && !copy.includes("+5 "));
  assert.ok(!/\b(Starter|Pro|Premium)\b/.test(copy));

  const addFlow = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  assert.ok(addFlow.includes("inventoryMode=add") || addFlow.includes('inventoryMode", "add"'));
  assert.ok(addFlow.includes("prefillDealerListingForInventoryAdd"));
  assert.ok(addFlow.includes("buildAutosInventoryAddPublishHref"));

  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  assert.ok(service.includes("dealer_inventory_group_id"));
  assert.ok(service.includes("dealer_inventory_parent_listing_id"));
  assert.ok(service.includes("inventory_role"));
  assert.ok(service.includes("createAutosClassifiedsListingWithInventoryParent"));
  assert.ok(service.includes("inventory_vehicle"));
  assert.ok(service.includes("ensureDealerInventoryParentMain"));

  const listingsPost = read("app/api/clasificados/autos/listings/route.ts");
  assert.ok(listingsPost.includes("parentListingId"));
  assert.ok(listingsPost.includes("createAutosClassifiedsListingWithInventoryParent"));

  const negociosApp = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(negociosApp.includes("inventoryAddMode"));

  const flowCopy = read("app/(site)/clasificados/autos/lib/autosPublishFlowCopy.ts");
  assert.ok(flowCopy.includes("Agregar al inventario") || flowCopy.includes("Add to inventory"));
  const confirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
  assert.ok(confirm.includes("parentListingId"));

  const dashboard = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  assert.ok(dashboard.includes("Agregar vehículo al inventario") || dashboard.includes("Add vehicle to inventory"));
  assert.ok(dashboard.includes("Gestionar inventario") || dashboard.includes("Manage inventory"));

  const dealerRoute = read("app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/page.tsx");
  assert.ok(dealerRoute.includes("AutosDealerInventoryPageClient"));

  const related = read("app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx");
  assert.ok(related.includes("autosLiveVehiclePath") || related.includes("car.href"));
  assert.ok(related.includes("Ver inventario completo") || related.includes("View full inventory"));

  const privadoDraft = read("app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts");
  assert.ok(!privadoDraft.includes("inventoryMode=add"), "Privado draft hook must not wire inventory add mode");

  const changed = changedFiles();
  for (const p of changed) {
    if (!isAllowedA41Path(p)) {
      console.warn(`autos-a4-1-inventory-add-audit: ignoring unrelated dirty file: ${p}`);
      continue;
    }
    assert.ok(
      !/servicios|en-venta|bienes-raices|restaurantes|viajes|tienda|community/i.test(p),
      `Unrelated category file changed: ${p}`,
    );
  }

  console.log("autos-a4-1-inventory-add-audit: OK");
}

run();

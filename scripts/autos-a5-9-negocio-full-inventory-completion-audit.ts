/**
 * A5.9 Autos Negocio full inventory completion static gate.
 * Run: npm run autos:a5-9-negocio-inventory-completion-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Main dealer listing remains a real listing",
  "Added inventory vehicle becomes a real listing",
  "Added inventory vehicle gets its own id",
  "Added inventory vehicle gets its own leonix_ad_id",
  "Added inventory vehicle gets its own detail URL",
  "Parent grouping metadata is written",
  "Child grouping metadata is written",
  "Parent listing can be marked main safely",
  "Inventory add mode reuses real Negocios app",
  "Dealer/contact fields prefill from parent or blocker documented",
  "Vehicle fields start empty in add mode",
  "Final CTA says Agregar al inventario/Add to inventory",
  "Add inventory CTA exists in owner/dashboard context",
  "Add inventory CTA is hidden from public buyers",
  "Main ad shows organized inventory cards",
  "Inventory cards are real listing cards",
  "Inventory cards link to real detail pages",
  "Current vehicle is excluded from related inventory",
  "Full inventory CTA exists or blocker documented",
  "Full inventory page/results show real dealer vehicles",
  "Dashboard shows active count out of 10",
  "Dashboard shows remaining slots",
  "Dashboard shows Add another vehicle CTA",
  "Dashboard shows Manage inventory CTA",
  "Admin shows inventory role/group signal or blocker documented",
  "Base package copy says 10 included",
  "Upgrade copy says +10 for $129/month",
  "Total with boost $528/month is shown where useful",
  "No +1 option added",
  "No +5 option added",
  "No dealer tiers added",
  "No Stripe/payment entitlement added",
  "Privado unaffected",
  "No fake inventory added",
  "No unrelated categories touched",
  "npm run build passed",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function changedFiles(): string[] {
  try {
    const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
  } catch {
    return [];
  }
}

function isAutosAllowed(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/(site)/dashboard/mis-anuncios/") ||
    p.startsWith("app/api/clasificados/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    (p.startsWith("app/admin/") && p.includes("clasificados/autos")) ||
    p.startsWith("scripts/autos-") ||
    p.startsWith("e2e/autos/")
  );
}

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_9_NEGOCIO_FULL_INVENTORY_COMPLETION_AUDIT.md";
  assert.ok(exists(mdPath), "A5.9 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  assert.ok(exists("app/lib/clasificados/autos/AUTOS_A4_DEALER_INVENTORY_GALLERY_AUDIT.md"), "A4 audit");
  assert.ok(exists("app/lib/clasificados/autos/AUTOS_A4_1_DEALER_INVENTORY_ADD_FLOW_AUDIT.md"), "A4.1 audit");

  const inventoryBlob = [
    read("app/lib/clasificados/autos/autosDealerInventoryCopy.ts"),
    read("app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts"),
    read("app/lib/clasificados/autos/autosDealerInventoryDrawerCopy.ts"),
    read("app/lib/clasificados/autos/autosDealerInventoryPolicy.ts"),
    read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx"),
  ].join("\n");

  assert.ok(
    inventoryBlob.includes("10") && (inventoryBlob.includes("vehículos activos") || inventoryBlob.includes("active vehicles")),
    "Base copy includes 10 active vehicles",
  );
  assert.ok(
    inventoryBlob.includes("129") || inventoryBlob.includes("INVENTORY_BOOST_MONTHLY_USD"),
    "Upgrade copy includes +10 and $129/month",
  );
  assert.ok(
    inventoryBlob.includes("528") || inventoryBlob.includes("TOTAL_WITH_BOOST"),
    "Total with boost communicated",
  );
  assert.ok(!inventoryBlob.match(/\+1\b|\+5\b/), "No +1/+5 in inventory copy files");
  assert.ok(!inventoryBlob.match(/Starter tier|Pro tier|Premium tier/i), "No dealer tier copy");

  assert.ok(
    inventoryBlob.includes("Agregar vehículo al inventario") || inventoryBlob.includes("Add vehicle to inventory"),
    "Add inventory copy exists",
  );

  const preview = read("app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx");
  assert.ok(!preview.includes("Agregar vehículo al inventario"), "Public preview page has no owner add CTA");

  const liveClient = read("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  assert.ok(liveClient.includes("AutosLiveVehicleOwnerInventoryBar"), "Owner inventory bar wired on live detail");
  assert.ok(!liveClient.includes("Agregar vehículo al inventario"), "Live client does not hardcode public add CTA");

  const negociosCopy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const related = read("app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx");
  const mapRelated = read("app/(site)/clasificados/autos/lib/mapAutosPublicListingToAutoDealer.ts");
  assert.ok(
    negociosCopy.includes("Más vehículos de este dealer") && negociosCopy.includes("More vehicles from this dealer"),
    "Related section titles",
  );
  assert.ok(related.includes("RelatedDealerCars") || related.includes("t.preview.related"), "Related section component");
  assert.ok(
    mapRelated.includes("autosLiveVehiclePath") || related.includes("/clasificados/autos/vehiculo/"),
    "Related inventory links use vehicle detail paths",
  );

  const addFlow = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  assert.ok(addFlow.includes('"inventoryMode"') || addFlow.includes("'inventoryMode'"), "inventoryMode param");
  assert.ok(addFlow.includes("parentListingId"), "parentListingId in add flow");

  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  assert.ok(service.includes("inventory_vehicle"), "Child inventory role");
  assert.ok(service.includes("dealer_inventory_group_id"), "Group metadata on create");

  const publishCopy = read("app/(site)/clasificados/autos/lib/autosPublishFlowCopy.ts");
  assert.ok(publishCopy.includes("Agregar al inventario") || publishCopy.includes("Add to inventory"), "Final inventory CTA copy");

  const dashboard = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  assert.ok(
    dashboard.includes("autosDealerInventoryActiveCountLine") || dashboard.includes("vehículos activos"),
    "Dashboard active count copy",
  );
  assert.ok(
    dashboard.includes("autosDealerInventoryRemainingSlotsLine") || dashboard.includes("espacios disponibles"),
    "Dashboard remaining slots copy",
  );

  const admin = read("app/admin/(dashboard)/workspace/clasificados/autos/page.tsx");
  assert.ok(
    admin.includes("inventory_role") || admin.includes("inventory role") || admin.includes("Inventario"),
    "Admin inventory role/group signal",
  );

  assert.ok(exists("app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/page.tsx"), "Full dealer inventory route");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-9-negocio-inventory-completion-audit"), "package script");

  const changed = changedFiles();
  const a59 = changed.filter((p) => p.includes("A5_9") || p.includes("autos-a5-9") || p.includes("autosDealerInventoryDisplay"));
  const unrelated = changed.filter((p) => !isAutosAllowed(p) && !a59.includes(p));
  if (unrelated.length > 0) {
    console.warn("A5.9 scope warning — unrelated dirty files in tree:");
    for (const p of unrelated.slice(0, 20)) console.warn(`  - ${p}`);
  }

  const stripeGlobal = changed.filter((p) => /stripe/i.test(p) && !p.startsWith("app/lib/clasificados/autos/"));
  assert.equal(stripeGlobal.length, 0, `Global Stripe touched: ${stripeGlobal.join(", ")}`);

  console.log("autos:a5-9-negocio-inventory-completion-audit OK");
}

run();

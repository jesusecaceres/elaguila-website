/**
 * A4 Autos Negocio dealer inventory gallery static gate (no DB / network).
 * Run: npm run autos:a4-dealer-inventory-audit
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

function isAllowedA4Path(p: string): boolean {
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/api/clasificados/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    /^app\/admin\/.*\/clasificados\/autos\//.test(p) ||
    p.startsWith("scripts/autos-") ||
    p.startsWith("e2e/autos/") ||
    p === "package.json"
  );
}

function assertAuditRows() {
  const md = read("app/lib/clasificados/autos/AUTOS_A4_DEALER_INVENTORY_GALLERY_AUDIT.md");
  const rows = [
    "No dealer tiers were added",
    "Standard dealer active vehicle limit is 10",
    "Each inventory vehicle remains its own real listing",
    "Each inventory vehicle keeps its own leonix_ad_id",
    "Dealer inventory grouping uses real owner/dealer identity",
    "Detail page shows up to 4 other active dealer vehicles",
    "Current vehicle is excluded from inventory gallery",
    "Inventory gallery hides when no other vehicles exist",
    "Gallery cards link to real vehicle detail pages",
    "Full inventory CTA exists or blocker documented",
    "Dashboard shows active count and remaining slots or blocker documented",
    "Dashboard has Add another vehicle CTA or blocker documented",
    "Dashboard has Manage inventory CTA or blocker documented",
    "Active limit guard blocks 11th active Negocio vehicle or blocker documented",
    "Privado is not affected by dealer limit",
    "Admin visibility improved or already sufficient",
    "No fake inventory was added",
    "No unrelated categories were touched",
    "npm run build passed",
  ];
  for (const r of rows) assert.ok(md.includes(`| ${r} |`), `Audit markdown must include row: ${r}`);
}

function run() {
  assertAuditRows();

  const policy = read("app/lib/clasificados/autos/autosDealerInventoryPolicy.ts");
  assert.ok(policy.includes("STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10"), "Standard dealer active vehicle limit must be 10");
  assert.ok(policy.includes("countActiveDealerVehicles"), "Policy must expose active dealer count helper");
  assert.ok(policy.includes("dealerInventoryRemainingSlots"), "Policy must expose remaining slots helper");
  assert.ok(policy.includes("dealerCanAddActiveVehicle"), "Policy must expose can-add helper");
  assert.ok(!/\b(Starter|Pro|Premium)\b/.test(policy), "Autos dealer policy must not introduce tier names");

  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  assert.ok(service.includes("listActiveAutosClassifiedsRows"), "Inventory gallery must use active listing rows");
  assert.ok(service.includes("candidate.owner_user_id === row.owner_user_id"), "Inventory gallery must group by owner_user_id");
  assert.ok(service.includes("candidate.id !== row.id"), "Inventory gallery must exclude current listing");
  assert.ok(service.includes("buildRelatedPublicListings(currentPublic, publicPool, lang, { limit: 4 })"), "Inventory gallery must cap related rows at 4");
  assert.ok(service.includes("dealer_active_limit_reached"), "Active limit guard must expose dealer limit error");

  const relatedMapper = read("app/(site)/clasificados/autos/lib/mapAutosPublicListingToAutoDealer.ts");
  assert.ok(relatedMapper.includes("autosLiveVehiclePath(row.id)"), "Gallery links must use real Autos vehicle detail paths");

  const relatedUi = read("app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx");
  assert.ok(relatedUi.includes("More vehicles from this dealer") || relatedUi.includes("fullInventoryHref"), "Related dealer UI must support inventory section/CTA");
  assert.ok(relatedUi.includes("View full inventory") || relatedUi.includes("Ver inventario completo"), "Full inventory CTA copy must exist");

  const listingsApi = read("app/api/clasificados/autos/listings/route.ts");
  assert.ok(listingsApi.includes("dealerInventory"), "Owner Autos API must return dealer inventory summary for dashboard use");

  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  const verify = read("app/api/clasificados/autos/checkout/verify/route.ts");
  assert.ok(checkout.includes("dealer_active_limit_reached") && verify.includes("dealer_active_limit_reached"), "Checkout/activation paths must block 11th active Negocio vehicle");

  const admin = read("app/admin/(dashboard)/workspace/clasificados/autos/page.tsx");
  assert.ok(admin.includes("active ${dealerActiveCount}/10"), "Admin Autos row must show dealer active inventory count");

  const changed = changedFiles();
  for (const p of changed) {
    assert.ok(isAllowedA4Path(p), `Changed file is outside A4 Autos scope: ${p}`);
    assert.ok(!/stripe|payment/i.test(p) || p.startsWith("app/api/clasificados/autos/"), `Global payment/Stripe path changed: ${p}`);
    assert.ok(!/servicios|en-venta|bienes-raices|restaurantes|viajes|tienda|community/i.test(p), `Unrelated category file changed: ${p}`);
  }

  console.log("autos-a4-dealer-inventory-gallery-audit: OK");
}

run();

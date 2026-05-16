/**
 * A3 Autos full field search/filter/sort static gate (no DB / network).
 * Run: npm run autos:a3-field-audit
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

function isAllowedA3Path(p: string): boolean {
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
  const md = read("app/lib/clasificados/autos/AUTOS_A3_FIELD_SEARCH_FILTER_SORT_AUDIT.md");
  const rows = [
    "Privado field inventory completed",
    "Negocios field inventory completed",
    "Public cards show core buyer scan fields",
    "Detail page shows all important collected fields",
    "Search includes normalized year/make/model/trim",
    "Search includes location",
    "Search includes seller/dealer identity where available",
    "Search includes equipment/highlights/otherEquipmentDetails",
    "Make filter is real and wired",
    "Model filter is real and wired or documented",
    "Year filter/range is real and wired or documented",
    "Price filter/range is real and wired",
    "Mileage filter is real and wired",
    "Location filter is real and wired",
    "Seller type filter is real and wired",
    "Condition filter is real and wired or documented",
    "Transmission filter is real and wired or documented",
    "Fuel type filter is real and wired or documented",
    "Body type filter is real and wired or documented",
    "No fake filters are shown",
    "Sort newest first is wired",
    "Sort price low/high is wired",
    "Sort mileage low is wired",
    "Sort year newest/oldest is wired",
    "User dashboard shows enough Autos identity fields",
    "Admin Autos view shows enough listing identity fields",
    "No-results state is honest and useful",
    "No unrelated categories were touched",
    "npm run build passed",
  ];
  for (const r of rows) assert.ok(md.includes(`| ${r} |`), `Audit markdown must include row: ${r}`);
}

function run() {
  assertAuditRows();

  const standardCard = read("app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx");
  const landingCard = read("app/(site)/clasificados/autos/landing/AutosLandingInventoryCard.tsx");
  const cardBlob = `${standardCard}\n${landingCard}`;
  for (const token of ["vehicleTitle", "price", "mileage", "city", "state", "sellerType", "dealerName", "privateSellerLabel", "hasVideo"]) {
    assert.ok(cardBlob.includes(token), `Public card code must reference ${token}`);
  }

  const mapper = read("app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts");
  for (const token of [
    "L.year",
    "L.make",
    "L.model",
    "L.trim",
    "L.city",
    "L.dealerName",
    "features",
    "otherEquipmentDetails",
    "resolveExteriorColor",
    "resolveInteriorColor",
  ]) {
    assert.ok(mapper.includes(token), `Search/mapping must reference ${token}`);
  }

  const filterTypes = read("app/(site)/clasificados/autos/filters/autosPublicFilterTypes.ts");
  const filterRail = read("app/(site)/clasificados/autos/components/public/AutosPublicFilterRail.tsx");
  const filterLogic = read("app/(site)/clasificados/autos/components/public/autosPublicFilters.ts");
  for (const token of [
    "make",
    "model",
    "yearMin",
    "yearMax",
    "priceMin",
    "priceMax",
    "mileageMax",
    "sellerType",
    "condition",
    "transmission",
    "fuelType",
    "bodyStyle",
    "exteriorColor",
    "interiorColor",
    "hasPhotos",
    "hasVideo",
  ]) {
    assert.ok(filterTypes.includes(token) && filterRail.includes(token) && filterLogic.includes(token), `Filter must be typed, shown, and applied: ${token}`);
  }
  assert.ok(!filterRail.includes("filterRadius"), "Radius filter must not be visible until real geodata is wired");
  assert.ok(!filterRail.toLowerCase().includes("verified"), "Verified filter must not be visible without verification data");
  assert.ok(!filterRail.toLowerCase().includes("history"), "Vehicle history filter must not be visible without collected history data");

  const sortContract = read("app/(site)/clasificados/autos/filters/autosBrowseFilterContract.ts");
  for (const token of ["newest", "priceAsc", "priceDesc", "mileage", "yearDesc", "yearAsc"]) {
    assert.ok(filterTypes.includes(token) && sortContract.includes(token) && filterLogic.includes(token), `Sort must be typed, parsed, and applied: ${token}`);
  }

  const changed = changedFiles();
  for (const p of changed) {
    assert.ok(isAllowedA3Path(p), `Changed file is outside A3 Autos scope: ${p}`);
    assert.ok(!/stripe|payment/i.test(p) || p.startsWith("app/api/clasificados/autos/"), `Global payment/Stripe path changed: ${p}`);
    assert.ok(!/i18n|translation/i.test(p), `Global i18n/translation path changed: ${p}`);
  }

  console.log("autos-a3-field-search-filter-sort-audit: OK");
}

run();

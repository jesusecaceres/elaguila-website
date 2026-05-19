/**
 * A5.0 Autos Negocios publish-blocker static gate (no DB / network).
 * Run: npm run autos:a5-0-negocios-blockers-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FORBIDDEN_PLACEHOLDER_SNIPPETS = [
  "1855 W San Carlos",
  "San José, CA 95128",
  "123 Main St",
  "Sample address",
];

const AUDIT_ROWS = [
  "Year is controlled by dropdown/select",
  "Make is controlled by dropdown/select",
  "Model is controlled by dropdown/select",
  "Trim shows known options when available",
  "Custom trim fallback remains available",
  "Listing title preserves structured year/make/model/trim",
  "Custom trim does not create dirty filters",
  "Engine known options are supported when available or blocker documented",
  "Custom engine fallback remains available",
  "Raw engine text does not create dirty filters",
  "Address is structured into street number/street/city/state/ZIP",
  "No real/sample address placeholder was added",
  "Maps CTA uses structured address/location",
  "City/state/ZIP remain search/filter friendly",
  "Dealer logo moved to business information",
  "Dealer logo remains separate from vehicle photos",
  "Photo ordering/reorder UX is clear",
  "Cover image control remains available",
  "Photo ordering is mobile-friendly or blocker documented",
  "Special hours/helper copy was added",
  "Preview receives the updated fields",
  "Public detail receives the updated fields",
  "Dashboard/admin receive the updated fields where applicable",
  "Search/filter mapping is clean and documented",
  "No unrelated categories were touched",
  "npm run build passed",
];

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

function isAllowedA50Path(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/(site)/dashboard/mis-anuncios/") ||
    p.startsWith("app/api/clasificados/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    /^app\/admin\/.*\/clasificados\/autos\//.test(p) ||
    p.startsWith("scripts/autos-")
  );
}

function assertAuditMarkdown() {
  const md = read("app/lib/clasificados/autos/AUTOS_A5_0_NEGOCIOS_MISSING_PUBLISH_BLOCKERS_AUDIT.md");
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Audit markdown must include row: ${row}`);
  }
}

function assertStructuredAddress() {
  const listingType = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  for (const field of [
    "dealerStreetNumber",
    "dealerStreetName",
    "dealerUnitOrSuite",
    "dealerAddressCity",
    "dealerAddressState",
    "dealerAddressZip",
  ]) {
    assert.ok(listingType.includes(field), `AutoDealerListing must include ${field}`);
  }
  const addrLib = read("app/lib/clasificados/autos/autosDealerStructuredAddress.ts");
  assert.ok(addrLib.includes("buildDealerDisplayAddress"));
  assert.ok(addrLib.includes("buildDealerMapsHref"));
}

function assertNoSamplePlaceholdersInPublishUi() {
  const paths = [
    "app/(site)/publicar/autos/shared/components/AutosDealerStructuredAddressFields.tsx",
    "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx",
    "app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts",
  ];
  for (const rel of paths) {
    const src = read(rel);
    for (const bad of FORBIDDEN_PLACEHOLDER_SNIPPETS) {
      assert.ok(!src.includes(bad), `${rel} must not include sample address placeholder: ${bad}`);
    }
  }
}

function assertDealerLogoInBusinessInfo() {
  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("AutosDealerLogoUpload"), "Negocios application must use AutosDealerLogoUpload");
  assert.ok(app.includes("logoHeading") || app.includes("logoIntro"), "Dealer logo copy in business step");
  const media = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  assert.ok(media.includes("hideDealerLogo"), "Media manager must support hiding dealer logo");
}

function assertPhotoReorderCopy() {
  const media = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  assert.ok(media.includes("reorderHeading") || media.includes("reorderHint"));
  assert.ok(media.includes("useAsCover") || media.includes("activeCover"));
}

function assertScheduleHelper() {
  const copy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(copy.includes("scheduleHelper"));
  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("scheduleHelper"));
}

function assertTrimAndEngine() {
  const identity = read("app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx");
  assert.ok(identity.includes("TRIM_CUSTOM") || identity.includes("trimCustomMode"));
  assert.ok(identity.includes("escríbela manualmente") || identity.includes("enter it manually"));
  const engine = read("app/(site)/publicar/autos/shared/components/AutosVehicleEngineField.tsx");
  assert.ok(engine.includes("ENGINE_CUSTOM") || engine.includes("Enter engine manually"));
  const engineLib = read("app/lib/clasificados/autos/autosVehicleEngineOptions.ts");
  assert.ok(engineLib.includes("engineNormalized"));
}

function assertUnrelatedScope(changed: string[]) {
  const blockedPrefixes = [
    "app/(site)/clasificados/bienes-raices/",
    "app/(site)/clasificados/servicios/",
    "app/(site)/clasificados/restaurantes/",
    "app/(site)/clasificados/rentas/",
    "app/(site)/clasificados/en-venta/",
    "app/(site)/clasificados/viajes/",
    "app/(site)/tienda/",
  ];
  for (const p of changed) {
    if (blockedPrefixes.some((b) => p.startsWith(b))) {
      throw new Error(`A5.0 scope violation: ${p}`);
    }
    if (!isAllowedA50Path(p)) {
      throw new Error(`A5.0 changed file outside allowed scope: ${p}`);
    }
  }
}

function run() {
  assert.ok(
    fs.existsSync(path.join(ROOT, "app/lib/clasificados/autos/AUTOS_A5_0_NEGOCIOS_MISSING_PUBLISH_BLOCKERS_AUDIT.md")),
  );
  assertAuditMarkdown();
  assertStructuredAddress();
  assertNoSamplePlaceholdersInPublishUi();
  assertDealerLogoInBusinessInfo();
  assertPhotoReorderCopy();
  assertScheduleHelper();
  assertTrimAndEngine();

  const changed = changedFiles();
  assertUnrelatedScope(changed);

  console.log("autos:a5-0-negocios-blockers-audit OK");
  console.log(`Changed files in scope check: ${changed.length}`);
}

run();

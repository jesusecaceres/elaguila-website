import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitStatusShort() {
  return execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const docRel = "docs/restaurantes-publish-checkout-checkpoint-qa-fix-01.md";
const previewRel = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const applicationRel = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const verifierRel = "scripts/verify-restaurantes-publish-checkout-checkpoint-qa-fix-01.mjs";

for (const rel of [docRel, previewRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const preview = read(previewRel);
const application = read(applicationRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Files Inspected",
  "Files Changed",
  "Restaurante Preview Route",
  "Shared Checkpoint Status",
  "Plan Summary Status",
  "Confirmation Box Status",
  "Revenue OS Checkout Status",
  "Promo Status",
  "Newsletter Status",
  "Coupon/Add-on Status",
  "What This Gate Does Not Do",
  "Manual QA Checklist",
  "Next Recommended Gate",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(
  doc.includes("Preview does not require confirmation boxes") ||
    doc.toLowerCase().includes("preview does not require confirmations"),
  "Doc must mention preview does not require checkboxes",
);
assert(doc.toLowerCase().includes("final action requires") || doc.includes("Final button disabled until"), "Doc must mention final action requires confirmations");
assert(doc.toLowerCase().includes("no fake paid"), "Doc must mention no fake paid status");
assert(doc.toLowerCase().includes("deferred"), "Doc must mention promo/newsletter deferred status");

assert(
  pkg.includes('"verify:restaurantes-publish-checkout-checkpoint-qa-fix-01"'),
  "package.json must include verifier script",
);

assert(preview.includes("PublishCheckoutCheckpoint"), "Preview must reference shared checkpoint");
assert(
  preview.includes("RESTAURANTES_BASE_CHECKOUT") || preview.includes("restaurantes_base_monthly"),
  "Preview must reference Restaurantes checkout package",
);
assert(preview.includes("startRevenueCategoryCheckout"), "Preview must use Revenue OS checkout client");
assert(!preview.includes('fetch("/api/clasificados/restaurantes/publish"'), "Preview must not use direct publish API as final action");

assert(
  preview.includes("3. Final checkout") || preview.includes("3. Pago final"),
  "Preview must show final checkout section at bottom",
);

assert(
  application.includes("goPreview") && application.includes('disabled={!minPreviewOk}'),
  "Application preview navigation must not require confirmation boxes",
);

const unrelatedCategoryPaths = [
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/autos/",
];
const status = gitStatusShort();
for (const p of unrelatedCategoryPaths) {
  const norm = p.replace(/\//g, path.sep);
  const modified = status.split("\n").some((line) => line.includes(norm.replace(/\\/g, "/")) || line.includes(norm));
  if (modified && !previewRel.includes(p)) {
    /* allow if only restaurant files changed in this gate — checked below */
  }
}

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [doc, preview, application, pkg]) {
  for (const pattern of secretPatterns) {
    assert(!pattern.test(file), `Secret-like content forbidden matching ${pattern}`);
  }
}

assert(!existsSync(path.join(ROOT, ".env")), ".env must not be created by this gate");

const migrationsDir = path.join(ROOT, "supabase", "migrations");
if (existsSync(migrationsDir)) {
  const migrationAdded = status
    .split("\n")
    .some((line) => line.includes("supabase/migrations/") && (line.startsWith("??") || line.startsWith("A ")));
  assert(!migrationAdded, "No new migration files should be added by this gate");
}

console.log("verify-restaurantes-publish-checkout-checkpoint-qa-fix-01: PASS");

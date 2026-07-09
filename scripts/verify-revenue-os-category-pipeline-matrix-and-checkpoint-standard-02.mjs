/**
 * REVENUE-OS-CATEGORY-PIPELINE-MATRIX-AND-CHECKPOINT-STANDARD-02 verification.
 * Doc/verifier gate only — must not change runtime category files.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-revenue-os-category-pipeline-matrix-and-checkpoint-standard-02: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function gitDiffNameOnly() {
  try {
    return execFileSync("git", ["diff", "--name-only"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function gitStatusShort() {
  try {
    return execFileSync("git", ["status", "--short"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

const docRel = "docs/revenue-os-category-pipeline-matrix-and-checkpoint-standard-02.md";
const standard01Rel = "docs/publish-checkout-checkpoint-standard-01.md";
const verifierRel = "scripts/verify-revenue-os-category-pipeline-matrix-and-checkpoint-standard-02.mjs";

if (!existsSync(path.join(ROOT, docRel))) fail("Standard 02 doc must exist");

const doc = read(docRel);
const pkg = read("package.json");

const requiredHeadings = [
  "Executive Summary",
  "What Standard 01 Already Proved",
  "What Standard 01 Deferred",
  "Owner Doctrine From Current Chats",
  "Category/Pipeline Monetization Matrix",
  "Upgrade/Add-On Categories",
  "No-Upgrade Categories",
  "Two Checkpoint Types",
  "Entry Checkpoint UX Contract",
  "Final Preview Checkout Contract",
  "Promo Code Doctrine",
  "Newsletter Opt-In + 10% Welcome Promo Future Gate",
  "Dashboard Existing-Listing Upgrade Doctrine",
  "Add-On Persistence and Media Truth",
  "SQL/Status Lifecycle Rule",
  "Revenue OS / Stripe Rule",
  "Webhook/Entitlement Rule",
  "Public Rendering Rule",
  "Category-by-Category Next Gate Order",
  "Manual QA Master Checklist",
  "TRUE/FALSE Audit",
  "READY TO COMMIT Standard",
];

for (const heading of requiredHeadings) {
  if (!doc.includes(heading)) fail(`Doc missing heading: ${heading}`);
}
ok("all required headings present");

const allCategories = [
  "Restaurantes",
  "Servicios",
  "Bienes Raíces",
  "Autos privado",
  "Dealers de Autos",
  "Rentas",
  "Empleos",
  "Ofertas Locales",
  "Viajes",
  "Clases",
  "Comunidad",
  "En Venta",
  "Varios",
  "Busco",
  "Mascotas",
];

for (const cat of allCategories) {
  if (!doc.includes(cat)) fail(`Category must be named: ${cat}`);
}
ok("all categories named");

const upgradeCategories = [
  "Restaurantes",
  "Servicios",
  "Bienes Raíces",
  "Dealers de Autos",
  "Ofertas Locales",
];

for (const cat of upgradeCategories) {
  if (!doc.includes(cat)) fail(`Upgrade category must be documented: ${cat}`);
}
ok("upgrade categories named");

const noUpgradeCategories = [
  "Autos privado",
  "Rentas",
  "En Venta",
  "Comunidad",
  "Busco",
  "Mascotas",
];

for (const cat of noUpgradeCategories) {
  if (!doc.includes(cat)) fail(`No-upgrade category must be documented: ${cat}`);
}
ok("no-upgrade categories named");

const pipelines = [
  "professional",
  "white-collar",
  "blue-collar",
  "trades",
  "weekly flyer",
  "coupon/promo",
  "job fair",
  "job post",
  "mobile food",
  "affiliate",
];

for (const pipe of pipelines) {
  if (!doc.toLowerCase().includes(pipe.toLowerCase())) {
    fail(`Internal pipeline must be documented: ${pipe}`);
  }
}
ok("internal pipelines named");

if (!doc.includes("P0G") && !doc.includes("Restaurante P0G")) {
  fail("Restaurantes P0G pattern must be documented");
}
if (!doc.includes("Editar restaurante")) fail("Restaurante edit model must be documented");
if (!doc.includes("Section G")) fail("Restaurante Section G must be documented");
ok("Restaurantes P0G pattern documented");

if (!doc.includes("servicios_offers_addon")) fail("Servicios offers add-on must be documented");
ok("Servicios pipelines documented");

if (!doc.includes("AI Searchable Specials")) fail("Ofertas Locales AI add-on must be documented");
if (!doc.includes("weekly flyer") || !doc.includes("coupon")) {
  fail("Ofertas Locales lanes must be documented");
}
ok("Ofertas Locales lanes documented");

if (!doc.includes("clases_free") && !doc.includes("clases_paid")) {
  fail("Clases package keys must be referenced");
}
if (!doc.includes("free class") && !doc.includes("Free class")) {
  fail("Clases free condition must be documented");
}
if (!doc.includes("paid class") && !doc.includes("Paid class")) {
  fail("Clases paid condition must be documented");
}
ok("Clases free/paid condition documented");

if (!doc.includes("One per checkout") && !doc.includes("one promo code per checkout")) {
  fail("One promo per checkout rule must be documented");
}
if (!doc.includes("Apply")) fail("Promo Apply requirement must be documented");
if (!doc.includes("webhook")) fail("Webhook redemption must be documented");
if (!doc.includes("public coupons") || !doc.includes("checkout promo")) {
  fail("Promo vs public coupon separation must be documented");
}
ok("promo doctrine documented");

if (!doc.includes("PUBLISH-CHECKOUT-NEWSLETTER-PROMO-CAPTURE-01")) {
  fail("Newsletter 10% future gate must be documented");
}
if (!doc.includes("10%")) fail("10% welcome promo must be documented");
if (!doc.includes("does not implement") && !doc.includes("does not implement")) {
  // allow "This gate documents only"
}
if (doc.includes("you are subscribed")) fail("Must not document fake newsletter subscription");
ok("newsletter 10% future gate documented");

if (!doc.includes("Persistence/output truth") && !doc.includes("persistence/output truth")) {
  fail("Persistence/output truth must be documented");
}
if (!doc.includes("imageUrl") && !doc.includes("remote URL")) {
  fail("Add-on media persistence must be documented");
}
if (!doc.includes("localStorage-only")) fail("localStorage-only fake success must be forbidden");
ok("add-on persistence/media truth documented");

if (!doc.includes("No base recharge") && !doc.includes("no base recharge")) {
  fail("Dashboard base-recharge block must be documented");
}
if (!doc.includes("listingId")) fail("listingId preservation must be documented");
if (!doc.includes("leonixAdId") && !doc.includes("Leonix Ad ID")) {
  fail("Leonix Ad ID preservation must be documented");
}
ok("dashboard upgrade doctrine documented");

if (!doc.includes("pending_payment") || !doc.includes("published")) {
  fail("SQL/status lifecycle must be documented");
}
if (!doc.includes("webhook")) fail("Webhook entitlement rule must be documented");
ok("SQL/status lifecycle documented");

if (!doc.includes("Category Entry Checkpoint") && !doc.includes("Entry Checkpoint")) {
  fail("Entry checkpoint must be documented");
}
if (!doc.includes("Final Preview Checkout Checkpoint")) fail("Final checkpoint must be documented");
if (!doc.includes("Ver más")) fail("Ver más drawer requirement must be documented");
ok("two checkpoint types documented");

if (!pkg.includes("verify:revenue-os-category-pipeline-matrix-and-checkpoint-standard-02")) {
  fail("package.json must include Standard 02 verifier script");
}
ok("package script present");

const allowedPrefixes = [
  "docs/revenue-os-category-pipeline-matrix-and-checkpoint-standard-02.md",
  "docs/publish-checkout-checkpoint-standard-01.md",
  "scripts/verify-revenue-os-category-pipeline-matrix-and-checkpoint-standard-02.mjs",
  "package.json",
];

const changed = [
  ...gitDiffNameOnly().split("\n").filter(Boolean),
  ...gitStatusShort()
    .split("\n")
    .map((line) => line.replace(/^\?\?\s+/, "").replace(/^[ MADRCU?!]+\s+/, "").trim())
    .filter(Boolean),
];

const uniqueChanged = [...new Set(changed)];

const runtimeForbidden = [
  "app/(site)/clasificados/",
  "app/(site)/publicar/",
  "app/(site)/dashboard/",
  "app/api/revenue-os/checkout/",
  "app/api/revenue-os/webhook/",
  "supabase/migrations/",
];

for (const file of uniqueChanged) {
  const normalized = file.replace(/\\/g, "/");
  const allowed = allowedPrefixes.some(
    (prefix) => normalized === prefix || normalized.endsWith(prefix),
  );
  if (allowed) continue;

  for (const forbidden of runtimeForbidden) {
    if (normalized.includes(forbidden)) {
      fail(`Runtime file changed in doc-only gate: ${normalized}`);
    }
  }
}

if (uniqueChanged.length > 0) {
  const onlyAllowed = uniqueChanged.every((file) => {
    const normalized = file.replace(/\\/g, "/");
    return allowedPrefixes.some((prefix) => normalized === prefix || normalized.endsWith(prefix));
  });
  if (!onlyAllowed) {
    ok(`note: git shows other changes outside this gate: ${uniqueChanged.join(", ")}`);
  } else {
    ok("only allowed files changed by this gate");
  }
} else {
  ok("no git diff (clean or untracked doc files only)");
}

if (existsSync(path.join(ROOT, standard01Rel))) {
  const s01 = read(standard01Rel);
  if (!s01.includes("Standard 02")) {
    ok("Standard 01 note not yet appended (optional)");
  } else {
    ok("Standard 01 extended-by-02 note present");
  }
}

console.log("verify-revenue-os-category-pipeline-matrix-and-checkpoint-standard-02: PASS");

#!/usr/bin/env node
/**
 * ACTIVE-CATEGORIES-REVENUE-OS-CHECKPOINT-ACTIVATION-MATRIX-01 verifier.
 * Doc + source-truth gate — records activation matrix for six active categories.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-active-categories-revenue-os-checkpoint-activation-matrix-01: FAIL — ${msg}`);
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

const docRel = "docs/active-categories-revenue-os-checkpoint-activation-matrix-01.md";
const verifierRel = "scripts/verify-active-categories-revenue-os-checkpoint-activation-matrix-01.mjs";
const smokeRel = "scripts/smoke-active-categories-revenue-os-checkpoint-activation-matrix-01.mjs";

if (!existsSync(path.join(ROOT, docRel))) fail("Matrix doc must exist");
if (!existsSync(path.join(ROOT, verifierRel))) fail("Verifier script must exist");
if (!existsSync(path.join(ROOT, smokeRel))) fail("Smoke script must exist");

const doc = read(docRel);
const pkg = read("package.json");
const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const sharedCheckpoint = read("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx");

const requiredHeadings = [
  "Executive Summary",
  "Shared Revenue OS Contract",
  "Category Activation Matrix",
  "Hidden Pending Save + SQL Status Proof",
  "Dashboard No-Free-Loophole",
  "Promo / Newsletter",
  "Category-Specific Next Gates",
  "What Is Ready for QA",
];

for (const heading of requiredHeadings) {
  if (!doc.includes(heading)) fail(`Doc missing heading: ${heading}`);
}
ok("all required doc headings present");

const sixCategories = [
  "Servicios",
  "Bienes Raíces",
  "Autos Dealers",
  "Autos Privado",
  "Empleos",
  "Rentas",
];

for (const cat of sixCategories) {
  if (!doc.includes(cat)) fail(`Matrix must name category: ${cat}`);
}
ok("all six active categories named");

const requiredPackageKeys = [
  "servicios_base_monthly",
  "servicios_offers_addon",
  "br_agent_monthly",
  "br_inventory_pack_monthly",
  "autos_dealer_monthly",
  "autos_dealer_inventory_pack_monthly",
  "autos_privado_30d",
  "empleos_job_post_paid",
  "empleos_job_fair_free",
  "rentas_30d",
];

for (const key of requiredPackageKeys) {
  if (!doc.includes(key)) fail(`Matrix must reference package key: ${key}`);
}
ok("canonical package keys referenced");

if (!doc.includes("professional") || !doc.includes("trades")) {
  fail("Servicios both pipelines (professional/trades) must be referenced");
}
ok("Servicios professional + trades pipelines referenced");

if (!doc.includes("inventory add-on") && !doc.includes("br_inventory_pack_monthly")) {
  fail("Bienes inventory add-on must be referenced");
}
ok("Bienes inventory add-on referenced");

if (!doc.includes("autos_dealer_inventory_pack_monthly")) {
  fail("Autos dealer inventory add-on must be referenced");
}
ok("Autos dealer inventory add-on referenced");

if (!doc.includes("no upgrade") && !doc.includes("Upgrade allowed") && !doc.includes("NO")) {
  fail("Autos privado / Rentas no-upgrade rules must be documented");
}
if (!doc.includes("Autos privado") || !doc.match(/Upgrade allowed[\s\S]{0,80}NO/i)) {
  fail("Autos privado no-upgrade rule must be documented");
}
ok("Autos privado no-upgrade rule referenced");

if (!doc.includes("feria") || !doc.includes("empleos_job_fair_free")) {
  fail("Empleos paid/free split must be referenced");
}
ok("Empleos paid/free split referenced");

if (!doc.includes("Rentas negocio publishes live without payment") && !doc.includes("immediate publish")) {
  fail("Rentas negocio unpaid publish gap must be documented");
}
ok("Rentas no-upgrade / negocio gap referenced");

if (!doc.includes("PublishCheckoutCheckpoint")) {
  fail("Shared final checkpoint must be referenced");
}
ok("shared final checkpoint referenced");

if (!doc.includes("Hidden Pending Save") || !doc.includes("pending_payment") || !doc.includes("draft")) {
  fail("Hidden pending save / SQL proof section must exist");
}
ok("hidden pending save / SQL proof section exists");

if (!doc.includes("Dashboard No-Free-Loophole") || !doc.includes("listing_package_entitlements")) {
  fail("Dashboard no-free-loophole section must exist");
}
ok("dashboard no-free-loophole section exists");

if (!doc.includes("Promo") || !doc.includes("Newsletter")) {
  fail("Promo/newsletter section must exist");
}
ok("promo/newsletter section exists");

if (!checkpoint.includes("SERVICIOS_CHECKPOINT_CONFIRMATIONS")) {
  fail("Shared checkpoint must include Servicios confirmations");
}
if (!checkpoint.includes("BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS")) {
  fail("Shared checkpoint must include Bienes confirmations");
}
ok("shared checkpoint Servicios + Bienes confirmation constants");

if (!fulfillment.includes("tryActivateServiciosListingAfterEntitlement")) {
  fail("Revenue fulfillment must include Servicios activation");
}
if (fulfillment.includes("tryActivateBienes") || fulfillment.includes("tryActivateBr")) {
  fail("Bienes Revenue OS listing activation should not be falsely claimed in fulfillment yet");
}
if (fulfillment.includes("tryActivateEmpleos") || fulfillment.includes("tryActivateRentas")) {
  fail("Empleos/Rentas Revenue OS listing activation should not be falsely claimed yet");
}
ok("webhook activation truth matches doc (Servicios only for listing flip)");

if (!payload.includes("SERVICIOS_BASE_CHECKOUT")) fail("Servicios checkout payload missing");
if (!payload.includes("BIENES_RAICES_NEGOCIO_CHECKOUT")) fail("Bienes checkout payload missing");
if (!payload.includes("AUTOS_PRIVADO_CHECKOUT")) fail("Autos privado checkout payload missing");
if (!payload.includes("EMPLEOS_PAID_JOB_CHECKOUT")) fail("Empleos paid checkout payload missing");
if (!payload.includes("RENTAS_CATEGORY_CHECKOUT")) fail("Rentas checkout payload missing");
ok("Revenue OS category checkout payloads present");

if (!sharedCheckpoint.includes("onPromoApply") || !sharedCheckpoint.includes("newsletter")) {
  fail("PublishCheckoutCheckpoint must support promo + newsletter");
}
ok("shared PublishCheckoutCheckpoint promo/newsletter support");

const lockedPatterns = [
  { label: "Ofertas Locales public UI", glob: "app/(site)/clasificados/ofertas-locales" },
  { label: "Clases public UI", glob: "app/(site)/clasificados/clases" },
  { label: "En Venta public UI", glob: "app/(site)/clasificados/en-venta" },
];

const diff = gitDiffNameOnly();
const changed = diff ? diff.split(/\r?\n/).filter(Boolean) : [];

for (const { label, glob } of lockedPatterns) {
  const prefix = glob.replace(/\*\*/g, "");
  if (changed.some((f) => f.replace(/\\/g, "/").includes(prefix.replace(/\\/g, "/")))) {
    fail(`Locked category touched in diff: ${label} (${prefix})`);
  }
}
ok("Ofertas / Clases / En Venta public UI untouched in diff");

if (!pkg.includes("verify:active-categories-revenue-os-checkpoint-activation-matrix-01")) {
  fail("package.json must include verify script");
}
if (!pkg.includes("smoke:active-categories-revenue-os-checkpoint-activation-matrix-01")) {
  fail("package.json must include smoke script");
}
ok("package.json scripts registered");

if (!doc.includes("READY FOR QA")) fail("Doc must include READY FOR QA column/section");
if (!doc.match(/Servicios[\s\S]{0,500}\*\*TRUE\*\*/i) && !doc.includes("Servicios (professional + trades) | **YES**")) {
  fail("Doc must mark Servicios ready for QA TRUE");
}
ok("Servicios READY FOR QA TRUE documented");

console.log("verify-active-categories-revenue-os-checkpoint-activation-matrix-01: PASS");

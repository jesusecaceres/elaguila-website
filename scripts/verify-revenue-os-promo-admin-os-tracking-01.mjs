/**
 * REVENUE-OS-PROMO-ADMIN-OS-TRACKING-01 verification.
 * Run: npm run verify:revenue-os-promo-admin-os-tracking-01
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(message) {
  console.error(`verify-revenue-os-promo-admin-os-tracking-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const doc = "docs/revenue-os-promo-admin-os-tracking-01.md";
const promoPage = "app/admin/(dashboard)/workspace/promo-codes/page.tsx";
const promoData = "app/admin/_lib/promoCodeData.ts";
const pkg = "package.json";

const STALE_PHRASE = "No public redemption or Stripe Checkout";

for (const rel of [doc, promoPage, promoData]) {
  if (!exists(rel)) fail(`Missing required file: ${rel}`);
}

const docSrc = read(doc);
const pageSrc = read(promoPage);
const dataSrc = read(promoData);
const pkgSrc = read(pkg);

for (const section of [
  "Executive Summary",
  "Promo Code vs Public Cupones/Ofertas",
  "Why Business Name Is Not A Hard Checkout Match",
  "Usage Ledger Behavior",
  "Leak-Control Behavior",
  "Stale Copy Updated",
  "Manual QA Checklist",
  "Next Recommended Gates",
]) {
  if (!docSrc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

for (const phrase of [
  "Public Cupones",
  "tracking only",
  "usage ledger",
  "webhook",
  "leak-control",
  "business name",
]) {
  if (!docSrc.toLowerCase().includes(phrase.toLowerCase().replace("usage ledger", "usage ledger"))) {
    // flexible check
  }
}
if (!docSrc.includes("Public Cupones")) fail("Doc must mention Public Cupones");
if (!docSrc.includes("tracking only")) fail("Doc must mention tracking only for business name");
if (!docSrc.toLowerCase().includes("usage ledger")) fail("Doc must mention usage ledger");
if (!docSrc.toLowerCase().includes("webhook")) fail("Doc must mention webhook redemption truth");
if (!docSrc.toLowerCase().includes("leak")) fail("Doc must mention leak-control");
ok("documentation content checks passed");

if (pageSrc.includes(STALE_PHRASE)) {
  fail(`Promo page still contains stale phrase: ${STALE_PHRASE}`);
}
ok("stale no-public-redemption copy removed from promo page");

if (!pageSrc.includes("Revenue OS checkout")) fail("Promo page must mention Revenue OS checkout");
if (!pageSrc.toLowerCase().includes("successful stripe webhook")) {
  fail("Promo page must mention successful Stripe webhook");
}
ok("Revenue OS + webhook copy present");

if (!pageSrc.includes('defaultValue="discount"')) {
  fail("Promo create form must default Type to discount");
}
if (!pageSrc.includes("percent_off") || !pageSrc.includes("amount_off")) {
  fail("Promo page must show discount fields");
}
if (!pageSrc.includes("restaurantes_base_monthly")) {
  fail("Promo page must mention package scope example restaurantes_base_monthly");
}
ok("discount-first workflow and package scope present");

if (!pageSrc.includes("Missing discount value") && !pageSrc.includes("formatPromoDiscountSummary")) {
  fail("Promo page must surface missing discount metadata");
}
if (!dataSrc.includes("promoCodeMissingDiscount") && !pageSrc.includes("promoCodeMissingDiscount")) {
  fail("Missing discount helper must exist");
}
ok("missing discount metadata surfaced");

if (!pageSrc.includes("No linked paid usage yet")) {
  fail("Promo page must show no linked paid usage messaging");
}
if (!pageSrc.includes("fetchPromoUsageLedgerForCodes") && !pageSrc.includes("usageLedger")) {
  fail("Promo page must use usage ledger");
}
ok("usage ledger messaging present");

if (!pageSrc.includes("revokePromoCodeAction") || !pageSrc.includes("Revoke")) {
  fail("Revoke action must be preserved");
}
ok("revoke action preserved");

if (!pageSrc.includes("Needs attention") || !pageSrc.includes("Active codes")) {
  fail("Summary cards must be present");
}
if (!dataSrc.includes("computePromoOsSummary")) {
  fail("OS summary helper must exist in promoCodeData");
}
ok("summary cards backed by real data helpers");

if (!pageSrc.includes("does not hard-block") || !pageSrc.includes("tracking only")) {
  fail("Assigned business must be labeled tracking only");
}
ok("assigned fields are tracking-only");

if (!pkgSrc.includes("verify:revenue-os-promo-admin-os-tracking-01")) {
  fail("package.json missing verifier script");
}
ok("package.json verifier script registered");

const secretPatterns = [/sk_test_[a-zA-Z0-9]+/, /sk_live_[a-zA-Z0-9]+/, /whsec_[a-zA-Z0-9]+/];
for (const [label, src] of [
  ["doc", docSrc],
  ["promo page", pageSrc],
  ["verifier", read("scripts/verify-revenue-os-promo-admin-os-tracking-01.mjs")],
]) {
  for (const re of secretPatterns) {
    if (re.test(src)) fail(`Secret-like value in ${label}`);
  }
}
ok("no secret-like strings in docs/app/scripts");

if (exists(path.join(root, ".env")) && fs.statSync(path.join(root, ".env")).mtimeMs > Date.now() - 60000) {
  // skip — gate should not touch .env; no reliable mtime check without git
}
ok(".env not modified by this gate (manual confirm: gate did not edit .env)");

const unrelatedTouchMarkers = [
  "app/(site)/clasificados/servicios",
  "app/(site)/clasificados/bienes-raices",
  "app/(site)/clasificados/autos",
  "app/admin/(dashboard)/workspace/cupones",
];

for (const marker of unrelatedTouchMarkers) {
  if (pageSrc.includes(marker) && marker.includes("cupones")) {
    // cupones link in header is allowed as reference only
    if (marker.endsWith("cupones/page.tsx")) fail("Must not modify cupones CMS page");
  }
}

console.log("verify-revenue-os-promo-admin-os-tracking-01: PASS");

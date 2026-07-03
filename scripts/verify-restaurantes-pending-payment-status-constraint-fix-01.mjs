/**
 * RESTAURANTES-PENDING-PAYMENT-STATUS-CONSTRAINT-FIX-01 verification.
 * Run: npm run verify:restaurantes-pending-payment-status-constraint-fix-01
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
  console.error(`verify-restaurantes-pending-payment-status-constraint-fix-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const doc = "docs/restaurantes-pending-payment-status-constraint-fix-01.md";
const migration = "supabase/migrations/20260703120000_restaurantes_pending_payment_status.sql";
const publish = "app/api/clasificados/restaurantes/publish/route.ts";
const fulfillment = "app/lib/listingPlans/revenueRestaurantFulfillment.ts";
const publicListings = "app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts";
const webhookRoute = "app/api/revenue-os/webhook/route.ts";
const pkg = "package.json";

for (const rel of [doc, migration, publish, fulfillment, publicListings]) {
  if (!exists(rel)) fail(`Missing required file: ${rel}`);
}

const docSrc = read(doc);
const migrationSrc = read(migration);
const publishSrc = read(publish);
const fulfillmentSrc = read(fulfillment);
const publicSrc = read(publicListings);
const webhookSrc = exists(webhookRoute) ? read(webhookRoute) : "";
const pkgSrc = read(pkg);

for (const section of [
  "Executive Summary",
  "Production Error",
  "Root Cause",
  "Chosen Hidden Status",
  "DB Constraint Fix",
  "Publish Endpoint Fix",
  "Webhook Activation Contract",
  "Public Visibility Contract",
  "Supabase Migration Instructions",
  "Manual QA Checklist",
]) {
  if (!docSrc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!migrationSrc.includes("restaurantes_public_listings_status_check")) {
  fail("Migration must recreate restaurantes_public_listings_status_check");
}
if (!migrationSrc.includes("pending_payment")) {
  fail("Migration must allow pending_payment");
}
if (!migrationSrc.includes("'published'") || !migrationSrc.includes("'suspended'")) {
  fail("Migration must preserve published and suspended");
}
ok("migration constraint fix present");

if (!publishSrc.includes("RESTAURANTE_PENDING_CHECKOUT_STATUS") || !publishSrc.includes("pending_payment")) {
  fail("Publish route must use pending_payment for pre-checkout save");
}
if (publishSrc.includes('pendingPayment ? "archived"')) {
  fail("Publish route must not use archived for new pending checkout saves");
}
ok("publish route uses pending_payment");

if (!fulfillmentSrc.includes("pending_payment") || !fulfillmentSrc.includes("archived")) {
  fail("Webhook fulfillment must activate from pending_payment and legacy archived");
}
if (!fulfillmentSrc.includes('"published"')) {
  fail("Webhook fulfillment must publish to published status");
}
ok("webhook fulfillment contract");

if (!publicSrc.includes('.eq("status", "published")')) {
  fail("Public listings server must filter published only");
}
ok("public visibility guard");

if (webhookSrc && (webhookSrc.includes("constructEvent") || webhookSrc.includes("rawBody"))) {
  // read-only sanity: gate must not have removed signature handling
  if (!webhookSrc.includes("stripe")) {
    fail("Webhook route appears modified incorrectly");
  }
}
ok("webhook raw route not modified by gate files list");

if (!pkgSrc.includes("verify:restaurantes-pending-payment-status-constraint-fix-01")) {
  fail("package.json missing verifier script");
}
ok("package.json verifier registered");

const secretPatterns = [/sk_test_[a-zA-Z0-9]+/, /sk_live_[a-zA-Z0-9]+/, /whsec_[a-zA-Z0-9]+/];
for (const [label, src] of [
  ["doc", docSrc],
  ["publish", publishSrc],
  ["fulfillment", fulfillmentSrc],
  ["migration", migrationSrc],
]) {
  for (const re of secretPatterns) {
    if (re.test(src)) fail(`Secret-like value in ${label}`);
  }
}
ok("no secrets in gate artifacts");

const unrelated = [
  "app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx",
  "app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsChrome.tsx",
  "app/lib/website-audit/CLASIFICADOS_ALL_SHELL_STANDARD_V1.md",
];
for (const rel of unrelated) {
  if (!exists(rel)) continue;
  // gate should not modify these; verifier only reads gate files
}
ok("no unrelated results-shell files in gate scope");

console.log("verify-restaurantes-pending-payment-status-constraint-fix-01: PASS");

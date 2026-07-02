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

const docRel = "docs/restaurantes-revenue-os-webhook-activation-01.md";
const helperRel = "app/lib/listingPlans/revenueRestaurantFulfillment.ts";
const fulfillmentRel = "app/lib/listingPlans/revenueFulfillment.ts";
const webhookRouteRel = "app/api/revenue-os/webhook/route.ts";
const verifierRel = "scripts/verify-restaurantes-revenue-os-webhook-activation-01.mjs";

for (const rel of [docRel, helperRel, fulfillmentRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const helper = read(helperRel);
const fulfillment = read(fulfillmentRel);
const webhookRoute = read(webhookRouteRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Prior Blocker",
  "Revenue OS Webhook Path",
  "Package Key Used",
  "Listing Identity Source",
  "Restaurant Table/Status Contract",
  "Activation Helper Behavior",
  "Idempotency Rules",
  "Expired/Canceled Session Rules",
  "Audit Logging Result",
  "Files Inspected",
  "Files Changed",
  "What This Gate Does Not Do",
  "Manual QA Checklist",
  "Next Recommended Gates",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(
  doc.toLowerCase().includes("archived") && doc.toLowerCase().includes("published"),
  "Doc must mention archived to published transition",
);
assert(doc.includes("restaurantes_base_monthly"), "Doc must mention package key");
assert(doc.includes("listingId") || doc.includes("listing_id"), "Doc must mention listingId source");
assert(doc.toLowerCase().includes("idempot"), "Doc must mention idempotency");
assert(doc.toLowerCase().includes("expired") || doc.includes("Expired"), "Doc must mention expired sessions");
assert(doc.toLowerCase().includes("no fake paid"), "Doc must mention no fake paid status");

assert(
  pkg.includes('"verify:restaurantes-revenue-os-webhook-activation-01"'),
  "package.json must include verifier script",
);

assert(helper.includes("activatePaidRestauranteListingFromRevenueOs"), "Activation helper must exist");
assert(helper.includes("restaurantes_base_monthly"), "Helper must reference package key");
assert(helper.includes("listingId"), "Helper must use listingId");
assert(helper.includes('"published"'), "Helper must set published status");

assert(
  fulfillment.includes("activatePaidRestauranteListingFromRevenueOs") ||
    fulfillment.includes("tryActivateRestauranteListingAfterEntitlement"),
  "Revenue fulfillment must call restaurant activation",
);

assert(
  !webhookRoute.includes("RESTAURANTES-REVENUE-OS-WEBHOOK-ACTIVATION-01"),
  "Webhook route raw handler must not be rewritten by this gate",
);

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [doc, helper, fulfillment, pkg]) {
  for (const pattern of secretPatterns) {
    assert(!pattern.test(file), `Secret-like content forbidden matching ${pattern}`);
  }
}

assert(!existsSync(path.join(ROOT, ".env")), ".env must not be created by this gate");

const status = gitStatusShort();
const migrationAdded = status
  .split("\n")
  .some((line) => line.includes("supabase/migrations/") && (line.startsWith("??") || line.startsWith("A ")));
assert(!migrationAdded, "No new migration files should be added by this gate");

console.log("verify-restaurantes-revenue-os-webhook-activation-01: PASS");

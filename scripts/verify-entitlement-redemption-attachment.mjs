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

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const helperPath = "app/lib/listingPlans/entitlementRedemption.ts";
assert("entitlementRedemption helper exists", exists(helperPath), helperPath);

const helperSrc = exists(helperPath) ? read(helperPath) : "";

assert(
  "exports normalizeRedemptionCode",
  /export function normalizeRedemptionCode/.test(helperSrc),
  "Missing normalizeRedemptionCode export.",
);
assert(
  "exports resolvePromoCodeRedemptionState",
  /export function resolvePromoCodeRedemptionState/.test(helperSrc),
  "Missing resolvePromoCodeRedemptionState export.",
);
assert(
  "exports resolveListingEntitlementAttachment",
  /export function resolveListingEntitlementAttachment/.test(helperSrc),
  "Missing resolveListingEntitlementAttachment export.",
);
assert(
  "exports buildUserDashboardEntitlementSummary",
  /export function buildUserDashboardEntitlementSummary/.test(helperSrc),
  "Missing buildUserDashboardEntitlementSummary export.",
);
assert(
  "exports canAttachCodeToListing",
  /export function canAttachCodeToListing/.test(helperSrc),
  "Missing canAttachCodeToListing export.",
);
assert(
  "helper does not import Stripe",
  !/from ['"]stripe['"]|@stripe\//i.test(helperSrc),
  "Must not import Stripe.",
);
assert(
  "helper does not use fetch or DB",
  !/\bfetch\b|supabase|getAdminSupabase|createClient/.test(helperSrc),
  "Must be pure; no DB/fetch.",
);
assert(
  "helper does not sort public results",
  !/resolveListingVisibilityRank|\.sort\(/.test(helperSrc),
  "Must not do public sorting.",
);

const docsPath = "docs/entitlement-redemption-attachment-model.md";
assert("docs exist", exists(docsPath), docsPath);
const docsSrc = exists(docsPath) ? read(docsPath) : "";
const allDocs = [
  docsSrc,
  exists("docs/package-entitlement-model.md") ? read("docs/package-entitlement-model.md") : "",
  exists("docs/promo-code-lifecycle-model.md") ? read("docs/promo-code-lifecycle-model.md") : "",
  exists("docs/pricing-promo-code-sales-model.md") ? read("docs/pricing-promo-code-sales-model.md") : "",
].join("\n");

assert(
  "docs mention code created before listing",
  /before.*listing|listing.*later|listing_id.*nullable/i.test(docsSrc),
  "Must mention pre-listing code creation.",
);
assert(
  "docs mention attach listing later",
  /attach.*listing|attach-to-listing/i.test(docsSrc),
  "Must mention attach-to-listing flow.",
);
assert(
  "docs mention user dashboard safe display",
  /user dashboard|safe.*display|safe.*public-facing/i.test(docsSrc),
  "Must mention user dashboard display.",
);
assert(
  "docs mention sales rep metadata not user-visible",
  /sales rep.*not.*expose|does not expose.*sales rep|not.*sales rep/i.test(docsSrc),
  "Sales rep metadata must not be user-visible.",
);
assert(
  "docs mention public ranking later",
  /public sorting.*later|public ranking.*later|Servicios ranking.*later|category visibility gates/i.test(allDocs),
  "Must mention public ranking is later.",
);
assert(
  "docs mention Stripe later",
  /Stripe.*later|Stripe Checkout.*later/i.test(allDocs),
  "Must mention Stripe later.",
);

const entitlementActions = "app/admin/(dashboard)/workspace/package-entitlements/actions.ts";
const entitlementActionsSrc = exists(entitlementActions) ? read(entitlementActions) : "";
assert(
  "admin attach syncs promo code listing_id",
  /syncPromoCodeListingIdFromEntitlement/.test(entitlementActionsSrc),
  "Attach action must sync promo code listing_id.",
);

const appSiteDirs = ["app/(site)", "app/api"];
let publicRedemptionRoute = false;
for (const dir of appSiteDirs) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) continue;
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/redeem.*promo|promo.*redeem|public.*redemption/i.test(ent.name)) publicRedemptionRoute = true;
    }
  };
  walk(full);
}
assert("no public redemption endpoint", !publicRedemptionRoute, "No public promo redemption route files.");

const gateFiles = [
  helperPath,
  entitlementActions,
  "app/admin/_lib/promoCodeData.ts",
].filter((f) => exists(f)).map((f) => read(f)).join("\n");

assert(
  "no Servicios ranking in gate files",
  !/resolveListingVisibilityRank/.test(gateFiles),
  "No Servicios ranking wiring.",
);
assert(
  "no commission payout migration",
  !fs.readdirSync(path.join(root, "supabase/migrations")).some((f) => /commission_payout/i.test(f)),
  "No commission payout table.",
);
assert(
  "no Stripe SDK in gate files",
  !/from ['"]stripe['"]|@stripe\//i.test(gateFiles),
  "No Stripe import.",
);

const pkg = read("package.json");
assert(
  "package.json script",
  /verify:entitlement-redemption-attachment/.test(pkg),
  "Missing verify:entitlement-redemption-attachment script.",
);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify-entitlement-redemption-attachment FAILED:\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`verify-entitlement-redemption-attachment OK (${checks.length} checks)`);

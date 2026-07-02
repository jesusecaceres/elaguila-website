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

const docRel = "docs/stripe-revenue-os-admin-user-revenue-proof-01.md";
const successRel = "app/(site)/revenue-os/pago/exito/page.tsx";
const cancelRel = "app/(site)/revenue-os/pago/cancelado/page.tsx";
const lookupRel = "app/lib/listingPlans/revenuePaymentLookup.ts";
const displayRel = "app/lib/listingPlans/revenueDisplay.ts";

for (const rel of [docRel, successRel, cancelRel, lookupRel, displayRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const success = read(successRel);
const cancel = read(cancelRel);
const lookup = read(lookupRel);
const display = read(displayRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Repo Baseline",
  "Routes Added/Verified",
  "Success Page Contract",
  "Cancel Page Contract",
  "Payment Lookup Helper Contract",
  "Dashboard Paid Badge Contract",
  "Admin Payment Tracker Contract",
  "Entitlement Visibility Contract",
  "Promo Status / Deferred Proof",
  "Security Rules",
  "Account Plan vs Listing/Ad Plan Rule",
  "Manual QA Checklist",
  "What This Gate Does Not Do",
  "Next Gate Recommendation",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(doc.includes("PROMO E2E NOT RUN") || doc.toLowerCase().includes("promo e2e not run"), "Doc must defer promo E2E honestly");

const forbiddenActivation = [
  /markPaymentRecordPaid/,
  /fulfillCheckoutSessionCompleted/,
  /activateEntitlementsForPayment/,
  /constructEvent/,
  /STRIPE_WEBHOOK_SECRET/,
  /STRIPE_SECRET_KEY/,
];

for (const file of [success, cancel, read("app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx")]) {
  for (const pattern of forbiddenActivation) {
    assert(!pattern.test(file), `Success/cancel UI must not contain activation pattern ${pattern}`);
  }
}

assert(
  success.includes("lookupRevenuePaymentProof"),
  "Success page must use lookup helper",
);
assert(
  lookup.includes("lookupRevenuePaymentProof") && !lookup.includes(".update("),
  "Lookup helper must be read-only",
);

assert(
  cancel.includes("no completaste") || cancel.includes("did not complete") || cancel.includes("not completed"),
  "Cancel page must state payment not completed",
);

assert(
  pkg.includes('"verify:stripe-revenue-os-admin-user-revenue-proof-01"'),
  "package script must exist",
);

const secretPatterns = [
  /sk_(live|test)_[A-Za-z0-9]{16,}/,
  /whsec_[A-Za-z0-9]{16,}/,
];

for (const file of [doc, success, cancel, lookup, display, pkg]) {
  for (const pattern of secretPatterns) {
    assert(!pattern.test(file), `Secret-like content forbidden matching ${pattern}`);
  }
}

const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const webhookRoute = read("app/api/revenue-os/webhook/route.ts");
assert(!checkoutRoute.includes("ADMIN-USER-REVENUE-PROOF"), "Checkout route must not be rewritten by this gate marker");
assert(!webhookRoute.includes("ADMIN-USER-REVENUE-PROOF"), "Webhook route must not be rewritten by this gate marker");

const gatePrefixes = [
  "docs/stripe-revenue-os-admin-user-revenue-proof-01.md",
  "scripts/verify-stripe-revenue-os-admin-user-revenue-proof-01.mjs",
  "app/(site)/revenue-os/",
  "app/lib/listingPlans/revenuePaymentLookup.ts",
  "app/lib/listingPlans/revenueDisplay.ts",
  "app/(site)/dashboard/lib/dashboardPackageEntitlementBadges.ts",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "app/admin/_lib/paymentTrackerData.ts",
  "app/admin/(dashboard)/workspace/payment-tracker/page.tsx",
  "app/api/dashboard/listing-package-entitlements/route.ts",
  "package.json",
];

const forbiddenPublicCategory = "app/(site)/clasificados/publicar/";

const statusLines = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

for (const line of statusLines) {
  const rel = line.slice(3).replaceAll("\\", "/");
  const isGateFile = gatePrefixes.some((p) => rel === p || rel.startsWith(p));

  if (line.startsWith("?? ") || line.startsWith("A ")) {
    assert(!rel.startsWith("supabase/migrations/"), `No migration added: ${rel}`);
    assert(!/^\.env(\.|$)/.test(rel), `.env must not be touched: ${rel}`);
  }

  if ((line.startsWith("M ") || line.startsWith("MM ")) && !isGateFile) {
    assert(!rel.startsWith(forbiddenPublicCategory), `No public category publish UI edited: ${rel}`);
  }
}

console.log("verify:stripe-revenue-os-admin-user-revenue-proof-01 PASS");

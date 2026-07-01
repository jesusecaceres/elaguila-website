import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function gitStatusShort() {
  return execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const docRel = "docs/stripe-revenue-os-webhook-fulfillment-01.md";
const routeRel = "app/api/revenue-os/webhook/route.ts";
const helpers = [
  "app/lib/listingPlans/revenueWebhook.ts",
  "app/lib/listingPlans/revenueFulfillment.ts",
  "app/lib/listingPlans/revenueEntitlementFulfillment.ts",
  "app/lib/listingPlans/revenueAuditLog.ts",
  "app/lib/listingPlans/revenuePaymentRecords.ts",
  "app/lib/listingPlans/revenuePromoRedemptions.ts",
];

assert(existsSync(path.join(ROOT, docRel)), `${docRel} must exist`);
assert(existsSync(path.join(ROOT, routeRel)), `${routeRel} must exist`);

for (const rel of helpers) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const route = read(routeRel);
const webhook = read(helpers[0]);
const fulfillment = read(helpers[1]);
const entitlement = read(helpers[2]);
const audit = read(helpers[3]);
const payments = read(helpers[4]);
const promos = read(helpers[5]);
const pkg = read("package.json");

const combined = [doc, route, webhook, fulfillment, entitlement, audit, payments, promos].join("\n");

for (const section of [
  "Executive Summary",
  "Repo Baseline",
  "Webhook Route Contract",
  "Signature Verification",
  "Supported Stripe Events",
  "Metadata Requirements",
  "Payment Record Fulfillment",
  "Promo Redemption Fulfillment",
  "Entitlement Activation",
  "Placement Entitlement Rules",
  "Admin Audit Log Events",
  "Idempotency Rules",
  "Expired/Cancelled Session Handling",
  "Security Notes",
  "Vercel Environment Variables Needed",
  "Stripe Dashboard Webhook Setup Steps",
  "Manual Sandbox QA Plan",
  "What This Gate Does Not Do",
  "Next Gate: Admin/User Revenue Proof",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(
  doc.includes("https://leonixmedia.com/api/revenue-os/webhook"),
  "Doc must mention production webhook endpoint URL",
);
assert(doc.includes("STRIPE_WEBHOOK_SECRET"), "Doc must mention STRIPE_WEBHOOK_SECRET");
assert(
  doc.includes("No entitlement activation without verified webhook") ||
    doc.includes("no entitlement activation without verified webhook") ||
    doc.toLowerCase().includes("without verified webhook"),
  "Doc must state no entitlement activation without verified webhook",
);

const secretPatterns = [
  /sk_(live|test)_[A-Za-z0-9]{16,}/,
  /whsec_[A-Za-z0-9]{16,}/,
  /\bSTRIPE_SECRET_KEY\s*=\s*.+/,
  /\bSTRIPE_WEBHOOK_SECRET\s*=\s*.+/,
];

for (const file of [doc, route, webhook, fulfillment, entitlement, audit, payments, promos]) {
  for (const pattern of secretPatterns) {
    assert(!pattern.test(file), `Secret-like content forbidden matching ${pattern}`);
  }
}

assert(route.includes("STRIPE_WEBHOOK_SECRET"), "Route must reference STRIPE_WEBHOOK_SECRET");
assert(
  route.includes("constructEvent") || webhook.includes("constructEvent"),
  "Must use stripe.webhooks.constructEvent",
);
assert(route.includes("request.text()"), "Route must read raw body via request.text()");
assert(
  route.includes("checkout.session.completed") ||
    webhook.includes("checkout.session.completed") ||
    route.includes("REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED"),
  "Route must handle checkout.session.completed",
);
assert(
  route.includes("checkout.session.expired") ||
    webhook.includes("checkout.session.expired") ||
    route.includes("REVENUE_WEBHOOK_EVENT_CHECKOUT_EXPIRED"),
  "Route must handle checkout.session.expired",
);
assert(!route.includes("NEXT_PUBLIC_STRIPE"), "Route must not expose publishable key");

assert(combined.includes("leonix_payment_records"), "Must reference leonix_payment_records");
assert(combined.includes("listing_package_entitlements"), "Must reference listing_package_entitlements");
assert(combined.includes("leonix_promo_code_redemptions"), "Must reference leonix_promo_code_redemptions");
assert(combined.includes("admin_audit_log"), "Must reference admin_audit_log");

assert(
  combined.includes("empleos_job_fair_free") || combined.includes("EMPLEOS_JOB_FAIR_FREE"),
  "Must guard empleos_job_fair_free",
);
assert(
  combined.includes("stripeEligible") || combined.includes("isStripeEligiblePackageKey"),
  "Must verify stripeEligible package eligibility",
);

assert(
  pkg.includes('"verify:stripe-revenue-os-webhook-fulfillment-01"') &&
    pkg.includes("scripts/verify-stripe-revenue-os-webhook-fulfillment-01.mjs"),
  "package script must exist",
);

const gateFilePrefixes = [
  "app/api/revenue-os/webhook/",
  "app/lib/listingPlans/revenueWebhook.ts",
  "app/lib/listingPlans/revenueFulfillment.ts",
  "app/lib/listingPlans/revenueEntitlementFulfillment.ts",
  "app/lib/listingPlans/revenueAuditLog.ts",
  "docs/stripe-revenue-os-webhook-fulfillment-01.md",
  "scripts/verify-stripe-revenue-os-webhook-fulfillment-01.mjs",
  "package.json",
];

const forbiddenUiPrefixes = [
  "app/(site)/",
  "app/admin/(dashboard)/",
];

const statusLines = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

for (const line of statusLines) {
  const rel = line.slice(3).replaceAll("\\", "/");
  const isGateFile = gateFilePrefixes.some(
    (prefix) => rel === prefix || rel.startsWith(prefix),
  );

  if (line.startsWith("?? ") || line.startsWith("A ")) {
    assert(!rel.startsWith("supabase/migrations/"), `No migration added: ${rel}`);
    assert(!/^\.env(\.|$)/.test(rel), `.env must not be touched: ${rel}`);
  }

  if ((line.startsWith("M ") || line.startsWith("MM ")) && !isGateFile) {
    for (const prefix of forbiddenUiPrefixes) {
      assert(
        !rel.startsWith(prefix),
        `No public/admin/dashboard UI edited by this gate: ${rel}`,
      );
    }
  }
}

console.log("verify:stripe-revenue-os-webhook-fulfillment-01 PASS");

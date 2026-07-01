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

const docRel = "docs/stripe-revenue-os-checkout-session-01.md";
const routeRel = "app/api/revenue-os/checkout/route.ts";
const helpers = [
  "app/lib/listingPlans/revenueCheckout.ts",
  "app/lib/listingPlans/revenueStripe.ts",
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
const checkout = read(helpers[0]);
const stripe = read(helpers[1]);
const payments = read(helpers[2]);
const promos = read(helpers[3]);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Env Readiness",
  "API Route Contract",
  "Checkout Request Contract",
  "Package Eligibility Rules",
  "Empleos Two-Pipeline Protection",
  "Rentas Paid Package Handling",
  "Promo Code Handling",
  "Pending Payment Record Flow",
  "Stripe Metadata Contract",
  "Success/Cancel URL Contract",
  "Security Notes",
  "What This Gate Does Not Activate",
  "Next Gate: Webhook Fulfillment",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(doc.includes("does not activate") || doc.includes("Does Not Activate"), "Doc must state no activation");
assert(doc.includes("Webhook"), "Doc must mention webhook fulfillment next");

const secretPatterns = [
  /sk_(live|test)_[A-Za-z0-9]{16,}/,
  /whsec_[A-Za-z0-9]{16,}/,
  /\bSTRIPE_SECRET_KEY\s*=\s*.+/,
];

for (const file of [doc, route, checkout, stripe, payments, promos]) {
  for (const pattern of secretPatterns) {
    assert(!pattern.test(file), `Secret-like content forbidden matching ${pattern}`);
  }
}

assert(!route.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"), "Route must not use publishable key server-side");
assert(
  !route.includes("STRIPE_SECRET_KEY") || stripe.includes("STRIPE_SECRET_KEY"),
  "Secret key reference must stay in server helper only",
);
assert(!route.match(/process\.env\.STRIPE_SECRET_KEY/), "Route must not read STRIPE_SECRET_KEY directly");

assert(
  route.includes("leonix_payment_records") || payments.includes("leonix_payment_records"),
  "Must reference leonix_payment_records",
);

assert(
  stripe.includes("checkout.sessions.create") || route.includes("createRevenueStripeCheckoutSession"),
  "Must create Stripe Checkout session",
);

assert(
  checkout.includes("success_url") ||
    checkout.includes("buildCheckoutSuccessUrl") ||
    stripe.includes("success_url"),
  "Must include success URL",
);
assert(
  checkout.includes("cancel_url") ||
    checkout.includes("buildCheckoutCancelUrl") ||
    stripe.includes("cancel_url"),
  "Must include cancel URL",
);

assert(
  stripe.includes("metadata") || route.includes("metadata"),
  "Must attach Stripe metadata",
);

assert(
  checkout.includes("isStripeEligiblePackageKey") ||
    checkout.includes("package_not_stripe_eligible") ||
    checkout.includes("EMPLEOS_JOB_FAIR_FREE"),
  "Must reject free / ineligible packages",
);

assert(
  checkout.includes("EMPLEOS_JOB_FAIR_FREE") || checkout.includes("empleos_job_fair_free"),
  "Must reference empleos_job_fair_free rejection",
);

assert(
  checkout.includes("empleos_job_post_paid") ||
    read("app/lib/listingPlans/revenuePricingMatrix.ts").includes("empleos_job_post_paid"),
  "Must support empleos_job_post_paid",
);

assert(
  !route.includes("body.amountCents") && !route.includes("input.amount"),
  "Route must not trust client amount",
);

assert(
  checkout.includes("validateRevenueCheckoutRequest") &&
    checkout.includes("getRevenuePackageDefinition"),
  "Amount must derive from pricing matrix helpers",
);

assert(
  pkg.includes('"verify:stripe-revenue-os-checkout-session-01"') &&
    pkg.includes("scripts/verify-stripe-revenue-os-checkout-session-01.mjs"),
  "package script must exist",
);

const statusLines = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

for (const line of statusLines) {
  const rel = line.slice(3).replaceAll("\\", "/");
  const added = line.startsWith("?? ") || line.startsWith("A ");
  assert(!added || !rel.startsWith("supabase/migrations/"), `No migration added: ${rel}`);
  assert(
    !added ||
      (!/^app\/api\/.*\/webhook\/route\.ts$/i.test(rel) &&
        !rel.includes("webhook/route.ts")),
    `No webhook route added: ${rel}`,
  );
  assert(!/^\.env(\.|$)/.test(rel), `.env must not be touched: ${rel}`);
}

console.log("verify:stripe-revenue-os-checkout-session-01 PASS");

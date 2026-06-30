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

const docRel = "docs/stripe-revenue-os-placement-pricing-promo-blueprint-01.md";
const packageRel = "package.json";

assert(existsSync(path.join(ROOT, docRel)), `${docRel} must exist`);
assert(existsSync(path.join(ROOT, packageRel)), `${packageRel} must exist`);

const doc = read(docRel);
const pkg = read(packageRel);

for (const section of [
  "Core Monetization Doctrine",
  "Existing Stripe/Payment Audit",
  "Existing Promo/Coupon Audit",
  "Existing Entitlement/Package Audit",
  "V1 Pricing Matrix",
  "Placement Entitlement Model",
  "Partner Premium / Print Client Rules",
  "Category Scope Rules",
  "Public Sorting Rules",
  "Homepage Featured Partner Rules",
  "Clasificados / Negocios Featured Partner Rules",
  "Category Landing / Results Placement Rules",
  "Admin OS Requirements",
  "Owner Dashboard Requirements",
  "Stripe Checkout Architecture",
  "Stripe Webhook Fulfillment Architecture",
  "Promo Code Architecture",
  "Print Client / Manual Comp Architecture",
  "Supabase Schema Gap Analysis",
  "Analytics / Audit Log Requirements",
  "Future Implementation Gates",
  "Open Owner Decisions",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

for (const requiredTruth of [
  "DO NOT",
  "No Stripe Checkout implementation",
  "User account plan is separate from listing/ad plan",
  "partner_premium",
  "leonix_payment_records",
  "leonix_promo_codes",
  "leonix_promo_code_redemptions",
  "No Restaurant partner in Autos results",
  "NEEDS OWNER FINAL LOCK",
]) {
  assert(doc.includes(requiredTruth), `Document must include required blueprint truth: ${requiredTruth}`);
}

const secretPatterns = [
  /sk_(live|test)_[A-Za-z0-9]{16,}/,
  /whsec_[A-Za-z0-9]{16,}/,
  /rk_(live|test)_[A-Za-z0-9]{16,}/,
  /postgres(?:ql)?:\/\/\S+/i,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  /\b(STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|SUPABASE_SERVICE_ROLE_KEY)\s*=\s*.+/i,
];

for (const pattern of secretPatterns) {
  assert(!pattern.test(doc), `Document appears to contain secret-like content matching ${pattern}`);
}

assert(
  pkg.includes('"verify:stripe-revenue-os-placement-pricing-promo-blueprint-01"') &&
    pkg.includes("scripts/verify-stripe-revenue-os-placement-pricing-promo-blueprint-01.mjs"),
  "package script verify:stripe-revenue-os-placement-pricing-promo-blueprint-01 must exist",
);

const lines = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

const allowedChanged = new Set([
  "package.json",
  docRel,
  "scripts/verify-stripe-revenue-os-placement-pricing-promo-blueprint-01.mjs",
]);

for (const line of lines) {
  const rel = line.slice(3).replaceAll("\\", "/");
  if (line.startsWith("?? ") || line.startsWith("A ") || line.startsWith(" M") || line.startsWith("M ")) {
    assert(allowedChanged.has(rel), `Unexpected changed file for blueprint gate: ${rel}`);
  }
  assert(!rel.startsWith("supabase/migrations/"), `No migration file may be added by this gate: ${rel}`);
  assert(
    !/^app\/api\/.*stripe.*\/(checkout|webhook)\/route\.ts$/i.test(rel) &&
      !/^app\/api\/.*(checkout|webhook).*\/route\.ts$/i.test(rel),
    `No Stripe checkout/webhook route may be added by this gate: ${rel}`,
  );
  assert(
    !rel.startsWith("app/(site)/clasificados/") &&
      !rel.startsWith("app/(site)/negocios") &&
      !rel.startsWith("app/(site)/negocios-locales"),
    `No public category page may be modified by this gate: ${rel}`,
  );
}

console.log("verify:stripe-revenue-os-placement-pricing-promo-blueprint-01 PASS");

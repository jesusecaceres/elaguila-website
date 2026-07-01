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

const docRel = "docs/stripe-revenue-os-live-supabase-proof-01.md";
const migrationGlob = "20260630120000_stripe_revenue_os_schema_and_entitlement_contract_01.sql";
const packageRel = "package.json";

const helperFiles = [
  "app/lib/listingPlans/revenuePricingMatrix.ts",
  "app/lib/listingPlans/placementEntitlements.ts",
  "app/lib/listingPlans/promoCodeRules.ts",
  "app/lib/listingPlans/revenueEntitlements.ts",
];

assert(existsSync(path.join(ROOT, docRel)), `${docRel} must exist`);
assert(
  existsSync(path.join(ROOT, "supabase/migrations", migrationGlob)),
  `Migration ${migrationGlob} must exist`,
);
assert(existsSync(path.join(ROOT, packageRel)), `${packageRel} must exist`);

const doc = read(docRel);
const pkg = read(packageRel);

for (const section of [
  "Executive Summary",
  "Migration Safety Inspection",
  "Live Migration / Apply Result",
  "Live Table Proof",
  "Required Column Proof",
  "Safe Test Row Proof",
  "RLS / Security Proof",
  "Admin Audit Log Proof",
  "Admin / Dashboard Readiness",
  "Empleos Two-Pipeline Proof",
  "Next Recommended Revenue OS Gate",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
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

assert(!doc.includes("NEXT_PUBLIC_SUPABASE"), "Document must not dump env variable assignments");

for (const rel of helperFiles) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

assert(
  pkg.includes('"verify:stripe-revenue-os-live-supabase-proof-01"') &&
    pkg.includes("scripts/verify-stripe-revenue-os-live-supabase-proof-01.mjs"),
  "package script verify:stripe-revenue-os-live-supabase-proof-01 must exist",
);

const statusLines = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

for (const line of statusLines) {
  const rel = line.slice(3).replaceAll("\\", "/");
  const added = line.startsWith("?? ") || line.startsWith("A ");
  assert(
    !added ||
      (!/^app\/api\/.*stripe.*\/(checkout|webhook)\/route\.ts$/i.test(rel) &&
        !/^app\/api\/.*\/(checkout|webhook)\/route\.ts$/i.test(rel)),
    `No Stripe checkout/webhook route may be added by this gate: ${rel}`,
  );
  assert(!/^\.env(\.|$)/.test(rel), `.env must not be touched: ${rel}`);
}

console.log("verify:stripe-revenue-os-live-supabase-proof-01 PASS");

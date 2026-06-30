import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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

function gitDiffNameOnly(cached = false) {
  const args = cached ? ["diff", "--cached", "--name-only"] : ["diff", "--name-only"];
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const docRel = "docs/stripe-revenue-os-schema-and-entitlement-contract-01.md";
const blueprintRel = "docs/stripe-revenue-os-placement-pricing-promo-blueprint-01.md";
const packageRel = "package.json";

const migrationGlob = readdirSync(path.join(ROOT, "supabase/migrations"))
  .filter((f) => f.includes("stripe_revenue_os_schema_and_entitlement_contract_01") && f.endsWith(".sql"));

const helperFiles = [
  "app/lib/listingPlans/revenuePricingMatrix.ts",
  "app/lib/listingPlans/placementEntitlements.ts",
  "app/lib/listingPlans/promoCodeRules.ts",
  "app/lib/listingPlans/revenueEntitlements.ts",
];

assert(existsSync(path.join(ROOT, docRel)), `${docRel} must exist`);
assert(existsSync(path.join(ROOT, blueprintRel)), `${blueprintRel} must exist`);
assert(existsSync(path.join(ROOT, packageRel)), `${packageRel} must exist`);
assert(migrationGlob.length === 1, "Exactly one stripe_revenue_os_schema_and_entitlement_contract_01 migration must exist");

const migrationRel = `supabase/migrations/${migrationGlob[0]}`;
const migration = read(migrationRel);
const doc = read(docRel);
const pkg = read(packageRel);

for (const section of [
  "Executive Summary",
  "Current Repo Contract Audit",
  "Migration Summary",
  "Payment Records Contract",
  "Promo Codes Contract",
  "Promo Redemptions Contract",
  "Placement Entitlements Contract",
  "Package Entitlements Alignment",
  "Print Client / Manual Comp Contract",
  "Stripe Metadata Contract",
  "Admin OS Readiness",
  "Owner Dashboard Readiness",
  "Category Landing / Results Sorting Readiness",
  "Security / RLS Notes",
  "Audit Log Plan",
  "Supabase Live Proof Plan",
  "Future Implementation Gates",
  "Open Owner Decisions",
  "Manual QA Checklist",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

for (const table of [
  "leonix_payment_records",
  "leonix_promo_codes",
  "leonix_promo_code_redemptions",
  "leonix_placement_entitlements",
  "listing_package_entitlements",
]) {
  assert(migration.includes(table), `Migration must reference ${table}`);
}

for (const forbidden of [
  /\bDROP\s+TABLE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+TABLE\b[\s\S]*?\bDROP\b/i,
]) {
  assert(!forbidden.test(migration), `Migration must not contain destructive SQL matching ${forbidden}`);
}

for (const rel of helperFiles) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
  const src = read(rel);
  assert(!/from\s+["']stripe["']/i.test(src) && !/require\s*\(\s*["']stripe["']\s*\)/.test(src), `${rel} must not import stripe`);
  assert(!/\bprocess\.env\b/.test(src), `${rel} must not read process.env`);
  assert(
    !/\.from\s*\(\s*["'][a-z_]+["']\s*\)/.test(src) &&
      !/createClient\s*\(/.test(src) &&
      !/supabase/.test(src),
    `${rel} must not mutate database`,
  );
}

assert(
  pkg.includes('"verify:stripe-revenue-os-schema-and-entitlement-contract-01"') &&
    pkg.includes("scripts/verify-stripe-revenue-os-schema-and-entitlement-contract-01.mjs"),
  "package script verify:stripe-revenue-os-schema-and-entitlement-contract-01 must exist",
);

const statusLines = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

const addedPaths = statusLines
  .filter((line) => line.startsWith("?? ") || line.startsWith("A "))
  .map((line) => line.slice(3).replaceAll("\\", "/"));

for (const rel of addedPaths) {
  assert(
    !/^app\/api\/.*stripe.*\/(checkout|webhook)\/route\.ts$/i.test(rel) &&
      !/^app\/api\/.*\/(checkout|webhook)\/route\.ts$/i.test(rel),
    `No Stripe checkout/webhook route may be added by this gate: ${rel}`,
  );
  assert(!/^\.env(\.|$)/.test(rel), `.env must not be touched: ${rel}`);
}

const diffPaths = [
  ...gitDiffNameOnly(false).split(/\r?\n/).filter(Boolean),
  ...gitDiffNameOnly(true).split(/\r?\n/).filter(Boolean),
].map((p) => p.replaceAll("\\", "/"));

for (const rel of diffPaths) {
  assert(!/^\.env(\.|$)/.test(rel), `.env must not be modified: ${rel}`);
}

console.log("verify:stripe-revenue-os-schema-and-entitlement-contract-01 PASS");

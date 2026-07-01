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

const matrixRel = "app/lib/listingPlans/revenuePricingMatrix.ts";
const promoRel = "app/lib/listingPlans/promoCodeRules.ts";
const entitlementsRel = "app/lib/listingPlans/revenueEntitlements.ts";
const liveProofRel = "docs/stripe-revenue-os-live-supabase-proof-01.md";
const packageRel = "package.json";

assert(existsSync(path.join(ROOT, matrixRel)), `${matrixRel} must exist`);
assert(existsSync(path.join(ROOT, promoRel)), `${promoRel} must exist`);
assert(existsSync(path.join(ROOT, entitlementsRel)), `${entitlementsRel} must exist`);
assert(existsSync(path.join(ROOT, liveProofRel)), `${liveProofRel} must exist`);
assert(existsSync(path.join(ROOT, packageRel)), `${packageRel} must exist`);

const matrix = read(matrixRel);
const promo = read(promoRel);
const entitlements = read(entitlementsRel);
const liveProof = read(liveProofRel);
const pkg = read(packageRel);

assert(matrix.includes("empleos_job_post_paid"), "revenuePricingMatrix must contain empleos_job_post_paid");
assert(matrix.includes("empleos_job_fair_free"), "revenuePricingMatrix must contain empleos_job_fair_free");
assert(!matrix.includes("empleos_job_30d"), "revenuePricingMatrix must not contain empleos_job_30d");
assert(!/\bpackageKey:\s*["']empleos_job_fair["']/.test(matrix), "revenuePricingMatrix must not use final key empleos_job_fair");

assert(
  promo.includes("EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY") || promo.includes("empleos_job_fair_free"),
  "promoCodeRules must document job fair promo ineligibility",
);

assert(
  (entitlements.includes("empleos_job_post_paid") ||
    entitlements.includes("EMPLEOS_JOB_POST_PAID_PACKAGE_KEY")) &&
    entitlements.includes("isStripeCheckoutMetadataEligible"),
  "revenueEntitlements must confirm job post Stripe metadata readiness",
);

assert(
  liveProof.includes("Empleos Two-Pipeline") || liveProof.includes("Empleos two pipelines"),
  "live supabase proof doc must mention Empleos two pipelines",
);

assert(
  pkg.includes('"verify:stripe-revenue-os-package-key-alignment-01"') &&
    pkg.includes("scripts/verify-stripe-revenue-os-package-key-alignment-01.mjs"),
  "package script verify:stripe-revenue-os-package-key-alignment-01 must exist",
);

const statusLines = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

for (const line of statusLines) {
  const rel = line.slice(3).replaceAll("\\", "/");
  const added = line.startsWith("?? ") || line.startsWith("A ");
  assert(!added || !rel.startsWith("supabase/migrations/"), `No migration may be added: ${rel}`);
  assert(
    !added ||
      (!/^app\/api\/.*stripe.*\/(checkout|webhook)\/route\.ts$/i.test(rel) &&
        !/^app\/api\/.*\/(checkout|webhook)\/route\.ts$/i.test(rel)),
    `No Stripe checkout/webhook route may be added: ${rel}`,
  );
  assert(!/^\.env(\.|$)/.test(rel), `.env must not be touched: ${rel}`);
}

console.log("verify:stripe-revenue-os-package-key-alignment-01 PASS");

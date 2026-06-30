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

const docRel = "docs/admin-verifier-suite-triage-and-repair-01.md";
const packageRel = "package.json";
const purposeRel = "app/admin/_components/AdminPagePurposeCard.tsx";
const explainerRel = "app/admin/_components/AdminActionExplainer.tsx";
const registryRel = "app/admin/_lib/adminOsActionRegistry.ts";
const smokeDocRel = "docs/admin-os-full-repo-smoke-and-finish-readiness-01.md";
const actionProofDocRel = "docs/admin-action-qa-and-live-schema-proof-01.md";

for (const rel of [
  docRel,
  packageRel,
  purposeRel,
  explainerRel,
  registryRel,
  smokeDocRel,
  actionProofDocRel,
]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const pkg = read(packageRel);

for (const section of [
  "Starting Failure List",
  "Verifier-by-Verifier Triage Table",
  "Real Product Blockers Found",
  "Stale Verifiers Updated",
  "Current Admin OS Verification Standard",
  "Mobile/PWA Verification Notes",
  "Admin English UX Verification Notes",
  "Remaining Needs Live Proof Items",
  "Final Verifier Results",
  "Build Result",
  "Next Recommended Admin OS Gate",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

for (const verifier of [
  "verify:admin-dashboard-cleanup",
  "verify:admin-dashboard-mobile-command-center",
  "verify:admin-review-cta-actions",
  "verify:admin-classifieds-queue-polish",
  "verify:admin-servicios-ops-presentation",
  "verify:admin-dashboard-ceo-command-center",
  "verify:admin-monetization-readonly",
  "verify:admin-package-entitlement-generator",
  "verify:admin-pricing-promo-generator-ui",
  "verify:admin-promo-code-lifecycle",
  "verify:admin-leads-inbox-ui-lifecycle",
  "verify:admin-leads-crm",
  "verify:admin-mobile-shell",
]) {
  assert(doc.includes(verifier), `Document must mention triaged verifier: ${verifier}`);
}

assert(
  pkg.includes('"verify:admin-verifier-suite-triage-and-repair-01"') &&
    pkg.includes("scripts/verify-admin-verifier-suite-triage-and-repair-01.mjs"),
  "package script verify:admin-verifier-suite-triage-and-repair-01 must exist",
);
assert(read(purposeRel).includes("AdminPagePurposeCard"), "AdminPagePurposeCard must exist");
assert(read(explainerRel).includes("AdminActionExplainer"), "AdminActionExplainer must exist");
assert(read(registryRel).includes("ADMIN_OS_ACTION_REGISTRY"), "adminOsActionRegistry must exist");

const added = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter((line) => line.startsWith("?? ") || line.startsWith("A "))
  .map((line) => line.slice(3).replaceAll("\\", "/"));

const allowedAdded = new Set([docRel, "scripts/verify-admin-verifier-suite-triage-and-repair-01.mjs"]);

for (const rel of added) {
  if (rel.startsWith("supabase/migrations/")) {
    throw new Error(`No migration file may be added by this gate: ${rel}`);
  }
  if (/(^|\/)(stripe|payment|payments)(\/|$)/i.test(rel) || /stripe/i.test(rel)) {
    throw new Error(`No Stripe route/file may be added by this gate: ${rel}`);
  }
  if (
    !allowedAdded.has(rel) &&
    (rel.startsWith("app/(site)/clasificados/") ||
      rel.startsWith("app/lib/clasificados/") ||
      rel.startsWith("components/clasificados/") ||
      rel.startsWith("docs/") && /clasificados.*(preview|public|output)/i.test(rel))
  ) {
    throw new Error(`No public Clasificados output doc/file may be added by this gate: ${rel}`);
  }
}

console.log("verify:admin-verifier-suite-triage-and-repair-01 PASS");

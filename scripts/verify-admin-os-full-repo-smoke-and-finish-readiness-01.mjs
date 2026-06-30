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

const docRel = "docs/admin-os-full-repo-smoke-and-finish-readiness-01.md";
const purposeRel = "app/admin/_components/AdminPagePurposeCard.tsx";
const explainerRel = "app/admin/_components/AdminActionExplainer.tsx";
const registryRel = "app/admin/_lib/adminOsActionRegistry.ts";
const qaRel = "docs/admin-os-final-qa-checklist-01.md";
const packageRel = "package.json";

for (const rel of [docRel, purposeRel, explainerRel, registryRel, qaRel, packageRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const pkg = read(packageRel);

for (const section of [
  "Executive Summary",
  "Admin Route Smoke Map",
  "Admin Action Smoke Map",
  "Verifier Inventory",
  "Build Result",
  "Manual Smoke Test Checklist",
  "Mobile/PWA Readiness Notes",
  "Launch-Safe Actions",
  "Needs Live Proof Actions",
  "Blockers",
  "Next Admin OS Gates",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(read(purposeRel).includes("AdminPagePurposeCard"), "AdminPagePurposeCard must exist");
assert(read(explainerRel).includes("AdminActionExplainer"), "AdminActionExplainer must exist");
assert(read(registryRel).includes("ADMIN_OS_ACTION_REGISTRY"), "adminOsActionRegistry must exist");
assert(
  pkg.includes('"verify:admin-os-full-repo-smoke-and-finish-readiness-01"') &&
    pkg.includes("scripts/verify-admin-os-full-repo-smoke-and-finish-readiness-01.mjs"),
  "package script verify:admin-os-full-repo-smoke-and-finish-readiness-01 must exist",
);

const added = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter((line) => line.startsWith("?? ") || line.startsWith("A "))
  .map((line) => line.slice(3).replaceAll("\\", "/"));

const allowedAdded = new Set([docRel, "scripts/verify-admin-os-full-repo-smoke-and-finish-readiness-01.mjs"]);

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
      /clasificados.*(preview|public|output)/i.test(rel))
  ) {
    throw new Error(`No public Clasificados output doc/file may be added by this gate: ${rel}`);
  }
}

console.log("verify:admin-os-full-repo-smoke-and-finish-readiness-01 PASS");

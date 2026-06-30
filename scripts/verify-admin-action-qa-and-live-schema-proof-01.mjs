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

function gitShortStatus() {
  try {
    return execFileSync("git", ["status", "--short"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(`Could not read git status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const docRel = "docs/admin-action-qa-and-live-schema-proof-01.md";
const registryRel = "app/admin/_lib/adminOsActionRegistry.ts";
const explainerRel = "app/admin/_components/AdminActionExplainer.tsx";
const packageRel = "package.json";

assert(existsSync(path.join(ROOT, docRel)), `${docRel} must exist`);
assert(existsSync(path.join(ROOT, registryRel)), `${registryRel} must exist`);
assert(existsSync(path.join(ROOT, explainerRel)), `${explainerRel} must exist`);

const doc = read(docRel);
const registry = read(registryRel);
const explainer = read(explainerRel);
const pkg = read(packageRel);

for (const section of [
  "Action Matrix",
  "Launch-Safe Actions",
  "Needs Live Proof",
  "Dangerous Actions",
  "Audit Log Coverage",
  "Success/Error Proof Coverage",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

for (const action of [
  "Suspend",
  "Restore",
  "Archive",
  "Republish",
  "Feature",
  "Verify Leonix",
  "Run AI review",
  "Delete",
  "Permanent delete",
]) {
  assert(doc.includes(action), `Document must include core action: ${action}`);
}

for (const status of [
  "REAL",
  "PARTIAL",
  "PLANNED",
  "NEEDS LIVE PROOF",
  "NEEDS SCHEMA GATE",
  "DISABLED",
]) {
  assert(doc.includes(status), `Document must include status: ${status}`);
  assert(registry.includes(status), `Registry taxonomy must include status: ${status}`);
}

assert(registry.includes("ADMIN_OS_ACTION_REGISTRY"), "adminOsActionRegistry must export ADMIN_OS_ACTION_REGISTRY");
assert(registry.includes("ADMIN_OS_ACTION_STATUS_TAXONOMY"), "adminOsActionRegistry must export status taxonomy");
assert(explainer.includes("AdminActionExplainer"), "AdminActionExplainer component must exist");
assert(
  pkg.includes('"verify:admin-action-qa-and-live-schema-proof-01"') &&
    pkg.includes("scripts/verify-admin-action-qa-and-live-schema-proof-01.mjs"),
  "package script verify:admin-action-qa-and-live-schema-proof-01 must exist",
);

const status = gitShortStatus()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

const added = status
  .filter((line) => line.startsWith("?? ") || line.startsWith("A "))
  .map((line) => line.slice(3).replaceAll("\\", "/"));

const allowedAdded = new Set([
  docRel,
  "scripts/verify-admin-action-qa-and-live-schema-proof-01.mjs",
]);

for (const rel of added) {
  if (rel.startsWith("supabase/migrations/")) {
    throw new Error(`No migration files may be added by this gate: ${rel}`);
  }
  if (/(^|\/)(stripe|payment|payments)(\/|$)/i.test(rel) || /stripe/i.test(rel)) {
    throw new Error(`No Stripe files/routes may be added by this gate: ${rel}`);
  }
  if (
    !allowedAdded.has(rel) &&
    (rel.startsWith("app/(site)/clasificados/") ||
      rel.startsWith("app/lib/clasificados/") ||
      rel.startsWith("components/clasificados/") ||
      /clasificados-preview-public-output/i.test(rel))
  ) {
    throw new Error(`No Clasificados public output files/docs may be added by this gate: ${rel}`);
  }
}

console.log("verify:admin-action-qa-and-live-schema-proof-01 PASS");

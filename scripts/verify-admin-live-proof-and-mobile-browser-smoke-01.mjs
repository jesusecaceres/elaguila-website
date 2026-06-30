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

const docRel = "docs/admin-live-proof-and-mobile-browser-smoke-01.md";
const packageRel = "package.json";
const purposeRel = "app/admin/_components/AdminPagePurposeCard.tsx";
const explainerRel = "app/admin/_components/AdminActionExplainer.tsx";
const registryRel = "app/admin/_lib/adminOsActionRegistry.ts";
const triageDocRel = "docs/admin-verifier-suite-triage-and-repair-01.md";
const smokeDocRel = "docs/admin-os-full-repo-smoke-and-finish-readiness-01.md";

for (const rel of [docRel, packageRel, purposeRel, explainerRel, registryRel, triageDocRel, smokeDocRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const pkg = read(packageRel);

for (const section of [
  "Route Browser Smoke Table",
  "Admin Command Center Smoke",
  "Marketplace Ops Smoke",
  "Leads/CRM Smoke",
  "Team/Users Smoke",
  "Website Control Smoke",
  "Magazine Manager Smoke",
  "Tienda Smoke",
  "Mobile/PWA 390px Smoke",
  "Live Proof Awareness",
  "Blockers",
  "Manual QA Steps for Chuy",
  "Next Recommended Admin OS Gate",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

for (const route of [
  "/admin",
  "/admin/workspace",
  "/admin/workspace/clasificados",
  "/admin/workspace/clasificados/servicios",
  "/admin/workspace/clasificados/autos",
  "/admin/workspace/clasificados/restaurantes",
  "/admin/reportes",
  "/admin/leads/inbox",
  "/admin/team",
  "/admin/usuarios",
  "/admin/site-settings",
  "/admin/settings",
  "/admin/workspace/language-audit",
  "/admin/tienda",
  "/admin/tienda/catalog",
  "/admin/workspace/revista",
  "/admin/draw",
]) {
  assert(doc.includes(route), `Document must include smoke route: ${route}`);
}

assert(
  pkg.includes('"verify:admin-live-proof-and-mobile-browser-smoke-01"') &&
    pkg.includes("scripts/verify-admin-live-proof-and-mobile-browser-smoke-01.mjs"),
  "package script verify:admin-live-proof-and-mobile-browser-smoke-01 must exist",
);
assert(read(purposeRel).includes("AdminPagePurposeCard"), "AdminPagePurposeCard must exist");
assert(read(explainerRel).includes("AdminActionExplainer"), "AdminActionExplainer must exist");
assert(read(registryRel).includes("ADMIN_OS_ACTION_REGISTRY"), "adminOsActionRegistry must exist");

const added = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter((line) => line.startsWith("?? ") || line.startsWith("A "))
  .map((line) => line.slice(3).replaceAll("\\", "/"));

const allowedAdded = new Set([docRel, "scripts/verify-admin-live-proof-and-mobile-browser-smoke-01.mjs"]);

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
      (rel.startsWith("docs/") && /clasificados.*(preview|public|output)/i.test(rel)))
  ) {
    throw new Error(`No public Clasificados output doc/file may be added by this gate: ${rel}`);
  }
}

console.log("verify:admin-live-proof-and-mobile-browser-smoke-01 PASS");

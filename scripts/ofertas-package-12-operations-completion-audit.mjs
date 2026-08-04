import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const assertIncludes = (label, text, needle) => assert(text.includes(needle), `${label} missing ${needle}`);
const assertNotIncludes = (label, text, needle) => assert(!text.includes(needle), `${label} must not include ${needle}`);

const requiredFiles = [
  "app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts",
  "docs/OFERTAS_PACKAGE_12_OWNER_ADMIN_OPERATIONS.md",
  "scripts/ofertas-package-12-operational-status-audit.mjs",
  "scripts/ofertas-package-12-owner-operations-audit.mjs",
  "scripts/ofertas-package-12-admin-review-audit.mjs",
  "scripts/ofertas-package-12-correction-resubmission-audit.mjs",
  "scripts/ofertas-package-12-recovery-operations-audit.mjs",
  "scripts/ofertas-package-12-commercial-term-parity-audit.mjs",
  "scripts/ofertas-package-12-mobile-es-en-accessibility-audit.mjs",
  "scripts/ofertas-package-12-operations-completion-audit.mjs",
];
for (const file of requiredFiles) {
  assert(existsSync(path.join(repoRoot, file)), `missing Package 12 required file: ${file}`);
}

const status = read("app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts");
const doc = read("docs/OFERTAS_PACKAGE_12_OWNER_ADMIN_OPERATIONS.md");
const checklist = read("docs/OFERTAS_PACKAGE_3_MASTER_CHECKLIST.md");

for (const marker of [
  "Operational State Machine",
  "Owner Status Matrix",
  "Admin Status Matrix",
  "Approval Blockers",
  "Rejection, Correction, Resubmission",
  "Source, Scan, Review, Recovery",
  "Commercial And Partner States",
  "Publication, Term, Renewal",
  "Analytics Visibility",
  "Migrations unapplied",
  "Database not accessed",
  "External services not called",
  "No Preview",
  "No Production",
  "No deployment",
]) {
  assertIncludes("Package 12 doc", doc, marker);
}

assertIncludes("master checklist", checklist, "Q9: PARTIAL - Package 12");
assertIncludes("status model", status, "adminApprovalAllowed");
assertIncludes("status model", status, "sourceReplacementAllowed");
assertIncludes("status model", status, "scanRetryAllowed");
assertIncludes("status model", status, "renewalAllowed");

const dirty = execFileSync("git", ["status", "--porcelain=v1"], { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => (line.startsWith("?? ") ? line.slice(3) : line.slice(3)).replace(/\\/g, "/"));

const forbiddenPatterns = [
  /^app\/api\/dashboard\//,
  /^app\/lib\/listingPlans\//,
  /^app\/lib\/analytics\/(?!server\/fetchOwnerDashboardAnalyticsServer\.ts$)/,
  /^app\/admin\/(?!\(dashboard\)\/workspace\/clasificados\/ofertas-locales\/)/,
  /^app\/middleware/,
  /^middleware\./,
  /^\.vercel\//,
  /^vercel\.json$/,
  /^\.env/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^tsconfig\.json$/,
  /^eslint\.config\.mjs$/,
  /^next\.config\.ts$/,
  /^supabase\/migrations\//,
];

for (const file of dirty) {
  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(file), `forbidden dirty Package 12 path: ${file}`);
  }
}

assertNotIncludes("Package 12 doc", doc.toLowerCase(), "production ready");
assertNotIncludes("Package 12 doc", doc.toLowerCase(), "preview ready");
assertNotIncludes("Package 12 doc", doc.toLowerCase(), "deployed");

console.log("PASS: Package 12 owner/admin operations completion, scope, and safety are guarded.");

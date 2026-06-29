/**
 * ADMIN-OS-BATTLEFIELD-FINISH-TO-QA-01 verification.
 * Run: npm run verify:admin-os-battlefield-finish-to-qa-01
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

function fail(message) {
  console.error(`verify-admin-os-battlefield-finish-to-qa-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const explainerPath = "app/admin/_components/AdminActionExplainer.tsx";
const registryPath = "app/admin/_lib/adminOsActionRegistry.ts";
const purposePath = "app/admin/_components/AdminPagePurposeCard.tsx";
const qaPath = "docs/admin-os-final-qa-checklist-01.md";

for (const file of [explainerPath, registryPath, purposePath, qaPath]) {
  if (!exists(file)) fail(`required file missing: ${file}`);
}

const explainer = read(explainerPath);
if (!explainer.includes("AdminActionExplainer")) fail("AdminActionExplainer component missing");
if (!explainer.includes("data-admin-action-explainer")) fail("AdminActionExplainer needs stable marker");
ok("shared action explainer exists");

const registry = read(registryPath);
const requiredActions = [
  "viewPublic",
  "editListing",
  "manageListing",
  "viewResults",
  "suspend",
  "restore",
  "archive",
  "republish",
  "feature",
  "verifyLeonix",
  "runAiReview",
  "markReviewed",
  "clearFlag",
  "delete",
  "permanentDelete",
  "publishIssue",
  "archiveIssue",
  "saveDraft",
  "exportCsv",
  "sendPasswordReset",
  "assignStaff",
];
for (const action of requiredActions) {
  if (!registry.includes(`${action}:`)) fail(`admin action registry missing ${action}`);
}
for (const label of ["View public", "Edit listing", "Manage listing", "View in results", "Verify Leonix", "Run AI review"]) {
  if (!registry.includes(label)) fail(`registry/action labels missing: ${label}`);
}
ok("admin action registry exists with required contracts");

const purpose = read(purposePath);
for (const status of ["REAL", "PARTIAL", "PLANNED", "NEEDS LIVE PROOF", "NEEDS SCHEMA GATE"]) {
  if (!purpose.includes(status)) fail(`status taxonomy missing: ${status}`);
}
ok("purpose card and status taxonomy remain available");

const checklist = read(qaPath);
const qaSections = [
  "## 1. Admin Command Center QA",
  "## 2. Marketplace Ops QA",
  "## 3. Servicios Admin QA",
  "## 4. Autos Admin QA",
  "## 5. Restaurantes Admin QA",
  "## 6. Reports QA",
  "## 7. Leads Inbox QA",
  "## 8. Team/Users QA",
  "## 9. Website Control QA",
  "## 10. Magazine Manager QA",
  "## 11. Tienda QA",
  "## 12. Owner Dashboard Mis Anuncios QA",
  "## 13. Mobile 390px QA",
  "## 14. Dangerous Actions QA",
  "## 15. English UX QA",
  "## 16. Ready-to-commit Checklist",
];
for (const section of qaSections) {
  if (!checklist.includes(section)) fail(`QA checklist missing section: ${section}`);
}
ok("final QA checklist includes all required sections");

const keyPages = [
  "app/admin/_components/AdminCommandCenterDashboard.tsx",
  "app/admin/(dashboard)/workspace/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx",
  "app/admin/(dashboard)/reportes/page.tsx",
  "app/admin/(dashboard)/leads/inbox/page.tsx",
  "app/admin/(dashboard)/team/page.tsx",
  "app/admin/(dashboard)/usuarios/page.tsx",
  "app/admin/(dashboard)/site-settings/page.tsx",
  "app/admin/(dashboard)/settings/page.tsx",
  "app/admin/(dashboard)/workspace/language-audit/page.tsx",
  "app/admin/(dashboard)/tienda/page.tsx",
  "app/admin/(dashboard)/tienda/catalog/page.tsx",
  "app/admin/(dashboard)/workspace/revista/page.tsx",
  "app/admin/(dashboard)/draw/page.tsx",
];
for (const file of keyPages) {
  if (!exists(file)) fail(`key admin page missing: ${file}`);
  const src = read(file);
  if (!src.includes("AdminPagePurposeCard") && !src.includes("Leonix Command Center")) {
    fail(`key admin page lacks purpose card/header proof: ${file}`);
  }
}
ok("key admin pages include purpose/help text or purpose card usage");

const actionSources = [
  "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx",
  "app/admin/(dashboard)/workspace/clasificados/_components/AdminRunAiReviewButton.tsx",
  "app/admin/_components/AdminDashboardReviewCardActions.tsx",
  "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx",
  "app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "app/(site)/dashboard/servicios/page.tsx",
  "app/(site)/dashboard/components/LeonixDashboardShell.tsx",
]
  .filter(exists)
  .map(read)
  .join("\n");

if (actionSources.includes("Open panel")) fail("Open panel remains in admin/dashboard action paths");
if (actionSources.includes("Continue editing")) fail("Continue editing remains in admin/dashboard action paths");
for (const label of ["View public", "Edit listing", "Manage listing", "View in results", "Verify Leonix", "Run AI review"]) {
  if (!actionSources.includes(label) && !registry.includes(label)) fail(`missing visible/registry label: ${label}`);
}
ok("action labels are standardized and confusing labels are absent");

const packageJson = JSON.parse(read("package.json"));
if (
  packageJson.scripts?.["verify:admin-os-battlefield-finish-to-qa-01"] !==
  "node scripts/verify-admin-os-battlefield-finish-to-qa-01.mjs"
) {
  fail("package script verify:admin-os-battlefield-finish-to-qa-01 missing");
}

const migrationDir = path.join(root, "supabase", "migrations");
const migrations = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir) : [];
const forbiddenMigration = migrations.find((name) => /battlefield|finish.*qa|admin.*os.*qa/i.test(name));
if (forbiddenMigration) fail(`no migration allowed for this gate: ${forbiddenMigration}`);

const changed = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const illegalPublicChange = changed.find(
  (file) =>
    file.startsWith("app/(site)/") &&
    !file.startsWith("app/(site)/dashboard/") &&
    !file.startsWith("app/(site)/clasificados/autos/") &&
    !file.startsWith("app/(site)/clasificados/autos/negocios/"),
);
if (illegalPublicChange) {
  fail(`unexpected public route/page change for this gate: ${illegalPublicChange}`);
}
ok("package script exists, no gate migration added, public changes constrained");

console.log("verify-admin-os-battlefield-finish-to-qa-01: PASS");

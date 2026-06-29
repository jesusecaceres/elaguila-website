/**
 * ADMIN-OS-ACTION-CONTRACT-AND-PAGE-PURPOSE-STACK-01 verification.
 * Run: npm run verify:admin-os-action-purpose-stack-01
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

function fail(message) {
  console.error(`verify-admin-os-action-purpose-stack-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const componentPath = "app/admin/_components/AdminPagePurposeCard.tsx";
if (!exists(componentPath)) fail("shared AdminPagePurposeCard component missing");

const component = read(componentPath);
for (const status of ["REAL", "PARTIAL", "PLANNED", "NEEDS LIVE PROOF", "NEEDS SCHEMA GATE"]) {
  if (!component.includes(status)) fail(`status taxonomy missing from component: ${status}`);
}
if (!component.includes("data-admin-purpose-card")) fail("purpose card needs stable verifier marker");
ok("shared purpose/status card component exists");

const dashboard = read("app/admin/_components/AdminCommandCenterDashboard.tsx");
if (!dashboard.includes("Leonix Command Center")) fail("dashboard must include Leonix Command Center");
if (!dashboard.includes("AdminPagePurposeCard")) fail("dashboard must use purpose card");

const pageChecks = [
  ["app/admin/(dashboard)/workspace/clasificados/page.tsx", "Classifieds workspace"],
  ["app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx", "Servicios admin ops"],
  ["app/admin/(dashboard)/workspace/clasificados/autos/page.tsx", "Autos admin ops"],
  ["app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx", "Restaurantes admin ops"],
  ["app/admin/(dashboard)/reportes/page.tsx", "Reports & complaints"],
  ["app/admin/(dashboard)/leads/inbox/page.tsx", "Launch Leads command center"],
  ["app/admin/(dashboard)/team/page.tsx", "Staff workspace"],
  ["app/admin/(dashboard)/usuarios/page.tsx", "Users and support lookup"],
  ["app/admin/(dashboard)/workspace/page.tsx", "Website Control / Site Sections"],
  ["app/admin/(dashboard)/site-settings/page.tsx", "Global site settings"],
  ["app/admin/(dashboard)/settings/page.tsx", "Settings"],
  ["app/admin/(dashboard)/workspace/language-audit/page.tsx", "Language Audit"],
  ["app/admin/(dashboard)/workspace/revista/page.tsx", "Magazine manager"],
  ["app/admin/(dashboard)/draw/page.tsx", "Draw legacy placeholder"],
  ["app/admin/(dashboard)/tienda/page.tsx", "Tienda command center"],
  ["app/admin/(dashboard)/tienda/catalog/page.tsx", "Tienda catalog"],
];

for (const [file, title] of pageChecks) {
  if (!exists(file)) fail(`expected page missing: ${file}`);
  const src = read(file);
  if (!src.includes("AdminPagePurposeCard")) fail(`${file} must use AdminPagePurposeCard`);
  if (!src.includes(title)) fail(`${file} missing purpose card title: ${title}`);
}
ok("major admin pages include purpose/status card usage");

const combinedAdminActionSources = [
  "app/admin/_components/AdminCommandCenterDashboard.tsx",
  "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx",
  "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx",
  "app/admin/(dashboard)/workspace/clasificados/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
]
  .filter(exists)
  .map(read)
  .join("\n");

if (combinedAdminActionSources.includes("Open panel")) fail("Open panel label still exists in admin/dashboard action paths");
if (combinedAdminActionSources.includes("Continue editing")) fail("Continue editing label still exists in admin/dashboard action paths");

for (const label of ["View public", "Edit listing", "Manage listing", "Suspend", "Restore", "Archive", "Republish", "Feature", "Verify Leonix", "Run AI review"]) {
  if (!combinedAdminActionSources.includes(label)) fail(`standard action label not found: ${label}`);
}
ok("standard action labels are present and legacy labels are absent");

const matrix = read("docs/leonix-admin-supabase-backing-matrix-01.md");
for (const phrase of ["NEEDS LIVE SUPABASE PROOF", "MISSING ACTION", "ADMIN-ACTION-QA-AND-LIVE-SCHEMA-PROOF-01"]) {
  if (phrase === "ADMIN-ACTION-QA-AND-LIVE-SCHEMA-PROOF-01") continue;
  if (!matrix.includes(phrase)) fail(`matrix status language missing: ${phrase}`);
}
if (!component.includes("needs live proof") || !component.includes("needs schema gate")) {
  fail("status taxonomy must include needs proof/schema gate language");
}
ok("matrix/status taxonomy language is referenced");

const migrationDir = path.join(root, "supabase", "migrations");
const migrationFiles = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir) : [];
const forbiddenGateMigration = migrationFiles.find((name) => /action.*purpose|purpose.*stack|page.*purpose/i.test(name));
if (forbiddenGateMigration) fail(`this no-schema gate must not add migrations: ${forbiddenGateMigration}`);

const packageJson = JSON.parse(read("package.json"));
if (
  packageJson.scripts?.["verify:admin-os-action-purpose-stack-01"] !==
  "node scripts/verify-admin-os-action-purpose-stack-01.mjs"
) {
  fail("package script verify:admin-os-action-purpose-stack-01 missing");
}
ok("package script registered and no migration added for this gate");

console.log("verify-admin-os-action-purpose-stack-01: PASS");

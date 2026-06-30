/**
 * CLASIFICADOS-PREVIEW-PUBLIC-OUTPUT-BATTLEFIELD-QA-01 verification.
 * Run: npm run verify:clasificados-preview-public-output-battlefield-qa-01
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

function fail(message) {
  console.error(`verify-clasificados-preview-public-output-battlefield-qa-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const auditPath = "docs/clasificados-preview-public-output-battlefield-audit-01.md";
const contractPath = "docs/clasificados-output-hierarchy-contract-01.md";
const qaPath = "docs/clasificados-preview-public-output-final-qa-01.md";

for (const file of [auditPath, contractPath, qaPath]) {
  if (!exists(file)) fail(`required document missing: ${file}`);
}

const audit = read(auditPath);
const contract = read(contractPath);
const qa = read(qaPath);
const docs = `${audit}\n${contract}\n${qa}`;

const categories = [
  "En Venta",
  "Servicios",
  "Autos",
  "Restaurantes",
  "Rentas",
  "Bienes Raices",
  "Empleos",
  "Clases",
  "Comunidad",
  "Viajes",
  "Mascotas",
  "Busco",
  "Comida Local",
];

for (const category of categories) {
  if (!docs.toLowerCase().includes(category.toLowerCase())) {
    fail(`docs missing primary category: ${category}`);
  }
}
ok("docs include all primary categories");

for (const phrase of [
  "preview",
  "public detail",
  "results card",
  "owner dashboard",
  "admin card",
  "title",
  "price",
  "location",
  "image",
  "CTA",
  "Other/Otro",
  "mobile 390px",
  "edit identity",
]) {
  if (!docs.toLowerCase().includes(phrase.toLowerCase())) {
    fail(`docs missing required output/parity language: ${phrase}`);
  }
}
ok("docs include required surface and hierarchy language");

for (const section of [
  "## 1. Global Preview Parity QA",
  "## 2. Global Results Card QA",
  "## 3. Global Public Detail QA",
  "## 4. Owner Dashboard QA",
  "## 5. Admin Listing QA",
  "## 6. Mobile 390px QA",
  "## 7. English UX QA",
  "## 8. Category-by-Category QA",
  "## 9. CTA QA",
  "## 10. Edit Identity QA",
  "## 11. Other/Otro Custom Text QA",
  "## 12. Analytics Visibility QA",
  "## 13. Ready to Commit Checklist",
]) {
  if (!qa.includes(section)) fail(`QA checklist missing section: ${section}`);
}
ok("QA checklist includes all required sections");

const packageJson = JSON.parse(read("package.json"));
if (
  packageJson.scripts?.["verify:clasificados-preview-public-output-battlefield-qa-01"] !==
  "node scripts/verify-clasificados-preview-public-output-battlefield-qa-01.mjs"
) {
  fail("package script verify:clasificados-preview-public-output-battlefield-qa-01 missing");
}

const dashboardAdminSources = [
  "app/(site)/dashboard",
  "app/admin",
  "components",
]
  .filter((rel) => fs.existsSync(path.join(root, rel)))
  .flatMap((rel) => {
    const base = path.join(root, rel);
    const files = execFileSync("git", ["ls-files", rel], { cwd: root, encoding: "utf8" })
      .split(/\r?\n/)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
    return files.map(read).join("\n");
  })
  .join("\n");

if (dashboardAdminSources.includes("Open panel")) fail("Open panel remains in dashboard/admin paths");
if (dashboardAdminSources.includes("Continue editing")) fail("Continue editing remains in dashboard/admin paths");
ok("confusing dashboard/admin labels are absent");

const migrations = execFileSync("git", ["ls-files", "supabase/migrations"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const forbiddenMigration = migrations.find((file) => /preview.*public.*output|battlefield.*qa|clasificados.*output/i.test(file));
if (forbiddenMigration) fail(`no migration allowed for this gate: ${forbiddenMigration}`);

const changed = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const changedAll = [...changed, ...untracked];
const stripeAdded = changedAll.find((file) => /stripe/i.test(file) && !file.startsWith("docs/"));
if (stripeAdded) fail(`Stripe file/route changed or added in this gate: ${stripeAdded}`);
ok("package script exists, no gate migration, no Stripe file/route added");

console.log("verify-clasificados-preview-public-output-battlefield-qa-01: PASS");

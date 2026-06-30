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
  "Mascotas y Perdidos",
  "Busco / Se busca",
  "Comida Local",
];
for (const category of categories) {
  if (!docs.includes(category)) fail(`docs missing primary category: ${category}`);
}
ok("docs include all primary categories");

for (const phrase of ["preview", "public detail", "results card", "owner dashboard", "admin card"]) {
  if (!docs.toLowerCase().includes(phrase)) fail(`docs missing surface language: ${phrase}`);
}
ok("docs include required output surfaces");

for (const phrase of ["title", "price", "location", "image", "CTA", "hierarchy"]) {
  if (!docs.includes(phrase)) fail(`docs missing hierarchy term: ${phrase}`);
}
if (!docs.includes("Other/Otro")) fail("docs missing Other/Otro custom text QA");
if (!docs.includes("390px")) fail("docs missing mobile 390px QA");
if (!docs.includes("edit identity")) fail("docs missing edit identity QA");
ok("docs include hierarchy, Other/Otro, mobile, and edit identity QA");

for (const section of [
  "## 1. Global Preview Parity QA",
  "## 2. Global Results Card QA",
  "## 3. Global Public Detail QA",
  "## 4. Owner Dashboard QA",
  "## 5. Admin Listing QA",
  "## 6. Mobile 390px QA",
  "## 7. English UX QA",
  "## 8. Category-by-category QA",
  "## 9. CTA QA",
  "## 10. Edit Identity QA",
  "## 11. Other/Otro Custom Text QA",
  "## 12. Analytics Visibility QA",
  "## 13. Ready to Commit Checklist",
]) {
  if (!qa.includes(section)) fail(`QA checklist missing section: ${section}`);
}
ok("QA checklist includes all required sections");

const dashboardAdminText = [
  "app/(site)/dashboard",
  "app/admin/(dashboard)/workspace/clasificados",
]
  .flatMap((dir) => {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) return [];
    return walk(abs).filter((file) => /\.(tsx|ts|jsx|js)$/.test(file));
  })
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

if (dashboardAdminText.includes("Open panel")) fail("Open panel remains in dashboard/admin paths");
if (dashboardAdminText.includes("Continue editing")) fail("Continue editing remains in dashboard/admin paths");
ok("legacy dashboard/admin labels are absent");

const packageJson = JSON.parse(read("package.json"));
if (
  packageJson.scripts?.["verify:clasificados-preview-public-output-battlefield-qa-01"] !==
  "node scripts/verify-clasificados-preview-public-output-battlefield-qa-01.mjs"
) {
  fail("package script missing");
}

const migrationsDir = path.join(root, "supabase", "migrations");
const migrations = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : [];
const gateMigration = migrations.find((name) => /preview.*public.*output|battlefield.*qa|clasificados.*output/i.test(name));
if (gateMigration) fail(`no migration allowed in this gate: ${gateMigration}`);

const changed = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const added = execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter((line) => line.startsWith("?? "))
  .map((line) => line.slice(3).trim());
const touched = [...changed, ...added];
const stripeTouched = touched.find((file) => /stripe/i.test(file));
if (stripeTouched) fail(`Stripe file/route touched in no-Stripe gate: ${stripeTouched}`);
ok("package script exists, no migration file, no Stripe file touched");

console.log("verify-clasificados-preview-public-output-battlefield-qa-01: PASS");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

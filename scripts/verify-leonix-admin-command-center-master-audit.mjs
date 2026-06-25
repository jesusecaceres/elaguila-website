/**
 * ADMIN-OS-MASTER-AUDIT-01 verification.
 * Run: npm run verify:leonix-admin-command-center-master-audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docPath = "docs/leonix-admin-command-center-master-audit.md";

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-leonix-admin-command-center-master-audit: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

if (!fs.existsSync(path.join(root, docPath))) {
  fail("audit doc missing");
}

const doc = read(docPath);

const REQUIRED_SECTIONS = [
  "Executive summary",
  "Admin route inventory",
  "CEO dashboard review",
  "Proposed admin information architecture",
  "Action truth map",
  "Design system audit",
  "Data / truth audit",
  "Mobile admin audit",
  "Missing tools / features",
  "Prioritized roadmap",
  "Recommended next 5 gates",
  "TRUE/FALSE audit",
];

for (const section of REQUIRED_SECTIONS) {
  if (!doc.includes(section)) fail(`audit doc missing section: ${section}`);
}
ok("audit doc includes all required sections");

const REQUIRED_ROUTES = [
  "/admin",
  "/admin/leads/inbox",
  "/admin/workspace/clasificados",
  "/admin/workspace/clasificados/servicios",
  "/admin/ops",
  "/admin/reportes",
  "/admin/team",
  "/admin/usuarios",
  "/admin/settings",
  "/admin/tienda",
];

for (const route of REQUIRED_ROUTES) {
  if (!doc.includes(route)) fail(`audit doc must mention route ${route}`);
}
ok("audit doc mentions required routes");

if (!doc.includes("/admin/workspace") && !doc.includes("site-sections")) {
  fail("audit doc must mention site sections (/admin/workspace or site-sections alias)");
}
ok("site sections route documented");

const REQUIRED_CONCEPTS = [
  "real data",
  "fake/static risk",
  "mobile",
  "horizontal overflow",
  "rectangular CTAs",
  "Leonix brand",
  "action proof",
  "destructive",
  "Supabase",
  "launch-critical",
];

for (const concept of REQUIRED_CONCEPTS) {
  if (!doc.toLowerCase().includes(concept.toLowerCase())) {
    fail(`audit doc must mention concept: ${concept}`);
  }
}
ok("audit doc mentions required concepts");

const packageJson = read("package.json");
if (!packageJson.includes('"verify:leonix-admin-command-center-master-audit"')) {
  fail("package.json missing verify script");
}
ok("package script registered");

console.log("\nverify-leonix-admin-command-center-master-audit: all checks passed");

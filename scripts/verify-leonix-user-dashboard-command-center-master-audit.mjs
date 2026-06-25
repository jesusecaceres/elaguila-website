/**
 * USER-DASHBOARD-OS-MASTER-AUDIT-01 verification.
 * Run: npm run verify:leonix-user-dashboard-command-center-master-audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docPath = "docs/leonix-user-dashboard-command-center-master-audit.md";

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-leonix-user-dashboard-command-center-master-audit: FAIL — ${msg}`);
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
  "User dashboard route inventory",
  "CEO/CFO/User/Client review",
  "Proposed user dashboard information architecture",
  "Action truth map",
  "Analytics truth audit",
  "Product truth audit",
  "Design system audit",
  "Mobile user dashboard audit",
  "Missing tools/features",
  "Prioritized roadmap",
  "Recommended next 5 gates",
  "TRUE/FALSE audit",
];

for (const section of REQUIRED_SECTIONS) {
  if (!doc.includes(section)) fail(`audit doc missing section: ${section}`);
}
ok("audit doc includes all required sections");

const REQUIRED_ROUTES = [
  "/dashboard",
  "/dashboard/mis-anuncios",
  "/dashboard/mis-anuncios/[id]",
  "/dashboard/drafts",
  "/dashboard/mensajes",
  "/dashboard/guardados",
  "/dashboard/analytics",
];

for (const route of REQUIRED_ROUTES) {
  if (!doc.includes(route)) fail(`audit doc must mention route ${route}`);
}
ok("audit doc mentions required routes");

const REQUIRED_CONCEPTS = [
  "real data",
  "fake/static risk",
  "mobile",
  "horizontal overflow",
  "Leonix brand system",
  "action proof",
  "destructive actions",
  "Supabase proof",
  "launch-critical",
  "seller analytics",
  "Mensajes disabled",
  "Guardados disabled",
];

for (const concept of REQUIRED_CONCEPTS) {
  if (!doc.toLowerCase().includes(concept.toLowerCase())) {
    fail(`audit doc must mention concept: ${concept}`);
  }
}
ok("audit doc mentions required concepts");

console.log("verify-leonix-user-dashboard-command-center-master-audit: PASS");

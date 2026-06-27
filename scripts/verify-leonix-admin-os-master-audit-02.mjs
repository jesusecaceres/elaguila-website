/**
 * ADMIN-OS-MASTER-AUDIT-02 verification.
 * Run: npm run verify:leonix-admin-os-master-audit-02
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docRel = "docs/leonix-admin-os-master-audit-02.md";
const docPath = path.join(root, docRel);

function fail(message) {
  console.error(`verify-leonix-admin-os-master-audit-02: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

if (!fs.existsSync(docPath)) {
  fail(`${docRel} is missing`);
}

const doc = fs.readFileSync(docPath, "utf8");

const requiredHeadings = [
  "## 1. Executive Summary",
  "## 2. Uploaded Screenshot UX Review",
  "## 3. Admin Route Inventory",
  "## 4. Sidebar/Nav Truth Map",
  "## 5. Supabase Backing Matrix",
  "## 6. Action Truth Map",
  "## 7. Mobile Issue Matrix",
  "## 8. Leonix Style Issue Matrix",
  "## 9. Bug Finder Architecture",
  "## 10. High-Priority Email Alert Plan",
  "## 11. Publishing/Upload Error Alert Architecture",
  "## 12. Listing Visibility Checker Architecture",
  "## 13. Viajes Affiliate Ops Architecture",
  "## 14. Website Control Architecture",
  "## 15. Magazine Manager Architecture",
  "## 16. User Support View Architecture",
  "## 17. Staff/Permissions Architecture",
  "## 18. Monetization/Revenue Architecture",
  "## 19. Business Concierge Architecture",
  "## 20. Prioritized Roadmap",
  "## 21. Recommended Next 10 Gates",
];

for (const heading of requiredHeadings) {
  if (!doc.includes(heading)) fail(`missing heading: ${heading}`);
}
ok("all required major headings are present");

const requiredRoutes = [
  "/admin",
  "/admin/ops",
  "/admin/activity-log",
  "/admin/leads/inbox",
  "/admin/leads/inbox?view=promo",
  "/admin/leads/newsletter",
  "/admin/leads/media-kit",
  "/admin/workspace/clasificados",
  "/admin/workspace/clasificados?status=flagged#queue",
  "/admin/workspace/clasificados/servicios",
  "/admin/workspace/clasificados/autos",
  "/admin/workspace/clasificados/restaurantes",
  "/admin/workspace/clasificados/viajes",
  "/admin/reportes",
  "/admin/team",
  "/admin/team/roster",
  "/admin/team/users/new",
  "/admin/usuarios",
  "/admin/site-sections",
  "/admin/settings",
  "/admin/workspace/language-audit",
  "/admin/tienda",
  "/admin/tienda/catalog",
];

for (const route of requiredRoutes) {
  if (!doc.includes(route)) fail(`missing route reference: ${route}`);
}
ok("required admin route references are present");

const requiredConcepts = [
  "real / partial / UI-only / unknown",
  "admin_system_alerts",
  "chuy@leonixmedia.com",
  "affiliate_partners",
  "travel_offers",
  "travel_inquiries",
  "affiliate_click_events",
  "magazine_issues",
  "concierge_requests",
  "390px",
  "No uncontrolled impersonation",
  "ADMIN-SUPABASE-BACKING-MATRIX-01",
  "ADMIN-ACTION-TRUTH-MAP-01",
  "ADMIN-BUG-FINDER-DASHBOARD-01",
];

for (const concept of requiredConcepts) {
  if (!doc.includes(concept)) fail(`missing required concept: ${concept}`);
}
ok("required architecture concepts are present");

const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
if (!packageJson.includes('"verify:leonix-admin-os-master-audit-02"')) {
  fail("package.json missing verify script");
}
ok("package script registered");

console.log("\nverify-leonix-admin-os-master-audit-02: all checks passed");

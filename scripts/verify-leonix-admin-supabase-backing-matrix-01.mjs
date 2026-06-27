/**
 * ADMIN-SUPABASE-BACKING-MATRIX-01 verification.
 * Run: npm run verify:leonix-admin-supabase-backing-matrix-01
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docRel = "docs/leonix-admin-supabase-backing-matrix-01.md";
const docPath = path.join(root, docRel);

function fail(message) {
  console.error(`verify-leonix-admin-supabase-backing-matrix-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

if (!fs.existsSync(docPath)) fail(`${docRel} is missing`);

const doc = fs.readFileSync(docPath, "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const requiredHeadings = [
  "## 1. Executive Summary",
  "## 2. Methodology",
  "## 3. Confirmed Tables From Migrations",
  "## 4. Admin Tool Backing Matrix",
  "## 5. Missing Table Register",
  "## 6. Missing Column Register",
  "## 7. Action Backing Matrix",
  "## 8. Security / RLS / Permission Notes",
  "## 9. Supabase Error Risk Map",
  "## 10. Recommended Migration Gates",
  "## 11. Final Recommendation",
];

for (const heading of requiredHeadings) {
  if (!doc.includes(heading)) fail(`missing heading: ${heading}`);
}
ok("all required headings are present");

const statusOptions = [
  "REAL",
  "PARTIAL",
  "UI-ONLY",
  "MISSING TABLE",
  "MISSING COLUMN",
  "MISSING ACTION",
  "NEEDS LIVE SUPABASE PROOF",
  "FUTURE ARCHITECTURE ONLY",
];

for (const status of statusOptions) {
  if (!doc.includes(status)) fail(`missing status option: ${status}`);
}
ok("all status options are present");

const futureTables = [
  "admin_system_alerts",
  "affiliate_partners",
  "travel_offers",
  "travel_inquiries",
  "affiliate_click_events",
  "concierge_requests",
  "announcements",
  "homepage_sections",
  "site_banners",
  "category_visibility",
  "theme_presets",
  "listing_visibility_checks",
  "support_view_sessions",
  "support_notes",
  "promo_code_redemptions",
  "sales_pipeline",
];

for (const table of futureTables) {
  if (!doc.includes(table)) fail(`missing missing/future table: ${table}`);
}
ok("key missing/future tables are present");

const coreTools = [
  "Admin dashboard",
  "Admin global nav/sidebar",
  "Activity log",
  "Launch Leads inbox",
  "Classifieds queue",
  "Servicios admin ops",
  "Autos admin ops",
  "Restaurantes admin ops",
  "Viajes classified ops",
  "Users list/search",
  "Team roster",
  "Site sections",
  "Magazine manager",
  "Payment tracker",
  "Bug Finder",
  "System Health",
  "Concierge requests",
];

for (const tool of coreTools) {
  if (!doc.includes(tool)) fail(`missing core admin tool: ${tool}`);
}
ok("core admin routes/tools are documented");

const requiredActions = [
  "view public",
  "edit listing",
  "open owner/user",
  "archive",
  "restore",
  "republish",
  "feature/promote",
  "verify Leonix",
  "suspend/pause",
  "mark reviewed",
  "clear flag",
  "bulk AI review",
  "send password reset",
  "owner Servicios edit hydration",
  "owner En Venta edit hydration",
];

const lowerDoc = doc.toLowerCase();
for (const action of requiredActions) {
  if (!lowerDoc.includes(action.toLowerCase())) fail(`missing action matrix item: ${action}`);
}
ok("action backing matrix includes required actions");

const migrationGates = [
  "ADMIN-SYSTEM-ALERTS-SCHEMA-01",
  "ADMIN-VIAJES-AFFILIATE-SCHEMA-01",
  "ADMIN-CONCIERGE-SCHEMA-01",
  "ADMIN-WEBSITE-CONTROL-SCHEMA-01",
  "ADMIN-PROMO-CODES-BACKING-01",
  "ADMIN-PACKAGE-ENTITLEMENTS-01",
  "ADMIN-PAYMENT-TRACKER-01",
  "ADMIN-SUPPORT-VIEW-SCHEMA-01",
  "ADMIN-LISTING-VISIBILITY-CHECKER-01",
  "CATEGORY-APPLICATION-STATE-SNAPSHOT-01",
];

for (const gate of migrationGates) {
  if (!doc.includes(gate)) fail(`missing recommended migration gate: ${gate}`);
}
ok("recommended migration gates are present");

const requiredProofTopics = [
  "Servicios owner edit hydration",
  "En Venta owner edit",
  "does not require any migration file",
  "no migrations added: TRUE",
];

for (const topic of requiredProofTopics) {
  if (!doc.includes(topic)) fail(`missing proof topic: ${topic}`);
}
ok("owner edit hydration and no-migration proof are documented");

if (
  packageJson.scripts?.["verify:leonix-admin-supabase-backing-matrix-01"] !==
  "node scripts/verify-leonix-admin-supabase-backing-matrix-01.mjs"
) {
  fail("package.json missing verify script");
}
ok("package script registered");

console.log("verify-leonix-admin-supabase-backing-matrix-01: PASS");

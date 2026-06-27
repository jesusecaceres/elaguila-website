/**
 * ADMIN-DASHBOARD-MOBILE-COMMAND-CENTER-01 verification.
 * Run: npm run verify:admin-dashboard-mobile-command-center-01
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(message) {
  console.error(`verify-admin-dashboard-mobile-command-center-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const page = "app/admin/(dashboard)/page.tsx";
const dashboard = "app/admin/_components/AdminCommandCenterDashboard.tsx";
const client = "app/admin/_components/AdminCommandCenterClient.tsx";
const routes = "app/admin/_lib/adminDashboardRoutes.ts";
const pkg = "package.json";

if (!exists(page)) fail("/admin dashboard page is missing");
if (!exists(dashboard)) fail("dashboard component is missing");
if (!exists(client)) fail("dashboard mobile command client is missing");

const pageSrc = read(page);
const dashSrc = read(dashboard);
const clientSrc = read(client);
const routesSrc = read(routes);
const pkgSrc = read(pkg);

const requiredText = [
  "Leonix Command Center",
  "Today's Attention",
  "Revenue Pulse",
  "Marketplace Ops",
  "Website Control",
  "People + Support",
  "System Health / Bug Finder",
  "Quick Actions",
  "real",
  "partial",
  "planned",
  "needs proof",
  "No fake health status",
  "admin_system_alerts",
  "chuy@leonixmedia.com",
  "No live route is linked",
];

for (const text of requiredText) {
  if (!dashSrc.includes(text)) fail(`dashboard missing required text: ${text}`);
}
ok("dashboard includes required command center sections and truth labels");

if (!pageSrc.includes("AdminCommandCenterDashboard")) {
  fail("/admin page does not render AdminCommandCenterDashboard");
}
ok("/admin renders command center dashboard");

if (!clientSrc.includes("adminResponsiveTabsScroll") || !clientSrc.includes("role=\"tablist\"")) {
  fail("mobile section tabs are missing");
}
if (!dashSrc.includes("grid gap-3 sm:grid-cols-2 lg:grid-cols-3") || !dashSrc.includes("overflow-x-hidden")) {
  fail("dashboard missing mobile-first card layout indicators");
}
ok("mobile-first carded layout indicators present");

if (/\$0|\$[0-9]/.test(dashSrc)) {
  fail("dashboard includes fake-looking revenue dollars");
}
ok("dashboard does not include fake revenue dollar copy");

const missingRoutes = [
  "/admin/system-health",
  "/admin/bug-finder",
  "/admin/system-alerts",
  "/admin/concierge",
  "/admin/homepage",
  "/admin/banners",
  "/admin/announcements",
  "/admin/themes",
  "/admin/category-visibility",
];

for (const route of missingRoutes) {
  if (dashSrc.includes(`href: "${route}"`) || dashSrc.includes(`href="${route}"`)) {
    fail(`dashboard links missing route as live: ${route}`);
  }
}
ok("missing future routes are not linked as live");

const liveRoutes = [
  "/admin/leads/inbox",
  "/admin/leads/inbox?view=promo",
  "/admin/workspace/clasificados?status=flagged#queue",
  "/admin/reportes",
  "/admin/team/roster",
  "/admin/site-sections",
  "/admin/activity-log",
  'viewSite: "/"',
];

for (const route of liveRoutes) {
  if (!dashSrc.includes(route) && !routesSrc.includes(route)) {
    fail(`expected live route reference missing: ${route}`);
  }
}
ok("quick/live action routes are backed by existing route constants");

if (!pkgSrc.includes('"verify:admin-dashboard-mobile-command-center-01"')) {
  fail("package script missing");
}
ok("package script exists");

console.log("\nverify-admin-dashboard-mobile-command-center-01: all checks passed");

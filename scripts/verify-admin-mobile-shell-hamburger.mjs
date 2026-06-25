/**
 * ADMIN-MOBILE-SHELL-HAMBURGER-01 verification.
 * Run: npm run verify:admin-mobile-shell-hamburger
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

function fail(msg) {
  console.error(`verify-admin-mobile-shell-hamburger: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const shell = read("app/admin/_components/AdminShell.tsx");
const sidebar = read("app/admin/_components/AdminSidebar.tsx");
const topbar = read("app/admin/_components/AdminTopbar.tsx");
const drawer = read("app/admin/_components/AdminMobileNavDrawer.tsx");
const globalNav = read("app/admin/_lib/adminGlobalNav.ts");
const pkg = read("package.json");

if (!/data-testid="admin-mobile-hamburger"/.test(drawer)) fail("hamburger button missing");
ok("mobile hamburger exists");

if (!/AdminMobileNavDrawer/.test(topbar)) fail("hamburger not wired in topbar");
ok("hamburger wired in topbar");

if (!/admin-mobile-nav-drawer/.test(drawer)) fail("mobile drawer missing");
if (!/createPortal/.test(drawer)) fail("drawer should portal to body to avoid overflow clipping");
ok("mobile drawer content exists (portaled)");

const hrefChecks = [
  ["Dashboard", "/admin", "nav.dashboard"],
  ["Launch Leads", "/admin/leads/inbox", "nav.launchLeads"],
  ["Categories", "/admin/workspace/clasificados", "nav.categories"],
  ["Global Search", "/admin/ops", "nav.customerOps"],
  ["Team", "/admin/team/roster", "nav.team"],
  ["Users", "/admin/usuarios", "nav.users"],
  ["Site sections", "/admin/workspace", "nav.siteSections"],
  ["Settings", "/admin/settings", "nav.settings"],
  ["Tienda", "/admin/tienda", "nav.tienda"],
];

for (const [label, href, key] of hrefChecks) {
  if (!globalNav.includes(href) || !globalNav.includes(key)) fail(`${label} route missing in ADMIN_GLOBAL_NAV`);
  if (!drawer.includes("ADMIN_GLOBAL_NAV")) fail("drawer must render ADMIN_GLOBAL_NAV");
}
ok("drawer nav routes configured");

if (!drawer.includes("nav.support") && !globalNav.includes("nav.support")) fail("Support link missing");
if (!globalNav.includes("/admin/clasificados/viajes")) fail("Viajes route missing");
if (!globalNav.includes("/admin/activity-log")) fail("Activity Log route missing");
if (!globalNav.includes("/admin/workspace/language-audit")) fail("Language audit route missing");
ok("Support, Viajes, Activity Log, Language audit in global nav");

if (!drawer.includes("admin-mobile-nav-view-site") || !drawer.includes('href="/"')) fail("View site link missing");
ok("View site link in drawer footer");

if (!drawer.includes("admin-mobile-nav-close") || !drawer.includes("admin-mobile-nav-backdrop")) {
  fail("drawer close controls missing");
}
if (!drawer.includes("onClick={close}") || !drawer.includes("Escape")) fail("drawer close behavior incomplete");
if (!drawer.includes("pathname") || !drawer.includes("close()")) fail("drawer should close on nav/route change");
ok("drawer close behavior (X, backdrop, escape, nav click)");

if (!drawer.includes("isAdminGlobalNavItemActive")) fail("active route helper missing");
if (!/active[\s\S]*#7A1E2C/.test(drawer)) fail("burgundy active styling missing");
ok("active/current route styling");

if (!/hidden w-64 shrink-0 lg:block/.test(shell)) fail("desktop sidebar wrapper missing");
if (!/AdminSidebar/.test(shell)) fail("desktop sidebar missing");
ok("desktop sidebar preserved");

if (!drawer.includes("overflow-x-hidden") || !drawer.includes("min-h-[44px]")) fail("mobile-safe layout missing");
if (!/lg:hidden/.test(drawer)) fail("drawer should be mobile-only");
ok("mobile-safe classes");

if (drawer.includes("app/(site)/")) fail("public page edits in drawer");
ok("no public page changes");

if (/CREATE TABLE|supabase\/migrations/.test(drawer)) fail("unexpected migration reference");
ok("no schema/migration changes");

if (/stripe|STRIPE_/.test(drawer) || /stripe|STRIPE_/.test(shell)) fail("stripe changes in shell");
ok("no Stripe/payment changes");

if (!pkg.includes('"verify:admin-mobile-shell-hamburger"')) fail("package script missing");
ok("package script registered");

console.log("\nverify-admin-mobile-shell-hamburger: all checks passed");

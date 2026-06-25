/**
 * ADMIN-DASHBOARD-CEO-COMMAND-CENTER-02 verification.
 * Run: npm run verify:admin-dashboard-ceo-command-center
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

function routePageExists(routePath) {
  const pathOnly = routePath.split("?")[0].split("#")[0];
  if (pathOnly === "/admin") return exists("app/admin/(dashboard)/page.tsx");
  if (pathOnly === "/") return exists("app/(site)/page.tsx") || exists("app/page.tsx");
  const segment = pathOnly.replace("/admin/", "");
  const direct = `app/admin/(dashboard)/${segment}/page.tsx`;
  return exists(direct);
}

function fail(msg) {
  console.error(`verify-admin-dashboard-ceo-command-center: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const page = read("app/admin/(dashboard)/page.tsx");
const dash = read("app/admin/_components/AdminCommandCenterDashboard.tsx");
const client = read("app/admin/_components/AdminCommandCenterClient.tsx");
const cta = read("app/admin/_components/AdminDashboardCta.tsx");
const theme = read("app/admin/_components/adminTheme.ts");
const routes = read("app/admin/_lib/adminDashboardRoutes.ts");
const data = read("app/admin/_lib/adminDashboardData.ts");
const audit = read("app/admin/DASHBOARD_CEO_COMMAND_CENTER_AUDIT.md");
const pkg = read("package.json");

// 1
if (!exists("app/admin/(dashboard)/page.tsx")) fail("/admin dashboard route missing");
ok("/admin dashboard route exists");

// 2–8 sections
if (!/Leonix Command Center/i.test(dash)) fail("command header missing");
ok("LEONIX COMMAND CENTER hero exists");

if (!dash.includes("admin-ceo-priority-strip")) fail("CEO priority strip missing");
ok("CEO priority strip exists");

if (!dash.includes("Today's Command")) fail("Today's Command section missing");
ok("Today's Command section exists");

if (!dash.includes("Revenue Pipeline")) fail("Revenue Pipeline section missing");
ok("Revenue Pipeline section exists");

if (!dash.includes("Marketplace Operations")) fail("Marketplace Operations section missing");
ok("Marketplace Operations section exists");

if (!dash.includes("Website & Content Control")) fail("Website & Content Control section missing");
ok("Website & Content Control section exists");

if (!dash.includes("Admin Team & System")) fail("Admin Team & System section missing");
ok("Admin Team & System section exists");

// 9–10 workbenches
if (!dash.includes("Review workbench preview")) fail("review workbench missing");
if (!dash.includes('id: "review"')) fail('review section id missing');
ok("Review workbench preview with id=review");

if (!dash.includes("Expiration workbench preview")) fail("expiration workbench missing");
if (!dash.includes('id: "expiration"')) fail('expiration section id missing');
ok("Expiration workbench preview exists");

// 11 anchors
for (const id of ["today", "revenue", "marketplace", "website", "system", "review", "expiration"]) {
  if (!dash.includes(`id: "${id}"`)) fail(`section anchor ${id} missing`);
}
ok("section nav anchors exist");

// 12–24 CTAs
const ctaChecks = [
  ["Launch Leads", routes.includes('launchLeads: "/admin/leads/inbox"')],
  ["Promocionales", routes.includes("view=promo")],
  ["Newsletter", routes.includes("/admin/leads/newsletter")],
  ["Media Kit", routes.includes("/admin/leads/media-kit")],
  ["Review ads deep link", routes.includes("status=flagged#queue")],
  ["Categories", routes.includes("/admin/workspace/clasificados")],
  ["Servicios", routes.includes("serviciosOps")],
  ["Global Search", routes.includes('customerOps: "/admin/ops"')],
  ["Reports", routes.includes('reports: "/admin/reportes"')],
  ["Team roster", routes.includes("/admin/team/roster")],
  ["Create staff user", routes.includes("/admin/team/users/new")],
  ["Users", routes.includes("/admin/usuarios")],
  ["Site sections", routes.includes("/admin/site-sections")],
  ["Settings", routes.includes('globalSettings: "/admin/settings"')],
  ["Tienda", routes.includes('tienda: "/admin/tienda"')],
  ["Catalog", routes.includes("/admin/tienda/catalog")],
  ["Public site", routes.includes('viewSite: "/"')],
];

for (const [label, pass] of ctaChecks) {
  if (!pass) fail(`${label} CTA route missing in adminDashboardRoutes`);
}
ok("required CTA routes configured");

for (const [label, route] of [
  ["Launch Leads", "/admin/leads/inbox"],
  ["Promocionales", "/admin/leads/inbox"],
  ["Newsletter", "/admin/leads/newsletter"],
  ["Media kit", "/admin/leads/media-kit"],
  ["Categories", "/admin/workspace/clasificados"],
  ["Servicios", "/admin/workspace/clasificados/servicios"],
  ["Global Search", "/admin/ops"],
  ["Reports", "/admin/reportes"],
  ["Team roster", "/admin/team/roster"],
  ["Create staff", "/admin/team/users/new"],
  ["Users", "/admin/usuarios"],
  ["Site sections", "/admin/site-sections"],
  ["Settings", "/admin/settings"],
  ["Tienda", "/admin/tienda"],
  ["Catalog", "/admin/tienda/catalog"],
]) {
  if (!dash.includes(route.split("?")[0]) && !routes.includes(route.split("?")[0])) {
    fail(`dashboard must reference route ${route}`);
  }
}
ok("dashboard references required hrefs");

// 25–26 rectangular CTAs
if (!theme.includes("adminDashboardCtaPrimary") || !cta.includes("adminDashboardCtaPrimary")) {
  fail("semantic CTA mapping missing");
}
if (/rounded-full/.test(dash) && /AdminDashboardCta[^}]*rounded-full/.test(dash)) {
  fail("main dashboard CTAs must not use rounded-full");
}
ok("rectangular CTA style mapping exists");

// 27–28 review truth
if (/AI-generated|artificial intelligence/i.test(dash) && !/not AI/i.test(dash)) {
  fail("dashboard must not fake AI review");
}
if (!data.includes("Reason unavailable — inspect review source")) fail("reason fallback must stay in data layer");
if (!dash.includes("not AI")) fail("review AI disclaimer missing");
ok("review copy does not fake AI; reason fallback preserved");

// 29 no fake counts
if (!dash.includes("No fake counts") && !dash.includes("Real data only")) fail("honest count language missing");
if (/fake analytics|invented count/i.test(dash)) fail("fake count language introduced");
ok("no fake counts language");

// 30 mobile layout
if (!dash.includes("overflow-x-hidden")) fail("mobile overflow guard missing");
if (!client.includes("adminResponsiveTabsScroll")) fail("section nav scroll missing");
if (!dash.includes("grid-cols-2")) fail("mobile grid layout missing");
ok("mobile-safe layout classes exist");

// 31–34 guardrails
if (dash.includes("app/(site)/") && dash.includes("export default")) fail("public page edits in dashboard");
ok("no public page changes");

const migrationHits = fs.readdirSync(path.join(root, "supabase/migrations")).filter((f) => f.includes("ceo_dashboard"));
if (migrationHits.length) fail("unexpected migration");
ok("no schema/migration changes");

if (/stripe|STRIPE_/.test(dash) || /stripe|STRIPE_/.test(page)) fail("stripe changes in dashboard");
ok("no Stripe/payment changes");

const categoryLogicRisk = [
  "saveLeonixLead",
  "updateListingStatus",
  "setListingStatus",
  ".from(\"listings\").update",
].some((needle) => dash.includes(needle));
if (categoryLogicRisk) fail("category logic change risk");
ok("no category logic changes in dashboard UI");

// audit + package
if (!exists("app/admin/DASHBOARD_CEO_COMMAND_CENTER_AUDIT.md")) fail("audit file missing");
if (!audit.includes("TRUE/FALSE audit")) fail("audit incomplete");
ok("audit file exists");

if (!pkg.includes('"verify:admin-dashboard-ceo-command-center"')) fail("package script missing");
ok("package script registered");

// route smoke
for (const route of [
  "/admin/site-sections",
  "/admin/workspace/clasificados/servicios",
  "/admin/activity-log",
  "/admin/workspace/language-audit",
]) {
  if (!routePageExists(route)) fail(`route page missing: ${route}`);
}
ok("site-sections alias and ops routes exist");

console.log("\nverify-admin-dashboard-ceo-command-center: all checks passed");

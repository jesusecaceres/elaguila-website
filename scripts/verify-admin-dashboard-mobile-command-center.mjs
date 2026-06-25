/**
 * ADMIN-DASHBOARD-MOBILE-01 verification.
 * Run: npm run verify:admin-dashboard-mobile-command-center
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
  const pathOnly = routePath.split("?")[0];
  if (pathOnly === "/admin") return exists("app/admin/(dashboard)/page.tsx");
  if (pathOnly === "/") return exists("app/(site)/page.tsx") || exists("app/page.tsx");
  const segment = pathOnly.replace("/admin/", "");
  const direct = `app/admin/(dashboard)/${segment}/page.tsx`;
  return exists(direct);
}

const checks = [];

function assert(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

const page = "app/admin/(dashboard)/page.tsx";
const dashboard = "app/admin/_components/AdminCommandCenterDashboard.tsx";
const client = "app/admin/_components/AdminCommandCenterClient.tsx";
const cta = "app/admin/_components/AdminDashboardCta.tsx";
const theme = "app/admin/_components/adminTheme.ts";
const routes = "app/admin/_lib/adminDashboardRoutes.ts";
const data = "app/admin/_lib/adminDashboardData.ts";
const audit = "app/admin/DASHBOARD_MOBILE_COMMAND_CENTER_AUDIT.md";
const pkg = "package.json";

assert("dashboard route page", exists(page), page);
assert("command center dashboard component", exists(dashboard), dashboard);
assert("mobile client nav", exists(client), client);
assert("audit file", exists(audit), audit);

const dashSrc = read(dashboard);
const clientSrc = read(client);
const ctaSrc = read(cta);
const themeSrc = read(theme);
const routesSrc = read(routes);
const dataSrc = read(data);
const pkgSrc = read(pkg);
const pageSrc = read(page);

assert("uses command center dashboard", pageSrc.includes("AdminCommandCenterDashboard"), page);
assert("Today's Command or legacy Attention section", /Today['']s Command/.test(dashSrc) || /Today['']s Attention/.test(dashSrc), dashboard);
assert("Revenue Pipeline or legacy Money Pipeline", /Revenue Pipeline/.test(dashSrc) || /Money Pipeline/.test(dashSrc), dashboard);
assert("Marketplace or legacy Operations section", /Marketplace Operations/.test(dashSrc) || /Operations/.test(dashSrc), dashboard);
assert("Command center hero or legacy subtitle", /Leonix Command Center/i.test(dashSrc) || dashSrc.includes("live Supabase counts"), dashboard);
assert("Launch Leads CTA", routesSrc.includes('launchLeads: "/admin/leads/inbox"'), routes);
assert("Promocionales CTA", routesSrc.includes("view=promo"), routes);
assert("Classifieds Queue CTA", routesSrc.includes("/admin/workspace/clasificados"), routes);
assert("Team CTA", routesSrc.includes("/admin/team"), routes);
assert("Create Staff User CTA", routesSrc.includes("/admin/team/users/new"), routes);
assert("Tienda/Catalog CTA", routesSrc.includes("/admin/tienda/catalog"), routes);
assert("View site CTA", routesSrc.includes('viewSite: "/"'), routes);
assert("mobile section nav carousel", clientSrc.includes("adminResponsiveTabsScroll") && clientSrc.includes("role=\"tablist\""), client);
assert("mobile stacked cards", dashSrc.includes("AdminDashboardCtaGrid") && dashSrc.includes("sm:grid-cols-2"), dashboard);
assert("no fixed narrow desktop-only width", !dashSrc.includes("max-w-md mx-auto") && dashSrc.includes("max-w-7xl"), dashboard);
assert("semantic CTA mapping burgundy", themeSrc.includes("adminDashboardCtaPrimary") && themeSrc.includes("#7A1E2C"), theme);
assert("semantic CTA mapping army green", themeSrc.includes("adminDashboardCtaActive") && themeSrc.includes("#2A4536"), theme);
assert("semantic CTA mapping royal blue", themeSrc.includes("adminDashboardCtaView") && themeSrc.includes("#1E4A7A"), theme);
assert("semantic CTA mapping orange", themeSrc.includes("adminDashboardCtaWarning"), theme);
assert("review reason fallback", dataSrc.includes("Reason unavailable — inspect review source"), data);
assert("expiring soon 3 day window", dataSrc.includes("ADMIN_DASHBOARD_EXPIRING_SOON_DAYS = 3"), data);
assert("expired separate section", dashSrc.includes("Expired") && dashSrc.includes("Expiring soon"), dashboard);
assert("real lead counts", dataSrc.includes("getAdminDashboardLeadsCounts"), data);
assert("no fake counts comment preserved", dashSrc.includes("live Supabase counts"), dashboard);
assert("verify script in package.json", pkgSrc.includes("verify:admin-dashboard-mobile-command-center"), pkg);
assert("no public page edits in dashboard stack", !dashSrc.includes("app/(site)/"), dashboard);

const forbidden = ["supabase/migrations/", "stripe", "STRIPE_"];
for (const f of forbidden) {
  assert(`no forbidden change marker: ${f}`, !pageSrc.includes(f) && !dashSrc.includes(f), f);
}

const CTA_SMOKE = [
  ["Launch Leads", "/admin/leads/inbox"],
  ["Promocionales", "/admin/leads/inbox?view=promo"],
  ["Newsletter", "/admin/leads/newsletter"],
  ["Media Kit", "/admin/leads/media-kit"],
  ["Classifieds Queue", "/admin/workspace/clasificados"],
  ["Team", "/admin/team"],
  ["Create Staff User", "/admin/team/users/new"],
  ["Website Sections", "/admin/site-sections"],
  ["Global Settings", "/admin/settings"],
  ["Tienda", "/admin/tienda"],
  ["Catalog", "/admin/tienda/catalog"],
];

for (const [label, route] of CTA_SMOKE) {
  assert(`route exists: ${label}`, routePageExists(route), route);
  assert(`href in dashboard: ${label}`, dashSrc.includes(route) || routesSrc.includes(route), route);
}

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-dashboard-mobile-command-center FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-dashboard-mobile-command-center PASS (${checks.length} checks)`);

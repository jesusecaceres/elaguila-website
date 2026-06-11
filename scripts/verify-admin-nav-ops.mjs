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

function adminPageExists(routePath) {
  const clean = routePath.split("?")[0].replace(/\/$/, "") || "/admin";
  const candidates = [
    `app/admin/(dashboard)${clean.replace(/^\/admin/, "")}/page.tsx`,
    `app/admin${clean.replace(/^\/admin/, "")}/page.tsx`,
  ];
  return candidates.some((c) => exists(c));
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const globalNavSrc = read("app/admin/_lib/adminGlobalNav.ts");
const workspaceNavSrc = read("app/admin/_components/AdminWorkspaceNav.tsx");
const navOpsSrc = read("app/admin/_lib/adminNavOps.ts");
const tiendaPage = read("app/admin/(dashboard)/tienda/page.tsx");
const workspaceTienda = read("app/admin/(dashboard)/workspace/tienda/page.tsx");
const tiendaSubnav = read("app/admin/_components/AdminTiendaWorkspaceSubnav.tsx");
const inboxPage = read("app/admin/(dashboard)/leads/inbox/page.tsx");
const inboxClient = read("app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx");
const adminStrings = read("app/admin/_lib/adminStrings.ts");
const accessControl = read("app/admin/_lib/adminAccessControl.ts");
const pkg = read("package.json");

const PROMO_HREF = "/admin/leads/inbox?view=promo";
const LEADS_HREF = "/admin/leads/inbox";
const TIENDA_HREF = "/admin/tienda";

// 1–2. Sidebar priority
const leadsIdx = globalNavSrc.indexOf('href: "/admin/leads/inbox"');
const tiendaIdx = globalNavSrc.indexOf('href: "/admin/tienda"');
assert("launch leads index found", leadsIdx >= 0, globalNavSrc);
assert("tienda index found", tiendaIdx >= 0, globalNavSrc);
assert("launch leads above tienda", leadsIdx < tiendaIdx, { leadsIdx, tiendaIdx });
assert("tienda near bottom (after settings)", globalNavSrc.indexOf('href: "/admin/settings"') < tiendaIdx, globalNavSrc);

// 3. Sidebar hrefs preserved
for (const href of [
  "/admin",
  "/admin/leads/inbox",
  "/admin/workspace/clasificados",
  "/admin/tienda",
  "/admin/workspace",
  "/admin/usuarios",
  "/admin/ops",
  "/admin/support",
  "/admin/team/roster",
  "/admin/activity-log",
  "/admin/settings",
  "/admin/workspace/language-audit",
  "/admin/payments",
]) {
  assert(`sidebar href preserved ${href}`, globalNavSrc.includes(`href: "${href}"`), href);
}

// 4–5. Promotions tab
assert("promotions label key", adminStrings.includes("workspaceNav.link.promotions"), adminStrings);
assert("promotions tab in workspace nav", workspaceNavSrc.includes("workspaceNav.link.promotions"), workspaceNavSrc);
assert("promotions href constant", workspaceNavSrc.includes("ADMIN_LEADS_PROMO_INBOX_HREF"), workspaceNavSrc);
assert("promotions route defined", navOpsSrc.includes(PROMO_HREF), navOpsSrc);
assert("promotions tab test id", workspaceNavSrc.includes("admin-workspace-promotions-tab"), workspaceNavSrc);
assert("promotions inbox page exists", adminPageExists(LEADS_HREF), LEADS_HREF);

// 6–8. Tienda command center
assert("tienda hub page exists", exists("app/admin/(dashboard)/tienda/page.tsx"), tiendaPage);
assert("tienda promo lead pathway", tiendaPage.includes(PROMO_HREF) || tiendaPage.includes("ADMIN_LEADS_PROMO_INBOX_HREF"), tiendaPage);
assert("tienda honest quote copy", /Launch Leads|no separate quote/i.test(tiendaPage), tiendaPage);
assert("tienda orders not first card", tiendaPage.indexOf("Promo / print quote") < tiendaPage.indexOf("Orders (inbox)"), tiendaPage);
assert("workspace tienda promo pathway", workspaceTienda.includes("ADMIN_LEADS_PROMO_INBOX_HREF"), workspaceTienda);
assert("tienda subnav promo link", tiendaSubnav.includes("ADMIN_LEADS_PROMO_INBOX_HREF"), tiendaSubnav);

// 9. No fake quote system
assert("tienda no fake quote module", /no separate quote|Launch Leads/i.test(tiendaPage), tiendaPage);

// 10–11. Top tabs hrefs
const tabHrefs = [
  "/admin/workspace/home",
  "/admin/workspace/clasificados",
  "/admin/workspace/package-entitlements",
  "/admin/workspace/promo-codes",
  PROMO_HREF,
  "/admin/workspace/sales-tracker",
  "/admin/workspace/payment-tracker",
  "/admin/workspace/tienda",
  "/admin/workspace/nosotros",
  "/admin/workspace/revista",
  "/admin/workspace/contacto",
  "/admin/workspace/noticias",
  "/admin/workspace/iglesias",
  "/admin/workspace/cupones",
  "/admin/workspace/anunciate",
];
for (const href of tabHrefs) {
  assert(`workspace tab href present ${href.split("?")[0]}`, workspaceNavSrc.includes(href.split("?")[0]), href);
  if (!href.includes("?")) {
    assert(`workspace route exists ${href}`, adminPageExists(href), href);
  }
}

// 12–13. Leads preservation
assert("lead data warning preserved", inboxPage.includes("adminWarningCallout") && inboxPage.includes("Data unavailable"), inboxPage);
assert("launch leads route preserved", globalNavSrc.includes(LEADS_HREF), globalNavSrc);
assert("inbox view param parser", inboxPage.includes("parseAdminLeadsInboxViewParam"), inboxPage);
assert("inbox initial ops view prop", inboxClient.includes("initialOpsView"), inboxClient);
assert("promo ops view filter", inboxClient.includes('"promo"'), inboxClient);

// Newsletter + media kit routes
assert("newsletter route in access", accessControl.includes("/admin/leads/newsletter"), accessControl);
assert("media kit route in access", accessControl.includes("/admin/leads/media-kit"), accessControl);

// 14–16. Guardrails
assert("no public page nav edits", !exists("app/(site)/layout.tsx") || !read("app/(site)/layout.tsx").includes("ADMIN_GLOBAL_NAV"), "public");
const migrationTouch = exists("supabase/migrations")
  ? fs.readdirSync(path.join(root, "supabase/migrations")).some((f) => f.includes("admin_nav_ops"))
  : false;
assert("no new migrations", !migrationTouch, "schema");
assert("no stripe activation", !/activate.*checkout|enable.*stripe/i.test(tiendaPage + workspaceNavSrc), "stripe");

// Access control includes promotions tab for filtered nav
assert("promotions in allowed workspace hrefs", accessControl.includes("ADMIN_LEADS_PROMO_INBOX_HREF"), accessControl);

// Package script
assert("verify script registered", /verify:admin-nav-ops/.test(pkg), pkg);

// Tienda CRUD routes still linked
for (const href of ["/admin/tienda/catalog", "/admin/tienda/catalog/new", "/admin/tienda/orders"]) {
  assert(`tienda CTA route ${href}`, tiendaPage.includes(href), href);
}

const failed = checks.filter((c) => !c.ok);

if (failed.length > 0) {
  console.error("verify:admin-nav-ops FAILED\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? `: ${String(typeof f.detail === "object" ? JSON.stringify(f.detail) : f.detail).slice(0, 160)}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-nav-ops PASS (${checks.length} checks)`);

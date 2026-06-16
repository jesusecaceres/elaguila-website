/**
 * ADMIN-CATEGORIES-COMMAND-CENTER-01 verification.
 * Run: npm run verify:admin-categories-command-center
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

const checks = [];

function assert(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

const page = "app/admin/(dashboard)/workspace/clasificados/page.tsx";
const commandCenter = "app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryCommandCenter.tsx";
const panelShared = "app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryPanelShared.tsx";
const auditLazy = "app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryOpsAuditLazy.tsx";
const auditApi = "app/api/admin/clasificados/category-ops-audit/route.ts";
const queueHrefLib = "app/admin/_lib/adminCategoryWorkspaceQueueHref.ts";
const utilities = "app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryUtilitiesCollapsible.tsx";
const auditDoc = "app/admin/(dashboard)/workspace/clasificados/CATEGORIES_COMMAND_CENTER_AUDIT.md";
const pkg = "package.json";

const pageSrc = read(page);
const ccSrc = read(commandCenter);
const panelSrc = read(panelShared);
const lazySrc = read(auditLazy);
const apiSrc = read(auditApi);
const queueSrc = read(queueHrefLib);
const utilSrc = read(utilities);
const pkgSrc = read(pkg);

const categoryConfig = "app/(site)/clasificados/config/categoryConfig.ts";
const hubEntries = "app/admin/_lib/adminCategoriesHubEntries.ts";
const configSrc = read(categoryConfig);
const hubSrc = read(hubEntries);

const requiredSlugs = [
  "en-venta",
  "rentas",
  "bienes-raices",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
  "restaurantes",
  "servicios",
  "empleos",
  "autos",
  "travel",
  "comida-local",
];

assert("clasificados workspace route", exists(page), page);
assert("category command center", exists(commandCenter) && ccSrc.includes("clasificados-category-command-center"), commandCenter);
assert("category drawer/selector", ccSrc.includes("clasificados-category-drawer") && ccSrc.includes("clasificados-category-mobile-rail"), commandCenter);
assert("selected category panel", panelSrc.includes("clasificados-category-selected-panel"), panelShared);
assert("registry drives selector", ccSrc.includes("registry.map") && panelSrc.includes("clasificados-category-selector-"), commandCenter);

for (const slug of requiredSlugs) {
  if (slug === "comida-local") {
    assert(`category in hub: ${slug}`, hubSrc.includes("comida-local"), hubEntries);
  } else {
    assert(`category in registry config: ${slug}`, configSrc.includes(`"${slug}"`), categoryConfig);
  }
  assert(
    `queue route for ${slug}`,
    queueSrc.includes(`case "${slug}"`) || queueSrc.includes(`category=${slug}`) || queueSrc.includes(`/${slug}`),
    queueHrefLib,
  );
}

assert("queue links preserved", panelSrc.includes("adminCategoryWorkspaceQueueHref") && queueSrc.includes("adminCategoryWorkspaceQueueHref"), panelShared);
assert("live listing links preserved", panelSrc.includes("adminCategoryWorkspaceLiveListingsHref"), panelShared);
assert("operational audit lazy collapsible", lazySrc.includes("clasificados-ops-audit-collapsible") && lazySrc.includes("<details"), auditLazy);
assert("operational audit api", apiSrc.includes("fetchClasificadosCategoryOpsAuditRows"), auditApi);
assert("search all listings preserved", pageSrc.includes("clasificados-global-search") && pageSrc.includes("clasificados.globalSearchTitle"), page);
assert("advanced registry link", panelSrc.includes("ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF"), panelShared);
assert("home content utility", utilSrc.includes("clasificados-home-content-utility") && utilSrc.includes("/admin/workspace/home/content"), utilities);
assert("moderation reference preserved", pageSrc.includes("clasificados-moderation-reference") && pageSrc.includes("EnVentaModerationFields"), page);
assert(
  "leonix semantic cta mapping",
  panelSrc.includes("adminDashboardCtaPrimary") &&
    panelSrc.includes("adminDashboardCtaView") &&
    panelSrc.includes("adminDashboardCtaActive") &&
    panelSrc.includes("adminDashboardCtaPremium"),
  panelShared,
);
assert("mobile safe layout", ccSrc.includes("overflow-x-auto") && ccSrc.includes("min-w-0"), commandCenter);
assert("lazy audit not blocking first paint", !pageSrc.includes("ClasificadosCategoryOpsAudit registry") && pageSrc.includes("ClasificadosCategoryOpsAuditLazy"), page);
assert("audit doc exists", exists(auditDoc), auditDoc);
assert("no public page changes", !pageSrc.includes("app/(site)/clasificados/page"), page);
assert("no schema migrations in page", !pageSrc.includes("CREATE TABLE") && !pageSrc.includes("supabase/migrations"), page);
assert("no stripe changes", !ccSrc.includes("stripe") && !panelSrc.includes("stripe"), commandCenter);
assert("verify script registered", pkgSrc.includes("verify:admin-categories-command-center"), pkg);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-categories-command-center FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-categories-command-center PASS (${checks.length} checks)`);

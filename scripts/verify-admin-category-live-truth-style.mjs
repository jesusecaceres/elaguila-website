/**
 * ADMIN-CATEGORIES-LIVE-TRUTH-STYLE-02 verification.
 * Run: npm run verify:admin-category-live-truth-style
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

const hubPage = "app/admin/(dashboard)/workspace/clasificados/page.tsx";
const commandCenter = "app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryCommandCenter.tsx";
const panelShared = "app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryPanelShared.tsx";
const statusTruth = "app/admin/_lib/adminCategoryStatusTruth.ts";
const registry = "app/lib/clasificados/clasificadosCategoryRegistry.ts";
const workspaceNav = "app/admin/_components/AdminWorkspaceNav.tsx";
const livePanel = "app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosLiveScopePanel.tsx";
const queuePage = "app/admin/(dashboard)/workspace/clasificados/_components/ListingsCategoryOpsQueuePage.tsx";
const queueHeader = "app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader.tsx";
const auditLazy = "app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryOpsAuditLazy.tsx";
const auditDoc = "app/admin/(dashboard)/workspace/clasificados/CATEGORY_LIVE_TRUTH_STYLE_AUDIT.md";
const adminStrings = "app/admin/_lib/adminStrings.ts";
const pkg = "package.json";

const pageSrc = read(hubPage);
const ccSrc = read(commandCenter);
const panelSrc = read(panelShared);
const truthSrc = read(statusTruth);
const registrySrc = read(registry);
const navSrc = read(workspaceNav);
const liveSrc = read(livePanel);
const queueSrc = read(queuePage);
const headerSrc = read(queueHeader);
const lazySrc = read(auditLazy);
const stringsSrc = read(adminStrings);
const pkgSrc = read(pkg);

const REQUIRED_SLUGS = [
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
];

assert("command center route exists", exists(hubPage), hubPage);
assert("category drawer exists", ccSrc.includes('data-testid="clasificados-category-drawer"'), commandCenter);
assert("selected panel exists", panelSrc.includes('data-testid="clasificados-category-selected-panel"'), panelShared);

for (const slug of REQUIRED_SLUGS) {
  assert(`registry default covers ${slug}`, registrySrc.includes(`"${slug}"`) || registrySrc.includes(`slug === "${slug}"`), registry);
}
assert("selector uses slug test ids", panelSrc.includes("clasificados-category-selector-${entry.slug}"), panelShared);

assert("status helper near drawer", ccSrc.includes("hub.statusHelper") && ccSrc.includes("clasificados-category-status-helper"), commandCenter);
assert("status reason block", panelSrc.includes("clasificados-category-status-reason") && panelSrc.includes("hub.statusWhyTitle"), panelShared);
assert("status truth module", exists(statusTruth) && truthSrc.includes("ADMIN_CATEGORY_LIVE_STATUS_PROOF"), statusTruth);
assert(
  "live requires proof map",
  truthSrc.includes("servicios:") &&
    truthSrc.includes("en-venta") &&
    truthSrc.includes("adminCategoryOperationalStatusFromProof"),
  statusTruth,
);
assert(
  "staged/coming soon blocker strings",
  stringsSrc.includes("hub.blocker.stagedViajesTable") && stringsSrc.includes("hub.blocker.comingSoonScaffold"),
  adminStrings,
);
assert(
  "servicios promoted to live in registry defaults",
  registrySrc.includes('slug === "servicios"') && /servicios[\s\S]{0,120}return "live"/.test(registrySrc),
  registry,
);
assert(
  "listings categories no longer default coming soon",
  !/"comunidad"[\s\S]{0,80}coming_soon/.test(registrySrc) || registrySrc.includes('return "staged"'),
  registry,
);

assert("workspace nav grouped content", navSrc.includes("ADMIN_WORKSPACE_CONTENT_NAV") && navSrc.includes("workspaceNav.groupContent"), workspaceNav);
assert("workspace nav grouped monetization", navSrc.includes("ADMIN_WORKSPACE_MONETIZATION_NAV") && navSrc.includes("workspaceNav.groupMonetization"), workspaceNav);
assert("workspace nav rectangular", navSrc.includes("rounded-lg border") && !navSrc.includes("rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:min-h"), workspaceNav);
for (const href of [
  "/admin/workspace/home",
  "/admin/workspace/clasificados",
  "/admin/workspace/package-entitlements",
  "/admin/workspace/promo-codes",
  "/admin/leads/inbox",
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
]) {
  assert(`workspace link preserved ${href.split("?")[0]}`, navSrc.includes(href.split("?")[0]), workspaceNav);
}

assert("selected panel route info", panelSrc.includes("hub.routesTitle") && panelSrc.includes("proof.queueRoute"), panelShared);
assert("selected panel cta grid", panelSrc.includes("clasificados-category-cta-grid") && panelSrc.includes("adminDashboardCtaPrimary"), panelShared);
assert("live scope panel", liveSrc.includes("clasificados-live-scope-state") && liveSrc.includes("liveEmptyBody"), livePanel);
assert("live scope wired in queue page", queueSrc.includes("ClasificadosLiveScopePanel") && queueSrc.includes('scope === "live"'), queuePage);
assert("queue header leonix", headerSrc.includes("clasificados-queue-header") && headerSrc.includes("scopeLabel"), queueHeader);
assert("empty live state truthful", stringsSrc.includes("listingsCategoryOps.liveEmptyBody"), adminStrings);
assert("advanced registry preserved", panelSrc.includes("ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF"), panelShared);
assert("operational audit lazy preserved", lazySrc.includes("details") || lazySrc.includes("ClasificadosCategoryOpsAudit"), auditLazy);
assert("search all listings preserved", pageSrc.includes("clasificados-global-search"), hubPage);
assert("mobile safe", ccSrc.includes("overflow-x-hidden") && ccSrc.includes("min-w-0"), commandCenter);
assert("no public page edits", !exists("app/(site)/clasificados/page.tsx") || !read("app/(site)/clasificados/page.tsx").includes("adminCategoryStatusTruth"), hubPage);
assert("audit doc exists", exists(auditDoc), auditDoc);
assert("verify script registered", pkgSrc.includes("verify:admin-category-live-truth-style"), pkg);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-category-live-truth-style FAILED\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? `: ${String(f.detail).slice(0, 160)}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-category-live-truth-style PASS (${checks.length} checks)`);

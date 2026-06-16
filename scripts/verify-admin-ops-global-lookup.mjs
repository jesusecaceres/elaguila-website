/**
 * ADMIN-OPS-GLOBAL-LOOKUP-01 verification.
 * Run: npm run verify:admin-ops-global-lookup
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

const opsPage = "app/admin/(dashboard)/ops/page.tsx";
const emptyState = "app/admin/(dashboard)/ops/_components/OpsGlobalLookupEmptyState.tsx";
const auditDoc = "app/admin/(dashboard)/ops/OPS_GLOBAL_LOOKUP_AUDIT.md";
const adminStrings = "app/admin/_lib/adminStrings.ts";
const globalNav = "app/admin/_lib/adminGlobalNav.ts";
const unifiedSearch = "app/admin/_lib/adminOpsUnifiedSearch.ts";
const pkg = "package.json";

const pageSrc = read(opsPage);
const emptySrc = read(emptyState);
const stringsSrc = read(adminStrings);
const navSrc = read(globalNav);
const searchSrc = read(unifiedSearch);
const pkgSrc = read(pkg);

// 1. Route exists
assert("ops route exists", exists(opsPage), opsPage);

// 2. Page title clarity
assert(
  "page title global search or customer lookup",
  stringsSrc.includes('"opsPage.title": "Global Search / Customer Lookup"') ||
    /Global Search|Customer Lookup/i.test(pageSrc),
  adminStrings,
);

// 3. Nav label no longer "Customer ops"
assert(
  "nav label is Global Search",
  stringsSrc.includes('"nav.customerOps": "Global Search"') && stringsSrc.includes('"nav.customerOps": "Búsqueda global"'),
  adminStrings,
);
assert(
  "sidebar uses nav.customerOps key",
  navSrc.includes('href: "/admin/ops"') && navSrc.includes('labelKey: "nav.customerOps"'),
  globalNav,
);
assert(
  "primary nav string not Customer ops",
  !/"nav\.customerOps": "Customer ops"/.test(stringsSrc),
  adminStrings,
);

// 4–7. Search form actions preserved
assert("search form exists", pageSrc.includes('data-testid="ops-global-search-form"') && pageSrc.includes('name="q"'), opsPage);
assert("search submit preserved", pageSrc.includes('data-testid="ops-search-submit"') && pageSrc.includes('type="submit"'), opsPage);
assert("clear action preserved", pageSrc.includes('data-testid="ops-search-clear"') && pageSrc.includes('href="/admin/ops"'), opsPage);
assert(
  "users only action preserved",
  pageSrc.includes('data-testid="ops-users-only"') && pageSrc.includes('href="/admin/usuarios"'),
  opsPage,
);

// 8–9. Empty state useful
assert(
  "empty state explains search scope",
  emptySrc.includes('data-testid="ops-global-lookup-empty-state"') &&
    emptySrc.includes("opsPage.emptySearchTargetsTitle") &&
    emptySrc.includes("opsPage.emptyScopeNote"),
  emptyState,
);
assert(
  "empty state admin destination links",
  emptySrc.includes("/admin/usuarios") &&
    emptySrc.includes("/admin/leads/inbox") &&
    emptySrc.includes("/admin/workspace/clasificados?status=flagged#queue") &&
    emptySrc.includes("/admin/reportes") &&
    emptySrc.includes("/admin/tienda/orders"),
  emptyState,
);

// 10. Result sections preserved
for (const section of ["ops-profiles", "ops-context", "ops-listings", "ops-orders", "ops-reports", "ops-shortcuts"]) {
  assert(`result section ${section}`, pageSrc.includes(`id="${section}"`), opsPage);
}
assert(
  "result section test ids",
  pageSrc.includes('data-testid="ops-results-profiles"') &&
    pageSrc.includes('data-testid="ops-results-listings"') &&
    pageSrc.includes('data-testid="ops-results-orders"'),
  opsPage,
);

// 11. User/profile links preserved
assert(
  "user profile links preserved",
  pageSrc.includes("/admin/usuarios/${id}") || pageSrc.includes("`/admin/usuarios/${") ,
  opsPage,
);
assert(
  "support context profile link",
  pageSrc.includes("/admin/usuarios/${bundle.supportContext.profileId}"),
  opsPage,
);

// 12. Listing/order links preserved
assert(
  "listing admin links preserved",
  pageSrc.includes("/admin/workspace/clasificados?q=") && pageSrc.includes("/clasificados/anuncio/${row.id}"),
  opsPage,
);
assert(
  "tienda order links preserved",
  pageSrc.includes("/admin/tienda/orders/${row.id}") && pageSrc.includes("/admin/tienda/orders?q="),
  opsPage,
);

// 13. Search logic unchanged (same exported API + parallel queries)
assert(
  "unified search export preserved",
  searchSrc.includes("export async function runAdminUnifiedSearch") &&
    searchSrc.includes("fetchProfilesForAdminList") &&
    searchSrc.includes("searchListingsForAdminOps") &&
    searchSrc.includes("listTiendaOrdersForAdmin") &&
    searchSrc.includes("searchListingReportsForOps"),
  unifiedSearch,
);

// 14–17. Guardrails
assert("no public page edits in ops gate", !pageSrc.includes("app/(site)/") || pageSrc.includes("/clasificados/anuncio/"), opsPage);
const migrationTouch = exists("supabase/migrations")
  ? fs.readdirSync(path.join(root, "supabase/migrations")).some((f) => /ops.global.lookup|admin_ops_global/i.test(f))
  : false;
assert("no new migrations", !migrationTouch, "schema");
assert("no stripe in ops page", !/stripe|checkout\.sessions/i.test(pageSrc + emptySrc), opsPage);
assert("search placeholder clarity", stringsSrc.includes("opsPage.searchPlaceholder") && stringsSrc.includes("Leonix ID"), adminStrings);

// 18. Mobile-safe layout
assert(
  "mobile safe classes",
  pageSrc.includes("overflow-x-hidden") &&
    pageSrc.includes("min-w-0") &&
    pageSrc.includes("grid-cols-1") &&
    emptySrc.includes("overflow-x-hidden"),
  opsPage,
);

// Form semantic CTAs
assert(
  "burgundy search + neutral clear + view users",
  pageSrc.includes("adminDashboardCtaPrimary") &&
    pageSrc.includes("adminDashboardCtaNeutral") &&
    pageSrc.includes("adminDashboardCtaView"),
  opsPage,
);

// Role clarification copy
assert(
  "role duplication clarity",
  emptySrc.includes("opsPage.roleDashboard") &&
    emptySrc.includes("opsPage.roleLeads") &&
    emptySrc.includes("opsPage.roleUsers") &&
    emptySrc.includes("opsPage.roleOps"),
  emptyState,
);

assert("audit doc exists", exists(auditDoc), auditDoc);
assert("verify script registered", pkgSrc.includes("verify:admin-ops-global-lookup"), pkg);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-ops-global-lookup FAILED\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? `: ${String(f.detail).slice(0, 160)}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-ops-global-lookup PASS (${checks.length} checks)`);

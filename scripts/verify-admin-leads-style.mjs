/**
 * ADMIN-LEADS-STYLE-01 verification.
 * Run: npm run verify:admin-leads-style
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

const inboxClient = "app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx";
const subnav = "app/admin/_components/leads/AdminLeadsSubnav.tsx";
const rowActions = "app/admin/_components/leads/AdminLaunchLeadRowActions.tsx";
const mobileCard = "app/admin/_components/leads/AdminLaunchLeadMobileCard.tsx";
const audit = "app/admin/_components/leads/ADMIN_LEADS_STYLE_AUDIT.md";
const pkg = "package.json";

const inboxSrc = read(inboxClient);
const subnavSrc = read(subnav);
const actionsSrc = read(rowActions);
const mobileSrc = read(mobileCard);
const pkgSrc = read(pkg);

assert("inbox client exists", exists(inboxClient), inboxClient);
assert("lead inbox tab", subnavSrc.includes("Lead inbox"), subnav);
assert("newsletter tab", subnavSrc.includes("Newsletter"), subnav);
assert("media kit tab", subnavSrc.includes("Media kit"), subnav);
assert("promocionales tab", subnavSrc.includes("Promocionales"), subnav);
assert("search filter panel", inboxSrc.includes('data-testid="launch-leads-filter-panel"') && inboxSrc.includes("Search"), inboxClient);
assert("export csv preserved", inboxSrc.includes("/api/admin/leads/inbox/export") && inboxSrc.includes("Export CSV"), inboxClient);
assert(
  "empty state truthful",
  inboxSrc.includes("No leads match the current view and filters") && inboxSrc.includes("Try All Leads or clear search"),
  inboxClient,
);
assert(
  "leonix semantic cta mapping",
  actionsSrc.includes("adminDashboardCtaPrimary") &&
    actionsSrc.includes("adminDashboardCtaView") &&
    actionsSrc.includes("adminDashboardCtaActive") &&
    actionsSrc.includes("adminDashboardCtaDanger") &&
    inboxSrc.includes("adminDashboardCtaView"),
  rowActions,
);
assert(
  "mobile safe layout",
  inboxSrc.includes("overflow-x-hidden") && mobileSrc.includes("overflow-x-hidden") && actionsSrc.includes("AdminDashboardCtaGrid"),
  inboxClient,
);
assert(
  "reply mailto preserved",
  actionsSrc.includes("mailtoHref") && (actionsSrc.includes("Reply") || actionsSrc.includes('label="Reply"')),
  rowActions,
);
assert("copy reply preserved", /Copy reply/.test(actionsSrc), rowActions);
assert(
  "archive restore delete preserved",
  actionsSrc.includes('label="Archive"') &&
    actionsSrc.includes('label="Restore"') &&
    actionsSrc.includes('label="Delete"'),
  rowActions,
);
assert("view action preserved", actionsSrc.includes('label="View"'), rowActions);
assert("email action preserved", actionsSrc.includes('label="Email"'), rowActions);
assert("command center header", inboxSrc.includes("Launch Leads command center"), inboxClient);
assert("ops chips use loaded counts", inboxSrc.includes("loadedOpsCounts") && inboxSrc.includes("activeTotal"), inboxClient);
assert("rectangular tabs variant", subnavSrc.includes('variant="rectangular"'), subnav);
assert("style audit doc", exists(audit), audit);
assert("no public page changes", !inboxSrc.includes("app/(site)/"), inboxClient);
assert("no schema migrations in client", !inboxSrc.includes("CREATE TABLE") && !inboxSrc.includes("supabase/migrations"), inboxClient);
assert("no stripe changes", !inboxSrc.includes("stripe") && !actionsSrc.includes("stripe"), inboxClient);
assert(
  "no query behavior changes",
  !inboxSrc.includes("listLeonixLeadsForAdmin") &&
    inboxSrc.includes("matchesOpsView") &&
    inboxSrc.includes("runLifecycle"),
  inboxClient,
);
assert("verify script registered", pkgSrc.includes("verify:admin-leads-style"), pkg);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-leads-style FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-leads-style PASS (${checks.length} checks)`);

/**
 * ADMIN-QUEUE-POLISH-01 verification.
 * Run: npm run verify:admin-classifieds-queue-polish
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

const queuePage = "app/admin/(dashboard)/workspace/clasificados/page.tsx";
const table = "app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx";
const rowActions = "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx";
const rowPanel = "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx";
const actionChrome = "app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueActionChrome.tsx";
const theme = "app/admin/_components/adminTheme.ts";
const cta = "app/admin/_components/AdminDashboardCta.tsx";
const editPage = "app/admin/(dashboard)/workspace/clasificados/listings/[id]/edit/page.tsx";
const pkg = "package.json";

assert("classifieds queue route", exists(queuePage), queuePage);
assert("listings table component", exists(table), table);
assert("row actions component", exists(rowActions), rowActions);
assert("row actions panel", exists(rowPanel), rowPanel);
assert("edit listing route", exists(editPage), editPage);

const tableSrc = read(table);
const rowSrc = read(rowActions);
const panelSrc = read(rowPanel);
const chromeSrc = read(actionChrome);
const themeSrc = read(theme);
const ctaSrc = read(cta);
const pageSrc = read(queuePage);
const pkgSrc = read(pkg);

assert("staff queue mode wired", pageSrc.includes("staffQueueMode") && pageSrc.includes("AdminListingsTable"), queuePage);
assert("desktop table block", tableSrc.includes("adminDesktopTableOnly") && tableSrc.includes('data-testid="clasificados-desktop-table"'), table);
assert("mobile card list", tableSrc.includes("adminMobileCardList") && tableSrc.includes('data-testid="clasificados-mobile-card"'), table);
assert("mobile cards use action panel", tableSrc.includes("ClassifiedAdminQueueRowActionsPanel") && tableSrc.includes('layout="card"'), table);
assert("zebra row readability", tableSrc.includes("adminQueueRowClass"), table);
assert("queue summary bar", tableSrc.includes('data-testid="clasificados-queue-summary"'), table);

assert("archive action", rowSrc.includes('"Archive"') && rowSrc.includes('run("archive")'), rowActions);
assert("restore action", rowSrc.includes('"Restore"') && rowSrc.includes('run("unsuspend")'), rowActions);
assert("republish action", rowSrc.includes("republish") && rowSrc.includes('run("republish"'), rowActions);
assert("feature action", rowSrc.includes('"Feature"') && rowSrc.includes('run("promote_on")'), rowActions);
assert("verify leonix action", rowSrc.includes('"Verify Leonix"') && rowSrc.includes('run("verify_on")'), rowActions);
assert("view public cta", panelSrc.includes("viewPublic") || panelSrc.includes("viewRentas"), rowPanel);
assert("seller profile cta", panelSrc.includes("listings.ownerCard") && panelSrc.includes("/admin/usuarios/"), rowPanel);
assert("edit listing cta", panelSrc.includes("/admin/workspace/clasificados/listings/") && panelSrc.includes('variant="primary"'), rowPanel);
assert("action groups lifecycle", rowSrc.includes("Lifecycle") && rowSrc.includes("Monetization"), rowActions);
assert("action groups review inspect", panelSrc.includes("Review") && panelSrc.includes("Inspect"), rowPanel);

assert("semantic color mapping", themeSrc.includes("adminDashboardCtaPremium") && themeSrc.includes("adminDashboardCtaView"), theme);
assert("cta button component", ctaSrc.includes("AdminDashboardCtaButton") && rowSrc.includes("AdminDashboardCtaButton"), cta);
assert("rectangle ctas", themeSrc.includes("rounded-lg") && rowSrc.includes("adminQueueActionCompact"), theme);
assert("danger delete preserved", panelSrc.includes('variant="danger"') && panelSrc.includes("deleteStaff"), rowPanel);

assert("action proof preserved", chromeSrc.includes("AdminActionProofBanner"), actionChrome);
assert("scroll context preserved", chromeSrc.includes("AdminQueueScrollRestore"), actionChrome);
assert("action return url flow", rowSrc.includes("buildAdminActionReturnUrl") && tableSrc.includes("buildAdminActionReturnUrl"), rowActions);
assert("no dead hash hrefs in panel", !panelSrc.includes('href="#"') && !panelSrc.includes("href='#'"), rowPanel);

assert("no public page edits in scope", !tableSrc.includes("app/(site)/clasificados/page.tsx"), table);
assert("no schema migrations", !tableSrc.includes("supabase/migrations") && !rowSrc.includes("CREATE TABLE"), table);
assert("no stripe changes", !tableSrc.includes("stripe") && !rowSrc.includes("stripe"), table);
assert("category filter preserved", pageSrc.includes('name="category"') && pageSrc.includes('name="status"'), queuePage);
assert("verify script registered", pkgSrc.includes("verify:admin-classifieds-queue-polish"), pkg);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-classifieds-queue-polish FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-classifieds-queue-polish PASS (${checks.length} checks)`);

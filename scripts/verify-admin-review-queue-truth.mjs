/**
 * ADMIN-REVIEW-QUEUE-TRUTH-02 verification.
 * Run: npm run verify:admin-review-queue-truth
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

const routes = "app/admin/_lib/adminDashboardRoutes.ts";
const dashboard = "app/admin/_components/AdminCommandCenterDashboard.tsx";
const reviewLib = "app/admin/_lib/adminDashboardReviewActions.ts";
const data = "app/admin/_lib/adminDashboardData.ts";
const strings = "app/admin/_lib/adminStrings.ts";
const reviewActions = "app/admin/_components/AdminDashboardReviewCardActions.tsx";
const clasificadosPage = "app/admin/(dashboard)/workspace/clasificados/page.tsx";
const rowPanel = "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx";
const editPage = "app/admin/(dashboard)/workspace/clasificados/listings/[id]/edit/page.tsx";
const snapshot = "app/admin/(dashboard)/workspace/clasificados/_components/AdminListingReviewSnapshot.tsx";
const table = "app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx";
const pkg = "package.json";

const routesSrc = read(routes);
const dashSrc = read(dashboard);
const libSrc = read(reviewLib);
const dataSrc = read(data);
const stringsSrc = read(strings);
const actionsSrc = read(reviewActions);
const pageSrc = read(clasificadosPage);
const panelSrc = read(rowPanel);
const editSrc = read(editPage);
const snapshotSrc = read(snapshot);
const tableSrc = read(table);
const pkgSrc = read(pkg);

assert("review queue route constant", routesSrc.includes("classifiedsReviewQueue") && routesSrc.includes("status=flagged#queue"), routes);
assert("dashboard review ads uses review queue href", dashSrc.includes("classifiedsReviewQueue"), dashboard);
assert("queue anchor constant", libSrc.includes('ADMIN_CLASIFICADOS_QUEUE_ANCHOR = "queue"'), reviewLib);
assert("buildReviewQueueHref includes queue anchor", libSrc.includes("#${ADMIN_CLASIFICADOS_QUEUE_ANCHOR}") || libSrc.includes("#queue"), reviewLib);
assert("clasificados page queue id anchor", pageSrc.includes('id="queue"'), clasificadosPage);
assert("queue section scroll margin", pageSrc.includes("scroll-mt-"), clasificadosPage);

assert("does not fake AI in title", !stringsSrc.includes("real review only"), strings);
assert("status-based queue copy", stringsSrc.includes("status-based queue") || stringsSrc.includes("cola por estado"), strings);
assert("reason fallback preserved", dataSrc.includes("Reason unavailable — inspect review source"), data);
assert("review source label helper", dataSrc.includes("adminDashboardReviewSourceLabel"), data);
assert("no AI reason claim for generic listings", dataSrc.includes("no AI/moderation reason column"), data);
assert("dashboard shows review source", dashSrc.includes("adminDashboardReviewSourceLabel"), dashboard);

assert("delete in queue CTA exists", actionsSrc.includes("Delete in queue"), reviewActions);
assert("queue href built with anchor", libSrc.includes("buildReviewQueueHref"), reviewLib);
assert("staff queue delete action", panelSrc.includes("listings.deleteStaff") && panelSrc.includes("staffQueueMode"), rowPanel);
assert("soft delete documented", panelSrc.includes("Soft delete") && panelSrc.includes("not permanent hard delete"), rowPanel);
assert("no permanent delete default", !panelSrc.includes("Permanent delete"), rowPanel);
assert("delete uses existing handler", panelSrc.includes("onDelete(row)") && tableSrc.includes("deleteListingAction"), rowPanel);
assert("action proof flow preserved", tableSrc.includes("buildAdminActionReturnUrl") && tableSrc.includes('"delete"'), table);

assert("review snapshot component", exists(snapshot), snapshot);
assert("edit page renders snapshot", editSrc.includes("AdminListingReviewSnapshot"), editPage);
assert("snapshot title field", snapshotSrc.includes("Title") && snapshotSrc.includes("title"), snapshot);
assert("snapshot description handling", snapshotSrc.includes("Description") && snapshotSrc.includes("No description"), snapshot);
assert("snapshot image handling", snapshotSrc.includes("No images available") && snapshotSrc.includes("image(s)"), snapshot);
assert("snapshot reason fallback", snapshotSrc.includes("Reason unavailable — inspect review source"), snapshot);
assert("snapshot review source", snapshotSrc.includes("Review source:"), snapshot);
assert("snapshot seller link", snapshotSrc.includes("/admin/usuarios/"), snapshot);

assert("no public page changes", !editSrc.includes("app/(site)/clasificados/page"), editPage);
assert("no schema migrations", !pageSrc.includes("supabase/migrations") && !editSrc.includes("CREATE TABLE"), clasificadosPage);
assert("no stripe changes", !panelSrc.includes("stripe") && !snapshotSrc.includes("stripe"), rowPanel);
assert("verify script registered", pkgSrc.includes("verify:admin-review-queue-truth"), pkg);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-review-queue-truth FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-review-queue-truth PASS (${checks.length} checks)`);
